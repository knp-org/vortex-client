import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Toggle } from '@/components/common/Toggle';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { MultiDirectoryPicker } from '@/components/common/MultiDirectoryPicker';
import { libraryService, providerService } from '@/services';
import type { ProviderInfo, LibraryProviderInput } from '@/types/providers';
import type { Library } from '@/types';
import { READING_MODE_OPTIONS, DEFAULT_READING_MODE } from '@/constants/reading';

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

    const [overrideProviders, setOverrideProviders] = useState(false);
    const [providers, setProviders] = useState<LibraryProviderInput[]>([]);
    const [allProviders, setAllProviders] = useState<ProviderInfo[]>([]);

    const isBooks = library?.library_type === 'books';

    useEffect(() => {
        if (library) {
            setName(library.name);
            setPaths(library.paths ?? []);
            setReadingMode(library.default_reading_mode ?? DEFAULT_READING_MODE);

            Promise.all([
                providerService.list(),
                libraryService.getProviders(library.id)
            ]).then(([all, libProviders]) => {
                setAllProviders(all);
                if (libProviders.length > 0) {
                    setOverrideProviders(true);
                    setProviders(libProviders.sort((a, b) => a.priority - b.priority));
                } else {
                    setOverrideProviders(false);
                    setProviders(all.map((p, i) => ({
                        provider_id: p.id,
                        priority: i,
                        enabled: p.enabled
                    })));
                }
            }).catch(console.error);
        }
    }, [library]);

    if (!isOpen || !library) return null;

    const moveProvider = (idx: number, dir: number) => {
        const newProviders = [...providers];
        const swapIdx = idx + dir;
        if (swapIdx >= 0 && swapIdx < newProviders.length) {
            [newProviders[idx], newProviders[swapIdx]] = [newProviders[swapIdx], newProviders[idx]];
            newProviders.forEach((p, i) => p.priority = i);
            setProviders(newProviders);
        }
    };

    const toggleProvider = (id: string) => {
        setProviders(prev => prev.map(p => p.provider_id === id ? { ...p, enabled: !p.enabled } : p));
    };

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

            if (overrideProviders) {
                await libraryService.updateProviders(library.id, providers);
            } else {
                await libraryService.updateProviders(library.id, []);
            }

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md p-4">
                <Card className="bg-surface/80 border-outline backdrop-blur-surface shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <h2 className="text-xl font-bold text-primary font-heading mb-6">Edit Library</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error font-body text-sm">
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

                        <div className="border-t border-outline pt-4 mt-4">
                            <Toggle
                                label="Override Metadata Providers"
                                checked={overrideProviders}
                                onChange={setOverrideProviders}
                                className="mb-4"
                            />

                            {overrideProviders && (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {providers.map((p, idx) => {
                                        const info = allProviders.find(a => a.id === p.provider_id);
                                        return (
                                            <div key={p.provider_id} className="flex items-center justify-between p-3 rounded-xl bg-surface/30 border border-outline">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <button type="button" onClick={() => moveProvider(idx, -1)} disabled={idx === 0} className="text-outline-variant hover:text-primary disabled:opacity-20 text-[10px] leading-none p-0.5">▲</button>
                                                        <button type="button" onClick={() => moveProvider(idx, 1)} disabled={idx === providers.length - 1} className="text-outline-variant hover:text-primary disabled:opacity-20 text-[10px] leading-none p-0.5">▼</button>
                                                    </div>
                                                    <span className="text-sm text-primary font-body">{info?.name || p.provider_id}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleProvider(p.provider_id)}
                                                    className="flex-shrink-0"
                                                >
                                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${p.enabled ? 'bg-primary/20 border-primary' : 'bg-surface/50 border-outline'} border`}>
                                                        <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full shadow-md transition-all ${p.enabled ? 'right-0.5 bg-primary' : 'left-0.5 bg-outline'}`} />
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

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
