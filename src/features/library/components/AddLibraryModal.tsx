import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { MultiDirectoryPicker } from '@/shared/ui/MultiDirectoryPicker';
import { libraryService } from '@/services';
import { Film, Tv, Music, Video, FileQuestion, BookOpen } from 'lucide-react';
import { READING_MODE_OPTIONS } from '@/constants/reading';

interface AddLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const LIBRARY_TYPES = [
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'tv_shows', label: 'TV Shows', icon: Tv },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'music_videos', label: 'Music Videos', icon: Video },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'other', label: 'Other', icon: FileQuestion },
];

export const AddLibraryModal: React.FC<AddLibraryModalProps> = ({ isOpen, onClose, onSuccess }) => {
    // Platform check removed as it's currently unused here
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

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md p-4">
                <Card className="bg-surface/80 border-outline backdrop-blur-surface shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <h2 className="text-xl font-bold text-primary font-heading mb-6">Add New Library</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error font-body text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Name"
                            placeholder="e.g., My Movies"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        <Select
                            label="Library Type"
                            value={type}
                            onChange={setType}
                            options={LIBRARY_TYPES}
                        />

                        {type === 'books' && (
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
                                {isLoading ? 'Creating...' : 'Add Library'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>,
        document.body
    );
};
