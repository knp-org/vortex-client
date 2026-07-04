import React, { useState, useEffect } from 'react';
import { GlassButton, GlassBadge, GlassHeading, GlassText, IconArrowRight } from '@knp-org/liquid-glass-ui';
import { useNavigate } from 'react-router-dom';
import { resolveImageUrl, mediaService, libraryService } from '@/services';
import type { Card } from '@/types';

type HeroItem = Card & { backdrop_url?: string; plot?: string };

export const HeroCarousel: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [items, setItems] = useState<HeroItem[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                // Hero carousel features Movies and TV shows only. The /recent feed can be
                // dominated by other types (e.g. music videos), so pull movies from their
                // libraries and series directly rather than filtering recent.
                const libraries = await libraryService.getAll();
                const movieLibs = libraries.filter(l => l.library_type === 'movies');
                const [movieCards, seriesCards] = await Promise.all([
                    Promise.all(movieLibs.map(l => mediaService.libraryItems(l.id).catch(() => [])))
                        .then(lists => lists.flat().filter(c => c.kind === 'movie')),
                    mediaService.seriesList().catch(() => []),
                ]);
                // Randomly draw a few from the combined movie + series pool.
                const pool = [...movieCards, ...seriesCards];
                for (let i = pool.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [pool[i], pool[j]] = [pool[j], pool[i]];
                }
                const cards = pool.slice(0, 5);
                // Cards carry no backdrop/plot; enrich the few hero items from their detail.
                const enriched = await Promise.all(cards.map(async (c): Promise<HeroItem> => {
                    try {
                        const d: any = c.kind === 'series'
                            ? await mediaService.series(c.id)
                            : await mediaService.movie(c.id);
                        return { ...c, backdrop_url: d?.backdrop_url, plot: d?.plot };
                    } catch {
                        return { ...c };
                    }
                }));
                setItems(enriched);
            } catch (error) {
                console.error("Failed to fetch carousel items", error);
            }
        };
        fetchRecent();
    }, []);

    // Auto-advance
    useEffect(() => {
        if (items.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [items.length]);

    const open = (card: Card) => navigate(card.kind === 'series' ? `/series/${card.id}` : `/media/${card.id}`);

    if (items.length === 0) {
        return (
            <div className="relative w-full h-[60vh] rounded-3xl overflow-hidden mb-8 bg-white/5 flex items-center justify-center">
                <GlassText variant="muted">No content available. Scan a library to see content here.</GlassText>
            </div>
        );
    }

    const item = items[currentIndex];

    return (
        <div className="relative w-full h-[50vh] sm:h-[55vh] md:h-[60vh] rounded-3xl overflow-hidden mb-8 group">
            {/* Background Image with Fade Transition */}
            {items.map((data, index) => {
                const isVisible = index === currentIndex;
                return (
                    <div
                        key={data.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                        aria-hidden={!isVisible}
                    >
                        {(data.backdrop_url || data.poster_url) ? (
                            <img
                                src={resolveImageUrl(data.backdrop_url || data.poster_url)}
                                alt={data.title || ''}
                                className="w-full h-full object-cover"
                                loading={index === 0 ? 'eager' : 'lazy'}
                                decoding="async"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black" />
                        )}

                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                    </div>
                );
            })}

            {/* Content Layer */}
            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 md:p-12 z-10 flex flex-col justify-end h-full overflow-hidden">
                <div className="max-w-2xl space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in">
                    {/* Meta Info */}
                    <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm md:text-base text-outline-variant font-label">
                        {item.kind && (
                            <GlassBadge className="uppercase !text-[10px] sm:!text-xs tracking-wider">
                                {item.kind}
                            </GlassBadge>
                        )}
                        {item.year && <span>{item.year}</span>}
                    </div>

                    {/* Title */}
                    <GlassHeading as="h1" size="large" className="text-2xl sm:text-4xl md:text-6xl tracking-tight drop-shadow-2xl line-clamp-2">
                        {item.title}
                    </GlassHeading>

                    {/* Description */}
                    {item.plot && (
                        <GlassText variant="muted" className="text-sm sm:text-base md:text-lg line-clamp-2 sm:line-clamp-3 drop-shadow-md max-w-xl">
                            {item.plot}
                        </GlassText>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-3 sm:space-x-4 pt-2 sm:pt-4">
                        <GlassButton size="lg" shape="pill" onClick={() => open(item)}>
                            Play Now
                        </GlassButton>
                        <GlassButton size="lg" variant="secondary" shape="pill" onClick={() => open(item)}>
                            More Info
                        </GlassButton>
                    </div>
                </div>
            </div>

            {/* Navigation Indicators */}
            {items.length > 1 && (
                <div className="absolute bottom-8 right-8 z-20 flex space-x-2">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'bg-primary w-8 shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                                : 'bg-white/30 hover:bg-white/50 w-2'
                                }`}
                        />
                    ))}
                </div>
            )}

            {/* Arrows (Visible on hover) */}
            {items.length > 1 && (
                <div className="absolute inset-y-0 right-4 z-20 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <GlassButton
                        variant="ghost"
                        shape="circle"
                        onClick={() => setCurrentIndex(prev => (prev + 1) % items.length)}
                    >
                        <IconArrowRight size={20} glow={false} />
                    </GlassButton>
                </div>
            )}
        </div>
    );
};
