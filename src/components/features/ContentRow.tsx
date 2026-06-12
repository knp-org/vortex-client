import React, { useRef } from 'react';
import { MediaCard } from '@/shared/ui/MediaCard';

export interface MediaItem {
    id: string;
    title: string;
    posterUrl: string;
    progress?: number; // 0-100
    subtitle?: string;
    isSeries?: boolean;
    seriesName?: string;
}

interface ContentRowProps {
    title: string;
    items: MediaItem[];
    isContinueWatching?: boolean;
    onViewAll?: () => void;
    onItemClick?: (item: MediaItem) => void;
}

export const ContentRow: React.FC<ContentRowProps> = ({ title, items, isContinueWatching = false, onViewAll, onItemClick }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth / 2 : current.offsetWidth / 2;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-bold text-primary font-heading">{title}</h2>
                    {onViewAll && (
                        <button
                            onClick={onViewAll}
                            className="text-xs font-medium text-outline-variant hover:text-primary uppercase tracking-wider transition-colors font-label"
                        >
                            See All
                        </button>
                    )}
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleScroll('left')}
                        className="p-1 rounded-full hover:bg-surface/50 text-outline-variant hover:text-primary transition-colors backdrop-blur-surface"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => handleScroll('right')}
                        className="p-1 rounded-full hover:bg-surface/50 text-outline-variant hover:text-primary transition-colors backdrop-blur-surface"
                    >
                        →
                    </button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex space-x-4 overflow-x-auto py-8 px-2 scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex-shrink-0 w-32 md:w-40 lg:w-44"
                    >
                        <MediaCard
                            id={item.id}
                            title={item.title}
                            posterUrl={item.posterUrl}
                            subtitle={item.subtitle}
                            progress={isContinueWatching ? item.progress : undefined}
                            type={item.isSeries ? 'series' : 'movie'}
                            onClick={() => onItemClick && onItemClick(item)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
