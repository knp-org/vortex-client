import React from 'react';
import { Play, Plus, Trash2, Volume2 } from 'lucide-react';
import type { Track } from '@/types';

const fmt = (s?: number) => {
    if (!s || s < 0) return '';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

interface Props {
    tracks: Track[];
    currentId?: number;
    isPlaying?: boolean;
    onPlay: (index: number) => void;
    onAdd?: (itemId: number) => void;
    onRemove?: (itemId: number) => void;
}

export const TrackList: React.FC<Props> = ({ tracks, currentId, isPlaying, onPlay, onAdd, onRemove }) => (
    <div className="divide-y divide-outline/40">
        {tracks.map((t, i) => {
            const active = currentId === t.id;
            return (
                <div
                    key={t.id}
                    onClick={() => onPlay(i)}
                    className="group flex items-center gap-3 py-2.5 px-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                >
                    <div className="w-6 text-center text-xs text-outline-variant font-label">
                        {active && isPlaying
                            ? <Volume2 size={14} className="text-primary mx-auto" />
                            : (t.track_number ?? i + 1)}
                    </div>
                    <Play size={14} className="hidden group-hover:block text-primary -ml-6" />
                    <div className="flex-1 min-w-0">
                        <div className={`truncate font-heading ${active ? 'text-primary' : 'text-primary'}`}>
                            {t.title || 'Unknown'}
                        </div>
                        {t.artist && <div className="text-xs text-outline-variant truncate font-label">{t.artist}</div>}
                    </div>
                    <span className="text-xs text-outline-variant font-label tabular-nums">{fmt(t.duration)}</span>
                    {onAdd && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAdd(t.id); }}
                            title="Add to playlist"
                            className="p-1.5 rounded-full text-outline-variant hover:text-primary hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Plus size={15} />
                        </button>
                    )}
                    {onRemove && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(t.id); }}
                            title="Remove"
                            className="p-1.5 rounded-full text-outline-variant hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 size={15} />
                        </button>
                    )}
                </div>
            );
        })}
        {tracks.length === 0 && <p className="text-outline-variant text-sm py-6 text-center font-body">No tracks.</p>}
    </div>
);
