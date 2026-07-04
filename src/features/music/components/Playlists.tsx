import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/app/layout/MainLayout';
import {
    GlassButton, GlassHeading, GlassText, GlassSpinner, GlassInput, GlassModal,
    IconArrowLeft, IconPlaySolid, IconPlus, IconTrash, IconPlaylists,
} from '@knp-org/liquid-glass-ui';
import { playlistService } from '@/services';
import type { Playlist, PlaylistDetail } from '@/types';
import { useMusicPlayer } from '../MusicPlayerContext';
import { TrackList } from './TrackList';

const PlaylistList: React.FC = () => {
    const navigate = useNavigate();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [name, setName] = useState('');

    const load = async () => { try { setPlaylists(await playlistService.list()); } catch { /* */ } };
    useEffect(() => { load(); }, []);

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        await playlistService.create(name.trim());
        setName('');
        load();
    };

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in">
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <GlassHeading as="h1" size="medium">Playlists</GlassHeading>
                    <GlassText variant="muted" className="text-sm mt-1">Your saved music playlists.</GlassText>
                </div>
                <form onSubmit={create} className="flex items-end gap-2">
                    <GlassInput label="New playlist" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                    <GlassButton type="submit" size="sm" disabled={!name.trim()}>
                        <span className="inline-flex items-center gap-2"><IconPlus size={16} glow={false} /> Create</span>
                    </GlassButton>
                </form>
            </div>

            {playlists.length === 0 ? (
                <GlassText variant="muted" className="py-10 text-center">No playlists yet.</GlassText>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playlists.map(pl => (
                        <button
                            key={pl.id}
                            onClick={() => navigate(`/playlists/${pl.id}`)}
                            className="text-left bg-surface/50 backdrop-blur-surface border border-outline rounded-2xl p-5 hover:bg-white/5 transition-colors flex items-center gap-4"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <IconPlaylists size={22} glow={false} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-primary font-heading truncate">{pl.name}</div>
                                <div className="text-xs text-outline-variant font-label">{pl.track_count} tracks</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const PlaylistView: React.FC<{ id: number }> = ({ id }) => {
    const navigate = useNavigate();
    const player = useMusicPlayer();
    const [pl, setPl] = useState<PlaylistDetail | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const load = async () => { try { setPl(await playlistService.get(id)); } catch (e) { console.error(e); } };
    useEffect(() => { load(); }, [id]);

    if (!pl) {
        return <div className="min-h-[50vh] flex items-center justify-center">
            <GlassSpinner size={40} />
        </div>;
    }

    const removeTrack = async (itemId: number) => {
        await playlistService.removeTrack(id, itemId);
        load();
    };
    const deletePlaylist = async () => {
        await playlistService.remove(id);
        navigate('/playlists');
    };

    return (
        <div className="p-6 md:p-8 space-y-6 animate-fade-in">
            <GlassButton shape="circle" onClick={() => navigate('/playlists')} aria-label="Back">
                <IconArrowLeft size={20} glow={false} />
            </GlassButton>

            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-xs uppercase tracking-wider text-outline-variant font-label">Playlist</p>
                    <GlassHeading as="h1" size="large" className="text-3xl md:text-4xl">{pl.name}</GlassHeading>
                    <GlassText variant="muted" className="text-sm mt-1">{pl.tracks.length} tracks</GlassText>
                </div>
                <div className="flex items-center gap-3">
                    <GlassButton onClick={() => player.playQueue(pl.tracks, 0)} disabled={pl.tracks.length === 0}>
                        <span className="inline-flex items-center gap-2"><IconPlaySolid size={18} glow={false} /> Play</span>
                    </GlassButton>
                    <GlassButton variant="danger" onClick={() => setConfirmDelete(true)}>
                        <span className="inline-flex items-center gap-2"><IconTrash size={18} glow={false} /> Delete</span>
                    </GlassButton>
                </div>
            </div>

            <div className="bg-surface/40 backdrop-blur-surface border border-outline rounded-2xl p-3 md:p-4">
                <TrackList
                    tracks={pl.tracks}
                    currentId={player.current?.id}
                    isPlaying={player.isPlaying}
                    onPlay={(i) => player.playQueue(pl.tracks, i)}
                    onRemove={removeTrack}
                />
            </div>

            <GlassModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                title="Delete playlist"
                footer={
                    <>
                        <GlassButton variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</GlassButton>
                        <GlassButton variant="danger" onClick={deletePlaylist}>Delete</GlassButton>
                    </>
                }
            >
                <GlassText>Delete playlist "{pl.name}"? This can't be undone.</GlassText>
            </GlassModal>
        </div>
    );
};

export const Playlists: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    return (
        <MainLayout>
            {id ? <PlaylistView id={parseInt(id)} /> : <PlaylistList />}
        </MainLayout>
    );
};
