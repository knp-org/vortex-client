import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/app/layout/MainLayout';
import { ArrowLeft, Play, Plus, Music } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { resolveImageUrl, mediaService } from '@/services';
import type { AlbumDetail as AlbumDetailT } from '@/types';
import { useMusicPlayer } from '../MusicPlayerContext';
import { TrackList } from './TrackList';
import { AddToPlaylistModal } from './AddToPlaylistModal';

export const AlbumDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const player = useMusicPlayer();
    const [album, setAlbum] = useState<AlbumDetailT | null>(null);
    const [addItems, setAddItems] = useState<number[] | null>(null);

    useEffect(() => {
        if (id) mediaService.album(id).then(setAlbum).catch(console.error);
    }, [id]);

    if (!album) {
        return (
            <MainLayout>
                <div className="min-h-[50vh] flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-primary rounded-full animate-spin border-t-transparent" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                <button onClick={() => navigate(-1)} className="bg-surface/50 hover:bg-white/10 text-primary border border-outline rounded-full p-2.5 transition-all backdrop-blur-surface">
                    <ArrowLeft size={20} />
                </button>

                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                    <div className="w-48 h-48 rounded-2xl overflow-hidden bg-white/5 border border-outline shadow-[0_0_30px_rgba(0,0,0,0.4)] shrink-0 flex items-center justify-center">
                        {album.cover_url ? (
                            <img src={resolveImageUrl(album.cover_url)} alt={album.title} className="w-full h-full object-cover" />
                        ) : (
                            <Music size={48} className="text-outline-variant" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wider text-outline-variant font-label">Album</p>
                        <h1 className="text-3xl md:text-5xl font-bold text-primary font-heading leading-tight">{album.title}</h1>
                        <div className="mt-2 text-outline-variant font-body flex items-center gap-2 flex-wrap">
                            {album.artist && (
                                <button
                                    className="text-primary hover:underline"
                                    onClick={() => album.artist_id && navigate(`/artists/${album.artist_id}`)}
                                >
                                    {album.artist}
                                </button>
                            )}
                            {album.year && <span>· {album.year}</span>}
                            <span>· {album.tracks.length} songs</span>
                        </div>

                        <div className="mt-5 flex items-center gap-3">
                            <Button icon={Play} onClick={() => player.playQueue(album.tracks, 0)} disabled={album.tracks.length === 0}>
                                Play
                            </Button>
                            <Button variant="secondary" icon={Plus} onClick={() => setAddItems(album.tracks.map(t => t.id))} disabled={album.tracks.length === 0}>
                                Add to Playlist
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-surface/40 backdrop-blur-surface border border-outline rounded-2xl p-3 md:p-4">
                    <TrackList
                        tracks={album.tracks}
                        currentId={player.current?.id}
                        isPlaying={player.isPlaying}
                        onPlay={(i) => player.playQueue(album.tracks, i)}
                        onAdd={(itemId) => setAddItems([itemId])}
                        onAddMany={setAddItems}
                    />
                </div>
            </div>

            {addItems && <AddToPlaylistModal itemIds={addItems} onClose={() => setAddItems(null)} />}
        </MainLayout>
    );
};
