import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Card } from './Card';

interface DirectoryEntry {
    name: string;
    path: string;
}

interface DirectoryPickerProps {
    value: string;
    onChange: (path: string) => void;
}

export const DirectoryPicker: React.FC<DirectoryPickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPath, setCurrentPath] = useState(value || (navigator.userAgent.includes("Windows") ? 'C:\\' : '/'));
    const [entries, setEntries] = useState<DirectoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDirectories = async (path: string) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/v1/directories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path })
            });
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
                setCurrentPath(path);
            }
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
        // Simple parent resolution
        const separator = currentPath.includes('\\') ? '\\' : '/';
        const parts = currentPath.split(separator).filter(p => p);
        parts.pop();
        const parent = parts.length === 0 ? separator : (separator === '/' ? '/' : '') + parts.join(separator);

        // Handle Windows root edge case better if needed, but basic string manip works for many cases
        // ideally use a more robust path joiner but for now:
        fetchDirectories(parent || separator);
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Library Path</label>
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={value}
                    readOnly
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 cursor-not-allowed focus:outline-none"
                    placeholder="Select a folder..."
                />
                <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
                    Browse
                </Button>
            </div>

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
                            <Button onClick={() => {
                                onChange(currentPath);
                                setIsOpen(false);
                            }} className="rounded-2xl">
                                Select Current Folder
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
