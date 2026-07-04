import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/app/layout/MainLayout';
import {
    GlassButton, GlassHeading, GlassSpinner,
    IconArrowLeft, IconPlaySolid, IconPlus, IconMusicNote,
} from '@knp-org/liquid-glass-ui';
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
                    <GlassSpinner size={40} />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                <GlassButton shape="circle" onClick={() => navigate(-1)} aria-label="Back">
                    <IconArrowLeft size={20} glow={false} />
                </GlassButton>

                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                    <div className="w-48 h-48 rounded-2xl overflow-hidden bg-white/5 border border-outline shadow-[0_0_30px_rgba(0,0,0,0.4)] shrink-0 flex items-center justify-center">
                        {album.cover_url ? (
                            <img src={resolveImageUrl(album.cover_url)} alt={album.title} className="w-full h-full object-cover" />
                        ) : (
                            <IconMusicNote size={48} glow={false} className="text-outline-variant" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wider text-outline-variant font-label">Album</p>
                        <GlassHeading as="h1" size="large" className="text-3xl md:text-5xl leading-tight">{album.title}</GlassHeading>
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
                            <GlassButton onClick={() => player.playQueue(album.tracks, 0)} disabled={album.tracks.length === 0}>
                                <span className="inline-flex items-center gap-2"><IconPlaySolid size={18} glow={false} /> Play</span>
                            </GlassButton>
                            <GlassButton variant="secondary" onClick={() => setAddItems(album.tracks.map(t => t.id))} disabled={album.tracks.length === 0}>
                                <span className="inline-flex items-center gap-2"><IconPlus size={18} glow={false} /> Add to Playlist</span>
                            </GlassButton>
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
