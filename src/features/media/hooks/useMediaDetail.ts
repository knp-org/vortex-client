import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Media, SeriesDetail, CastMember, Episode } from '@/types';
import { api } from '@/services';

/**
 * All data, state, and actions for the media/series detail screen. The screen
 * component ([MediaDetail]) is purely presentational on top of this hook.
 */
export function useMediaDetail() {
    const { id, name } = useParams<{ id?: string; name?: string }>();
    const navigate = useNavigate();
    const isSeries = !!name;

    const [media, setMedia] = useState<Media | null>(null);
    const [series, setSeries] = useState<SeriesDetail | null>(null);
    const [bookInfo, setBookInfo] = useState<{ page_count?: number | null } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Series-specific state
    const [selectedSeason, setSelectedSeason] = useState<number>(1);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);
    const [isSeasonOpen, setIsSeasonOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isIdentifyOpen, setIsIdentifyOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Cast data lives on either the series or the movie record.
    const castData = media?.cast || series?.cast;
    const parsedCast = useMemo<CastMember[]>(() => {
        if (!castData) return [];
        try {
            const parsed = JSON.parse(castData);
            return Array.isArray(parsed) ? (parsed as CastMember[]) : [];
        } catch (e) {
            console.error("Failed to parse cast data", e);
            return [];
        }
    }, [castData]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (isSeries && name) {
                    const encodedName = encodeURIComponent(name);
                    const data = await api.get<SeriesDetail>(`/series/${encodedName}/detail`);
                    setSeries(data);
                    if (data.seasons.length > 0) {
                        if (!selectedSeason) setSelectedSeason(data.seasons[0].season_number);
                    }
                } else if (id) {
                    const data = await api.get<Media>(`/media/${id}`);
                    setMedia(data);
                    // Book-specific fields (page count) aren't on the generic media
                    // record; pull them from the dedicated book endpoint.
                    if (data.media_type === 'book') {
                        try {
                            setBookInfo(await api.get(`/books/${id}/info`));
                        } catch (e) {
                            console.error("Failed to fetch book info", e);
                            setBookInfo(null);
                        }
                    } else {
                        setBookInfo(null);
                    }
                } else {
                    setError("Invalid URL parameters");
                }
            } catch (error: any) {
                console.error("Failed to fetch details", error);
                setError(error.message || "Failed to load content");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, name, isSeries]);

    // Fetch episodes when the selected season changes.
    useEffect(() => {
        const fetchEpisodes = async () => {
            if (!isSeries || !name || !selectedSeason) return;
            setIsEpisodesLoading(true);
            try {
                const encodedName = encodeURIComponent(name);
                const data = await api.get<Episode[]>(`/series/${encodedName}/season/${selectedSeason}`);
                setEpisodes(data);
            } catch (error) {
                console.error("Failed to fetch episodes", error);
            } finally {
                setIsEpisodesLoading(false);
            }
        };
        fetchEpisodes();
    }, [isSeries, name, selectedSeason]);

    const refreshData = async () => {
        if (isSeries && name) {
            const encodedName = encodeURIComponent(name);
            setSeries(await api.get<SeriesDetail>(`/series/${encodedName}/detail`));
        } else if (id) {
            setMedia(await api.get<Media>(`/media/${id}`));
        }
    };

    const handleIdentify = async (providerId: string, mediaType: 'movie' | 'series', providerName?: string) => {
        try {
            const body = { provider_id: providerId, media_type: mediaType, provider_name: providerName };
            if (isSeries && name) {
                const encodedName = encodeURIComponent(name);
                await api.post(`/series/${encodedName}/identify`, body);
            } else if (id) {
                await api.post(`/media/${id}/identify`, body);
            } else {
                return;
            }
            await refreshData();
            setIsIdentifyOpen(false);
        } catch (error) {
            console.error("Identify error", error);
        }
    };

    const handleRefresh = async () => {
        setIsMenuOpen(false);
        setIsLoading(true);
        try {
            if (isSeries && name) {
                const encodedName = encodeURIComponent(name);
                await api.post(`/series/${encodedName}/refresh`);
            } else if (id) {
                await api.post(`/media/${id}/refresh`);
            }
            // Reload to force image cache clear and a fresh data fetch.
            window.location.reload();
        } catch (error) {
            console.error("Refresh failed", error);
            setIsLoading(false);
        }
    };

    const isBook = media?.media_type === 'book';

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
            if (isBook) {
                navigate(`/reader/${episodes[0].id}`);
            } else {
                navigate(`/player/${episodes[0].id}`);
            }
        }
    };

    return {
        navigate, isSeries, isBook,
        media, series, bookInfo, isLoading, error,
        selectedSeason, setSelectedSeason, episodes, isEpisodesLoading,
        isSeasonOpen, setIsSeasonOpen,
        isIdentifyOpen, setIsIdentifyOpen, isMenuOpen, setIsMenuOpen,
        parsedCast, handleIdentify, handleRefresh, handlePlay,
    };
}
