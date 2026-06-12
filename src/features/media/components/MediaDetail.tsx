
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/shared/ui/Button';
import { IdentifyModal } from './IdentifyModal';
import { ArrowLeft, Play, BookOpen, ChevronDown, Search, PlusCircle, Heart, MoreVertical, RefreshCw } from 'lucide-react';
import { Media, SeriesDetail, CastMember, Episode } from '@/types';
import { resolveImageUrl, api } from '@/services';

export const MediaDetail: React.FC = () => {
    const { id, name } = useParams<{ id?: string; name?: string }>();
    const navigate = useNavigate();
    const isSeries = !!name;

    const [media, setMedia] = useState<Media | null>(null);
    const [series, setSeries] = useState<SeriesDetail | null>(null);
    const [bookInfo, setBookInfo] = useState<{ page_count?: number | null } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Series specific state
    const [selectedSeason, setSelectedSeason] = useState<number>(1);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);
    const [isSeasonOpen, setIsSeasonOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isIdentifyOpen, setIsIdentifyOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Get Cast Data from either Series or Movie
    const castData = media?.cast || series?.cast;
    console.log("MediaDetail render. castData:", castData);

    const parsedCast = React.useMemo(() => {
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
            console.log("MediaDetail mounted. Params:", { id, name, isSeries });

            try {
                if (isSeries && name) {
                    const encodedName = encodeURIComponent(name);
                    const data = await api.get<SeriesDetail>(`/series/${encodedName}/detail`);
                    console.log("Series Data:", data);
                    setSeries(data);
                    // Default to first season found if not already set
                    if (data.seasons.length > 0) {
                        // Actually better to just default to season 1 or first available
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

    // Fetch episodes when season changes
    useEffect(() => {
        const fetchEpisodes = async () => {
            if (!isSeries || !name || !selectedSeason) return;
            setIsEpisodesLoading(true);
            console.log(`Fetching episodes for ${name} Season ${selectedSeason}`);
            try {
                const encodedName = encodeURIComponent(name);
                const data = await api.get<Episode[]>(`/series/${encodedName}/season/${selectedSeason}`);
                console.log("Episodes Data:", data);
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
        // Re-fetch current data
        if (isSeries && name) {
            const encodedName = encodeURIComponent(name);
            setSeries(await api.get<SeriesDetail>(`/series/${encodedName}/detail`));
        } else if (id) {
            setMedia(await api.get<Media>(`/media/${id}`));
        }
    };

    const handleIdentify = async (providerId: string, mediaType: 'movie' | 'series', providerName?: string) => {
        console.log("MediaDetail: handleIdentify called. Params:", { providerId, mediaType, providerName, isSeries, name, id });
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

            // Reload to force image cache clear and new data fetch
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

    if (isLoading) {
        return (
            <MainLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                    <p className="text-red-500 text-xl">{error}</p>
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
                // Try JSON parse first
                const parsed = JSON.parse(input);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                // content is not JSON
            }
            return input.split(',').map(s => s.trim());
        }
        return [];
    };

    const backdropUrl = isSeries ? series?.backdrop_url : media?.backdrop_url;
    const posterUrl = isSeries ? series?.poster_url : media?.poster_url;
    const title = isSeries ? series?.name : media?.title;
    const plot = isSeries ? series?.plot : media?.plot;
    const year = isSeries ? series?.year : media?.year;

    // Normalize genres
    const rawGenres = isSeries ? series?.genres : media?.genres;
    const genres = parseGenres(rawGenres);

    const rawDirector = isSeries ? series?.director : media?.director;
    const director = parseGenres(rawDirector); // Reuse parseGenres logic as it handles JSON/Strings/Arrays similarly

    const ageRating = isSeries ? series?.age_rating : media?.age_rating;
    const studio = isSeries ? series?.studio : media?.studio;
    const trailerUrl = isSeries ? series?.trailer_url : media?.trailer_url;
    const originCountry = isSeries ? series?.origin_country : media?.origin_country;
    const collectionName = isSeries ? series?.collection_name : media?.collection_name;
    const creatorRaw = isSeries ? series?.creator : media?.creator;
    const creator = parseGenres(creatorRaw);

    // Book-specific display values.
    const bookFormat = isBook
        ? media?.file_path?.split('.').pop()?.toUpperCase() || undefined
        : undefined;
    const pageCount = bookInfo?.page_count ?? media?.page_count;



    return (
        <MainLayout>
            <div className="min-h-screen pb-20 animate-fade-in bg-black/40 backdrop-blur-xl rounded-t-[3rem] mt-4 mx-4">
                {/* Backdrop Section - Reduced height */}
                <div className="relative h-[50vh] w-full overflow-hidden rounded-t-[3rem] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                    {/* Back Button */}
                    <div className="absolute top-0 left-0 p-6 z-30 flex gap-4">
                        <button
                            className="bg-surface/50 hover:bg-white/10 text-primary border border-outline rounded-full p-2.5 transition-all hover:scale-105 backdrop-blur-surface"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    {/* Top Right Actions */}
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
                                    {!isBook && (
                                        <button
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors text-sm text-outline-variant hover:text-primary flex items-center gap-2 font-label"
                                            onClick={() => {
                                                setIsIdentifyOpen(true);
                                                setIsMenuOpen(false);
                                            }}
                                        >
                                            <Search size={16} />
                                            <span>Identify</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="absolute inset-0 rounded-t-[3rem] overflow-hidden">
                        {backdropUrl ? (
                            <img
                                src={resolveImageUrl(backdropUrl)}
                                alt="Backdrop"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-surface" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                    </div>
                </div>

                {/* Content Section - Overlapping */}
                <div className="container mx-auto px-4 md:px-8 relative z-20 -mt-48">
                    <div className="flex flex-col md:flex-row gap-8 items-start">

                        {/* Poster - Distinct and overlapping */}
                        <div className="w-48 md:w-72 shrink-0 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-t-[rgba(255,255,255,0.3)] border-l-[rgba(255,255,255,0.3)] border-b-[rgba(255,255,255,0.05)] border-r-[rgba(255,255,255,0.05)] bg-surface/50 backdrop-blur-glass">
                            {posterUrl ? (
                                <img src={resolveImageUrl(posterUrl)} alt={title} className="w-full h-auto object-cover aspect-[2/3]" />
                            ) : (
                                <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-white/20">No Poster</div>
                            )}
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 pt-4 md:pt-12 text-primary">
                            {/* Title */}
                            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2 leading-tight font-heading">
                                {title}
                            </h1>

                            {/* Metadata Row */}
                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-400 mb-6">
                                {ageRating && (
                                    <span className="border border-white/20 px-1 rounded text-xs uppercase text-white/80">{ageRating}</span>
                                )}
                                {year && <span>{year}</span>}
                                {!isBook && media?.runtime && (
                                    <span>{Math.floor(media.runtime / 60)}h {media.runtime % 60}m</span>
                                )}
                                {isBook ? (
                                    <>
                                        {bookFormat && (
                                            <span className="border border-white/20 px-1 rounded text-xs uppercase">{bookFormat}</span>
                                        )}
                                        {pageCount ? <span>{pageCount} pages</span> : null}
                                    </>
                                ) : (
                                    <span className="border border-white/20 px-1 rounded text-xs uppercase">HD</span>
                                )}
                                {originCountry && (
                                    <span>{originCountry}</span>
                                )}
                            </div>

                            {/* Actions Row */}
                            <div className="flex flex-wrap items-center gap-3 mb-8">
                                <button
                                    className={`${isBook ? 'h-10 px-5 gap-2' : 'h-10 w-10'} rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform font-medium`}
                                    onClick={() => handlePlay()}
                                    title={isBook ? 'Read' : 'Play'}
                                >
                                    {isBook ? (
                                        <>
                                            <BookOpen size={18} />
                                            <span>Read</span>
                                        </>
                                    ) : (
                                        <Play size={18} className="fill-current ml-0.5" />
                                    )}
                                </button>

                                {trailerUrl && (
                                    <button
                                        className="h-10 px-5 gap-2 rounded-full bg-surface/50 hover:bg-white/10 text-primary border border-outline flex items-center justify-center hover:scale-105 transition-transform backdrop-blur-surface font-medium"
                                        onClick={() => window.open(trailerUrl, '_blank')}
                                        title="Watch Trailer"
                                    >
                                        <Play size={18} />
                                        <span>Trailer</span>
                                    </button>
                                )}

                                {/* Extra Actions (Visual only for now matching design) */}
                                <div className="flex items-center gap-2 ml-auto md:ml-0">
                                    <button className="p-2 rounded-full hover:bg-surface/50 backdrop-blur-surface border border-transparent hover:border-outline transition-colors text-outline-variant hover:text-primary">
                                        <PlusCircle size={20} />
                                    </button>
                                    <button className="p-2 rounded-full hover:bg-surface/50 backdrop-blur-surface border border-transparent hover:border-outline transition-colors text-outline-variant hover:text-primary">
                                        <Heart size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Details/File Info Grid */}
                            {isBook ? (
                                <div className="space-y-6">
                                    <div className="bg-surface/30 backdrop-blur-surface border border-outline rounded-2xl p-6">
                                        <h3 className="text-lg font-bold text-primary font-heading mb-4">File Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-y-3 text-sm font-body">
                                            <div className="text-outline-variant font-label">Format</div>
                                            <div className="text-primary">{bookFormat || 'Unknown'}</div>
                                            <div className="text-outline-variant font-label">Pages</div>
                                            <div className="text-primary">{pageCount ?? 'N/A'}</div>
                                            {genres.length > 0 && (
                                                <>
                                                    <div className="text-outline-variant font-label">Genres</div>
                                                    <div className="text-primary">{genres.join(', ')}</div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-lg font-bold text-primary font-heading mb-3">Description</h3>
                                        <p className="text-outline-variant leading-relaxed max-w-3xl text-sm md:text-base font-body">
                                            {plot || 'No plot available.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-y-2 text-sm mb-6 font-body">
                                        <div className="text-outline-variant font-label">Genres</div>
                                        <div className="text-primary">
                                            {genres.join(', ') || 'N/A'}
                                        </div>
                                        
                                        {(director.length > 0 || creator.length > 0) && (
                                            <>
                                                <div className="text-outline-variant font-label">{isSeries ? 'Creator' : 'Director'}</div>
                                                <div className="text-primary">{(creator.length > 0 ? creator : director).join(', ')}</div>
                                            </>
                                        )}

                                        {studio && (
                                            <>
                                                <div className="text-outline-variant font-label">Studio</div>
                                                <div className="text-primary">{studio}</div>
                                            </>
                                        )}

                                        {collectionName && (
                                            <>
                                                <div className="text-outline-variant font-label">Collection</div>
                                                <div className="text-primary">{collectionName}</div>
                                            </>
                                        )}

                                        <div className="text-outline-variant font-label">Audio</div>
                                        <div className="text-primary">English - AAC - Stereo</div>
                                    </div>

                                    {/* Plot */}
                                    <p className="text-outline-variant leading-relaxed max-w-3xl text-sm md:text-base font-body">
                                        {plot || 'No plot available.'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Cast Section */}
                    {parsedCast.length > 0 && (
                        <div className="mt-12 mb-8 animate-fade-in-up delay-200">
                            <h3 className="text-xl font-bold text-primary font-heading mb-6 flex items-center gap-2">
                                <span>Cast</span>
                                <span className="text-sm font-normal text-outline-variant bg-surface/50 border border-outline backdrop-blur-surface px-2 py-0.5 rounded-full font-label">
                                    {parsedCast.length}
                                </span>
                            </h3>
                            <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
                                {parsedCast.map((actor, idx) => (
                                    <div key={idx} className="flex-none w-28 snap-start flex flex-col items-center text-center group">
                                        <div className="w-24 h-24 rounded-full overflow-hidden mb-3 ring-2 ring-white/5 group-hover:ring-primary/50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] bg-surface/50 backdrop-blur-surface relative">
                                            {actor.profile_url ? (
                                                <img
                                                    src={resolveImageUrl(actor.profile_url)}
                                                    alt={actor.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-outline-variant bg-white/5">
                                                    <span className="text-[10px] uppercase tracking-wider font-label">No Image</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-white/10 transition-colors" />
                                        </div>
                                        <h4 className="text-xs font-bold text-primary line-clamp-1 group-hover:text-primary transition-colors mb-0.5 w-full font-heading">
                                            {actor.name}
                                        </h4>
                                        <p className="text-[10px] text-outline-variant line-clamp-2 leading-tight w-full px-1 font-body">
                                            {actor.character}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Episodes Carousel (Series Only) */}
                    {isSeries && (
                        <div className="mt-16 mb-12">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-primary font-heading">Episodes</h3>

                                {/* Season Selector */}
                                {series && (
                                    <div className="relative z-40">
                                        <button
                                            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-outline bg-surface/50 hover:bg-white/10 backdrop-blur-surface transition-all text-xs font-medium text-primary font-label"
                                            onClick={() => setIsSeasonOpen(!isSeasonOpen)}
                                        >
                                            <span className="mr-1">Season {selectedSeason}</span>
                                            <ChevronDown size={12} className={`transition-transform duration-300 ${isSeasonOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isSeasonOpen && (
                                            <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 backdrop-blur-glass border border-outline rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)] font-label">
                                                {series.seasons.map((season) => (
                                                    <button
                                                        key={season.season_number}
                                                        className={`w-full text-left px-4 py-2 hover:bg-white/5 transition-colors text-xs ${selectedSeason === season.season_number ? 'text-primary bg-white/10' : 'text-outline-variant'}`}
                                                        onClick={() => {
                                                            setSelectedSeason(season.season_number);
                                                            setIsSeasonOpen(false);
                                                        }}
                                                    >
                                                        Season {season.season_number}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {isEpisodesLoading ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-8 h-8 border-2 border-primary rounded-full animate-spin border-t-transparent" />
                                </div>
                            ) : (
                                /* Standard Video Episodes Carousel */
                                <div className="relative">
                                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar">
                                        {episodes.map((episode) => (
                                            <div
                                                key={episode.id}
                                                className="flex-none w-56 md:w-64 snap-start group cursor-pointer"
                                                onClick={() => handlePlay(Number(episode.id))}
                                            >
                                                <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                                                    {episode.poster_url ? (
                                                        <img src={resolveImageUrl(episode.poster_url)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    ) : (
                                                        <div className="w-full h-full bg-surface/50 border border-outline flex items-center justify-center text-outline-variant font-body">No Image</div>
                                                    )}
                                                    {/* Play overlay */}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                                            <Play size={20} className="fill-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="px-1">
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <h4 className="font-medium text-primary group-hover:text-primary transition-colors line-clamp-1 font-heading">
                                                            {episode.episode_number}. {episode.title || `Episode ${episode.episode_number}`}
                                                        </h4>
                                                        <span className="text-xs text-outline-variant whitespace-nowrap font-label">24m</span>
                                                    </div>
                                                    <p className="text-xs text-outline-variant line-clamp-2 leading-relaxed font-body">
                                                        {episode.plot || "No description available."}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <IdentifyModal
                    isOpen={isIdentifyOpen}
                    onClose={() => setIsIdentifyOpen(false)}
                    onIdentify={handleIdentify}
                    currentTitle={title || ""}
                    isSeries={!!isSeries}
                />
            </div>
        </MainLayout >
    );
};
