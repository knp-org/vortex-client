import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { MultiDirectoryPicker } from '../common/MultiDirectoryPicker';
import { libraryService, providerService } from '../../services';
import type { ProviderInfo, LibraryProviderInput } from '../../types/providers';
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

                        <div className="border-t border-white/10 pt-4 mt-4">
                            <label className="flex items-center space-x-3 mb-4 cursor-pointer w-max">
                                <input
                                    type="checkbox"
                                    checked={overrideProviders}
                                    onChange={(e) => setOverrideProviders(e.target.checked)}
                                    className="rounded border-white/20 bg-black/50 text-cyan-500 focus:ring-cyan-500"
                                />
                                <span className="text-sm font-medium text-white">Override Metadata Providers</span>
                            </label>

                            {overrideProviders && (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {providers.map((p, idx) => {
                                        const info = allProviders.find(a => a.id === p.provider_id);
                                        return (
                                            <div key={p.provider_id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <button type="button" onClick={() => moveProvider(idx, -1)} disabled={idx === 0} className="text-gray-500 hover:text-white disabled:opacity-20 text-[10px] leading-none p-0.5">▲</button>
                                                        <button type="button" onClick={() => moveProvider(idx, 1)} disabled={idx === providers.length - 1} className="text-gray-500 hover:text-white disabled:opacity-20 text-[10px] leading-none p-0.5">▼</button>
                                                    </div>
                                                    <span className="text-sm text-gray-200">{info?.name || p.provider_id}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleProvider(p.provider_id)}
                                                    className="flex-shrink-0"
                                                >
                                                    <div className={`w-9 h-5 rounded-full relative transition-colors ${p.enabled ? 'bg-cyan-500/30' : 'bg-white/10'} border border-white/10`}>
                                                        <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full shadow-md transition-all ${p.enabled ? 'right-0.5 bg-cyan-400' : 'left-0.5 bg-gray-500'}`} />
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
