import { useRef, useState, useEffect, useCallback, RefObject } from 'react';
import Hls from 'hls.js';
import type { StreamInfo } from '@/types/player';
import { api, getApiBase, resolveUrl, withAuthToken } from '@/services/api';

export interface VideoPlayerState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    isFullscreen: boolean;
    isLoading: boolean;
    isTranscoding: boolean;
}

export interface VideoPlayerControls {
    play: () => void;
    pause: () => void;
    togglePlayPause: () => void;
    seek: (time: number) => void;
    skip: (seconds: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    toggleFullscreen: () => void;
}

interface UseVideoPlayerOptions {
    mediaId: string | undefined;
    containerRef: RefObject<HTMLDivElement | null>;
}

interface UseVideoPlayerResult {
    videoRef: RefObject<HTMLVideoElement | null>;
    state: VideoPlayerState;
    controls: VideoPlayerControls;
    hlsRef: RefObject<Hls | null>;
}

export function useVideoPlayer({ mediaId, containerRef }: UseVideoPlayerOptions): UseVideoPlayerResult {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isTranscoding, setIsTranscoding] = useState(false);

    const startHls = useCallback((hlsUrl: string, startPosition?: number) => {
        if (!videoRef.current) return;

        // Resolve to an absolute URL for the Tauri app (cross-origin to the server).
        const resolvedHlsUrl = resolveUrl(hlsUrl);

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        if (Hls.isSupported()) {
            const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                manifestLoadingTimeOut: 15000,
                xhrSetup: (xhr, _url) => {
                    const token = localStorage.getItem('auth_token');
                    if (token) {
                        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    }
                }
            });

            // hls.js authenticates via xhrSetup (Bearer header), so no query token needed here.
            hls.loadSource(resolvedHlsUrl);
            hls.attachMedia(videoRef.current);
            hlsRef.current = hls;

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoading(false);
                if (startPosition && startPosition > 0 && videoRef.current) {
                    videoRef.current.currentTime = startPosition;
                }
                videoRef.current?.play().catch(() => {});
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                console.error('HLS error:', data);
                if (data.fatal) {
                    setIsLoading(false);
                }
            });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS can't set headers, so embed the token in the URL.
            videoRef.current.src = withAuthToken(resolvedHlsUrl);
            if (startPosition && startPosition > 0) {
                videoRef.current.currentTime = startPosition;
            }
        }
    }, []);

    // Setup player on mount/id change
    useEffect(() => {
        const setupPlayer = async () => {
            if (!mediaId || !videoRef.current) return;

            setIsLoading(true);

            try {
                const streamInfo = await api.get<StreamInfo>(`/stream/${mediaId}/info`).catch(() => null);

                if (streamInfo) {

                    if (streamInfo.duration_seconds) {
                        setDuration(streamInfo.duration_seconds);
                    }

                    const progress = await api.get<{ position: number }>(`/media/${mediaId}/progress`).catch(() => null);
                    const resumePosition = progress && progress.position > 0 ? progress.position : undefined;

                    if (streamInfo.needs_transcode && streamInfo.hls_url) {
                        setIsTranscoding(true);
                        startHls(streamInfo.hls_url, resumePosition);
                    } else {
                        videoRef.current.src = withAuthToken(resolveUrl(streamInfo.direct_stream_url));
                        setIsTranscoding(false);
                        if (resumePosition && videoRef.current) {
                            videoRef.current.currentTime = resumePosition;
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to setup player:', e);
                if (videoRef.current) {
                    videoRef.current.src = withAuthToken(`${getApiBase()}/stream/${mediaId}`);
                }
            }
        };

        setupPlayer();

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [mediaId, startHls]);

    // Fullscreen change handler
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Video event handlers
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleLoadedMetadata = () => {
            if (duration === 0 && video.duration && isFinite(video.duration)) {
                setDuration(video.duration);
            }
            setIsLoading(false);
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [duration]);

    // Controls
    const play = useCallback(() => {
        videoRef.current?.play();
    }, []);

    const pause = useCallback(() => {
        videoRef.current?.pause();
    }, []);

    const togglePlayPause = useCallback(() => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
    }, []);

    const seek = useCallback((time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    }, []);

    const skip = useCallback((seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    }, []);

    const handleSetVolume = useCallback((newVolume: number) => {
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
        }
    }, []);

    const toggleMute = useCallback(() => {
        if (videoRef.current) {
            const newMuted = !isMuted;
            videoRef.current.muted = newMuted;
            setIsMuted(newMuted);
        }
    }, [isMuted]);

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, [containerRef]);

    return {
        videoRef,
        hlsRef,
        state: {
            isPlaying,
            currentTime,
            duration,
            volume,
            isMuted,
            isFullscreen,
            isLoading,
            isTranscoding,
        },
        controls: {
            play,
            pause,
            togglePlayPause,
            seek,
            skip,
            setVolume: handleSetVolume,
            toggleMute,
            toggleFullscreen,
        },
    };
}
