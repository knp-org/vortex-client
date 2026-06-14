import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, ListMusic } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { playlistService } from '@/services';
import type { Playlist } from '@/types';

/** Adds one or more track item-ids to a chosen (or newly created) playlist. */
export const AddToPlaylistModal: React.FC<{ itemIds: number[]; onClose: () => void }> = ({ itemIds, onClose }) => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [newName, setNewName] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');

    const load = async () => {
        try { setPlaylists(await playlistService.list()); } catch { /* ignore */ }
    };
    useEffect(() => { load(); }, []);

    const addAll = async (playlistId: number) => {
        setBusy(true);
        try {
            for (const id of itemIds) await playlistService.addTrack(playlistId, id);
            onClose();
        } catch (e: any) {
            setMsg(e?.message || 'Failed to add to playlist.');
        } finally {
            setBusy(false);
        }
    };

    const createAndAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setBusy(true);
        try {
            const pl = await playlistService.create(newName.trim());
            await addAll(pl.id);
        } catch (e: any) {
            setMsg(e?.message || 'Failed to create playlist.');
            setBusy(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface/90 backdrop-blur-glass border border-outline rounded-2xl w-full max-w-md shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
                <div className="p-5 border-b border-outline flex items-center justify-between bg-white/5">
                    <h2 className="text-lg font-bold text-primary font-heading flex items-center gap-2">
                        <ListMusic size={18} className="text-primary" /> Add to Playlist
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={18} className="text-outline-variant hover:text-primary" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div className="max-h-56 overflow-y-auto divide-y divide-outline/40">
                        {playlists.map(pl => (
                            <button
                                key={pl.id}
                                disabled={busy}
                                onClick={() => addAll(pl.id)}
                                className="w-full text-left py-3 px-2 hover:bg-white/5 rounded-lg flex items-center justify-between transition-colors disabled:opacity-50"
                            >
                                <span className="text-primary font-heading">{pl.name}</span>
                                <span className="text-xs text-outline-variant font-label">{pl.track_count} tracks</span>
                            </button>
                        ))}
                        {playlists.length === 0 && (
                            <p className="text-outline-variant text-sm py-3 font-body">No playlists yet — create one below.</p>
                        )}
                    </div>

                    <form onSubmit={createAndAdd} className="flex items-end gap-2 pt-2 border-t border-outline/50">
                        <div className="flex-1">
                            <Input label="New playlist" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Playlist name" />
                        </div>
                        <Button type="submit" icon={Plus} disabled={!newName.trim() || busy}>Create</Button>
                    </form>

                    {msg && <p className="text-error text-sm font-body">{msg}</p>}
                </div>
            </div>
        </div>,
        document.body
    );
};
