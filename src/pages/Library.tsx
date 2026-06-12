import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { Film, Tv, Music, BookOpen, FileQuestion } from 'lucide-react';
import { MediaCard } from '@/shared/ui/MediaCard';
import { Library as ILibrary, Media } from '@/types';
import { libraryService, api } from '@/services';

export const Library: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [media, setMedia] = useState<Media[]>([]);
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

                const data = await api.get<Media[]>(`/libraries/${id}/media`);
                setMedia(data);
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
            case 'music_videos': return <Music size={32} className="text-primary" />;
            case 'books': return <BookOpen size={32} className="text-primary" />;
            default: return <FileQuestion size={32} className="text-primary" />;
        }
    };

    // Grouping Logic
    const displayedItems = useMemo(() => {
        if (library?.library_type !== 'tv_shows' && library?.library_type !== 'books') return media;

        // Show unique series
        const seriesMap = new Map<string, Media>();
        const looseItems: Media[] = [];

        media.forEach(item => {
            if (item.series_name) {
                if (!seriesMap.has(item.series_name)) {
                    seriesMap.set(item.series_name, item);
                }
            } else {
                looseItems.push(item);
            }
        });

        // Convert grouped series to items but override title for display
        const seriesItems = Array.from(seriesMap.values()).map(item => ({
            ...item,
            title: item.series_name!, // Display series name as title
            is_series_folder: true
        }));

        return [...seriesItems, ...looseItems].sort((a, b) => a.title.localeCompare(b.title));
    }, [media, library]);

    const handleItemClick = (item: Media & { is_series_folder?: boolean }) => {
        if (item.is_series_folder) {
            if (library?.library_type === 'books') {
                navigate(`/book-series/${encodeURIComponent(item.series_name!)}`);
            } else {
                navigate(`/series/${encodeURIComponent(item.series_name!)}`);
            }
        } else {
            navigate(`/media/${item.id}`);
        }
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
                        <p className="text-outline-variant text-sm font-label">{media.length} items</p>
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
                ) : displayedItems.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-outline-variant font-heading">No media found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
                        {displayedItems.map((item: any) => (
                            <div
                                key={item.id} // Note: for series folder, key is first ep id
                                className="group cursor-pointer space-y-2"
                            >
                                <MediaCard
                                    id={item.id}
                                    title={item.title}
                                    posterUrl={item.poster_url}
                                    type={item.is_series_folder ? 'folder' : 'movie'}
                                    onClick={() => handleItemClick(item)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};
