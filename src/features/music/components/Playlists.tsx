import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/app/layout/MainLayout';
import { ArrowLeft, Play, Plus, Trash2, ListMusic } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
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
                    <h1 className="text-3xl font-bold text-primary font-heading">Playlists</h1>
                    <p className="text-outline-variant text-sm mt-1 font-body">Your saved music playlists.</p>
                </div>
                <form onSubmit={create} className="flex items-end gap-2">
                    <Input label="New playlist" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                    <Button type="submit" size="sm" icon={Plus} disabled={!name.trim()}>Create</Button>
                </form>
            </div>

            {playlists.length === 0 ? (
                <p className="text-outline-variant font-body py-10 text-center">No playlists yet.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playlists.map(pl => (
                        <button
                            key={pl.id}
                            onClick={() => navigate(`/playlists/${pl.id}`)}
                            className="text-left bg-surface/50 backdrop-blur-surface border border-outline rounded-2xl p-5 hover:bg-white/5 transition-colors flex items-center gap-4"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <ListMusic size={22} />
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

    const load = async () => { try { setPl(await playlistService.get(id)); } catch (e) { console.error(e); } };
    useEffect(() => { load(); }, [id]);

    if (!pl) {
        return <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-primary rounded-full animate-spin border-t-transparent" />
        </div>;
    }

    const removeTrack = async (itemId: number) => {
        await playlistService.removeTrack(id, itemId);
        load();
    };
    const deletePlaylist = async () => {
        if (!window.confirm(`Delete playlist "${pl.name}"?`)) return;
        await playlistService.remove(id);
        navigate('/playlists');
    };

    return (
        <div className="p-6 md:p-8 space-y-6 animate-fade-in">
            <button onClick={() => navigate('/playlists')} className="bg-surface/50 hover:bg-white/10 text-primary border border-outline rounded-full p-2.5 transition-all backdrop-blur-surface">
                <ArrowLeft size={20} />
            </button>

            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-xs uppercase tracking-wider text-outline-variant font-label">Playlist</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-primary font-heading">{pl.name}</h1>
                    <p className="text-outline-variant text-sm mt-1 font-body">{pl.tracks.length} tracks</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button icon={Play} onClick={() => player.playQueue(pl.tracks, 0)} disabled={pl.tracks.length === 0}>Play</Button>
                    <Button variant="secondary" icon={Trash2} onClick={deletePlaylist}>Delete</Button>
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
