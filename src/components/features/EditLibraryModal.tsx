import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { MultiDirectoryPicker } from '../common/MultiDirectoryPicker';
import { libraryService } from '../../services';
import type { Library } from '../../types';
import { READING_MODE_OPTIONS, DEFAULT_READING_MODE } from '../../constants/reading';

interface EditLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    library: Pick<Library, 'id' | 'name' | 'paths' | 'library_type' | 'default_reading_mode'> | null;
}

export const EditLibraryModal: React.FC<EditLibraryModalProps> = ({ isOpen, onClose, onSuccess, library }) => {
    const [name, setName] = useState('');
    const [paths, setPaths] = useState<string[]>([]);
    const [readingMode, setReadingMode] = useState<string>(DEFAULT_READING_MODE);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isBooks = library?.library_type === 'books';

    useEffect(() => {
        if (library) {
            setName(library.name);
            setPaths(library.paths ?? []);
            setReadingMode(library.default_reading_mode ?? DEFAULT_READING_MODE);
        }
    }, [library]);

    if (!isOpen || !library) return null;

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
            await libraryService.update(library.id, {
                name,
                paths,
                ...(isBooks ? { default_reading_mode: readingMode } : {}),
            });
            onSuccess();
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Network Error";
            setError(message || "Failed to update library.");
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md p-4">
                <Card className="bg-gray-900/90 border-white/10 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6">Edit Library</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        {isBooks && (
                            <Select
                                label="Default Reading Mode"
                                value={readingMode}
                                onChange={setReadingMode}
                                options={READING_MODE_OPTIONS.map(o => ({ id: o.id, label: o.label }))}
                            />
                        )}

                        <MultiDirectoryPicker
                            values={paths}
                            onChange={setPaths}
                        />

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button type="button" variant="secondary" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>,
        document.body
    );
};
