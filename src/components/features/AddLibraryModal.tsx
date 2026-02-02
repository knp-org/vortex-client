import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { DirectoryPicker } from '../common/DirectoryPicker';
import { Film, Tv, Music, FileQuestion } from 'lucide-react';

interface AddLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const LIBRARY_TYPES = [
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'tv_shows', label: 'TV Shows', icon: Tv },
    { id: 'music_videos', label: 'Music', icon: Music },
    { id: 'other', label: 'Other', icon: FileQuestion },
];

export const AddLibraryModal: React.FC<AddLibraryModalProps> = ({ isOpen, onClose, onSuccess }) => {
    // Platform check removed as it's currently unused here
    const [name, setName] = useState('');
    const [path, setPath] = useState('');
    const [type, setType] = useState('movies');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/v1/libraries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    path,
                    library_type: type
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
                setName('');
                setPath('');
            } else {
                const text = await res.text();
                setError(text || "Failed to create library. Please check the logs.");
                console.error("Failed to create library:", text);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error occurred";
            setError(`Network Error: ${message}`);
            console.error("Error creating library:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md p-4">
                <Card className="bg-gray-900/90 border-white/10 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6">Add New Library</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
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

                        <DirectoryPicker
                            value={path}
                            onChange={setPath}
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
