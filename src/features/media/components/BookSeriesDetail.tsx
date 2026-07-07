import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/app/layout/MainLayout';
import {
    GlassButton, GlassHeading, GlassText, GlassSpinner, GlassBadge,
    IconArrowLeft,
} from '@knp-org/liquid-glass-ui';
import { BookOpen } from 'lucide-react';
import { resolveImageUrl, mediaService } from '@/services';
import type { BookSeriesDetail as BookSeriesDetailType, BookDetail } from '@/types';

export const BookSeriesDetail: React.FC = () => {
    const { seriesId } = useParams<{ seriesId: string }>();
    const navigate = useNavigate();

    const [series, setSeries] = useState<BookSeriesDetailType | null>(null);
    const [chapters, setChapters] = useState<BookDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSeries = async () => {
            if (!seriesId) return;
            setIsLoading(true);
            try {
                const detail = await mediaService.bookSeries(seriesId);
                setSeries(detail);
                const books = await mediaService.bookSeriesChapters(seriesId);
                setChapters(books);
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to load book series');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSeries();
    }, [seriesId]);

    if (isLoading) {
        return (
            <MainLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <GlassSpinner size={48} />
                </div>
            </MainLayout>
        );
    }

    if (error || !series) {
        return (
            <MainLayout>
                <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                    <GlassText className="text-error text-xl">{error || 'Series not found'}</GlassText>
                    <GlassButton onClick={() => navigate(-1)}>Go Back</GlassButton>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="min-h-screen pb-20 animate-fade-in bg-black/40 backdrop-blur-xl rounded-t-[3rem] mt-4 mx-4">
                <div className="relative h-[50vh] w-full overflow-hidden rounded-t-[3rem] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 left-0 p-6 z-30 flex gap-4">
                        <GlassButton shape="circle" onClick={() => navigate(-1)} aria-label="Back">
                            <IconArrowLeft size={20} glow={false} />
                        </GlassButton>
                    </div>

                    <div className="absolute inset-0 rounded-t-[3rem] overflow-hidden">
                        {series.backdrop_url ? (
                            <img
                                src={resolveImageUrl(series.backdrop_url)}
                                alt="Backdrop"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-surface" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                    </div>
                </div>

                <div className="container mx-auto px-4 md:px-8 relative z-20 -mt-48">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-48 md:w-72 shrink-0 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-t-[rgba(255,255,255,0.3)] border-l-[rgba(255,255,255,0.3)] border-b-[rgba(255,255,255,0.05)] border-r-[rgba(255,255,255,0.05)] bg-surface/50 backdrop-blur-glass">
                            {series.poster_url ? (
                                <img src={resolveImageUrl(series.poster_url)} alt={series.name} className="w-full h-auto object-cover aspect-[2/3]" />
                            ) : (
                                <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-white/20">No Poster</div>
                            )}
                        </div>

                        <div className="flex-1 pt-4 md:pt-12 text-primary">
                            <GlassHeading as="h1" size="large" className="text-4xl md:text-5xl mb-2 leading-tight">
                                {series.name}
                            </GlassHeading>

                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-400 mb-6">
                                <GlassBadge className="uppercase !text-xs">Series</GlassBadge>
                                <span>{chapters.length} Chapters</span>
                                {series.rating && (
                                    <span>★ {(series.rating / 2).toFixed(1)}</span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mb-8">
                                <GlassButton
                                    shape="pill"
                                    onClick={() => {
                                        if (chapters.length > 0) {
                                            navigate(`/reader/${chapters[0].id}`);
                                        }
                                    }}
                                    disabled={chapters.length === 0}
                                    title="Start Reading"
                                    className="!bg-white !text-black hover:!bg-white/90 active:!bg-white/80"
                                >
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    <span className="font-bold">Start Reading</span>
                                </GlassButton>
                            </div>

                            {series.plot && (
                                <div className="mb-8">
                                    <GlassText className="text-gray-300 leading-relaxed max-w-4xl opacity-90 text-sm md:text-base">
                                        {series.plot}
                                    </GlassText>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 md:px-8 mt-12 mb-12">
                    <GlassHeading as="h2" size="medium" className="mb-6 flex items-center gap-3">
                        <span className="w-1 h-6 bg-white/30 rounded-full" />
                        Chapters
                    </GlassHeading>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {chapters.map(chapter => (
                            <div 
                                key={chapter.id} 
                                onClick={() => navigate(`/reader/${chapter.id}`)}
                                className="group relative flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <div className="w-16 h-24 shrink-0 rounded-lg overflow-hidden bg-white/5">
                                    {chapter.poster_url ? (
                                        <img src={resolveImageUrl(chapter.poster_url)} alt={chapter.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="w-6 h-6 text-white/20" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <GlassText className="font-semibold text-white/90 truncate mb-1">
                                        {chapter.title || `Chapter ${chapter.chapter_number}`}
                                    </GlassText>
                                    <div className="flex items-center gap-2 text-xs text-white/50">
                                        {chapter.chapter_number !== undefined && (
                                            <span className="px-2 py-0.5 rounded-full bg-white/10">
                                                Vol. {chapter.chapter_number}
                                            </span>
                                        )}
                                        {chapter.page_count && (
                                            <span>{chapter.page_count} pages</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};
