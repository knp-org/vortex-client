import React from 'react';
import { MainLayout } from '@/app/layout/MainLayout';
import { Button } from '@/shared/ui/Button';
import { IdentifyModal } from './IdentifyModal';
import { CastRow } from './CastRow';
import { EpisodesSection } from './EpisodesSection';
import { ArrowLeft, Play, BookOpen, Search, PlusCircle, Heart, MoreVertical, RefreshCw } from 'lucide-react';
import { resolveImageUrl } from '@/services';
import { useMediaDetail } from '../hooks/useMediaDetail';

export const MediaDetail: React.FC = () => {
    const {
        navigate, isSeries, isBook,
        media, series, bookInfo, isLoading, error,
        selectedSeason, setSelectedSeason, episodes, isEpisodesLoading,
        isSeasonOpen, setIsSeasonOpen,
        isIdentifyOpen, setIsIdentifyOpen, isMenuOpen, setIsMenuOpen,
        parsedCast, handleIdentify, handleRefresh, handlePlay,
    } = useMediaDetail();

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
                    <CastRow cast={parsedCast} />

                    {/* Episodes Carousel (Series Only) */}
                    {isSeries && (
                        <EpisodesSection
                            series={series}
                            episodes={episodes}
                            isEpisodesLoading={isEpisodesLoading}
                            selectedSeason={selectedSeason}
                            setSelectedSeason={setSelectedSeason}
                            isSeasonOpen={isSeasonOpen}
                            setIsSeasonOpen={setIsSeasonOpen}
                            onPlay={handlePlay}
                        />
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
