import React from 'react';
import {
    Play, Pause, SkipBack, SkipForward, Rewind, FastForward,
    Shuffle, Repeat, Repeat1, Volume2, Volume1, VolumeX, X, Music, ChevronUp,
} from 'lucide-react';
import { resolveImageUrl } from '@/services';
import { useMusicPlayer } from '../MusicPlayerContext';

const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const MusicPlayerBar: React.FC = () => {
    const p = useMusicPlayer();
    if (!p.hasTrack || !p.current) return null;
    const t = p.current;

    const VolIcon = p.muted || p.volume === 0 ? VolumeX : p.volume < 0.5 ? Volume1 : Volume2;

    return (
        <div className="shrink-0 h-20 bg-[#0d0d12]/95 backdrop-blur-glass border-t border-outline px-4 flex items-center gap-4 z-40">
            {/* Now playing — click to open the full-screen player */}
            <div className="flex items-center gap-3 w-1/4 min-w-0">
                <button
                    onClick={() => p.setExpanded(true)}
                    title="Open full-screen player"
                    className="w-14 h-14 rounded-lg overflow-hidden bg-white/5 border border-outline shrink-0 flex items-center justify-center group relative"
                >
                    {t.cover_url ? (
                        <img src={resolveImageUrl(t.cover_url)} alt={t.album || ''} className="w-full h-full object-cover" />
                    ) : (
                        <Music size={20} className="text-outline-variant" />
                    )}
                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ChevronUp size={18} className="text-white" />
                    </span>
                </button>
                <button onClick={() => p.setExpanded(true)} className="min-w-0 text-left">
                    <div className="text-primary text-sm font-medium font-heading truncate">{t.title || 'Unknown'}</div>
                    <div className="text-outline-variant text-xs font-label truncate">{t.artist || t.album || ''}</div>
                </button>
            </div>

            {/* Controls + progress */}
            <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div className="flex items-center gap-3 text-outline-variant">
                    <button onClick={p.toggleShuffle} title="Shuffle" className={`p-1.5 rounded-full hover:text-primary transition-colors ${p.shuffle ? 'text-primary' : ''}`}>
                        <Shuffle size={16} />
                    </button>
                    <button onClick={p.prev} title="Previous" className="p-1.5 rounded-full hover:text-primary transition-colors">
                        <SkipBack size={18} className="fill-current" />
                    </button>
                    <button onClick={() => p.skip(-10)} title="Back 10s" className="p-1.5 rounded-full hover:text-primary transition-colors">
                        <Rewind size={16} />
                    </button>
                    <button onClick={p.togglePlay} title={p.isPlaying ? 'Pause' : 'Play'}
                        className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-105 transition-transform">
                        {p.isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
                    </button>
                    <button onClick={() => p.skip(10)} title="Forward 10s" className="p-1.5 rounded-full hover:text-primary transition-colors">
                        <FastForward size={16} />
                    </button>
                    <button onClick={p.next} title="Next" className="p-1.5 rounded-full hover:text-primary transition-colors">
                        <SkipForward size={18} className="fill-current" />
                    </button>
                    <button onClick={p.cycleRepeat} title={`Repeat: ${p.repeat}`} className={`p-1.5 rounded-full hover:text-primary transition-colors ${p.repeat !== 'off' ? 'text-primary' : ''}`}>
                        {p.repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
                    </button>
                </div>

                <div className="w-full flex items-center gap-2 max-w-xl">
                    <span className="text-[10px] text-outline-variant font-label w-9 text-right tabular-nums">{fmt(p.position)}</span>
                    <input
                        type="range"
                        min={0}
                        max={p.duration || 0}
                        step={0.1}
                        value={p.position}
                        onChange={(e) => p.seek(parseFloat(e.target.value))}
                        className="flex-1 h-1 accent-primary cursor-pointer"
                    />
                    <span className="text-[10px] text-outline-variant font-label w-9 tabular-nums">{fmt(p.duration)}</span>
                </div>
            </div>

            {/* Volume (scroll to change) */}
            <div
                className="w-1/5 min-w-0 flex items-center justify-end gap-2 text-outline-variant"
                onWheel={(e) => { e.preventDefault(); p.bumpVolume(e.deltaY < 0 ? 0.05 : -0.05); }}
                title="Scroll to change volume"
            >
                <button onClick={p.toggleMute} className="p-1.5 rounded-full hover:text-primary transition-colors">
                    <VolIcon size={18} />
                </button>
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={p.muted ? 0 : p.volume}
                    onChange={(e) => p.setVolume(parseFloat(e.target.value))}
                    className="w-24 h-1 accent-primary cursor-pointer"
                />
                <button onClick={p.stop} title="Close player" className="p-1.5 rounded-full hover:text-primary transition-colors ml-1">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};
