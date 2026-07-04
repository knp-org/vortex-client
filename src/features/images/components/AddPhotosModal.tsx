import React, { useEffect, useMemo, useState } from 'react';
import {
    GlassModal, GlassButton, GlassSpinner, GlassPhotoGrid, GlassText,
    type GlassPhotoItem,
} from '@knp-org/liquid-glass-ui';
import { mediaService, resolveImageUrl } from '@/services';
import type { Photo } from '@/types';

interface AddPhotosModalProps {
    /** The album photos are being moved into. */
    galleryId: number;
    /** Library to pull candidate photos from. */
    libraryId: number;
    onClose: () => void;
    /** Called after photos were successfully moved in. */
    onAdded: () => void;
}

/**
 * Pick existing library photos to move into an album. Moving a photo reassigns
 * it to this album, so it leaves whichever album it was in before. Photos
 * already in the target album are excluded from the picker.
 */
export const AddPhotosModal: React.FC<AddPhotosModalProps> = ({ galleryId, libraryId, onClose, onAdded }) => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        mediaService.libraryImages(libraryId)
            .then((all) => { if (alive) setPhotos(all); })
            .catch(console.error)
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [libraryId]);

    // Candidates = every library photo not already in this album.
    const candidates: GlassPhotoItem[] = useMemo(
        () => photos
            .filter((p) => p.gallery_id !== galleryId)
            .map((p) => ({
                id: p.id,
                thumbUrl: resolveImageUrl(p.thumb_url),
                url: resolveImageUrl(p.url),
                title: p.title,
            })),
        [photos, galleryId],
    );

    const toggle = (id: number | string) => {
        const numId = Number(id);
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(numId)) next.delete(numId); else next.add(numId);
            return next;
        });
    };

    const confirm = async () => {
        if (selected.size === 0) return;
        setBusy(true);
        try {
            await mediaService.addImagesToGallery(galleryId, Array.from(selected));
            onAdded();
            onClose();
        } catch (e) {
            console.error('Failed to add photos to album', e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <GlassModal
            isOpen
            onClose={onClose}
            className="!max-w-4xl"
            surfaceOpacity={0.9}
            title="Add Photos"
            footer={
                <div className="flex items-center justify-between">
                    <GlassText variant="muted" className="text-sm">{selected.size} selected</GlassText>
                    <div className="flex items-center gap-3">
                        <GlassButton onClick={onClose} disabled={busy}>Cancel</GlassButton>
                        <GlassButton
                            variant="primary"
                            onClick={confirm}
                            disabled={busy || selected.size === 0}
                        >
                            {busy ? 'Adding…' : `Add ${selected.size || ''}`.trim()}
                        </GlassButton>
                    </div>
                </div>
            }
        >
            <GlassText variant="muted" className="text-xs mb-4 block">
                Moving a photo here removes it from its current album.
            </GlassText>

            <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
                {loading ? (
                    <div className="flex justify-center py-16"><GlassSpinner size={32} /></div>
                ) : candidates.length === 0 ? (
                    <GlassText variant="muted" className="block text-center py-16">
                        No other photos in this library to add.
                    </GlassText>
                ) : (
                    <GlassPhotoGrid
                        photos={candidates}
                        selectable
                        selectedIds={Array.from(selected)}
                        onToggleSelect={toggle}
                        minThumb={120}
                    />
                )}
            </div>
        </GlassModal>
    );
};
