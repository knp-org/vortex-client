import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Maximize, Minimize, Volume2, VolumeX, SkipBack, SkipForward, Subtitles, Check, AudioLines } from 'lucide-react';
import Hls from 'hls.js';
import { SubtitleTrack, AudioTrack, StreamInfo, DeviceProfile, detectCapabilities } from '../types';
import { api, getApiBase } from '../services';
import { NativePlayerButton } from '../components/NativePlayerButton';

export const Player: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressIntervalRef = useRef<number | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const hlsBaseUrlRef = useRef<string>('');  // Base HLS URL for seeking
    const lastSeekTimeRef = useRef<number>(0);  // Track last seek position

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
    const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
    const [activeSubtitleId, setActiveSubtitleId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTranscoding, setIsTranscoding] = useState(false);
    const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
    const [title, setTitle] = useState('');
    const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
    const [showAudioMenu, setShowAudioMenu] = useState(false);
    const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
    void streamInfo; // Suppress unused warning

    const controlsTimeoutRef = useRef<number | null>(null);

    // Fetch stream info and setup video source
    useEffect(() => {
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

                // Fetch media details for title
                try {
                    const media = await api.get<{ title?: string; series_name?: string; season_number?: number; episode_number?: number }>(`/media/${id}`);
                    if (media.series_name && media.season_number != null && media.episode_number != null) {
                        setTitle(`${media.series_name} - S${media.season_number}E${media.episode_number}${media.title ? ` - ${media.title}` : ''}`);
                    } else if (media.title) {
                        setTitle(media.title);
                    }
                } catch {
                    // Title is non-critical
                }

                // Get stream info
                const profile = detectCapabilities();
                const streamInfo = await api.post<StreamInfo, DeviceProfile>(`/stream/${id}/info`, profile);
                setStreamInfo(streamInfo);

                // Set duration from API (more accurate for transcoded content)
                if (streamInfo.duration_seconds) {
                    setDuration(streamInfo.duration_seconds);
                }

                // Initialize HLS
                let hls: Hls | null = null;
                if (streamInfo.hls_url) {
                    setIsTranscoding(true);

                    if (Hls.isSupported()) {
                        hls = new Hls({
                            capLevelToPlayerSize: true,
                            debug: false,
                            enableWorker: true,
                        });
                        hlsRef.current = hls;

                        // Store base URL for seek reloading
                        hlsBaseUrlRef.current = streamInfo.hls_url.includes('?')
                            ? streamInfo.hls_url
                            : streamInfo.hls_url + '?';

                        // Include start time in HLS URL for resume playback
                        const hlsUrlWithStart = savedPosition > 0
                            ? `${hlsBaseUrlRef.current}&start=${Math.floor(savedPosition)}`
                            : streamInfo.hls_url;

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
                            ? `${streamInfo.hls_url}${streamInfo.hls_url.includes('?') ? '&' : '?'}start=${Math.floor(savedPosition)}`
                            : streamInfo.hls_url;
                        videoRef.current.src = hlsUrlWithStart;
                        videoRef.current.addEventListener('loadeddata', () => {
                            videoRef.current?.play().catch(() => setIsPlaying(false));
                        }, { once: true });
                    }
                } else {
                    // Direct Play
                    setIsTranscoding(false);
                    if (videoRef.current) {
                        videoRef.current.src = streamInfo.direct_stream_url;
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
                    videoRef.current.src = `/api/v1/stream/${id}`;
                }
            } finally {
                setIsLoading(false);
            }
        };

        setupPlayer();

        // Cleanup HLS on unmount
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
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
                    fetch(`/api/v1/media/${id}/progress`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ position, total_duration: total }),
                    }).catch(err => console.error('Failed to save progress:', err));
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
                    navigator.sendBeacon(`/api/v1/media/${id}/progress`, data);
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

    // Auto-hide controls
    const resetControlsTimeout = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
            controlsTimeoutRef.current = window.setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    useEffect(() => {
        resetControlsTimeout();
    }, [isPlaying]);

    // Event handlers
    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    };

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

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        lastSeekTimeRef.current = time;  // Track for stall recovery
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        if (videoRef.current) {
            videoRef.current.volume = vol;
            setIsMuted(vol === 0);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        if (isFullscreen) {
            await document.exitFullscreen();
        } else {
            await containerRef.current.requestFullscreen();
        }
    };

    const skip = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
        }
    };

    const formatTime = (time: number): string => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Refs for keyboard handler to avoid re-registering on every state change
    const isPlayingRef = useRef(isPlaying);
    isPlayingRef.current = isPlaying;
    const isMutedRef = useRef(isMuted);
    isMutedRef.current = isMuted;
    const isFullscreenRef = useRef(isFullscreen);
    isFullscreenRef.current = isFullscreen;
    const durationRef = useRef(duration);
    durationRef.current = duration;

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    if (videoRef.current) {
                        if (isPlayingRef.current) videoRef.current.pause();
                        else videoRef.current.play();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (videoRef.current) {
                        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (videoRef.current) {
                        videoRef.current.currentTime = Math.min(durationRef.current, videoRef.current.currentTime + 10);
                    }
                    break;
                case 'f':
                    e.preventDefault();
                    if (containerRef.current) {
                        if (isFullscreenRef.current) document.exitFullscreen();
                        else containerRef.current.requestFullscreen();
                    }
                    break;
                case 'm':
                    e.preventDefault();
                    if (videoRef.current) {
                        videoRef.current.muted = !isMutedRef.current;
                        setIsMuted(!isMutedRef.current);
                    }
                    break;
                case 'Escape':
                    if (!isFullscreenRef.current) {
                        navigate(-1);
                    }
                    break;
            }
            resetControlsTimeout();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

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
            setShowSubtitleMenu(false);
            return;
        }

        // Check if a <track> element already exists for this subtitle
        const existingTrack = Array.from(video.querySelectorAll('track')).find(
            t => t.getAttribute('data-sub-id') === trackId
        );

        if (existingTrack) {
            for (let i = 0; i < video.textTracks.length; i++) {
                if (video.textTracks[i].label === selectedSub.label && video.textTracks[i].kind === 'subtitles') {
                    video.textTracks[i].mode = 'showing';
                    break;
                }
            }
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
        setShowSubtitleMenu(false);
    };

    const selectAudioTrack = (audioIndex: number) => {
        if (audioIndex === activeAudioIndex) {
            setShowAudioMenu(false);
            return;
        }

        setActiveAudioIndex(audioIndex);
        setShowAudioMenu(false);

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

            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-4">
                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                    {isTranscoding && (
                        <span className="text-white/70 text-sm">Transcoding video...</span>
                    )}
                </div>
            )}

            {/* Controls Overlay */}
            <div
                className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                {/* Top Bar - Back button and title */}
                <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent z-10">
                    <button
                        type="button"
                        className="flex items-center gap-3 text-white hover:text-cyan-400 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(-1);
                        }}
                    >
                        <ArrowLeft size={24} />
                        <span className="text-lg font-medium truncate max-w-[60vw]">{title || 'Back'}</span>
                    </button>
                </div>

                {/* Center Play/Pause */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <button
                        className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all hover:scale-110"
                        onClick={handlePlayPause}
                    >
                        {isPlaying ? <Pause size={36} /> : <Play size={36} className="ml-1" />}
                    </button>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    {/* Progress Bar */}
                    <div className="mb-4">
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-lg"
                            style={{
                                background: `linear-gradient(to right, rgb(6, 182, 212) 0%, rgb(6, 182, 212) ${(currentTime / duration) * 100}%, rgba(255, 255, 255, 0.3) ${(currentTime / duration) * 100}%, rgba(255, 255, 255, 0.3) 100%)`
                            }}
                        />
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Play/Pause */}
                            <button
                                className="text-white hover:text-cyan-400 transition-colors"
                                onClick={handlePlayPause}
                            >
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>

                            {/* Skip buttons */}
                            <button
                                className="text-white hover:text-cyan-400 transition-colors"
                                onClick={() => skip(-10)}
                            >
                                <SkipBack size={20} />
                            </button>
                            <button
                                className="text-white hover:text-cyan-400 transition-colors"
                                onClick={() => skip(10)}
                            >
                                <SkipForward size={20} />
                            </button>

                            {/* Volume */}
                            <div className="flex items-center gap-2">
                                <button
                                    className="text-white hover:text-cyan-400 transition-colors"
                                    onClick={toggleMute}
                                >
                                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                />
                            </div>

                            {/* Time Display */}
                            <span className="text-white/80 text-sm font-mono">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-4">
                            {/* Subtitles */}
                            {subtitles.length > 0 && (
                                <div className="relative">
                                    <button
                                        className={`transition-colors ${activeSubtitleId ? 'text-cyan-400' : 'text-white hover:text-cyan-400'}`}
                                        onClick={(e) => { e.stopPropagation(); setShowSubtitleMenu(!showSubtitleMenu); setShowAudioMenu(false); }}
                                    >
                                        <Subtitles size={20} />
                                    </button>

                                    {showSubtitleMenu && (
                                        <div className="absolute bottom-10 right-0 bg-black/95 border border-white/10 rounded-lg py-1 min-w-[200px] max-h-[300px] overflow-y-auto shadow-xl backdrop-blur-sm">
                                            <div className="px-3 py-1.5 text-xs text-white/50 uppercase tracking-wide">Subtitles</div>
                                            <button
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                                                onClick={() => selectSubtitle(null)}
                                            >
                                                <span className="w-4">{!activeSubtitleId && <Check size={14} />}</span>
                                                Off
                                            </button>
                                            {subtitles.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                                                    onClick={() => selectSubtitle(sub.id)}
                                                >
                                                    <span className="w-4">{activeSubtitleId === sub.id && <Check size={14} className="text-cyan-400" />}</span>
                                                    <span className="flex-1 text-left truncate">{sub.label}</span>
                                                    <span className="text-[10px] text-white/40 uppercase">{sub.source === 'embedded' ? 'EMB' : 'EXT'}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Audio Tracks */}
                            {audioTracks.length > 1 && (
                                <div className="relative">
                                    <button
                                        className="text-white hover:text-cyan-400 transition-colors"
                                        onClick={(e) => { e.stopPropagation(); setShowAudioMenu(!showAudioMenu); setShowSubtitleMenu(false); }}
                                    >
                                        <AudioLines size={20} />
                                    </button>

                                    {showAudioMenu && (
                                        <div className="absolute bottom-10 right-0 bg-black/95 border border-white/10 rounded-lg py-1 min-w-[220px] max-h-[300px] overflow-y-auto shadow-xl backdrop-blur-sm">
                                            <div className="px-3 py-1.5 text-xs text-white/50 uppercase tracking-wide">Audio</div>
                                            {audioTracks.map(track => (
                                                <button
                                                    key={track.index}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                                                    onClick={() => selectAudioTrack(track.index)}
                                                >
                                                    <span className="w-4">{activeAudioIndex === track.index && <Check size={14} className="text-cyan-400" />}</span>
                                                    <span className="flex-1 text-left truncate">{track.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Fullscreen */}
                            <button
                                className="text-white hover:text-cyan-400 transition-colors"
                                onClick={toggleFullscreen}
                            >
                                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Native Player Button */}
                    <div className="absolute top-6 right-6 z-20">
                        {streamInfo && (
                            <NativePlayerButton url={streamInfo.direct_stream_url} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
