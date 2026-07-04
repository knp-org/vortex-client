import React, { useState } from 'react';
import { Tv, Film, Image as ImageIcon, FileSearch, ListPlus } from 'lucide-react';
import {
    GlassCard,
    GlassHeading,
    GlassText,
    GlassButton,
    IconPlaySolid,
    IconMoreVertical,
    IconSync,
    IconEdit,
    IconInfo,
} from '@knp-org/liquid-glass-ui';
import { mediaService, resolveImageUrl } from '@/services';
import { IdentifyModal } from './IdentifyModal';
import { MediaInfoModal } from './MediaInfoModal';
import { AddToPlaylistModal } from '@/features/music';

interface MediaCardProps {
    id?: number | string;
    title: string;
    posterUrl?: string;
    onClick?: () => void;
    subtitle?: string;
    progress?: number;
    type?: 'movie' | 'series' | 'episode' | 'folder' | 'album' | 'gallery';
    aspectRatio?: 'poster' | 'video' | 'square'; // poster = 2/3, video = 16/9, square = 1/1
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
    const aspectClass = aspectRatio === 'video' ? 'aspect-video' : aspectRatio === 'square' ? 'aspect-square' : 'aspect-[2/3]';
    // Galleries (photo albums) are just navigational — no metadata context menu.
    const isGallery = type === 'gallery';
    const [showMenu, setShowMenu] = useState(false);
    const [showIdentify, setShowIdentify] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [mediaDetails, setMediaDetails] = useState<any>(null);
    const [playlistItems, setPlaylistItems] = useState<number[] | null>(null);

    // For series cards the id is a series id; otherwise a media item id.
    const isSeries = type === 'folder' || type === 'series';
    // Music library cards represent albums (the id is an album id).
    const isAlbum = type === 'album';

    const handleAction = async (e: React.MouseEvent, action: string) => {
        e.stopPropagation();
        setShowMenu(false);
        if (!id) return;
        const itemId = typeof id === 'string' ? parseInt(id) : id;

        if (action === 'refresh') {
            try {
                if (isSeries) await mediaService.refreshSeries(itemId);
                else await mediaService.refreshMedia(itemId);
            } catch (err) {
                console.error("Failed to refresh", err);
            }
        } else if (action === 'identify') {
            setShowIdentify(true);
        } else if (action === 'info') {
            // Media Info is only offered for individual items (not series folders).
            try {
                const info = await mediaService.mediaInfo(itemId);
                setMediaDetails({ title, media_info: JSON.stringify(info) });
                setShowInfo(true);
            } catch (err) {
                console.error("Failed to fetch media info", err);
            }
        } else if (action === 'edit') {
            // Placeholder
            console.log("Edit requested for", itemId);
        } else if (action === 'playlist') {
            // Album cards: gather the album's track item-ids for the playlist modal.
            try {
                const album = await mediaService.album(itemId);
                setPlaylistItems(album.tracks.map(t => t.id));
            } catch (err) {
                console.error("Failed to load album tracks", err);
            }
        }
    };

    const handleIdentify = async (providerId: string, mediaType: 'movie' | 'series', providerName?: string) => {
        if (!id) return;
        const itemId = typeof id === 'string' ? parseInt(id) : id;
        try {
            const body = { provider_id: providerId, media_type: mediaType, provider_name: providerName };
            if (isSeries) await mediaService.identifySeries(itemId, body);
            else await mediaService.identifyMedia(itemId, body);
            window.location.reload(); // Simple refresh to show new data
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <GlassCard
                className={`group relative !p-0 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] cursor-pointer ${className}`}
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
                            {isGallery ? <ImageIcon size={40} /> : isSeries ? <Tv size={40} /> : <Film size={40} />}
                        </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
                        {/* Play Icon — hidden for cards that open a detail view rather
                            than starting playback (albums, series/folders). */}
                        {!isAlbum && !isSeries && (
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 text-white transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-75 shadow-lg border border-white/20 pointer-events-none">
                                <IconPlaySolid size={24} glow={false} className="ml-1" />
                            </div>
                        )}

                        {/* Title */}
                        {!showMenu && (
                            <>
                                <GlassHeading as="h3" size="small" className="!text-sm leading-tight mt-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 absolute bottom-4 px-4 w-full select-none">
                                    {title}
                                </GlassHeading>
                                {subtitle && (
                                    <GlassText as="p" variant="muted" className="!text-xs transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 absolute bottom-12 w-full px-4 truncate">
                                        {subtitle}
                                    </GlassText>
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
                {(id || title) && !isGallery && (
                    <div className="absolute top-2 right-2 flex flex-col items-end z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <GlassButton
                            variant="ghost"
                            shape="circle"
                            size="sm"
                            className="!p-1 bg-black/60"
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        >
                            <IconMoreVertical size={14} glow={false} />
                        </GlassButton>

                        {showMenu && (
                            <div className="mt-1 w-36 bg-[#15151c]/95 backdrop-blur-glass border border-outline rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-in text-left">
                                {isAlbum ? (
                                    <button onClick={(e) => handleAction(e, 'playlist')} className="w-full px-2.5 py-1.5 text-[11px] text-outline-variant hover:bg-white/10 hover:text-primary flex items-center gap-2 font-label">
                                        <ListPlus size={12} /> Add to Playlist
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={(e) => handleAction(e, 'refresh')} className="w-full px-2.5 py-1.5 text-[11px] text-outline-variant hover:bg-white/10 hover:text-primary flex items-center gap-2 font-label">
                                            <IconSync size={12} glow={false} /> Refresh Metadata
                                        </button>
                                        <button onClick={(e) => handleAction(e, 'edit')} className="w-full px-2.5 py-1.5 text-[11px] text-outline-variant hover:bg-white/10 hover:text-primary flex items-center gap-2 font-label">
                                            <IconEdit size={12} glow={false} /> Edit Metadata
                                        </button>
                                        <button onClick={(e) => handleAction(e, 'identify')} className="w-full px-2.5 py-1.5 text-[11px] text-outline-variant hover:bg-white/10 hover:text-primary flex items-center gap-2 font-label">
                                            <FileSearch size={12} /> Identity
                                        </button>
                                        {!isSeries && (
                                            <button onClick={(e) => handleAction(e, 'info')} className="w-full px-2.5 py-1.5 text-[11px] text-outline-variant hover:bg-white/10 hover:text-primary flex items-center gap-2 border-t border-white/5 font-label">
                                                <IconInfo size={12} glow={false} /> Media Info
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </GlassCard>

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

            {playlistItems && (
                <AddToPlaylistModal itemIds={playlistItems} onClose={() => setPlaylistItems(null)} />
            )}
        </>
    );
};
