import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { api } from '../../services';
import { Folder, Plus, X } from 'lucide-react';

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
            <label className="text-sm font-medium text-gray-300 ml-1">Library Folders</label>

            {values.length > 0 && (
                <div className="space-y-2">
                    {values.map((path) => (
                        <div
                            key={path}
                            className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl"
                        >
                            <div className="flex items-center space-x-2 min-w-0">
                                <Folder size={16} className="text-cyan-400 shrink-0" />
                                <span className="text-sm text-gray-300 font-mono truncate">{path}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removePath(path)}
                                className="p-1 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                                aria-label="Remove folder"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Button type="button" variant="secondary" onClick={() => setIsOpen(true)} className="w-full">
                <span className="flex items-center justify-center space-x-2">
                    <Plus size={16} />
                    <span>Add Folder</span>
                </span>
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-gray-900/95 border-white/10 shadow-2xl overflow-hidden rounded-3xl !p-0">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h3 className="font-bold text-white">Select Folder</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                                ✕
                            </button>
                        </div>

                        <div className="p-3 bg-black/20 flex items-center space-x-2">
                            <Button size="sm" variant="secondary" onClick={handleUpClick} disabled={isLoading}>
                                ⬆ Up
                            </Button>
                            <div className="text-xs font-mono text-gray-300 truncate flex-1 bg-black/30 p-2 rounded-xl">
                                {currentPath}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[300px]">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    Loading...
                                </div>
                            ) : (
                                entries.map((entry) => (
                                    <div
                                        key={entry.path}
                                        onClick={() => handleEntryClick(entry)}
                                        className="flex items-center p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-colors group"
                                    >
                                        <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📁</span>
                                        <span className="text-gray-200 text-sm font-medium select-none truncate">
                                            {entry.name}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-white/10 flex justify-end space-x-3">
                            <Button variant="secondary" onClick={() => setIsOpen(false)} className="rounded-2xl">
                                Cancel
                            </Button>
                            <Button onClick={() => addPath(currentPath)} className="rounded-2xl">
                                Add This Folder
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
