import React, { useEffect, useState } from 'react';
import { GlassModal, GlassButton, GlassSpinner, GlassText } from '@knp-org/liquid-glass-ui';
import { mediaService, resolveImageUrl } from '@/services';
import type { Card } from '@/types';

interface MoveToAlbumModalProps {
    /** Library whose albums are offered as destinations. */
    libraryId: number;
    /** Album the selected photos currently live in (excluded from the list). */
    currentGalleryId: number;
    /** Photo ids to move. */
    imageIds: number[];
    onClose: () => void;
    /** Called after the photos were moved into the chosen album. */
    onMoved: () => void;
}

/**
 * Pick a destination album for a set of selected photos. Because a photo belongs
 * to exactly one album, adding to an album moves it out of its current one.
 */
export const MoveToAlbumModal: React.FC<MoveToAlbumModalProps> = ({
    libraryId, currentGalleryId, imageIds, onClose, onMoved,
}) => {
    const [albums, setAlbums] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [target, setTarget] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        mediaService.galleries(libraryId)
            .then((all) => { if (alive) setAlbums(all.filter((a) => a.id !== currentGalleryId)); })
            .catch(console.error)
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [libraryId, currentGalleryId]);

    const confirm = async () => {
        if (target == null || imageIds.length === 0) return;
        setBusy(true);
        setError(null);
        try {
            await mediaService.addImagesToGallery(target, imageIds);
            onMoved();
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to add photos to album');
            setBusy(false);
        }
    };

    return (
        <GlassModal
            isOpen
            onClose={onClose}
            surfaceOpacity={0.9}
            title={`Add ${imageIds.length} ${imageIds.length === 1 ? 'photo' : 'photos'} to album`}
            footer={
                <div className="flex items-center justify-end gap-3">
                    <GlassButton onClick={onClose} disabled={busy}>Cancel</GlassButton>
                    <GlassButton
                        variant="primary"
                        onClick={confirm}
                        disabled={busy || target == null}
                    >
                        {busy ? 'Adding…' : 'Add to album'}
                    </GlassButton>
                </div>
            }
        >
            <GlassText variant="muted" className="text-xs mb-4 block">
                Photos will move out of their current album.
            </GlassText>

            <div className="max-h-[55vh] overflow-y-auto scrollbar-hide">
                {loading ? (
                    <div className="flex justify-center py-16"><GlassSpinner size={32} /></div>
                ) : albums.length === 0 ? (
                    <GlassText variant="muted" className="block text-center py-16">
                        No other albums in this library. Create one first.
                    </GlassText>
                ) : (
                    <div className="space-y-2">
                        {albums.map((a) => {
                            const isSel = target === a.id;
                            const thumb = a.thumbs?.[0] || a.poster_url;
                            return (
                                <GlassButton
                                    key={a.id}
                                    variant="ghost"
                                    onClick={() => setTarget(a.id)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-colors text-left ${
                                        isSel
                                            ? 'border-primary bg-primary/10'
                                            : 'border-white/10 hover:bg-white/5'
                                    }`}
                                >
                                    <span className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                                        {thumb
                                            ? <img src={resolveImageUrl(thumb)} alt="" className="w-full h-full object-cover" />
                                            : <span style={{ opacity: 0.4 }}>🖼️</span>}
                                    </span>
                                    <span className="text-sm text-primary font-label truncate">{a.title}</span>
                                </GlassButton>
                            );
                        })}
                    </div>
                )}
                {error && <p className="text-sm mt-3" style={{ color: 'var(--color-error, #ff6b6b)' }}>{error}</p>}
            </div>
        </GlassModal>
    );
};
