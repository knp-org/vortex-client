import React from 'react';
import { ChevronDown, Play } from 'lucide-react';
import { SeriesDetail, Episode } from '@/types';
import { resolveImageUrl } from '@/services';

interface EpisodesSectionProps {
    series: SeriesDetail | null;
    episodes: Episode[];
    isEpisodesLoading: boolean;
    selectedSeason: number;
    setSelectedSeason: (n: number) => void;
    isSeasonOpen: boolean;
    setIsSeasonOpen: (open: boolean) => void;
    onPlay: (mediaId?: number) => void;
}

/** Season selector + episodes carousel on the series detail screen. */
export const EpisodesSection: React.FC<EpisodesSectionProps> = ({
    series, episodes, isEpisodesLoading,
    selectedSeason, setSelectedSeason, isSeasonOpen, setIsSeasonOpen, onPlay,
}) => {
    return (
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
                                onClick={() => onPlay(Number(episode.id))}
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
    );
};
