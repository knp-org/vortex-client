import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { DirectoryPicker } from '../common/DirectoryPicker';

interface EditLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    library: {
        id: number;
        name: string;
        path: string;
    } | null;
}

export const EditLibraryModal: React.FC<EditLibraryModalProps> = ({ isOpen, onClose, onSuccess, library }) => {
    const [name, setName] = useState('');
    const [path, setPath] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (library) {
            setName(library.name);
            setPath(library.path);
        }
    }, [library]);

    if (!isOpen || !library) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/v1/libraries/${library.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    path
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const text = await res.text();
                setError(text || "Failed to update library.");
            }
        } catch (error) {
            setError("Network Error");
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

                        <DirectoryPicker
                            value={path}
                            onChange={setPath}
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
