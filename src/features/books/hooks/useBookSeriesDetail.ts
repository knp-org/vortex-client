import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SeriesDetail, Episode } from '@/types';
import { api } from '@/services';

export type SortOrder = 'NUMBER_ASC' | 'NUMBER_DESC' | 'NAME_ASC' | 'NAME_DESC';

/**
 * Data, state, and actions for the book/comic series detail screen.
 * The screen component ([BookSeriesDetail]) renders on top of this hook.
 */
export function useBookSeriesDetail() {
    const { name } = useParams<{ name?: string }>();
    const navigate = useNavigate();

    const [series, setSeries] = useState<SeriesDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [sortOrder, setSortOrder] = useState<SortOrder>('NUMBER_ASC');

    useEffect(() => {
        const fetchData = async () => {
            if (!name) return;
            setIsLoading(true);
            setError(null);
            try {
                const encodedName = encodeURIComponent(name);
                const data = await api.get<SeriesDetail>(`/series/${encodedName}/detail`);
                setSeries(data);

                // Fetch season 1 implicitly (which contains all chapters for comics).
                setIsEpisodesLoading(true);
                try {
                    const eps = await api.get<Episode[]>(`/series/${encodedName}/season/1`);
                    setEpisodes(eps);
                } catch (epsError) {
                    console.error("Failed to fetch chapters", epsError);
                } finally {
                    setIsEpisodesLoading(false);
                }
            } catch (err: any) {
                console.error("Failed to fetch details", err);
                setError(err.message || "Failed to load content");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [name]);

    const handleRefresh = async () => {
        setIsMenuOpen(false);
        setIsLoading(true);
        try {
            if (name) {
                const encodedName = encodeURIComponent(name);
                await api.post(`/series/${encodedName}/refresh`);
            }
            window.location.reload();
        } catch (error) {
            console.error("Refresh failed", error);
            setIsLoading(false);
        }
    };

    const handlePlay = (episodeId?: number) => {
        if (episodeId) {
            navigate(`/reader/${episodeId}`);
        } else if (episodes.length > 0) {
            navigate(`/reader/${episodes[0].id}`);
        }
    };

    const toggleSortOrder = () => {
        setSortOrder(current => {
            switch (current) {
                case 'NUMBER_ASC': return 'NUMBER_DESC';
                case 'NUMBER_DESC': return 'NAME_ASC';
                case 'NAME_ASC': return 'NAME_DESC';
                case 'NAME_DESC': return 'NUMBER_ASC';
            }
        });
    };

    const sortedEpisodes = useMemo(() => {
        const eps = [...episodes];
        switch (sortOrder) {
            case 'NUMBER_ASC': return eps.sort((a, b) => a.episode_number - b.episode_number);
            case 'NUMBER_DESC': return eps.sort((a, b) => b.episode_number - a.episode_number);
            case 'NAME_ASC': return eps.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            case 'NAME_DESC': return eps.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        }
    }, [episodes, sortOrder]);

    return {
        navigate, series, isLoading, error, isEpisodesLoading,
        isMenuOpen, setIsMenuOpen, sortOrder, toggleSortOrder, sortedEpisodes,
        handleRefresh, handlePlay,
    };
}
