import React from 'react';
import { GlassHeading, GlassText, GlassBadge } from '@knp-org/liquid-glass-ui';
import { CreditDto } from '@/types';
import { resolveImageUrl } from '@/services';

/** Horizontal scroller of cast headshots on the media detail screen. */
export const CastRow: React.FC<{ cast: CreditDto[] }> = ({ cast }) => {
    if (cast.length === 0) return null;

    return (
        <div className="mt-12 mb-8 animate-fade-in-up delay-200">
            <GlassHeading as="h3" size="small" className="mb-6 flex items-center gap-2">
                <span>Cast</span>
                <GlassBadge className="!text-sm">{cast.length}</GlassBadge>
            </GlassHeading>
            <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
                {cast.map((actor, idx) => (
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
                        <GlassHeading as="h4" size="none" className="!text-xs font-bold line-clamp-1 mb-0.5 w-full">
                            {actor.name}
                        </GlassHeading>
                        <GlassText variant="muted" className="!text-[10px] line-clamp-2 leading-tight w-full px-1">
                            {actor.character}
                        </GlassText>
                    </div>
                ))}
            </div>
        </div>
    );
};
