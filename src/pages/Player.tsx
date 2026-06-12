import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { SubtitleTrack, AudioTrack, StreamInfo, DeviceProfile, detectCapabilities } from '@/types';
import { api, getApiBase, resolveUrl, withAuthToken } from '@/services';
import { invoke } from '@tauri-apps/api/core';
import {
    PlayerControls,
    useMediaTitle,
    useAutoHideControls,
    usePlayerKeyboard,
    openMpvOverlayWindow,
    closeMpvOverlayWindow,
} from '@/player';

export const Player: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressIntervalRef = useRef<number | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const hlsBaseUrlRef = useRef<string>('');  // Base HLS URL for seeking
    const lastSeekTimeRef = useRef<number>(0);  // Track last seek position

    // Embedded mpv (Linux desktop) state. mpv renders in this (main) window;
    // a separate transparent overlay window hosts the controls.
    const mpvActiveRef = useRef(false);
    const mpvCleanupRef = useRef<null | (() => void)>(null);
    const [mpvActive, setMpvActive] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
    const [activeSubtitleId, setActiveSubtitleId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTranscoding, setIsTranscoding] = useState(false);
    const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
    const title = useMediaTitle(id);
    const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
    const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
    void streamInfo; // Suppress unused warning

    const { showControls, resetControlsTimeout } = useAutoHideControls(isPlaying);

    // Fetch stream info and setup video source
    useEffect(() => {
        // Tear down the embedded mpv + its overlay window and stop geometry sync.
        const teardownMpv = () => {
            if (mpvCleanupRef.current) { mpvCleanupRef.current(); mpvCleanupRef.current = null; }
            if (mpvActiveRef.current) {
                mpvActiveRef.current = false;
                setMpvActive(false);
                invoke('mpv_stop').catch(() => {});
                closeMpvOverlayWindow();
            }
        };

        const openMpvOverlay = async (mediaId: string) => {
            mpvCleanupRef.current = await openMpvOverlayWindow(mediaId, () => {
                teardownMpv();
                navigate(-1);
            });
        };

        const setupPlayer = async () => {
            if (!id || !videoRef.current) return;

            try {
                // Fetch saved progress FIRST (before setting source)
                let savedPosition = 0;
                try {
                    const progressRes = await api.get<{ position: number }>(`/media/${id}/progress`);
                    if (progressRes.position && progressRes.position > 10) {
                        savedPosition = progressRes.position;
                    }
                } catch {
                    // No saved progress, start from beginning
                }


                // Get stream info
                const profile = detectCapabilities();
                const streamInfo = await api.post<StreamInfo, DeviceProfile>(`/stream/${id}/info`, profile);
                setStreamInfo(streamInfo);

                // Set duration from API (more accurate for transcoded content)
                if (streamInfo.duration_seconds) {
                    setDuration(streamInfo.duration_seconds);
                }

                // Linux desktop: play everything through embedded mpv (broad codec
                // support + performance). mpv renders in this window; a transparent
                // overlay window hosts the controls. The web app and other OSes keep
                // using hls.js/<video> below.
                const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
                if (isTauri) {
                    let os = '';
                    try { os = await invoke<string>('get_os'); } catch { /* not tauri */ }
                    if (os === 'linux' && id) {
                        try {
                            await invoke('mpv_play', {
                                url: withAuthToken(resolveUrl(streamInfo.direct_stream_url)),
                                startSeconds: savedPosition,
                            });
                            mpvActiveRef.current = true;
                            setMpvActive(true);
                            setIsTranscoding(false);
                            setIsLoading(false);
                            await openMpvOverlay(id);
                            return; // mpv handles playback; skip <video>/HLS setup
                        } catch (e) {
                            console.error('Embedded mpv failed, falling back to <video>:', e);
                            mpvActiveRef.current = false;
                            setMpvActive(false);
                            teardownMpv();
                        }
                    }
                }

                // Initialize HLS
                let hls: Hls | null = null;
                const resolvedHlsUrl = streamInfo.hls_url ? resolveUrl(streamInfo.hls_url) : null;
                // <video src> can't send an auth header, so embed the token in the URL.
                const resolvedDirectUrl = withAuthToken(resolveUrl(streamInfo.direct_stream_url));

                if (resolvedHlsUrl) {
                    setIsTranscoding(true);

                    if (Hls.isSupported()) {
                        hls = new Hls({
                            capLevelToPlayerSize: true,
                            debug: false,
                            enableWorker: true,
                        });
                        hlsRef.current = hls;

                        // Store base URL for seek reloading
                        hlsBaseUrlRef.current = resolvedHlsUrl.includes('?')
                            ? resolvedHlsUrl
                            : resolvedHlsUrl + '?';

                        // Include start time in HLS URL for resume playback
                        const hlsUrlWithStart = savedPosition > 0
                            ? `${hlsBaseUrlRef.current}&start=${Math.floor(savedPosition)}`
                            : resolvedHlsUrl;

                        lastSeekTimeRef.current = savedPosition;
                        hls.loadSource(hlsUrlWithStart);
                        hls.attachMedia(videoRef.current!);

                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            // For HLS with resume, the stream starts at 0 (transcoded from seek point)
                            // so we don't need to set currentTime
                            videoRef.current?.play().catch(() => setIsPlaying(false));
                            setIsPlaying(true);
                        });

                        hls.on(Hls.Events.ERROR, (_, data) => {
                            if (data.fatal) {
                                switch (data.type) {
                                    case Hls.ErrorTypes.NETWORK_ERROR:
                                        console.error("Network error, recovering...");
                                        hls?.startLoad();
                                        break;
                                    case Hls.ErrorTypes.MEDIA_ERROR:
                                        console.error("Media error, recovering...");
                                        hls?.recoverMediaError();
                                        break;
                                    default:
                                        console.error("Unrecoverable error");
                                        hls?.destroy();
                                        break;
                                }
                            }

                            // Detect buffer stall - reload from seek position
                            if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR && hlsBaseUrlRef.current) {
                                const seekTime = lastSeekTimeRef.current || videoRef.current?.currentTime || 0;
                                console.log(`Buffer stalled at ${seekTime}s, reloading playlist...`);

                                const newUrl = `${hlsBaseUrlRef.current}&start=${Math.floor(seekTime)}`;
                                hls?.loadSource(newUrl);
                            }
                        });
                    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
                        // Native HLS support (Safari) - include start time
                        const hlsUrlWithStart = savedPosition > 0
                            ? `${resolvedHlsUrl}${resolvedHlsUrl.includes('?') ? '&' : '?'}start=${Math.floor(savedPosition)}`
                            : resolvedHlsUrl;
                        videoRef.current.src = withAuthToken(hlsUrlWithStart);
                        videoRef.current.addEventListener('loadeddata', () => {
                            videoRef.current?.play().catch(() => setIsPlaying(false));
                        }, { once: true });
                    }
                } else {
                    // Direct Play
                    setIsTranscoding(false);
                    if (videoRef.current) {
                        videoRef.current.src = resolvedDirectUrl;
                        videoRef.current.addEventListener('loadeddata', () => {
                            // Set saved progress for direct play after video is ready
                            if (savedPosition > 0 && videoRef.current) {
                                videoRef.current.currentTime = savedPosition;
                            }
                            videoRef.current?.play().catch(() => setIsPlaying(false));
                        }, { once: true });
                    }
                }

                // Load subtitles and audio tracks
                const [subs, tracks] = await Promise.all([
                    api.get<SubtitleTrack[]>(`/stream/${id}/subtitles`).catch(() => []),
                    api.get<AudioTrack[]>(`/stream/${id}/audio_tracks`).catch(() => []),
                ]);
                setSubtitles(subs);
                setAudioTracks(tracks);
                const defaultTrack = tracks.find(t => t.is_default) || tracks[0];
                if (defaultTrack) setActiveAudioIndex(defaultTrack.index);

            } catch (error) {
                console.error("Setup error", error);
                // Fallback to direct stream if info endpoint fails
                if (videoRef.current) {
                    videoRef.current.src = withAuthToken(resolveUrl(`/api/v1/stream/${id}`));
                }
            } finally {
                setIsLoading(false);
            }
        };

        setupPlayer();

        // Cleanup HLS / mpv on unmount
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            teardownMpv();
        };
    }, [id]);

    // Save progress periodically while playing
    useEffect(() => {
        if (!id || !isPlaying) return;

        const saveProgress = () => {
            if (videoRef.current) {
                const position = Math.floor(videoRef.current.currentTime);
                const total = Math.floor(videoRef.current.duration) || 0;

                if (position > 5 && total > 0) {
                    api.post(`/media/${id}/progress`, { position, total_duration: total })
                        .catch(err => console.error('Failed to save progress:', err));
                }
            }
        };

        // Save every 15 seconds while playing
        progressIntervalRef.current = window.setInterval(saveProgress, 15000);

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [id, isPlaying]);

    // Save progress on unmount
    useEffect(() => {
        return () => {
            if (videoRef.current && id) {
                const position = Math.floor(videoRef.current.currentTime);
                const total = Math.floor(videoRef.current.duration) || 0;

                if (position > 0 && total > 0) {
                    // Use sendBeacon with Blob for proper content-type
                    const data = new Blob(
                        [JSON.stringify({ position, total_duration: total })],
                        { type: 'application/json' }
                    );
                    // sendBeacon can't set an Authorization header, so pass the token in the URL.
                    navigator.sendBeacon(withAuthToken(resolveUrl(`/api/v1/media/${id}/progress`)), data);
                }
            }
        };
    }, [id]);

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Event handlers
    const handlePlayPause = useCallback(() => {
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
    }, [isPlaying]);

    const handleSeek = useCallback((time: number) => {
        lastSeekTimeRef.current = time;
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const handleVolumeChange = useCallback((vol: number) => {
        setVolume(vol);
        if (videoRef.current) {
            videoRef.current.volume = vol;
            setIsMuted(vol === 0);
        }
    }, []);

    const toggleMute = useCallback(() => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    }, [isMuted]);

    const toggleFullscreen = useCallback(async () => {
        if (!containerRef.current) return;
        if (isFullscreen) await document.exitFullscreen();
        else await containerRef.current.requestFullscreen();
    }, [isFullscreen]);

    const skip = useCallback((seconds: number) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }, [duration]);

    const handleBack = useCallback(() => navigate(-1), [navigate]);

    const keyboardActions = useMemo(
        () => ({
            onPlayPause: handlePlayPause,
            onSkip: skip,
            onVolumeChange: handleVolumeChange,
            onToggleMute: toggleMute,
            onToggleFullscreen: toggleFullscreen,
            onBack: handleBack,
            onInteraction: resetControlsTimeout,
        }),
        [handlePlayPause, skip, handleVolumeChange, toggleMute, toggleFullscreen, handleBack, resetControlsTimeout],
    );

    usePlayerKeyboard({
        playing: isPlaying,
        muted: isMuted,
        isFullscreen,
        duration,
        volume,
        actions: keyboardActions,
    });

    const lastTimeUpdateRef = useRef(0);
    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            const now = performance.now();
            if (now - lastTimeUpdateRef.current > 500) {
                lastTimeUpdateRef.current = now;
                setCurrentTime(videoRef.current.currentTime);
            }
        }
    }, []);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            // Only use video element duration if we don't have API duration
            // API duration is more accurate for transcoded streams
            if (duration === 0 && videoRef.current.duration && isFinite(videoRef.current.duration)) {
                setDuration(videoRef.current.duration);
            }
            setIsLoading(false);
        }
    };

    const selectSubtitle = async (trackId: string | null) => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const selectedSub = subtitles.find(s => s.id === trackId);

        // Disable all subtitle tracks first
        for (let i = 0; i < video.textTracks.length; i++) {
            if (video.textTracks[i].kind === 'subtitles') {
                video.textTracks[i].mode = 'disabled';
            }
        }

        if (!trackId || !selectedSub) {
            setActiveSubtitleId(null);
            return;
        }

        // Check if a <track> element already exists for this subtitle
        const existingTrack = Array.from(video.querySelectorAll('track')).find(
            t => t.getAttribute('data-sub-id') === trackId
        );

        if (existingTrack) {
            // Enable the exact track we matched by id. Matching by label here
            // would re-show the wrong cue track when two subtitles share a label
            // (common with embedded streams, e.g. multiple "und" / "[Forced]").
            existingTrack.track.mode = 'showing';
        } else {
            // Fetch VTT with auth, then create blob URL
            try {
                const token = localStorage.getItem('auth_token');
                const headers: HeadersInit = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const resp = await fetch(`${getApiBase()}${selectedSub.url.replace('/api/v1', '')}`, {
                    headers,
                    credentials: 'include',
                });
                if (!resp.ok) throw new Error(`${resp.status}`);

                const vttText = await resp.text();
                const blob = new Blob([vttText], { type: 'text/vtt' });
                const blobUrl = URL.createObjectURL(blob);

                const track = document.createElement('track');
                track.kind = 'subtitles';
                track.label = selectedSub.label;
                track.srclang = selectedSub.language;
                track.src = blobUrl;
                track.setAttribute('data-sub-id', trackId);
                video.appendChild(track);
                track.track.mode = 'showing';
            } catch (e) {
                console.error('Failed to load subtitle:', e);
            }
        }

        setActiveSubtitleId(trackId);
    };

    const selectAudioTrack = (audioIndex: number) => {
        if (audioIndex === activeAudioIndex) return;

        setActiveAudioIndex(audioIndex);

        if (!hlsRef.current || !hlsBaseUrlRef.current) return;

        // Reload HLS with the new audio_index param so FFmpeg restarts with the selected audio stream
        const currentPos = videoRef.current?.currentTime || 0;
        setIsLoading(true);

        // Build new URL with audio_index
        const baseUrl = hlsBaseUrlRef.current.replace(/[&?]audio_index=\d+/g, '');
        const separator = baseUrl.includes('?') ? '&' : '?';
        const newUrl = `${baseUrl}${separator}audio_index=${audioIndex}&start=${Math.floor(currentPos)}`;

        hlsRef.current.loadSource(newUrl);
        hlsRef.current.once(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            videoRef.current?.play().catch(() => {});
        });
    };

    const trackSelection = useMemo(
        () => ({
            subtitles,
            activeSubtitleId,
            onSelectSubtitle: (trackId: string | null) => { void selectSubtitle(trackId); },
            audioTracks,
            activeAudioIndex,
            onSelectAudio: selectAudioTrack,
        }),
        [subtitles, activeSubtitleId, audioTracks, activeAudioIndex],
    );

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onMouseMove={resetControlsTimeout}
            onClick={resetControlsTimeout}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onWaiting={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
                onCanPlayThrough={() => setIsLoading(false)}
                playsInline
                preload="auto"
                crossOrigin="anonymous"
            />

            {/* Embedded mpv playback (Linux): mpv renders over the window; this
                sits behind it and shows during launch / if mpv detaches. */}
            {mpvActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
                    <p className="text-sm">Playing in mpv — press <kbd className="px-1.5 py-0.5 rounded bg-white/10">q</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/10">Esc</kbd> to return</p>
                </div>
            )}

            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-4">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
                    {isTranscoding && (
                        <span className="text-white/70 text-sm">Transcoding video...</span>
                    )}
                </div>
            )}

            {!mpvActive && (
                <PlayerControls
                    playing={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    volume={volume}
                    muted={isMuted}
                    isFullscreen={isFullscreen}
                    title={title}
                    showControls={showControls}
                    onPlayPause={handlePlayPause}
                    onSeek={handleSeek}
                    onSkip={skip}
                    onVolumeChange={handleVolumeChange}
                    onToggleMute={toggleMute}
                    onToggleFullscreen={toggleFullscreen}
                    onBack={handleBack}
                    onInteraction={resetControlsTimeout}
                    tracks={trackSelection}
                />
            )}
        </div>
    );
};
