import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/common/Button';
import { ArrowLeft, BookOpen, MoreVertical, RefreshCw, SortAsc, SortDesc } from 'lucide-react';
import { SeriesDetail, Episode } from '@/types';
import { resolveImageUrl, api } from '@/services';

export const BookSeriesDetail: React.FC = () => {
    const { name } = useParams<{ name?: string }>();
    const navigate = useNavigate();

    const [series, setSeries] = useState<SeriesDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // Sort Order state
    type SortOrder = 'NUMBER_ASC' | 'NUMBER_DESC' | 'NAME_ASC' | 'NAME_DESC';
    const [sortOrder, setSortOrder] = useState<SortOrder>('NUMBER_ASC');

    // Unused Cast processing removed


    useEffect(() => {
        const fetchData = async () => {
            if (!name) return;
            setIsLoading(true);
            setError(null);
            
            try {
                const encodedName = encodeURIComponent(name);
                const data = await api.get<SeriesDetail>(`/series/${encodedName}/detail`);
                setSeries(data);
                
                // Fetch season 1 implicitly (which contains all chapters for comics)
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

    const getSortLabel = () => {
        switch (sortOrder) {
            case 'NUMBER_ASC': return 'Number Asc';
            case 'NUMBER_DESC': return 'Number Desc';
            case 'NAME_ASC': return 'Name Asc';
            case 'NAME_DESC': return 'Name Desc';
        }
    };

    const getSortIcon = () => {
        if (sortOrder.includes('ASC')) return <SortAsc size={12} />;
        return <SortDesc size={12} />;
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            </MainLayout>
        );
    }

    if (error || !series) {
        return (
            <MainLayout>
                <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                    <p className="text-red-500 text-xl">{error || 'Series not found'}</p>
                    <Button onClick={() => navigate(-1)}>Go Back</Button>
                </div>
            </MainLayout>
        );
    }

    const parseGenres = (input: any): string[] => {
        if (!input) return [];
        if (Array.isArray(input)) return input;
        if (typeof input === 'string') {
            try {
                const parsed = JSON.parse(input);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {}
            return input.split(',').map(s => s.trim());
        }
        return [];
    };

    const genres = parseGenres(series.genres);
    const creator = parseGenres(series.creator);

    return (
        <MainLayout>
            <div className="min-h-screen pb-20 animate-fade-in bg-black/40 backdrop-blur-xl rounded-t-[3rem] mt-4 mx-4">
                {/* Backdrop Section */}
                <div className="relative h-[50vh] w-full overflow-hidden rounded-t-[3rem] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 left-0 p-6 z-30 flex gap-4">
                        <button
                            className="bg-surface/50 hover:bg-white/10 text-primary border border-outline rounded-full p-2.5 transition-all hover:scale-105 backdrop-blur-surface"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    <div className="absolute top-0 right-0 p-6 z-30">
                        <div className="relative">
                            <button
                                className="bg-surface/50 hover:bg-white/10 text-primary border border-outline rounded-full p-2.5 transition-all hover:scale-105 backdrop-blur-surface"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <MoreVertical size={20} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 backdrop-blur-glass border border-outline rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)] animate-fade-in z-50">
                                    <button
                                        className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors text-sm text-outline-variant hover:text-primary flex items-center gap-2 font-label"
                                        onClick={handleRefresh}
                                    >
                                        <RefreshCw size={16} />
                                        <span>Refresh Metadata</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="absolute inset-0 rounded-t-[3rem] overflow-hidden">
                        {series.backdrop_url ? (
                            <img
                                src={resolveImageUrl(series.backdrop_url)}
                                alt="Backdrop"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-surface" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                    </div>
                </div>

                {/* Content Section */}
                <div className="container mx-auto px-4 md:px-8 relative z-20 -mt-48">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Poster */}
                        <div className="w-48 md:w-72 shrink-0 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-t-[rgba(255,255,255,0.3)] border-l-[rgba(255,255,255,0.3)] border-b-[rgba(255,255,255,0.05)] border-r-[rgba(255,255,255,0.05)] bg-surface/50 backdrop-blur-glass">
                            {series.poster_url ? (
                                <img src={resolveImageUrl(series.poster_url)} alt={series.name} className="w-full h-auto object-cover aspect-[2/3]" />
                            ) : (
                                <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-white/20">No Poster</div>
                            )}
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 pt-4 md:pt-12 text-primary">
                            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2 leading-tight font-heading">
                                {series.name}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-400 mb-6">
                                {series.age_rating && (
                                    <span className="border border-white/20 px-1 rounded text-xs uppercase text-white/80">{series.age_rating}</span>
                                )}
                                {series.year && <span>{series.year}</span>}
                                {series.origin_country && <span>{series.origin_country}</span>}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mb-8">
                                <button
                                    className="h-10 px-5 gap-2 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform font-medium"
                                    onClick={() => handlePlay()}
                                    title="Read"
                                >
                                    <BookOpen size={18} />
                                    <span>Read</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {genres.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-y-2 text-sm font-body">
                                        <div className="text-outline-variant font-label">Genres</div>
                                        <div className="text-primary">{genres.join(', ')}</div>
                                    </div>
                                )}
                                {creator.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-y-2 text-sm font-body">
                                        <div className="text-outline-variant font-label">Creator</div>
                                        <div className="text-primary">{creator.join(', ')}</div>
                                    </div>
                                )}
                                {series.studio && (
                                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-y-2 text-sm font-body">
                                        <div className="text-outline-variant font-label">Studio</div>
                                        <div className="text-primary">{series.studio}</div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-lg font-bold text-primary font-heading mb-3">Description</h3>
                                    <p className="text-outline-variant leading-relaxed max-w-3xl text-sm md:text-base font-body">
                                        {series.plot || 'No plot available.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chapters Section */}
                    <div className="mt-16 mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-primary font-heading">Chapters</h3>

                            {/* Sort Toggle */}
                            <button
                                className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-outline bg-surface/50 hover:bg-white/10 backdrop-blur-surface transition-all text-xs font-medium text-primary font-label"
                                onClick={toggleSortOrder}
                            >
                                <span className="mr-1">{getSortLabel()}</span>
                                {getSortIcon()}
                            </button>
                        </div>
                        
                        {isEpisodesLoading ? (
                            <div className="flex justify-center py-10">
                                <div className="w-8 h-8 border-2 border-primary rounded-full animate-spin border-t-transparent" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {sortedEpisodes.map((episode) => (
                                    <div
                                        key={episode.id}
                                        className="w-full flex items-center p-3 rounded-xl border border-transparent hover:border-outline bg-surface/30 hover:bg-surface/50 transition-colors cursor-pointer group"
                                        onClick={() => handlePlay(Number(episode.id))}
                                    >
                                        <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-surface/50">
                                            {episode.poster_url ? (
                                                <img src={resolveImageUrl(episode.poster_url)} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/20"><BookOpen size={24} /></div>
                                            )}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <h4 className="font-bold text-primary text-sm md:text-base line-clamp-1 font-heading group-hover:text-white transition-colors">
                                                {episode.title || `Chapter ${episode.episode_number}`}
                                            </h4>
                                            {episode.plot && (
                                                <p className="text-xs text-outline-variant line-clamp-1 mt-1 font-body">{episode.plot}</p>
                                            )}
                                        </div>
                                        <div className="px-4 text-outline-variant group-hover:text-primary transition-colors">
                                            <BookOpen size={20} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};
