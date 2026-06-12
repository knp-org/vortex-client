import React, { useState } from 'react';
import {
    ArrowLeft,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    SkipBack,
    SkipForward,
    Subtitles,
    Check,
    AudioLines,
} from 'lucide-react';
import { formatTime } from '@/player/utils/formatTime';
import { api } from '@/services';
import type { Setting } from '@/types/settings';
import type { PlayerControlActions, PlayerControlState, TrackSelection } from '@/player/types';

export interface PlayerControlsProps extends PlayerControlState, PlayerControlActions {
    /** Transparent overlay window: persistent back bar + pass-through clicks. */
    overlayMode?: boolean;
    /** Defer seek until the user releases the scrubber (mpv polling). */
    seekOnRelease?: boolean;
    tracks?: TrackSelection;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
    playing,
    currentTime,
    duration,
    volume,
    muted,
    isFullscreen,
    title,
    showControls,
    overlayMode = false,
    seekOnRelease = false,
    tracks,
    onPlayPause,
    onSeek,
    onSeekPreview,
    onSeekCommit,
    onSkip,
    onVolumeChange,
    onToggleMute,
    onToggleFullscreen,
    onBack,
}) => {
    const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
    const [showAudioMenu, setShowAudioMenu] = useState(false);

    const [skipForward, setSkipForward] = React.useState(10);
    const [skipBackward, setSkipBackward] = React.useState(10);

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await api.get<Setting[]>('/settings');
                const pSettings = data.find(s => s.key === 'player_settings');
                if (pSettings) {
                    const parsed = JSON.parse(pSettings.value);
                    if (parsed.skipForwardTime) setSkipForward(parsed.skipForwardTime);
                    if (parsed.skipBackwardTime) setSkipBackward(parsed.skipBackwardTime);
                }
            } catch (e) {
                // ignore
            }
        };
        fetchSettings();
    }, []);

    const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleSeekInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = Number(e.target.value);
        if (seekOnRelease) {
            onSeekPreview?.(t);
        } else {
            onSeek(t);
        }
    };

    const handleSeekRelease = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const t = Number((e.target as HTMLInputElement).value);
        if (seekOnRelease) {
            onSeekCommit?.(t);
        }
    };

    const controlsLayerClass = overlayMode
        ? `absolute inset-0 transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`
        : `absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;

    const interactiveClass = overlayMode ? 'pointer-events-auto' : '';

    const topBar = (
        <div
            className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent ${overlayMode ? 'z-20' : 'z-10'}`}
        >
            <button
                type="button"
                className="flex items-center gap-3 text-outline-variant hover:text-primary transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    onBack();
                }}
            >
                <ArrowLeft size={24} />
                <span className="text-lg font-medium truncate max-w-[60vw]">{title || 'Back'}</span>
            </button>
        </div>
    );

    return (
        <>
            {!overlayMode && topBar}

            <div className={controlsLayerClass}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <button
                        className={`${interactiveClass} w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all hover:scale-110`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlayPause();
                        }}
                    >
                        {playing ? <Pause size={36} /> : <Play size={36} className="ml-1" />}
                    </button>
                </div>

                <div
                    className={`${interactiveClass} absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-3 flex items-center gap-3">
                        <span className="text-xs text-white/80 tabular-nums w-14 text-right">
                            {formatTime(currentTime)}
                        </span>
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            step={1}
                            value={currentTime}
                            onChange={handleSeekInput}
                            onMouseUp={seekOnRelease ? handleSeekRelease : undefined}
                            onTouchEnd={seekOnRelease ? handleSeekRelease : undefined}
                            className="flex-1 h-1 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                            style={{
                                background: `linear-gradient(to right, rgb(255,255,255) 0%, rgb(255,255,255) ${pct}%, rgba(255,255,255,0.3) ${pct}%, rgba(255,255,255,0.3) 100%)`,
                            }}
                        />
                        <span className="text-xs text-white/80 tabular-nums w-14">{formatTime(duration)}</span>
                    </div>

                    <div className="flex items-center gap-4 text-outline-variant">
                        <button className="hover:text-primary transition-colors" onClick={onPlayPause}>
                            {playing ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                        <button className="hover:text-primary transition-colors flex items-center gap-1" onClick={() => onSkip(-skipBackward)}>
                            <SkipBack size={20} />
                            <span className="text-[10px] opacity-70 font-mono">-{skipBackward}s</span>
                        </button>
                        <button className="hover:text-primary transition-colors flex items-center gap-1" onClick={() => onSkip(skipForward)}>
                            <SkipForward size={20} />
                            <span className="text-[10px] opacity-70 font-mono">+{skipForward}s</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button className="hover:text-primary transition-colors" onClick={onToggleMute}>
                                {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={muted ? 0 : volume}
                                onChange={(e) => onVolumeChange(Number(e.target.value))}
                                className="w-24 h-1 rounded-full appearance-none cursor-pointer bg-white/30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                            />
                        </div>

                        <div className="flex-1" />

                        {tracks && tracks.subtitles.length > 0 && (
                            <div className="relative">
                                <button
                                    className={`transition-colors ${tracks.activeSubtitleId ? 'text-primary' : 'hover:text-primary'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowSubtitleMenu(!showSubtitleMenu);
                                        setShowAudioMenu(false);
                                    }}
                                >
                                    <Subtitles size={20} />
                                </button>
                                {showSubtitleMenu && (
                                    <div className="absolute bottom-10 right-0 bg-black/95 border border-white/10 rounded-lg py-1 min-w-[200px] max-h-[300px] overflow-y-auto shadow-xl backdrop-blur-sm">
                                        <div className="px-3 py-1.5 text-xs text-white/50 uppercase tracking-wide">Subtitles</div>
                                        <button
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                                            onClick={() => {
                                                tracks.onSelectSubtitle(null);
                                                setShowSubtitleMenu(false);
                                            }}
                                        >
                                            <span className="w-4">{!tracks.activeSubtitleId && <Check size={14} />}</span>
                                            Off
                                        </button>
                                        {tracks.subtitles.map((sub) => (
                                            <button
                                                key={sub.id}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                                                onClick={() => {
                                                    tracks.onSelectSubtitle(sub.id);
                                                    setShowSubtitleMenu(false);
                                                }}
                                            >
                                                <span className="w-4">
                                                    {tracks.activeSubtitleId === sub.id && (
                                                        <Check size={14} className="text-primary" />
                                                    )}
                                                </span>
                                                <span className="flex-1 text-left truncate">{sub.label}</span>
                                                <span className="text-[10px] text-white/40 uppercase">
                                                    {sub.source === 'embedded' ? 'EMB' : 'EXT'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {tracks && tracks.audioTracks.length > 1 && (
                            <div className="relative">
                                <button
                                    className="hover:text-primary transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAudioMenu(!showAudioMenu);
                                        setShowSubtitleMenu(false);
                                    }}
                                >
                                    <AudioLines size={20} />
                                </button>
                                {showAudioMenu && (
                                    <div className="absolute bottom-10 right-0 bg-black/95 border border-white/10 rounded-lg py-1 min-w-[220px] max-h-[300px] overflow-y-auto shadow-xl backdrop-blur-sm">
                                        <div className="px-3 py-1.5 text-xs text-white/50 uppercase tracking-wide">Audio</div>
                                        {tracks.audioTracks.map((track) => (
                                            <button
                                                key={track.index}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                                                onClick={() => {
                                                    tracks.onSelectAudio(track.index);
                                                    setShowAudioMenu(false);
                                                }}
                                            >
                                                <span className="w-4">
                                                    {tracks.activeAudioIndex === track.index && (
                                                        <Check size={14} className="text-primary" />
                                                    )}
                                                </span>
                                                <span className="flex-1 text-left truncate">{track.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button className="hover:text-primary transition-colors" onClick={onToggleFullscreen}>
                            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {overlayMode && topBar}
        </>
    );
};
