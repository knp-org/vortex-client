import React, { useState } from 'react';
import { Play, Tv, Film, MoreVertical, RefreshCw, FileSearch, Info, Edit } from 'lucide-react';
import { Media } from '@/types/media';
import { api, resolveImageUrl } from '@/services';
import { IdentifyModal } from '@/components/features/IdentifyModal';
import { MediaInfoModal } from '@/components/features/MediaInfoModal';

interface MediaCardProps {
    id?: number | string;
    title: string;
    posterUrl?: string;
    onClick?: () => void;
    subtitle?: string;
    progress?: number;
    type?: 'movie' | 'series' | 'episode' | 'folder';
    aspectRatio?: 'poster' | 'video'; // poster = 2/3, video = 16/9
    className?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({
    id,
    title,
    posterUrl,
    onClick,
    subtitle,
    progress,
    type = 'movie',
    aspectRatio = 'poster',
    className = ''
}) => {
    const aspectClass = aspectRatio === 'video' ? 'aspect-video' : 'aspect-[2/3]';
    const [showMenu, setShowMenu] = useState(false);
    const [showIdentify, setShowIdentify] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [mediaDetails, setMediaDetails] = useState<Media | null>(null);

    const handleAction = async (e: React.MouseEvent, action: string) => {
        e.stopPropagation();
        setShowMenu(false);
        if (!id) return;
        const mediaId = typeof id === 'string' ? parseInt(id) : id;

        if (action === 'refresh') {
            try {
                if (type === 'folder' || type === 'series') {
                    await api.post(`/series/${encodeURIComponent(title)}/refresh`);
                } else {
                    await api.post(`/media/${mediaId}/refresh`);
                }
            } catch (err) {
                console.error("Failed to refresh", err);
            }
        } else if (action === 'identify') {
            setShowIdentify(true);
        } else if (action === 'info') {
            try {
                if (type === 'folder' || type === 'series') {
                    const data = await api.get<any>(`/series/${encodeURIComponent(title)}`);
                    setMediaDetails(data);
                } else {
                    const data = await api.get<Media>(`/media/${mediaId}`);
                    setMediaDetails(data);
                }
                setShowInfo(true);
            } catch (err) {
                console.error("Failed to fetch details", err);
            }
        } else if (action === 'edit') {
            // Placeholder
            console.log("Edit requested for", mediaId);
        }
    };

    const handleIdentify = async (providerId: string, mediaType: 'movie' | 'series', providerName?: string) => {
        if (!id && !title) return;
        try {
            if (type === 'folder' || type === 'series') {
                await api.post(`/series/${encodeURIComponent(title)}/identify`, { provider_id: providerId, media_type: mediaType, provider_name: providerName });
            } else {
                await api.post(`/media/${id}/identify`, { provider_id: providerId, media_type: mediaType, provider_name: providerName });
            }
            window.location.reload(); // Simple refresh to show new data
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <div
                className={`group relative rounded-xl bg-surface/50 backdrop-blur-surface border border-t-[rgba(255,255,255,0.3)] border-l-[rgba(255,255,255,0.3)] border-b-[rgba(255,255,255,0.05)] border-r-[rgba(255,255,255,0.05)] shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] cursor-pointer ${className}`}
                onClick={onClick}
                onMouseLeave={() => setShowMenu(false)}
            >
                <div className={`${aspectClass} w-full relative overflow-hidden rounded-xl`}>
                    {posterUrl ? (
                        <img
                            src={resolveImageUrl(posterUrl)}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/20">
                            {type === 'series' || type === 'folder' ? <Tv size={40} /> : <Film size={40} />}
                        </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
                        {/* Play Icon */}
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 text-white transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-75 shadow-lg border border-white/20 pointer-events-none">
                            <Play size={24} className="ml-1 fill-white" />
                        </div>

                        {/* Title */}
                        {!showMenu && (
                            <>
                                <h3 className="text-sm font-bold text-primary leading-tight mt-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 absolute bottom-4 px-4 w-full select-none font-heading">
                                    {title}
                                </h3>
                                {subtitle && (
                                    <p className="text-xs text-outline-variant transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 absolute bottom-12 w-full px-4 truncate font-body">
                                        {subtitle}
                                    </p>
                                )}
                            </>
                        )}

                    </div>

                    {/* Progress Bar */}
                    {progress !== undefined && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 z-10">
                            <div
                                className="h-full bg-primary shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* 3-Dots Menu Button (Moved outside overflow-hidden inner container) */}
                {(id || title) && (
                    <div className="absolute top-2 right-2 flex flex-col items-end z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            className="p-1 rounded-full bg-black/60 text-primary hover:bg-primary hover:text-on-primary transition-colors"
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        >
                            <MoreVertical size={14} />
                        </button>

                        {showMenu && (
                            <div className="mt-1 w-36 bg-surface/90 backdrop-blur-glass border border-t-[rgba(255,255,255,0.3)] border-l-[rgba(255,255,255,0.3)] border-b-[rgba(255,255,255,0.05)] border-r-[rgba(255,255,255,0.05)] rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden animate-fade-in text-left">
                                <button onClick={(e) => handleAction(e, 'refresh')} className="w-full px-2.5 py-1.5 text-[11px] text-outline-variant hover:bg-white/10 hover:text-primary flex items-center gap-2 font-label">
                                    <RefreshCw size={12} /> Refresh Metadata
                                </button>
                                <button onClick={(e) => handleAction(e, 'edit')} className="w-full px-2.5 py-1.5 text-[11px] text-outline-variant hover:bg-white/10 hover:text-primary flex items-center gap-2 font-label">
                                    <Edit size={12} /> Edit Metadata
                                </button>
                                <button onClick={(e) => handleAction(e, 'identify')} className="w-full px-2.5 py-1.5 text-[11px] text-outline-variant hover:bg-white/10 hover:text-primary flex items-center gap-2 font-label">
                                    <FileSearch size={12} /> Identity
                                </button>
                                {(type !== 'folder' && type !== 'series') && (
                                    <button onClick={(e) => handleAction(e, 'info')} className="w-full px-2.5 py-1.5 text-[11px] text-outline-variant hover:bg-white/10 hover:text-primary flex items-center gap-2 border-t border-white/5 font-label">
                                        <Info size={12} /> Media Info
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <IdentifyModal
                isOpen={showIdentify}
                onClose={() => setShowIdentify(false)}
                onIdentify={handleIdentify}
                currentTitle={title}
                isSeries={type === 'series'}
            />

            {mediaDetails && (
                <MediaInfoModal
                    isOpen={showInfo}
                    onClose={() => setShowInfo(false)}
                    media={mediaDetails}
                />
            )}
        </>
    );
};
