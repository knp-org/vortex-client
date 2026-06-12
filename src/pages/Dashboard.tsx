import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { HeroCarousel } from '@/components/features/HeroCarousel';
import { ContentRow, MediaItem } from '@/components/features/ContentRow';
import { Library, Media } from '@/types';
import { libraryService, api } from '@/services';

interface ContinueWatchingMedia extends Media {
    progress?: number;
    total_duration?: number;
    library_type?: string;
}

const LibraryRow: React.FC<{ library: Library }> = React.memo(({ library }) => {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const data = await api.get<Media[]>(`/libraries/${library.id}/media`);
                if (data) {

                    let processedData = data;

                    // Group if TV Shows or Books
                    if (library.library_type === 'tv_shows' || library.library_type === 'books') {
                        const seriesMap = new Map<string, Media>();
                        const looseItems: Media[] = [];

                        data.forEach(item => {
                            if (item.series_name) {
                                if (!seriesMap.has(item.series_name)) {
                                    const seriesItem = { ...item, title: item.series_name }; // Use series name as title
                                    seriesMap.set(item.series_name, seriesItem);
                                }
                            } else {
                                looseItems.push(item);
                            }
                        });
                        processedData = [...Array.from(seriesMap.values()), ...looseItems];
                        processedData.sort((a, b) => a.title.localeCompare(b.title));
                    }

                    // Map to MediaItem and limit to 15
                    const items: MediaItem[] = processedData.map(m => ({
                        id: m.id.toString(),
                        title: m.title,
                        posterUrl: m.poster_url || '',
                        subtitle: undefined,
                        isSeries: !!m.series_name,
                        seriesName: m.series_name
                    })).slice(0, 15);

                    setMedia(items);
                }
            } catch (error) {
                console.error(`Failed to fetch media for library ${library.id}`, error);
            }
        };

        fetchMedia();
    }, [library.id, library.library_type]);

    if (media.length === 0) return null;

    const handleItemClick = (item: MediaItem) => {
        if (item.isSeries && item.seriesName) {
            if (library.library_type === 'books') {
                navigate(`/book-series/${encodeURIComponent(item.seriesName)}`);
            } else {
                navigate(`/series/${encodeURIComponent(item.seriesName)}`);
            }
        } else {
            navigate(`/media/${item.id}`);
        }
    };

    return (
        <ContentRow
            title={library.name}
            items={media}
            onViewAll={() => navigate(`/libraries/${library.id}`)}
            onItemClick={handleItemClick}
        />
    );
});

export const Dashboard: React.FC = () => {
    const [libraries, setLibraries] = useState<Library[]>([]);
    const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch libraries
                const libData = await libraryService.getAll();
                setLibraries(libData);

                // Fetch continue watching
                const continueData = await api.get<ContinueWatchingMedia[]>('/continue');
                if (continueData && continueData.length > 0) {
                    const items: MediaItem[] = continueData.map(m => ({
                        id: m.id.toString(),
                        title: m.series_name
                            ? `${m.series_name} S${m.season_number || 1}E${m.episode_number || 1}`
                            : m.title,
                        posterUrl: m.poster_url || m.still_url || '',
                        progress: m.progress && (m.total_duration || m.runtime)
                            ? Math.min(100, Math.floor((m.progress / (m.total_duration || (m.runtime! * 60))) * 100))
                            : undefined,
                        subtitle: m.series_name ? m.title : undefined,
                        isSeries: !!m.series_name,
                        seriesName: m.series_name
                    }));
                    setContinueWatching(items);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };
        fetchData();
    }, []);

    return (
        <MainLayout>
            <div className="pb-8">
                <HeroCarousel />

                <div className="px-4 space-y-8 relative z-20">
                    {/* Continue Watching Row */}
                    {continueWatching.length > 0 && (
                        <ContentRow
                            title="Continue Watching"
                            items={continueWatching}
                            isContinueWatching={true}
                            onItemClick={(item) => navigate(`/player/${item.id}`)}
                        />
                    )}

                    {/* Dynamic Library Rows */}
                    {libraries.map(lib => (
                        <LibraryRow key={lib.id} library={lib} />
                    ))}

                    {/* Fallback/Welcome if no libraries */}
                    {libraries.length === 0 && (
                        <div className="text-center py-20 text-gray-500">
                            Welcome to Vortex! Go to Settings to add your first library.
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};
