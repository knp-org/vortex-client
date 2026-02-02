import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';

interface HeroItem {
    id: number;
    title: string;
    plot?: string;
    backdrop_url?: string;
    year?: number;
    genre?: string; // API returns "Action, Drama" string usually
    series_name?: string;
    media_type?: string;
}

export const HeroCarousel: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [items, setItems] = useState<HeroItem[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const res = await fetch('/api/v1/recent');
                if (res.ok) {
                    const data = await res.json();
                    setItems(data.slice(0, 5)); // Top 5
                }
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

    if (items.length === 0) {
        return (
            <div className="relative w-full h-[60vh] rounded-3xl overflow-hidden mb-8 bg-white/5 flex items-center justify-center">
                <div className="text-gray-500">No content available. Scan a library to see content here.</div>
            </div>
        );
    }

    const item = items[currentIndex];

    return (
        <div className="relative w-full h-[60vh] rounded-3xl overflow-hidden mb-8 group">
            {/* Background Image with Fade Transition */}
            {items.map((data, index) => (
                <div
                    key={data.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    {data.backdrop_url ? (
                        <img
                            src={data.backdrop_url}
                            alt={data.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black" />
                    )}

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                </div>
            ))}

            {/* Content Layer */}
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-10 flex flex-col justify-end h-full">
                <div className="max-w-2xl space-y-4 animate-fade-in">
                    {/* Meta Info */}
                    <div className="flex items-center space-x-3 text-sm md:text-base text-gray-300 font-medium">
                        {item.media_type && (
                            <span className="bg-white/10 px-2 py-1 rounded border border-white/10 uppercase text-xs tracking-wider">
                                {item.media_type}
                            </span>
                        )}
                        {item.year && <span>{item.year}</span>}
                        {(item.year || item.media_type) && item.genre && <span>•</span>}
                        {item.genre && <span>{item.genre}</span>}
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight drop-shadow-2xl">
                        {item.title}
                    </h1>

                    {/* Description */}
                    {item.plot && (
                        <p className="text-gray-200 text-lg line-clamp-3 md:line-clamp-none drop-shadow-md max-w-xl">
                            {item.plot}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-4 pt-4">
                        <Button
                            size="lg"
                            className="px-8 shadow-cyan-500/20"
                            onClick={() => navigate(item.series_name ? `/series/${item.series_name}` : `/media/${item.id}`)}
                        >
                            Play Now
                        </Button>
                        <Button
                            size="lg"
                            variant="secondary"
                            onClick={() => navigate(item.series_name ? `/series/${item.series_name}` : `/media/${item.id}`)}
                        >
                            More Info
                        </Button>
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
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'bg-cyan-400 w-8'
                                : 'bg-white/30 hover:bg-white/50'
                                }`}
                        />
                    ))}
                </div>
            )}

            {/* Arrows (Visible on hover) */}
            {items.length > 1 && (
                <div className="absolute inset-y-0 right-4 z-20 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setCurrentIndex(prev => (prev + 1) % items.length)}
                        className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/10"
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
};
