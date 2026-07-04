import React, { useState } from 'react';
import { GlassModal, GlassButton, GlassInput, GlassSelect, GlassAlert } from '@knp-org/liquid-glass-ui';
import { MultiDirectoryPicker } from '@/shared/ui/MultiDirectoryPicker';
import { libraryService } from '@/services';
import { READING_MODE_OPTIONS } from '@/constants/reading';

interface AddLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const LIBRARY_TYPES = [
    { value: 'movies', label: 'Movies' },
    { value: 'tv_shows', label: 'TV Shows' },
    { value: 'music', label: 'Music' },
    { value: 'music_videos', label: 'Music Videos' },
    { value: 'books', label: 'Books' },
    { value: 'images', label: 'Images' },
    { value: 'other', label: 'Other' },
];

export const AddLibraryModal: React.FC<AddLibraryModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [paths, setPaths] = useState<string[]>([]);
    const [type, setType] = useState('movies');
    const [readingMode, setReadingMode] = useState('vertical');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (paths.length === 0) {
            setError("Please add at least one folder.");
            setIsLoading(false);
            return;
        }

        try {
            await libraryService.create({
                name,
                paths,
                library_type: type,
                default_reading_mode: type === 'books' ? readingMode : null,
            });
            onSuccess();
            onClose();
            setName('');
            setPaths([]);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error occurred";
            setError(message || "Failed to create library. Please check the logs.");
            console.error("Error creating library:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GlassModal isOpen={isOpen} onClose={onClose} title="Add New Library" className="max-w-md library-modal-blur" footer={null}>
            {error && (
                <GlassAlert variant="error" className="mb-4">{error}</GlassAlert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <GlassInput
                    label="Name"
                    placeholder="e.g., My Movies"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <GlassSelect
                    label="Library Type"
                    value={type}
                    onChange={setType}
                    options={LIBRARY_TYPES}
                />

                {type === 'books' && (
                    <GlassSelect
                        label="Default Reading Mode"
                        value={readingMode}
                        onChange={setReadingMode}
                        options={READING_MODE_OPTIONS.map(o => ({ value: o.id, label: o.label }))}
                    />
                )}

                <MultiDirectoryPicker
                    values={paths}
                    onChange={setPaths}
                />

                <div className="flex justify-end space-x-3 pt-4">
                    <GlassButton type="button" onClick={onClose}>
                        Cancel
                    </GlassButton>
                    <GlassButton variant="primary" type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Add Library'}
                    </GlassButton>
                </div>
            </form>
        </GlassModal>
    );
};
