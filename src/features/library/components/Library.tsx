import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/app/layout/MainLayout';
import { Film, Tv, Music, BookOpen, Image, FileQuestion } from 'lucide-react';
import { MediaCard } from '@/features/media';
import { Library as ILibrary, Card } from '@/types';
import { libraryService, mediaService } from '@/services';

export const Library: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [items, setItems] = useState<Card[]>([]);
    const [library, setLibrary] = useState<ILibrary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        else navigate(`/media/${card.id}`);
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
                        <p className="text-outline-variant text-sm font-label">{items.length} items</p>
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] bg-surface/50 rounded-xl animate-pulse backdrop-blur-surface border border-white/5" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-error mb-2 font-heading">Connection Error</p>
                        <p className="text-outline-variant font-body">{error}</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-outline-variant font-heading">No media found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
                        {items.map((card) => (
                            <div key={`${card.kind}-${card.id}`} className="group cursor-pointer space-y-2">
                                <MediaCard
                                    id={card.id}
                                    title={card.title || ''}
                                    posterUrl={card.poster_url}
                                    type={card.kind === 'series' ? 'folder' : 'movie'}
                                    onClick={() => handleItemClick(card)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};
