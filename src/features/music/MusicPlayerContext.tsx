import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { resolveUrl, withAuthToken } from '@/services';
import type { Track } from '@/types';

export type RepeatMode = 'off' | 'all' | 'one';

interface MusicPlayerContextType {
    queue: Track[];
    current?: Track;
    isPlaying: boolean;
    position: number;
    duration: number;
    volume: number;
    muted: boolean;
    shuffle: boolean;
    repeat: RepeatMode;
    hasTrack: boolean;
    /** The queue in play order (shuffle applied), for the up-next list. */
    orderedQueue: Track[];
    /** Index into `orderedQueue` of the current track. */
    currentIndex: number;
    /** Whether the full-screen player is open. */
    expanded: boolean;
    setExpanded: (v: boolean) => void;
    /** Jump to a position in `orderedQueue`. */
    jumpTo: (index: number) => void;
    /** Start a queue (e.g. an album / playlist), optionally at a given index. */
    playQueue: (tracks: Track[], startIndex?: number) => void;
    togglePlay: () => void;
    next: () => void;
    prev: () => void;
    seek: (seconds: number) => void;
    /** Relative seek within the current track (e.g. +10 / -10). */
    skip: (delta: number) => void;
    setVolume: (v: number) => void;
    /** Relative volume change for mouse-wheel control. */
    bumpVolume: (delta: number) => void;
    toggleMute: () => void;
    toggleShuffle: () => void;
    cycleRepeat: () => void;
    stop: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

const shuffled = (n: number, first: number): number[] => {
    const rest = Array.from({ length: n }, (_, i) => i).filter(i => i !== first);
    for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return [first, ...rest];
};

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    if (audioRef.current === null && typeof Audio !== 'undefined') {
        audioRef.current = new Audio();
    }

    const [queue, setQueue] = useState<Track[]>([]);
    const [order, setOrder] = useState<number[]>([]); // play order: indices into queue
    const [pos, setPos] = useState(0);                 // index into order
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(1);
    const [muted, setMuted] = useState(false);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState<RepeatMode>('off');
    const [expanded, setExpanded] = useState(false);

    const current = queue[order[pos]];
    const hasTrack = !!current;
    const orderedQueue = order.map(i => queue[i]).filter(Boolean);

    // Load + (re)play whenever the current track changes.
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (!current) {
            audio.pause();
            audio.removeAttribute('src');
            return;
        }
        audio.src = withAuthToken(resolveUrl(current.stream_url));
        audio.load();
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }, [current?.id]);

    // Keep audio volume in sync.
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
    }, [volume, muted]);

    // Advance to the next track, respecting repeat. Kept in a ref so the audio
    // 'ended' listener always sees current state.
    const advance = useCallback(() => {
        if (repeat === 'one') {
            const audio = audioRef.current;
            if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
            return;
        }
        setPos(prev => {
            if (prev + 1 < order.length) return prev + 1;
            if (repeat === 'all') return 0;
            return prev; // end of queue
        });
        if (pos + 1 >= order.length && repeat !== 'all') {
            setIsPlaying(false);
        }
    }, [repeat, order.length, pos]);

    const advanceRef = useRef(advance);
    advanceRef.current = advance;

    // Wire audio element events once.
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onTime = () => setPosition(audio.currentTime || 0);
        const onMeta = () => setDuration(audio.duration || 0);
        const onEnded = () => advanceRef.current();
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        audio.addEventListener('timeupdate', onTime);
        audio.addEventListener('loadedmetadata', onMeta);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        return () => {
            audio.removeEventListener('timeupdate', onTime);
            audio.removeEventListener('loadedmetadata', onMeta);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }, []);

    const playQueue = useCallback((tracks: Track[], startIndex = 0) => {
        setQueue(tracks);
        if (shuffle) {
            setOrder(shuffled(tracks.length, startIndex));
            setPos(0);
        } else {
            setOrder(Array.from({ length: tracks.length }, (_, i) => i));
            setPos(startIndex);
        }
    }, [shuffle]);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !current) return;
        if (audio.paused) audio.play().catch(() => {});
        else audio.pause();
    }, [current]);

    const next = useCallback(() => {
        setPos(prev => {
            if (prev + 1 < order.length) return prev + 1;
            return repeat === 'all' ? 0 : prev;
        });
    }, [order.length, repeat]);

    const prev = useCallback(() => {
        const audio = audioRef.current;
        if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
        setPos(prev => (prev > 0 ? prev - 1 : (repeat === 'all' ? order.length - 1 : 0)));
    }, [order.length, repeat]);

    const jumpTo = useCallback((index: number) => {
        setPos(prev => (index >= 0 && index < order.length ? index : prev));
    }, [order.length]);

    const seek = useCallback((seconds: number) => {
        const audio = audioRef.current;
        if (audio) { audio.currentTime = seconds; setPosition(seconds); }
    }, []);

    const skip = useCallback((delta: number) => {
        const audio = audioRef.current;
        if (audio) {
            const t = Math.max(0, Math.min((audio.duration || 0), audio.currentTime + delta));
            audio.currentTime = t;
            setPosition(t);
        }
    }, []);

    const setVolume = useCallback((v: number) => {
        const clamped = Math.max(0, Math.min(1, v));
        setVolumeState(clamped);
        if (clamped > 0) setMuted(false);
    }, []);

    const bumpVolume = useCallback((delta: number) => setVolume((muted ? 0 : volume) + delta), [muted, volume, setVolume]);
    const toggleMute = useCallback(() => setMuted(m => !m), []);

    const toggleShuffle = useCallback(() => {
        setShuffle(s => {
            const on = !s;
            // Rebuild order keeping the current track playing.
            const cur = order[pos] ?? 0;
            if (on) {
                setOrder(shuffled(queue.length, cur));
                setPos(0);
            } else {
                setOrder(Array.from({ length: queue.length }, (_, i) => i));
                setPos(cur);
            }
            return on;
        });
    }, [order, pos, queue.length]);

    const cycleRepeat = useCallback(() => {
        setRepeat(r => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'));
    }, []);

    const stop = useCallback(() => {
        const audio = audioRef.current;
        if (audio) { audio.pause(); audio.removeAttribute('src'); }
        setQueue([]); setOrder([]); setPos(0); setIsPlaying(false); setPosition(0); setDuration(0);
        setExpanded(false);
    }, []);

    return (
        <MusicPlayerContext.Provider value={{
            queue, current, isPlaying, position, duration, volume, muted, shuffle, repeat, hasTrack,
            orderedQueue, currentIndex: pos, expanded, setExpanded, jumpTo,
            playQueue, togglePlay, next, prev, seek, skip, setVolume, bumpVolume, toggleMute,
            toggleShuffle, cycleRepeat, stop,
        }}>
            {children}
        </MusicPlayerContext.Provider>
    );
};

export const useMusicPlayer = () => {
    const ctx = useContext(MusicPlayerContext);
    if (!ctx) throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
    return ctx;
};
