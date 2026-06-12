import React from 'react';
import { CastMember } from '@/types';
import { resolveImageUrl } from '@/services';

/** Horizontal scroller of cast headshots on the media detail screen. */
export const CastRow: React.FC<{ cast: CastMember[] }> = ({ cast }) => {
    if (cast.length === 0) return null;

    return (
        <div className="mt-12 mb-8 animate-fade-in-up delay-200">
            <h3 className="text-xl font-bold text-primary font-heading mb-6 flex items-center gap-2">
                <span>Cast</span>
                <span className="text-sm font-normal text-outline-variant bg-surface/50 border border-outline backdrop-blur-surface px-2 py-0.5 rounded-full font-label">
                    {cast.length}
                </span>
            </h3>
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
    );
};
