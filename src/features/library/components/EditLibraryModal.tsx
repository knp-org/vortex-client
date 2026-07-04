import React, { useState, useEffect } from 'react';
import { GlassModal, GlassButton, GlassInput, GlassSelect, GlassToggle, GlassAlert, GlassCard } from '@knp-org/liquid-glass-ui';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { MultiDirectoryPicker } from '@/shared/ui/MultiDirectoryPicker';
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

    return (
        <GlassModal isOpen={isOpen} onClose={onClose} title="Edit Library" className="max-w-md library-modal-blur" footer={null}>
            {error && (
                <GlassAlert variant="error" className="mb-4">{error}</GlassAlert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <GlassInput
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                {isBooks && (
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

                <div className="border-t border-outline pt-4 mt-4">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <span className="text-sm font-label text-primary">Override Metadata Providers</span>
                        <GlassToggle checked={overrideProviders} onChange={(e) => setOverrideProviders(e.target.checked)} />
                    </div>

                    {overrideProviders && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {providers.map((p, idx) => {
                                const info = allProviders.find(a => a.id === p.provider_id);
                                return (
                                    <GlassCard key={p.provider_id} className="flex items-center justify-between p-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex flex-col gap-0.5">
                                                <button type="button" onClick={() => moveProvider(idx, -1)} disabled={idx === 0} className="text-outline-variant hover:text-primary disabled:opacity-20 p-0.5"><ChevronUp size={14} /></button>
                                                <button type="button" onClick={() => moveProvider(idx, 1)} disabled={idx === providers.length - 1} className="text-outline-variant hover:text-primary disabled:opacity-20 p-0.5"><ChevronDown size={14} /></button>
                                            </div>
                                            <span className="text-sm text-primary font-body">{info?.name || p.provider_id}</span>
                                        </div>
                                        <GlassToggle checked={p.enabled} onChange={() => toggleProvider(p.provider_id)} />
                                    </GlassCard>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <GlassButton type="button" onClick={onClose}>
                        Cancel
                    </GlassButton>
                    <GlassButton variant="primary" type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </GlassButton>
                </div>
            </form>
        </GlassModal>
    );
};
