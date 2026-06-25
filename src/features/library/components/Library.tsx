import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/app/layout/MainLayout';
import { Film, Tv, Music, BookOpen, Image, FileQuestion } from 'lucide-react';
import { MediaCard } from '@/features/media';
import { TrackList, useMusicPlayer } from '@/features/music';
import { AddToPlaylistModal } from '@/features/music';
import { Library as ILibrary, Card, Track } from '@/types';
import { libraryService, mediaService } from '@/services';

type MusicView = 'albums' | 'artists' | 'tracks';

export const Library: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const player = useMusicPlayer();
    const [items, setItems] = useState<Card[]>([]);
    const [library, setLibrary] = useState<ILibrary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Music-only browse state.
    const [view, setView] = useState<MusicView>('albums');
    const [artists, setArtists] = useState<Card[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [addItems, setAddItems] = useState<number[] | null>(null);

    const isMusic = library?.library_type === 'music';
    const isMusicVideos = library?.library_type === 'music_videos';

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);
            setError(null);
            try {
                const libs = await libraryService.getAll();
                const currentLib = libs.find(l => l.id === parseInt(id));
                if (currentLib) setLibrary(currentLib);

                // The server returns ready-to-render cards (series already collapsed).
                setItems(await mediaService.libraryItems(id));
            } catch (err) {
                console.error("Failed to fetch library data", err);
                setError("Failed to connect to server. Please check your connection.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Lazily load artists / tracks the first time their tab is opened.
    useEffect(() => {
        if (!id || !isMusic) return;
        if (view === 'artists' && artists.length === 0) {
            mediaService.artists(parseInt(id)).then(setArtists).catch(console.error);
        } else if (view === 'tracks' && tracks.length === 0) {
            mediaService.libraryTracks(id).then(setTracks).catch(console.error);
        }
    }, [id, isMusic, view, artists.length, tracks.length]);

    const getIcon = (type?: string) => {
        switch (type) {
            case 'movies': return <Film size={32} className="text-primary" />;
            case 'tv_shows': return <Tv size={32} className="text-primary" />;
            case 'music':
            case 'music_videos': return <Music size={32} className="text-primary" />;
            case 'books': return <BookOpen size={32} className="text-primary" />;
            case 'images': return <Image size={32} className="text-primary" />;
            default: return <FileQuestion size={32} className="text-primary" />;
        }
    };

    const handleItemClick = (card: Card) => {
        if (card.kind === 'series') navigate(`/series/${card.id}`);
        else if (card.kind === 'album') navigate(`/albums/${card.id}`);
        else if (card.kind === 'artist') navigate(`/artists/${card.id}`);
        else navigate(`/media/${card.id}`);
    };

    const gridCols = isMusicVideos
        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8';

    const grid = (cards: Card[]) => (
        <div className={`grid ${gridCols} gap-4 md:gap-6`}>
            {cards.map((card) => (
                <div key={`${card.kind}-${card.id}`} className="group cursor-pointer space-y-2">
                    <MediaCard
                        id={card.id}
                        title={card.title || ''}
                        posterUrl={card.poster_url}
                        type={card.kind === 'series' ? 'folder' : card.kind === 'album' ? 'album' : card.kind === 'artist' ? 'album' : 'movie'}
                        aspectRatio={isMusicVideos ? 'video' : 'poster'}
                        onClick={() => handleItemClick(card)}
                    />
                </div>
            ))}
        </div>
    );

    const skeleton = (
        <div className={`grid ${gridCols} gap-4 md:gap-6`}>
            {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-surface/50 rounded-xl animate-pulse backdrop-blur-surface border border-white/5" />
            ))}
        </div>
    );

    const tabs: { key: MusicView; label: string; count: number }[] = [
        { key: 'albums', label: 'Albums', count: items.length },
        { key: 'artists', label: 'Artists', count: artists.length },
        { key: 'tracks', label: 'Tracks', count: tracks.length },
    ];

    const headerCount = isMusic
        ? (view === 'albums' ? `${items.length} albums`
            : view === 'artists' ? `${artists.length} artists`
            : `${tracks.length} tracks`)
        : `${items.length} items`;

    const renderMusic = () => {
        if (view === 'artists') {
            return artists.length === 0
                ? <p className="text-center py-20 text-xl text-outline-variant font-heading">No artists found.</p>
                : grid(artists);
        }
        if (view === 'tracks') {
            return tracks.length === 0
                ? <p className="text-center py-20 text-xl text-outline-variant font-heading">No tracks found.</p>
                : (
                    <div className="bg-surface/40 backdrop-blur-surface border border-outline rounded-2xl p-3 md:p-4">
                        <TrackList
                            tracks={tracks}
                            currentId={player.current?.id}
                            isPlaying={player.isPlaying}
                            onPlay={(i) => player.playQueue(tracks, i)}
                            onAdd={(itemId) => setAddItems([itemId])}
                            onAddMany={setAddItems}
                        />
                    </div>
                );
        }
        // albums
        return items.length === 0
            ? <p className="text-center py-20 text-xl text-outline-variant font-heading">No albums found.</p>
            : grid(items);
    };

    return (
        <MainLayout>
            <div className="p-8 space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-surface/80 backdrop-blur-surface rounded-2xl border border-outline shadow-inner">
                        {getIcon(library?.library_type)}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-primary font-heading">{library?.name || 'Library'}</h1>
                        <p className="text-outline-variant text-sm font-label">{headerCount}</p>
                    </div>
                </div>

                {/* Music browse tabs */}
                {isMusic && (
                    <div className="flex items-center gap-2 border-b border-outline/40">
                        {tabs.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setView(t.key)}
                                className={`px-4 py-2 -mb-px text-sm font-label border-b-2 transition-colors ${
                                    view === t.key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-outline-variant hover:text-primary'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Body */}
                {isLoading ? skeleton
                    : error ? (
                        <div className="text-center py-20">
                            <p className="text-xl text-error mb-2 font-heading">Connection Error</p>
                            <p className="text-outline-variant font-body">{error}</p>
                        </div>
                    ) : isMusic ? renderMusic()
                    : items.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-xl text-outline-variant font-heading">No media found.</p>
                        </div>
                    ) : grid(items)}
            </div>

            {addItems && <AddToPlaylistModal itemIds={addItems} onClose={() => setAddItems(null)} />}
        </MainLayout>
    );
};
