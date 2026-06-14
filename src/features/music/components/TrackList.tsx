import React, { useState } from 'react';
import { Play, Plus, Trash2, Volume2, CheckSquare, Square, X, ListMusic } from 'lucide-react';
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
    /** When provided, enables multi-select mode and adds the chosen tracks in bulk. */
    onAddMany?: (itemIds: number[]) => void;
    onRemove?: (itemId: number) => void;
}

export const TrackList: React.FC<Props> = ({ tracks, currentId, isPlaying, onPlay, onAdd, onAddMany, onRemove }) => {
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState<Set<number>>(new Set());

    const toggle = (id: number) => setSelected(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });

    const exitSelect = () => { setSelecting(false); setSelected(new Set()); };
    const allSelected = tracks.length > 0 && selected.size === tracks.length;
    const selectAll = () => setSelected(allSelected ? new Set() : new Set(tracks.map(t => t.id)));
    const confirmAdd = () => {
        if (!onAddMany || selected.size === 0) return;
        onAddMany(tracks.filter(t => selected.has(t.id)).map(t => t.id));
        exitSelect();
    };

    return (
        <div>
            {onAddMany && (
                <div className="flex items-center justify-between gap-2 pb-2 mb-1 border-b border-outline/40">
                    {!selecting ? (
                        <button
                            onClick={() => setSelecting(true)}
                            disabled={tracks.length === 0}
                            className="text-xs font-label text-outline-variant hover:text-primary flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-40"
                        >
                            <CheckSquare size={14} /> Select
                        </button>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <button onClick={selectAll} className="text-xs font-label text-outline-variant hover:text-primary px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                                    {allSelected ? 'Clear' : 'Select all'}
                                </button>
                                <span className="text-xs font-label text-outline-variant">{selected.size} selected</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={confirmAdd}
                                    disabled={selected.size === 0}
                                    className="text-xs font-label text-primary hover:text-primary flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-40"
                                >
                                    <ListMusic size={14} /> Add
                                </button>
                                <button
                                    onClick={exitSelect}
                                    title="Cancel"
                                    className="p-1.5 rounded-full text-outline-variant hover:text-primary hover:bg-white/10 transition-colors"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="divide-y divide-outline/40">
                {tracks.map((t, i) => {
                    const active = currentId === t.id;
                    const isSelected = selected.has(t.id);
                    return (
                        <div
                            key={t.id}
                            onClick={() => (selecting ? toggle(t.id) : onPlay(i))}
                            className="group flex items-center gap-3 py-2.5 px-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                        >
                            {selecting ? (
                                <div className="w-6 flex items-center justify-center text-outline-variant">
                                    {isSelected
                                        ? <CheckSquare size={16} className="text-primary" />
                                        : <Square size={16} />}
                                </div>
                            ) : (
                                <>
                                    <div className="w-6 text-center text-xs text-outline-variant font-label">
                                        {active && isPlaying
                                            ? <Volume2 size={14} className="text-primary mx-auto" />
                                            : (t.track_number ?? i + 1)}
                                    </div>
                                    <Play size={14} className="hidden group-hover:block text-primary -ml-6" />
                                </>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className={`truncate font-heading ${active ? 'text-primary' : 'text-primary'}`}>
                                    {t.title || 'Unknown'}
                                </div>
                                {t.artist && <div className="text-xs text-outline-variant truncate font-label">{t.artist}</div>}
                            </div>
                            <span className="text-xs text-outline-variant font-label tabular-nums">{fmt(t.duration)}</span>
                            {!selecting && onAdd && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAdd(t.id); }}
                                    title="Add to playlist"
                                    className="p-1.5 rounded-full text-outline-variant hover:text-primary hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Plus size={15} />
                                </button>
                            )}
                            {!selecting && onRemove && (
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
        </div>
    );
};
