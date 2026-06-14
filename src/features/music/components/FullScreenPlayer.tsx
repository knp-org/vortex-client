import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Play, Pause, SkipBack, SkipForward, Rewind, FastForward,
    Shuffle, Repeat, Repeat1, Volume2, Volume1, VolumeX,
    ChevronDown, Music, ListMusic, Mic2, Plus,
} from 'lucide-react';
import { resolveImageUrl, mediaService } from '@/services';
import type { Lyrics } from '@/types';
import { usePlatform } from '@/shared/hooks/usePlatform';
import { useMusicPlayer } from '../MusicPlayerContext';
import { AddToPlaylistModal } from './AddToPlaylistModal';

const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

type Tab = 'lyrics' | 'queue';

export const FullScreenPlayer: React.FC = () => {
    const p = useMusicPlayer();
    const { isTauri } = usePlatform();
    const [tab, setTab] = useState<Tab>('lyrics');
    const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

    // Close on Escape.
    useEffect(() => {
        if (!p.expanded) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') p.setExpanded(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [p.expanded, p.setExpanded]);

    if (!p.expanded || !p.hasTrack || !p.current) return null;
    const t = p.current;
    const cover = t.cover_url ? resolveImageUrl(t.cover_url) : undefined;
    const VolIcon = p.muted || p.volume === 0 ? VolumeX : p.volume < 0.5 ? Volume1 : Volume2;

    return (
        <div className={`fixed left-0 right-0 bottom-0 z-50 flex flex-col bg-[#08080c] animate-fade-in overflow-hidden ${isTauri ? 'top-8' : 'top-0'}`}>
            {/* Blurred album-art backdrop */}
            {cover && (
                <div
                    className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-30 pointer-events-none"
                    style={{ backgroundImage: `url(${cover})` }}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90 pointer-events-none" />

            {/* Header */}
            <div className="relative shrink-0 h-16 px-6 flex items-center justify-between">
                <button
                    onClick={() => p.setExpanded(false)}
                    title="Collapse"
                    className="p-2 rounded-full text-outline-variant hover:text-primary hover:bg-white/10 transition-colors"
                >
                    <ChevronDown size={24} />
                </button>
                <div className="text-xs uppercase tracking-widest text-outline-variant font-label">Now Playing</div>
                <button
                    onClick={() => setShowAddToPlaylist(true)}
                    title="Add to playlist"
                    className="p-2 rounded-full text-outline-variant hover:text-primary hover:bg-white/10 transition-colors"
                >
                    <Plus size={22} />
                </button>
            </div>

            {/* Body: art + controls on the left, lyrics/queue on the right */}
            <div className="relative flex-1 min-h-0 flex flex-col lg:flex-row gap-8 px-6 lg:px-12 pb-6 overflow-y-auto lg:overflow-hidden">
                {/* Left: art, info, transport */}
                <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-6">
                    <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-white/5 border border-outline shadow-[0_12px_48px_rgba(0,0,0,0.6)] flex items-center justify-center">
                        {cover
                            ? <img src={cover} alt={t.album || ''} className="w-full h-full object-cover" />
                            : <Music size={72} className="text-outline-variant" />}
                    </div>

                    <div className="text-center max-w-sm w-full px-2">
                        <div className="text-2xl font-bold text-primary font-heading truncate">{t.title || 'Unknown'}</div>
                        <div className="text-outline-variant font-label truncate mt-1">{t.artist || 'Unknown Artist'}</div>
                        {t.album && <div className="text-outline-variant/70 text-sm font-label truncate">{t.album}</div>}
                    </div>

                    {/* Seek */}
                    <div className="w-full max-w-sm flex items-center gap-3">
                        <span className="text-[11px] text-outline-variant font-label w-10 text-right tabular-nums">{fmt(p.position)}</span>
                        <input
                            type="range" min={0} max={p.duration || 0} step={0.1} value={p.position}
                            onChange={(e) => p.seek(parseFloat(e.target.value))}
                            className="flex-1 h-1.5 accent-primary cursor-pointer"
                        />
                        <span className="text-[11px] text-outline-variant font-label w-10 tabular-nums">{fmt(p.duration)}</span>
                    </div>

                    {/* Transport */}
                    <div className="flex items-center gap-4 text-outline-variant">
                        <button onClick={p.toggleShuffle} title="Shuffle"
                            className={`p-2 rounded-full hover:text-primary transition-colors ${p.shuffle ? 'text-primary' : ''}`}>
                            <Shuffle size={20} />
                        </button>
                        <button onClick={() => p.skip(-10)} title="Back 10s" className="p-2 rounded-full hover:text-primary transition-colors">
                            <Rewind size={20} />
                        </button>
                        <button onClick={p.prev} title="Previous" className="p-2 rounded-full hover:text-primary transition-colors">
                            <SkipBack size={24} className="fill-current" />
                        </button>
                        <button onClick={p.togglePlay} title={p.isPlaying ? 'Pause' : 'Play'}
                            className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-105 transition-transform">
                            {p.isPlaying ? <Pause size={26} className="fill-current" /> : <Play size={26} className="fill-current ml-0.5" />}
                        </button>
                        <button onClick={p.next} title="Next" className="p-2 rounded-full hover:text-primary transition-colors">
                            <SkipForward size={24} className="fill-current" />
                        </button>
                        <button onClick={() => p.skip(10)} title="Forward 10s" className="p-2 rounded-full hover:text-primary transition-colors">
                            <FastForward size={20} />
                        </button>
                        <button onClick={p.cycleRepeat} title={`Repeat: ${p.repeat}`}
                            className={`p-2 rounded-full hover:text-primary transition-colors ${p.repeat !== 'off' ? 'text-primary' : ''}`}>
                            {p.repeat === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                        </button>
                    </div>

                    {/* Volume */}
                    <div
                        className="flex items-center gap-3 text-outline-variant"
                        onWheel={(e) => { e.preventDefault(); p.bumpVolume(e.deltaY < 0 ? 0.05 : -0.05); }}
                        title="Scroll to change volume"
                    >
                        <button onClick={p.toggleMute} className="p-1.5 rounded-full hover:text-primary transition-colors">
                            <VolIcon size={20} />
                        </button>
                        <input
                            type="range" min={0} max={1} step={0.01} value={p.muted ? 0 : p.volume}
                            onChange={(e) => p.setVolume(parseFloat(e.target.value))}
                            className="w-32 h-1 accent-primary cursor-pointer"
                        />
                    </div>
                </div>

                {/* Right: lyrics / queue panel */}
                <div className="flex-1 min-w-0 lg:max-w-md flex flex-col min-h-0">
                    <div className="shrink-0 flex items-center gap-2 mb-3">
                        <TabButton active={tab === 'lyrics'} onClick={() => setTab('lyrics')} icon={Mic2} label="Lyrics" />
                        <TabButton active={tab === 'queue'} onClick={() => setTab('queue')} icon={ListMusic} label="Up Next" />
                    </div>
                    <div className="flex-1 min-h-0">
                        {tab === 'lyrics'
                            ? <LyricsPanel trackId={t.id} position={p.position} onSeek={p.seek} />
                            : <QueuePanel />}
                    </div>
                </div>
            </div>

            {showAddToPlaylist && (
                <AddToPlaylistModal itemIds={[t.id]} onClose={() => setShowAddToPlaylist(false)} />
            )}
        </div>
    );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ElementType; label: string }> =
    ({ active, onClick, icon: Icon, label }) => (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-label transition-colors ${
                active ? 'bg-primary/15 text-primary' : 'text-outline-variant hover:text-primary'
            }`}
        >
            <Icon size={16} /> {label}
        </button>
    );

// ── Lyrics ───────────────────────────────────────────────────────────────────

const LyricsPanel: React.FC<{ trackId: number; position: number; onSeek: (s: number) => void }> =
    ({ trackId, position, onSeek }) => {
        const [lyrics, setLyrics] = useState<Lyrics | null>(null);
        const [loading, setLoading] = useState(true);
        const activeRef = useRef<HTMLParagraphElement | null>(null);
        const scrollRef = useRef<HTMLDivElement | null>(null);

        useEffect(() => {
            let cancelled = false;
            setLoading(true);
            setLyrics(null);
            mediaService.lyrics(trackId)
                .then(l => { if (!cancelled) setLyrics(l); })
                .catch(() => { if (!cancelled) setLyrics(null); })
                .finally(() => { if (!cancelled) setLoading(false); });
            return () => { cancelled = true; };
        }, [trackId]);

        // Index of the current line for synced lyrics: last line whose time <= position.
        const activeIndex = useMemo(() => {
            if (!lyrics?.synced) return -1;
            let idx = -1;
            for (let i = 0; i < lyrics.lines.length; i++) {
                const time = lyrics.lines[i].time;
                if (time != null && time <= position + 0.25) idx = i; else break;
            }
            return idx;
        }, [lyrics, position]);

        // Auto-scroll the active line into view — but only within the lyrics
        // container. `scrollIntoView` scrolls every scrollable ancestor (which
        // would push the whole player, header and all, out of view), so we
        // scroll the container manually instead.
        useEffect(() => {
            const container = scrollRef.current;
            const active = activeRef.current;
            if (!container || !active) return;
            const top = active.offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
            container.scrollTo({ top, behavior: 'smooth' });
        }, [activeIndex]);

        if (loading) {
            return <Centered><div className="w-6 h-6 border-2 border-current rounded-full animate-spin border-t-transparent text-outline-variant" /></Centered>;
        }
        if (!lyrics || lyrics.lines.length === 0) {
            return <Centered><span className="text-outline-variant text-sm font-body">No lyrics found for this track.</span></Centered>;
        }

        return (
            <div ref={scrollRef} className="relative h-full overflow-y-auto pr-2 space-y-1 scroll-smooth lyrics-scroll">
                {lyrics.lines.map((line, i) => {
                    const active = i === activeIndex;
                    const clickable = lyrics.synced && line.time != null;
                    return (
                        <p
                            key={i}
                            ref={active ? activeRef : undefined}
                            onClick={clickable ? () => onSeek(line.time as number) : undefined}
                            className={`font-heading leading-snug py-1 transition-colors ${
                                clickable ? 'cursor-pointer' : ''
                            } ${
                                active
                                    ? 'text-primary text-xl font-semibold'
                                    : lyrics.synced
                                        ? 'text-outline-variant/60 text-lg hover:text-outline-variant'
                                        : 'text-on-surface text-base'
                            }`}
                        >
                            {line.text || ' '}
                        </p>
                    );
                })}
                {lyrics.source === 'lrclib' && (
                    <p className="text-[10px] text-outline-variant/50 font-label pt-4">Lyrics via lrclib.net</p>
                )}
            </div>
        );
    };

// ── Up-next queue ─────────────────────────────────────────────────────────────

const QueuePanel: React.FC = () => {
    const p = useMusicPlayer();
    if (p.orderedQueue.length === 0) {
        return <Centered><span className="text-outline-variant text-sm font-body">Queue is empty.</span></Centered>;
    }
    return (
        <div className="h-full overflow-y-auto pr-2 divide-y divide-outline/30">
            {p.orderedQueue.map((track, i) => {
                const current = i === p.currentIndex;
                return (
                    <button
                        key={`${track.id}-${i}`}
                        onClick={() => p.jumpTo(i)}
                        className={`w-full flex items-center gap-3 py-2.5 px-2 text-left rounded-lg hover:bg-white/5 transition-colors ${
                            current ? 'bg-white/5' : ''
                        }`}
                    >
                        <span className={`w-6 text-center text-xs tabular-nums shrink-0 ${current ? 'text-primary' : 'text-outline-variant/60'}`}>
                            {current ? <Music size={14} className="mx-auto" /> : i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className={`text-sm font-heading truncate ${current ? 'text-primary' : 'text-on-surface'}`}>
                                {track.title || 'Unknown'}
                            </div>
                            <div className="text-xs text-outline-variant font-label truncate">{track.artist || track.album || ''}</div>
                        </div>
                        {track.duration != null && (
                            <span className="text-[11px] text-outline-variant/60 font-label tabular-nums shrink-0">{fmt(track.duration)}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

const Centered: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="h-full flex items-center justify-center">{children}</div>
);
