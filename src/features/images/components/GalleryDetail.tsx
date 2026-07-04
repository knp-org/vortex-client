import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
    GlassButton, GlassSpinner, GlassEmptyState, GlassPhotoGrid, GlassLightbox,
    IconArrowLeft, IconEdit, IconCheck, IconTrash, IconClose, IconInfo, IconPlus,
    type GlassPhotoItem, type GlassLightboxSlide,
} from '@knp-org/liquid-glass-ui';
import { MainLayout } from '@/app/layout/MainLayout';
import { resolveImageUrl, mediaService } from '@/services';
import type { GalleryDetail as GalleryDetailT } from '@/types';
import { EditGalleryModal } from './EditGalleryModal';
import { PhotoMetaPanel } from './PhotoMetaPanel';
import { AddPhotosModal } from './AddPhotosModal';
import { MoveToAlbumModal } from './MoveToAlbumModal';

export const GalleryDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [gallery, setGallery] = useState<GalleryDetailT | null>(null);
    const [loading, setLoading] = useState(true);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    // Photo details (EXIF panel) are hidden by default so the image shows full;
    // the in-lightbox info button toggles them.
    const [showInfo, setShowInfo] = useState(false);
    const [editing, setEditing] = useState(false);
    const [adding, setAdding] = useState(false);
    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [movingToAlbum, setMovingToAlbum] = useState(false);
    const [busy, setBusy] = useState(false);

    const load = React.useCallback(() => {
        if (!id) return;
        setLoading(true);
        mediaService.gallery(id)
            .then(setGallery)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const photos: GlassPhotoItem[] = useMemo(
        () => (gallery?.images ?? []).map((p) => ({
            id: p.id,
            thumbUrl: resolveImageUrl(p.thumb_url),
            url: resolveImageUrl(p.url),
            title: p.title,
            width: p.width,
            height: p.height,
        })),
        [gallery],
    );

    const slides: GlassLightboxSlide[] = useMemo(
        () => photos.map((p) => ({ src: p.url || p.thumbUrl, alt: p.title, caption: p.title })),
        [photos],
    );

    const toggleSelect = (photoId: number | string) => {
        const numId = Number(photoId);
        setSelected((prev) => prev.includes(numId) ? prev.filter((x) => x !== numId) : [...prev, numId]);
    };

    const exitSelect = () => { setSelectMode(false); setSelected([]); };

    const removeSelected = async () => {
        if (!gallery || selected.length === 0) return;
        setBusy(true);
        try {
            await Promise.all(selected.map((pid) => mediaService.removeImageFromGallery(gallery.id, pid)));
            exitSelect();
            load();
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="min-h-[50vh] flex items-center justify-center">
                    <GlassSpinner size={40} />
                </div>
            </MainLayout>
        );
    }

    if (!gallery) {
        return (
            <MainLayout>
                <div className="p-8">
                    <GlassEmptyState
                        icon="🖼️"
                        title="Album not found"
                        description="This photo album may have been removed."
                        action={<GlassButton onClick={() => navigate(-1)}>Go back</GlassButton>}
                    />
                </div>
            </MainLayout>
        );
    }

    const cover = gallery.cover_url
        ? resolveImageUrl(gallery.cover_url)
        : photos[0]?.thumbUrl;

    return (
        <MainLayout>
            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                {/* Back */}
                <GlassButton shape="circle" onClick={() => navigate(-1)} aria-label="Back">
                    <IconArrowLeft size={20} glow={false} />
                </GlassButton>

                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                    <div className="w-48 h-48 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.4)] shrink-0 flex items-center justify-center">
                        {cover
                            ? <img src={cover} alt={gallery.name} className="w-full h-full object-cover" />
                            : <span style={{ fontSize: '3rem', opacity: 0.4 }}>🖼️</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wider text-muted">Album</p>
                        <h1 className="heading-medium" style={{ margin: 0 }}>{gallery.name}</h1>
                        {gallery.description && <p className="text-body mt-1">{gallery.description}</p>}
                        <p className="text-muted mt-2">{gallery.image_count} photos</p>

                        <div className="mt-5 flex items-center gap-3 flex-wrap">
                            {!selectMode ? (
                                <>
                                    <GlassButton onClick={() => setAdding(true)}>
                                        <span className="inline-flex items-center gap-2"><IconPlus size={16} glow={false} /> Add Photos</span>
                                    </GlassButton>
                                    <GlassButton onClick={() => setEditing(true)}>
                                        <span className="inline-flex items-center gap-2"><IconEdit size={16} glow={false} /> Edit</span>
                                    </GlassButton>
                                    <GlassButton
                                        onClick={() => setSelectMode(true)}
                                        disabled={photos.length === 0}
                                    >
                                        <span className="inline-flex items-center gap-2"><IconCheck size={16} glow={false} /> Select</span>
                                    </GlassButton>
                                </>
                            ) : (
                                <>
                                    <GlassButton
                                        variant="primary"
                                        onClick={() => setMovingToAlbum(true)}
                                        disabled={busy || selected.length === 0}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <IconPlus size={16} glow={false} /> Add {selected.length || ''} to album
                                        </span>
                                    </GlassButton>
                                    <GlassButton
                                        variant="danger"
                                        onClick={removeSelected}
                                        disabled={busy || selected.length === 0}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <IconTrash size={16} glow={false} /> Remove {selected.length || ''} from album
                                        </span>
                                    </GlassButton>
                                    <GlassButton onClick={exitSelect} disabled={busy}>
                                        <span className="inline-flex items-center gap-2"><IconClose size={16} glow={false} /> Done</span>
                                    </GlassButton>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Photos */}
                {photos.length === 0 ? (
                    <GlassEmptyState
                        icon="🖼️"
                        title="No photos yet"
                        description="This album doesn't contain any photos."
                    />
                ) : (
                    <GlassPhotoGrid
                        photos={photos}
                        selectable={selectMode}
                        selectedIds={selected}
                        onToggleSelect={toggleSelect}
                        onPhotoClick={(i) => { setShowInfo(false); setLightboxIndex(i); }}
                    />
                )}
            </div>

            {/* Rendered via a portal to <body> so the fixed-position lightbox escapes
                MainLayout's backdrop-filter ancestor (which would otherwise become the
                containing block and pin it to the top of the scrolled content instead
                of centering it in the viewport). */}
            {lightboxIndex !== null && createPortal(
                <>
                    <GlassLightbox
                        isOpen
                        slides={slides}
                        index={lightboxIndex}
                        onIndexChange={setLightboxIndex}
                        onClose={() => setLightboxIndex(null)}
                        renderSidebar={showInfo ? (i) => <PhotoMetaPanel photoId={Number(photos[i].id)} /> : undefined}
                    />
                    {/* Info toggle — overlays the lightbox (z above its chrome), left of the
                        close button. Shows/hides the photo details panel. Uses the surface-less
                        ghost variant with a constant translucent circular chrome so toggling it
                        never flips the button to a solid white surface; state is conveyed via
                        aria-pressed. Positioning stays inline so the fixed overlay escapes the
                        lightbox chrome. */}
                    <GlassButton
                        variant="ghost"
                        onClick={() => setShowInfo((v) => !v)}
                        aria-label={showInfo ? 'Hide photo details' : 'Show photo details'}
                        aria-pressed={showInfo}
                        style={{
                            position: 'fixed',
                            top: '1.25rem',
                            right: '4.75rem',
                            zIndex: 6002,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '2.75rem',
                            height: '2.75rem',
                            borderRadius: '9999px',
                            border: '1px solid rgba(255,255,255,0.25)',
                            background: 'rgba(0,0,0,0.55)',
                            backdropFilter: 'blur(8px)',
                            color: '#fff',
                        }}
                    >
                        <IconInfo size={20} glow={false} />
                    </GlassButton>
                </>,
                document.body,
            )}

            {adding && (
                <AddPhotosModal
                    galleryId={gallery.id}
                    libraryId={gallery.library_id}
                    onClose={() => setAdding(false)}
                    onAdded={load}
                />
            )}

            {movingToAlbum && (
                <MoveToAlbumModal
                    libraryId={gallery.library_id}
                    currentGalleryId={gallery.id}
                    imageIds={selected}
                    onClose={() => setMovingToAlbum(false)}
                    onMoved={() => { exitSelect(); load(); }}
                />
            )}

            {editing && (
                <EditGalleryModal
                    gallery={gallery}
                    onClose={() => setEditing(false)}
                    onSaved={(patch) => setGallery((g) => g ? { ...g, ...patch } : g)}
                    onDeleted={() => navigate(-1)}
                />
            )}
        </MainLayout>
    );
};
