import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassDropdown, GlassHeading } from '@knp-org/liquid-glass-ui';
import { AddLibraryModal, EditLibraryModal } from '@/features/library';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { Film, Tv, Music, BookOpen, Trash2, RefreshCw, Scan, Edit2 } from 'lucide-react';
import { Library } from '@/types';
import { libraryService } from '@/services';

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

    const handleScan = async (id: number) => {
        setScanningLibraryId(id);
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

    const libraryIcon = (type: Library['library_type']) =>
        type === 'movies' ? <Film size={20} /> :
            type === 'tv_shows' ? <Tv size={20} /> :
                type === 'books' ? <BookOpen size={20} /> : <Music size={20} />;

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
                    <GlassHeading size="medium" className="font-heading">Library Management</GlassHeading>
                    <GlassButton variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>Add Library</GlassButton>
                </div>
                <div className="space-y-4">
                    {libraries.length === 0 ? (
                        <div className="text-center py-12 text-outline-variant font-body">
                            No libraries found. Add one to get started.
                        </div>
                    ) : (
                        libraries.map((lib) => {
                            const busy = scanningLibraryId === lib.id || refreshingLibraryId === lib.id;
                            return (
                                <GlassCard key={lib.id} className="flex items-center justify-between p-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-outline flex items-center justify-center text-xl text-primary">
                                            {libraryIcon(lib.library_type)}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-primary font-heading">{lib.name}</div>
                                            <div className="text-xs text-outline-variant font-label">
                                                {lib.paths && lib.paths.length > 0
                                                    ? lib.paths.length === 1
                                                        ? lib.paths[0]
                                                        : `${lib.paths[0]} +${lib.paths.length - 1} more`
                                                    : 'No folders'}
                                            </div>
                                        </div>
                                    </div>
                                    {busy ? (
                                        <span className="text-xs text-primary font-label animate-pulse mr-4">
                                            {scanningLibraryId === lib.id ? 'Scanning...' : 'Refreshing...'}
                                        </span>
                                    ) : (
                                        <GlassDropdown
                                            label="Manage"
                                            items={[
                                                {
                                                    label: <span className="flex items-center gap-2"><Scan size={16} /> Scan Files</span>,
                                                    onClick: () => handleScan(lib.id),
                                                },
                                                {
                                                    label: <span className="flex items-center gap-2"><RefreshCw size={16} /> Refresh Metadata</span>,
                                                    onClick: () => handleRefresh(lib.id),
                                                },
                                                { label: '', isSeparator: true },
                                                {
                                                    label: <span className="flex items-center gap-2"><Edit2 size={16} /> Edit Library</span>,
                                                    onClick: () => handleEditClick(lib),
                                                },
                                                {
                                                    label: <span className="flex items-center gap-2 text-error"><Trash2 size={16} /> Delete Library</span>,
                                                    onClick: () => handleDeleteClick(lib.id),
                                                },
                                            ]}
                                        />
                                    )}
                                </GlassCard>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
};
