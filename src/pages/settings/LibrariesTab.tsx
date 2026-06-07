import React, { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';
import { AddLibraryModal } from '../../components/features/AddLibraryModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { EditLibraryModal } from '../../components/features/EditLibraryModal';
import { Film, Tv, Music, BookOpen, Trash2, MoreVertical, RefreshCw, Scan, Edit2 } from 'lucide-react';
import { Library } from '../../types';
import { libraryService } from '../../services';

export const LibrariesTab: React.FC = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [libraries, setLibraries] = useState<Library[]>([]);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; libraryId: number | null }>({
        isOpen: false,
        libraryId: null
    });
    const [editModal, setEditModal] = useState<{ isOpen: boolean; library: Library | null }>({
        isOpen: false,
        library: null
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [scanningLibraryId, setScanningLibraryId] = useState<number | null>(null);
    const [refreshingLibraryId, setRefreshingLibraryId] = useState<number | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    const fetchLibraries = async () => {
        try {
            const data = await libraryService.getAll();
            setLibraries(data);
        } catch (error) {
            console.error("Failed to fetch libraries", error);
        }
    };

    useEffect(() => {
        fetchLibraries();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        if (openMenuId !== null) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openMenuId]);

    const handleScan = async (id: number) => {
        setScanningLibraryId(id);
        setOpenMenuId(null);
        try {
            await libraryService.scan(id);
            setTimeout(() => setScanningLibraryId(null), 2000);
        } catch (error) {
            console.error("Failed to scan library", error);
            setScanningLibraryId(null);
        }
    };

    const handleRefresh = async (id: number) => {
        setRefreshingLibraryId(id);
        setOpenMenuId(null);
        try {
            await libraryService.refresh(id);
            setTimeout(() => setRefreshingLibraryId(null), 2000);
        } catch (error) {
            console.error("Failed to refresh library", error);
            setRefreshingLibraryId(null);
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteModal({ isOpen: true, libraryId: id });
    };

    const handleEditClick = (library: Library) => {
        setEditModal({ isOpen: true, library });
        setOpenMenuId(null);
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.libraryId) return;
        setIsDeleting(true);
        try {
            await libraryService.delete(deleteModal.libraryId);
            setLibraries(libraries.filter(lib => lib.id !== deleteModal.libraryId));
            setDeleteModal({ isOpen: false, libraryId: null });
        } catch (error) {
            console.error("Error deleting library", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <AddLibraryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchLibraries}
            />
            <EditLibraryModal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ isOpen: false, library: null })}
                onSuccess={fetchLibraries}
                library={editModal.library}
            />
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, libraryId: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Library"
                message="Are you sure you want to delete this library? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                isLoading={isDeleting}
            />

            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">Library Management</h3>
                    <Button size="sm" onClick={() => setIsAddModalOpen(true)}>Add Library</Button>
                </div>
                <div className="space-y-4">
                    {libraries.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            No libraries found. Add one to get started.
                        </div>
                    ) : (
                        libraries.map((lib) => (
                            <div key={lib.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-xl text-cyan-400">
                                        {lib.library_type === 'movies' ? <Film size={20} /> : lib.library_type === 'tv_shows' ? <Tv size={20} /> : lib.library_type === 'books' ? <BookOpen size={20} /> : <Music size={20} />}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-200">{lib.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {lib.paths && lib.paths.length > 0
                                                ? lib.paths.length === 1
                                                    ? lib.paths[0]
                                                    : `${lib.paths[0]} +${lib.paths.length - 1} more`
                                                : 'No folders'}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative" onClick={e => e.stopPropagation()}>
                                    {(scanningLibraryId === lib.id || refreshingLibraryId === lib.id) ? (
                                        <span className="text-xs text-cyan-400 animate-pulse mr-4">
                                            {scanningLibraryId === lib.id ? 'Scanning...' : 'Refreshing...'}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === lib.id ? null : lib.id);
                                            }}
                                            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                    )}

                                    {openMenuId === lib.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                                            <button
                                                onClick={() => handleScan(lib.id)}
                                                className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center space-x-2"
                                            >
                                                <Scan size={16} />
                                                <span>Scan Files</span>
                                            </button>
                                            <button
                                                onClick={() => handleRefresh(lib.id)}
                                                className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center space-x-2"
                                            >
                                                <RefreshCw size={16} />
                                                <span>Refresh Metadata</span>
                                            </button>
                                            <div className="h-px bg-white/5 my-1" />
                                            <button
                                                onClick={() => handleEditClick(lib)}
                                                className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center space-x-2"
                                            >
                                                <Edit2 size={16} />
                                                <span>Edit Library</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setOpenMenuId(null);
                                                    handleDeleteClick(lib.id);
                                                }}
                                                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-400/10 flex items-center space-x-2"
                                            >
                                                <Trash2 size={16} />
                                                <span>Delete Library</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};
