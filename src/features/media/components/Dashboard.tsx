import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/app/layout/MainLayout';
import { GlassText } from '@knp-org/liquid-glass-ui';
import { HeroCarousel } from './HeroCarousel';
import { ContentRow, MediaItem } from './ContentRow';
import { Library } from '@/types';
import { libraryService, mediaService } from '@/services';

/** Navigate to the right detail screen for a card's kind. */
export const navigateForCard = (
    navigate: (to: string) => void,
    item: { id: string; kind?: string },
) => {
    if (item.kind === 'series') navigate(`/series/${item.id}`);
    else if (item.kind === 'album') navigate(`/albums/${item.id}`);
    else if (item.kind === 'artist') navigate(`/artists/${item.id}`);
    else navigate(`/media/${item.id}`);
};

const LibraryRow: React.FC<{ library: Library }> = React.memo(({ library }) => {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                // The server already returns ready-to-render cards (series collapsed).
                const cards = await mediaService.libraryItems(library.id);
                const items: MediaItem[] = cards.slice(0, 15).map(c => ({
                    id: c.id.toString(),
                    title: c.title || '',
                    posterUrl: c.poster_url || '',
                    kind: c.kind,
                }));
                setMedia(items);
            } catch (error) {
                console.error(`Failed to fetch media for library ${library.id}`, error);
            }
        };

        fetchMedia();
    }, [library.id]);

    if (media.length === 0) return null;

    return (
        <ContentRow
            title={library.name}
            items={media}
            onViewAll={() => navigate(`/libraries/${library.id}`)}
            onItemClick={(item) => navigateForCard(navigate, item)}
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

                // Fetch continue watching (per-user)
                const continueData = await mediaService.continueWatching();
                if (continueData && continueData.length > 0) {
                    const items: MediaItem[] = continueData.map(m => ({
                        id: m.id.toString(),
                        title: m.title || '',
                        posterUrl: m.poster_url || '',
                        progress: m.total_duration > 0
                            ? Math.min(100, Math.floor((m.position / m.total_duration) * 100))
                            : undefined,
                        kind: m.kind,
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

                    {/* Dynamic Library Rows (photo galleries are excluded from the home screen) */}
                    {libraries
                        .filter(lib => lib.library_type !== 'images')
                        .map(lib => (
                            <LibraryRow key={lib.id} library={lib} />
                        ))}

                    {/* Fallback/Welcome if no libraries */}
                    {libraries.length === 0 && (
                        <GlassText variant="muted" className="block text-center py-20">
                            Welcome to Vortex! Go to Settings to add your first library.
                        </GlassText>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};
