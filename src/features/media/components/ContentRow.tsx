import React, { useRef } from 'react';
import { GlassButton, GlassHeading, IconArrowLeft, IconArrowRight } from '@knp-org/liquid-glass-ui';
import { MediaCard } from './MediaCard';

export interface MediaItem {
    id: string;
    title: string;
    posterUrl: string;
    progress?: number; // 0-100
    subtitle?: string;
    /** Server card kind: movie | series | episode | book | music_video. */
    kind?: string;
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
                    <GlassHeading as="h2" size="small">{title}</GlassHeading>
                    {onViewAll && (
                        <GlassButton
                            variant="ghost"
                            size="sm"
                            shape="pill"
                            onClick={onViewAll}
                            className="!text-xs uppercase tracking-wider"
                        >
                            See All
                        </GlassButton>
                    )}
                </div>
                <div className="flex space-x-2">
                    <GlassButton variant="ghost" shape="circle" size="sm" onClick={() => handleScroll('left')}>
                        <IconArrowLeft size={16} glow={false} />
                    </GlassButton>
                    <GlassButton variant="ghost" shape="circle" size="sm" onClick={() => handleScroll('right')}>
                        <IconArrowRight size={16} glow={false} />
                    </GlassButton>
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
                            type={item.kind === 'series' ? 'series' : item.kind === 'book' ? 'movie' : 'movie'}
                            onClick={() => onItemClick && onItemClick(item)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
