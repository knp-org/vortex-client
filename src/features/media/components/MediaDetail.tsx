import React from 'react';
import { MainLayout } from '@/app/layout/MainLayout';
import {
    GlassButton, GlassHeading, GlassText, GlassSpinner, GlassBadge,
    IconArrowLeft, IconPlay, IconPlaySolid, IconSearch, IconFavorites,
    IconMoreVertical, IconSync,
} from '@knp-org/liquid-glass-ui';
import { IdentifyModal } from './IdentifyModal';
import { CastRow } from './CastRow';
import { EpisodesSection } from './EpisodesSection';
import { BookOpen } from 'lucide-react';
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
        isFavorite, toggleFavorite,
    } = useMediaDetail();

    if (isLoading) {
        return (
            <MainLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <GlassSpinner size={48} />
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                    <GlassText className="text-error text-xl">{error}</GlassText>
                    <GlassButton onClick={() => navigate(-1)}>Go Back</GlassButton>
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

    // Directors come from the structured credits (role = "Director").
    const director = parsedCast
        .filter(c => (c.role || '').toLowerCase() === 'director')
        .map(c => c.name);

    const ageRating = isSeries ? series?.age_rating : media?.age_rating;
    const studio = isSeries ? series?.studio : media?.studio;
    const trailerUrl = isSeries ? series?.trailer_url : media?.trailer_url;
    const originCountry = isSeries ? series?.origin_country : media?.origin_country;
    const collectionName = isSeries ? series?.collection_name : media?.collection_name;
    const creatorRaw = isSeries ? series?.creator : media?.creator;
    const creator = parseGenres(creatorRaw);

    // Book-specific display values (format/pages come from the book info endpoint).
    const bookFormat = isBook ? bookInfo?.format?.toUpperCase() : undefined;
    const pageCount = bookInfo?.page_count ?? media?.page_count;



    return (
        <MainLayout>
            <div className="min-h-screen pb-20 animate-fade-in bg-black/40 backdrop-blur-xl rounded-t-[3rem] mt-4 mx-4">
                {/* Backdrop Section - Reduced height */}
                <div className="relative h-[50vh] w-full overflow-hidden rounded-t-[3rem] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                    {/* Back Button */}
                    <div className="absolute top-0 left-0 p-6 z-30 flex gap-4">
                        <GlassButton shape="circle" onClick={() => navigate(-1)} aria-label="Back">
                            <IconArrowLeft size={20} glow={false} />
                        </GlassButton>
                    </div>

                    {/* Top Right Actions */}
                    <div className="absolute top-0 right-0 p-6 z-30">
                        <div className="relative">
                            <GlassButton shape="circle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="More actions">
                                <IconMoreVertical size={20} glow={false} />
                            </GlassButton>

                            {isMenuOpen && (
                                <div className="glass-menu animate-fade-in" style={{ right: 0, left: 'auto', minWidth: '12rem' }}>
                                    <button
                                        className="glass-menu-item flex items-center gap-2 font-label"
                                        onClick={handleRefresh}
                                    >
                                        <IconSync size={16} glow={false} />
                                        <span>Refresh Metadata</span>
                                    </button>
                                    {!isBook && (
                                        <button
                                            className="glass-menu-item flex items-center gap-2 font-label"
                                            onClick={() => {
                                                setIsIdentifyOpen(true);
                                                setIsMenuOpen(false);
                                            }}
                                        >
                                            <IconSearch size={16} glow={false} />
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
                            <GlassHeading as="h1" size="large" className="text-4xl md:text-5xl mb-2 leading-tight">
                                {title}
                            </GlassHeading>

                            {/* Metadata Row */}
                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-400 mb-6">
                                {ageRating && (
                                    <GlassBadge className="uppercase !text-xs">{ageRating}</GlassBadge>
                                )}
                                {year && <span>{year}</span>}
                                {!isBook && media?.runtime && (
                                    <span>{Math.floor(media.runtime / 60)}h {media.runtime % 60}m</span>
                                )}
                                {isBook ? (
                                    <>
                                        {bookFormat && (
                                            <GlassBadge className="uppercase !text-xs">{bookFormat}</GlassBadge>
                                        )}
                                        {pageCount ? <span>{pageCount} pages</span> : null}
                                    </>
                                ) : (
                                    <GlassBadge className="uppercase !text-xs">HD</GlassBadge>
                                )}
                                {originCountry && (
                                    <span>{originCountry}</span>
                                )}
                            </div>

                            {/* Actions Row */}
                            <div className="flex flex-wrap items-center gap-3 mb-8">
                                <GlassButton
                                    shape={isBook ? 'pill' : 'circle'}
                                    onClick={() => handlePlay()}
                                    title={isBook ? 'Read' : 'Play'}
                                >
                                    {isBook ? (
                                        <span className="inline-flex items-center gap-2">
                                            <BookOpen size={18} /> Read
                                        </span>
                                    ) : (
                                        <IconPlaySolid size={18} glow={false} className="ml-0.5" />
                                    )}
                                </GlassButton>

                                {trailerUrl && (
                                    <GlassButton
                                        variant="secondary"
                                        shape="pill"
                                        onClick={() => window.open(trailerUrl, '_blank')}
                                        title="Watch Trailer"
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <IconPlay size={18} glow={false} /> Trailer
                                        </span>
                                    </GlassButton>
                                )}

                                {/* Extra Actions */}
                                {!isSeries && (
                                    <div className="flex items-center gap-2 ml-auto md:ml-0">
                                        <GlassButton
                                            variant="ghost"
                                            shape="circle"
                                            onClick={toggleFavorite}
                                            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                            className={isFavorite ? 'text-red-400' : ''}
                                        >
                                            <IconFavorites size={20} glow={false} fill={isFavorite ? 'currentColor' : 'none'} />
                                        </GlassButton>
                                    </div>
                                )}
                            </div>

                            {/* Details/File Info Grid */}
                            {isBook ? (
                                <div className="space-y-6">
                                    <div className="bg-surface/30 backdrop-blur-surface border border-outline rounded-2xl p-6">
                                        <GlassHeading as="h3" size="small" className="mb-4">File Information</GlassHeading>
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
                                        <GlassHeading as="h3" size="small" className="mb-3">Description</GlassHeading>
                                        <GlassText variant="muted" className="leading-relaxed max-w-3xl text-sm md:text-base">
                                            {plot || 'No plot available.'}
                                        </GlassText>
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

                                        {media?.file_name && (
                                            <>
                                                <div className="text-outline-variant font-label">File</div>
                                                <div className="text-primary break-all">{media.file_name}</div>
                                            </>
                                        )}

                                        <div className="text-outline-variant font-label">Audio</div>
                                        <div className="text-primary">English - AAC - Stereo</div>
                                    </div>

                                    {/* Plot */}
                                    <GlassText variant="muted" className="leading-relaxed max-w-3xl text-sm md:text-base">
                                        {plot || 'No plot available.'}
                                    </GlassText>
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
