import React, { useState, useEffect } from 'react';
import { GlassModal, GlassButton, GlassCard } from '@knp-org/liquid-glass-ui';
import { api } from '@/services';
import { Folder, Plus, X, ArrowUp } from 'lucide-react';

interface DirectoryEntry {
    name: string;
    path: string;
}

interface MultiDirectoryPickerProps {
    values: string[];
    onChange: (paths: string[]) => void;
}

export const MultiDirectoryPicker: React.FC<MultiDirectoryPickerProps> = ({ values, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const defaultRoot = navigator.userAgent.includes("Windows") ? 'C:\\' : '/';
    const [currentPath, setCurrentPath] = useState(defaultRoot);
    const [entries, setEntries] = useState<DirectoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDirectories = async (path: string) => {
        setIsLoading(true);
        try {
            const data = await api.post<DirectoryEntry[]>('/directories', { path });
            setEntries(data);
            setCurrentPath(path);
        } catch (error) {
            console.error("Failed to fetch directories", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchDirectories(currentPath);
        }
    }, [isOpen]);

    const handleEntryClick = (entry: DirectoryEntry) => {
        fetchDirectories(entry.path);
    };

    const handleUpClick = () => {
        const separator = currentPath.includes('\\') ? '\\' : '/';
        const parts = currentPath.split(separator).filter(p => p);
        parts.pop();
        const parent = parts.length === 0 ? separator : (separator === '/' ? '/' : '') + parts.join(separator);
        fetchDirectories(parent || separator);
    };

    const addPath = (path: string) => {
        if (path && !values.includes(path)) {
            onChange([...values, path]);
        }
        setIsOpen(false);
    };

    const removePath = (path: string) => {
        onChange(values.filter(p => p !== path));
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-label font-medium text-outline-variant ml-1">Library Folders</label>

            {values.length > 0 && (
                <div className="space-y-2">
                    {values.map((path) => (
                        <GlassCard key={path} className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center space-x-2 min-w-0">
                                <Folder size={16} className="text-primary shrink-0" />
                                <span className="text-sm text-outline-variant font-mono truncate">{path}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removePath(path)}
                                className="p-1 text-outline-variant hover:text-error rounded-lg hover:bg-white/10 transition-colors shrink-0"
                                aria-label="Remove folder"
                            >
                                <X size={16} />
                            </button>
                        </GlassCard>
                    ))}
                </div>
            )}

            <GlassButton type="button" onClick={() => setIsOpen(true)} className="w-full">
                <span className="flex items-center justify-center space-x-2">
                    <Plus size={16} />
                    <span>Add Folder</span>
                </span>
            </GlassButton>

            <GlassModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Select Folder"
                className="max-w-2xl library-modal-blur"
                footer={
                    <div className="flex justify-end space-x-3">
                        <GlassButton onClick={() => setIsOpen(false)}>Cancel</GlassButton>
                        <GlassButton variant="primary" onClick={() => addPath(currentPath)}>Add This Folder</GlassButton>
                    </div>
                }
            >
                <div className="flex items-center space-x-2 mb-3">
                    <GlassButton size="sm" onClick={handleUpClick} disabled={isLoading}>
                        <ArrowUp size={14} className="mr-1" /> Up
                    </GlassButton>
                    <div className="text-xs font-mono text-primary truncate flex-1 bg-surface/50 border border-outline/50 p-2 rounded-xl shadow-inner">
                        {currentPath}
                    </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto space-y-1 min-h-[300px] custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-outline-variant font-body py-12">
                            Loading...
                        </div>
                    ) : (
                        entries.map((entry) => (
                            <div
                                key={entry.path}
                                onClick={() => handleEntryClick(entry)}
                                className="flex items-center p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                            >
                                <Folder size={20} className="mr-3 text-primary group-hover:scale-110 transition-transform shrink-0" />
                                <span className="text-primary text-sm font-body font-medium select-none truncate">
                                    {entry.name}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </GlassModal>
        </div>
    );
};
