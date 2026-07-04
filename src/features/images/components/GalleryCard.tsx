import React from 'react';
import { GlassCard, GlassHeading, IconAlbums } from '@knp-org/liquid-glass-ui';
import { resolveImageUrl } from '@/services';
import type { Card } from '@/types';

interface GalleryCardProps {
    card: Card;
    onClick?: () => void;
}

/**
 * A photo-album (gallery) card that renders a mosaic collage of the album's
 * first few photos instead of a single cover + play icon. Falls back to the
 * cover image, then a placeholder, when few/no thumbnails are available.
 */
export const GalleryCard: React.FC<GalleryCardProps> = ({ card, onClick }) => {
    // Prefer the server-provided mosaic thumbs; fall back to the single cover.
    const thumbs = (card.thumbs && card.thumbs.length > 0)
        ? card.thumbs
        : (card.poster_url ? [card.poster_url] : []);

    const tiles = thumbs.slice(0, 4).map(resolveImageUrl);

    // Layout: 1 -> full, 2 -> two columns, 3 -> big-left + two stacked, 4 -> 2x2.
    const gridClass =
        tiles.length >= 4 ? 'grid-cols-2 grid-rows-2'
        : tiles.length === 3 ? 'grid-cols-2 grid-rows-2'
        : tiles.length === 2 ? 'grid-cols-2 grid-rows-1'
        : 'grid-cols-1 grid-rows-1';

    return (
        <GlassCard
            onClick={onClick}
            className="group relative !p-0 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
            <div className="aspect-square w-full relative">
                {tiles.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <IconAlbums size={40} glow={false} />
                    </div>
                ) : (
                    <div className={`grid ${gridClass} gap-0.5 w-full h-full`}>
                        {tiles.map((src, i) => (
                            <div
                                key={i}
                                // With 3 tiles, the first spans both rows on the left.
                                className={`overflow-hidden bg-white/5 ${tiles.length === 3 && i === 0 ? 'row-span-2' : ''}`}
                            >
                                <img
                                    src={src}
                                    alt=""
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Title overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 pointer-events-none">
                    <GlassHeading as="h3" size="small" className="!text-sm leading-tight w-full truncate">
                        {card.title}
                    </GlassHeading>
                </div>
            </div>
        </GlassCard>
    );
};
