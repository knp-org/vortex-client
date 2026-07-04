import React, { useState } from 'react';
import { GlassModal, GlassInput, GlassTextarea, GlassButton } from '@knp-org/liquid-glass-ui';
import { mediaService } from '@/services';
import type { GalleryDetail } from '@/types';

interface EditGalleryModalProps {
    gallery: GalleryDetail;
    onClose: () => void;
    /** Called after a successful rename/description edit. */
    onSaved: (patch: { name: string; description?: string }) => void;
    /** Called after the gallery is deleted. */
    onDeleted: () => void;
}

/** Rename / re-describe or delete a photo album (gallery). */
export const EditGalleryModal: React.FC<EditGalleryModalProps> = ({ gallery, onClose, onSaved, onDeleted }) => {
    const [name, setName] = useState(gallery.name);
    const [description, setDescription] = useState(gallery.description ?? '');
    const [busy, setBusy] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const save = async () => {
        const trimmed = name.trim();
        if (!trimmed) { setError('Name cannot be empty'); return; }
        setBusy(true);
        setError(null);
        try {
            await mediaService.updateGallery(gallery.id, { name: trimmed, description });
            onSaved({ name: trimmed, description });
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save');
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        setBusy(true);
        setError(null);
        try {
            await mediaService.deleteGallery(gallery.id);
            onDeleted();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to delete');
            setBusy(false);
        }
    };

    return (
        <GlassModal
            isOpen
            onClose={onClose}
            title="Edit Album"
            footer={
                <div className="flex items-center justify-between gap-4 w-full">
                    <GlassButton variant="danger" onClick={() => setConfirmDelete(true)} disabled={busy}>
                        Delete
                    </GlassButton>
                    <div className="flex gap-3">
                        <GlassButton onClick={onClose} disabled={busy}>Cancel</GlassButton>
                        <GlassButton variant="primary" onClick={save} disabled={busy}>Save</GlassButton>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                <GlassInput
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Album name"
                />
                <GlassTextarea
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                />
                {error && <p className="text-sm" style={{ color: 'var(--color-error, #ff6b6b)' }}>{error}</p>}
                {confirmDelete && (
                    <div className="rounded-lg border border-white/10 p-3 space-y-3" style={{ background: 'rgba(255,80,80,0.08)' }}>
                        <p className="text-sm text-primary">
                            Delete “{gallery.name}”? Its photos are kept but become ungrouped.
                        </p>
                        <div className="flex justify-end gap-3">
                            <GlassButton onClick={() => setConfirmDelete(false)} disabled={busy}>Keep</GlassButton>
                            <GlassButton variant="danger" onClick={remove} disabled={busy}>Delete Album</GlassButton>
                        </div>
                    </div>
                )}
            </div>
        </GlassModal>
    );
};
