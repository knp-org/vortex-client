import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SeriesDetail, CreditDto, Episode } from '@/types';
import { mediaService, bookService } from '@/services';
import type { BookInfo } from '@/services';

/**
 * All data, state, and actions for the media/series detail screen. The screen
 * component ([MediaDetail]) is purely presentational on top of this hook.
 *
 * Routes: `/media/:id` (movie | book | episode — discriminated by `kind`) and
 * `/series/:seriesId` (a TV show).
 */
export function useMediaDetail() {
    const { id, seriesId } = useParams<{ id?: string; seriesId?: string }>();
    const navigate = useNavigate();
    const isSeries = !!seriesId;

    // For a single item this is a MovieDetail | BookDetail | Episode (+ `kind`).
    const [media, setMedia] = useState<any>(null);
    const [series, setSeries] = useState<SeriesDetail | null>(null);
    const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
    const [isBook, setIsBook] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Series-specific state
    const [selectedSeason, setSelectedSeason] = useState<number>(1);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);
    const [isSeasonOpen, setIsSeasonOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isIdentifyOpen, setIsIdentifyOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Cast is already structured on the movie/series detail.
    const parsedCast = useMemo<CreditDto[]>(
        () => ((isSeries ? series?.cast : media?.cast) ?? []),
        [isSeries, series, media],
    );

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            setIsBook(false);
            try {
                if (isSeries && seriesId) {
                    const data = await mediaService.series(seriesId);
                    setSeries(data);
                    if (data.seasons.length > 0) {
                        setSelectedSeason(data.seasons[0].season_number);
                    }
                } else if (id) {
                    // `/media/:id` is polymorphic; `kind` discriminates the shape.
                    const data: any = await mediaService.movie(id);
                    setMedia(data);
                    if (data?.kind === 'book') {
                        setIsBook(true);
                        try {
                            setBookInfo(await bookService.info(id));
                        } catch (e) {
                            console.error('Failed to fetch book info', e);
                            setBookInfo(null);
                        }
                    }
                } else {
                    setError('Invalid URL parameters');
                }
            } catch (err: any) {
                console.error('Failed to fetch details', err);
                setError(err.message || 'Failed to load content');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, seriesId, isSeries]);

    // Fetch episodes when the selected season changes.
    useEffect(() => {
        const fetchEpisodes = async () => {
            if (!isSeries || !seriesId || !selectedSeason) return;
            setIsEpisodesLoading(true);
            try {
                setEpisodes(await mediaService.seasonEpisodes(seriesId, selectedSeason));
            } catch (error) {
                console.error('Failed to fetch episodes', error);
            } finally {
                setIsEpisodesLoading(false);
            }
        };
        fetchEpisodes();
    }, [isSeries, seriesId, selectedSeason]);

    // Favorites apply to individual items (movie/book/episode), not whole series.
    useEffect(() => {
        if (isSeries || !id) { setIsFavorite(false); return; }
        mediaService.favorites()
            .then(favs => setIsFavorite(favs.some(c => String(c.id) === id)))
            .catch(() => {});
    }, [id, isSeries]);

    const toggleFavorite = async () => {
        if (isSeries || !id) return;
        try {
            if (isFavorite) await mediaService.removeFavorite(id);
            else await mediaService.addFavorite(id);
            setIsFavorite(v => !v);
        } catch (e) {
            console.error('Failed to toggle favorite', e);
        }
    };

    const refreshData = async () => {
        if (isSeries && seriesId) {
            setSeries(await mediaService.series(seriesId));
        } else if (id) {
            setMedia(await mediaService.movie(id));
        }
    };

    const handleIdentify = async (providerId: string, mediaType: 'movie' | 'series', providerName?: string) => {
        try {
            const body = { provider_id: providerId, media_type: mediaType, provider_name: providerName };
            if (isSeries && seriesId) {
                await mediaService.identifySeries(seriesId, body);
            } else if (id) {
                await mediaService.identifyMedia(id, body);
            } else {
                return;
            }
            await refreshData();
            setIsIdentifyOpen(false);
        } catch (error) {
            console.error('Identify error', error);
        }
    };

    const handleRefresh = async () => {
        setIsMenuOpen(false);
        setIsLoading(true);
        try {
            if (isSeries && seriesId) {
                await mediaService.refreshSeries(seriesId);
            } else if (id) {
                await mediaService.refreshMedia(id);
            }
            // Reload to force image cache clear and a fresh data fetch.
            window.location.reload();
        } catch (error) {
            console.error('Refresh failed', error);
            setIsLoading(false);
        }
    };

    const handlePlay = (mediaId?: number) => {
        if (isBook && (mediaId || media?.id)) {
            navigate(`/reader/${mediaId ?? media!.id}`);
            return;
        }
        if (mediaId) {
            navigate(`/player/${mediaId}`);
        } else if (media?.id) {
            navigate(`/player/${media.id}`);
        } else if (episodes.length > 0) {
            navigate(`/player/${episodes[0].id}`);
        }
    };

    return {
        navigate, isSeries, isBook,
        media, series, bookInfo, isLoading, error,
        selectedSeason, setSelectedSeason, episodes, isEpisodesLoading,
        isSeasonOpen, setIsSeasonOpen,
        isIdentifyOpen, setIsIdentifyOpen, isMenuOpen, setIsMenuOpen,
        parsedCast, handleIdentify, handleRefresh, handlePlay,
        isFavorite, toggleFavorite,
    };
}
