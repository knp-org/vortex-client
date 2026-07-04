import React, { useState } from 'react';
import { GlassModal, GlassInput, GlassTextarea, GlassButton } from '@knp-org/liquid-glass-ui';
import { mediaService } from '@/services';

interface CreateGalleryModalProps {
    libraryId: number;
    onClose: () => void;
    /** Called with the new gallery id after creation. */
    onCreated: (id: number) => void;
}

/** Create a new photo album (gallery) in an Images library. */
export const CreateGalleryModal: React.FC<CreateGalleryModalProps> = ({ libraryId, onClose, onCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const create = async () => {
        const trimmed = name.trim();
        if (!trimmed) { setError('Name cannot be empty'); return; }
        setBusy(true);
        setError(null);
        try {
            const { id } = await mediaService.createGallery({
                library_id: libraryId,
                name: trimmed,
                description: description.trim() || undefined,
            });
            onCreated(id);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create album');
            setBusy(false);
        }
    };

    return (
        <GlassModal
            isOpen
            onClose={onClose}
            title="New Album"
            footer={
                <div className="flex justify-end gap-3">
                    <GlassButton onClick={onClose} disabled={busy}>Cancel</GlassButton>
                    <GlassButton variant="primary" onClick={create} disabled={busy}>Create</GlassButton>
                </div>
            }
        >
            <div className="space-y-4">
                <GlassInput
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Album name"
                    autoFocus
                />
                <GlassTextarea
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                />
                {error && <p className="text-sm" style={{ color: 'var(--color-error, #ff6b6b)' }}>{error}</p>}
            </div>
        </GlassModal>
    );
};
