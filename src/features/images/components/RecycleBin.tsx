import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    GlassButton, GlassSpinner, GlassEmptyState, GlassPhotoGrid, GlassModal, GlassText,
    IconArrowLeft, IconCheck, IconTrash, IconClose, IconSync,
    type GlassPhotoItem,
} from '@knp-org/liquid-glass-ui';
import { MainLayout } from '@/app/layout/MainLayout';
import { resolveImageUrl, mediaService, libraryService } from '@/services';
import type { Photo } from '@/types';

/** A pending destructive action awaiting confirmation in the modal. */
interface Pending {
    message: string;
    confirmLabel: string;
    run: () => Promise<void>;
}

/**
 * Recycle bin for an Images library: photos removed from their album that have
 * not been permanently deleted. Photos can be restored (back to the album they
 * came from) or deleted forever.
 */
export const RecycleBin: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [photos, setPhotos] = useState<Photo[]>([]);
    const [libraryName, setLibraryName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [busy, setBusy] = useState(false);
    const [pending, setPending] = useState<Pending | null>(null);

    const load = React.useCallback(() => {
        if (!id) return;
        setLoading(true);
        mediaService.trashedImages(id)
            .then(setPhotos)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!id) return;
        libraryService.getAll()
            .then((libs) => setLibraryName(libs.find((l) => l.id === parseInt(id))?.name ?? ''))
            .catch(console.error);
    }, [id]);

    const items: GlassPhotoItem[] = useMemo(
        () => photos.map((p) => ({
            id: p.id,
            thumbUrl: resolveImageUrl(p.thumb_url),
            url: resolveImageUrl(p.url),
            title: p.title,
            width: p.width,
            height: p.height,
        })),
        [photos],
    );

    const toggleSelect = (photoId: number | string) => {
        const numId = Number(photoId);
        setSelected((prev) => prev.includes(numId) ? prev.filter((x) => x !== numId) : [...prev, numId]);
    };

    const exitSelect = () => { setSelectMode(false); setSelected([]); };

    const restoreSelected = async () => {
        if (selected.length === 0) return;
        setBusy(true);
        try {
            await Promise.all(selected.map((pid) => mediaService.restoreImage(pid)));
            exitSelect();
            load();
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(false);
        }
    };

    /** Run a confirmed destructive action, then reset and reload. */
    const runPending = async () => {
        if (!pending) return;
        setBusy(true);
        try {
            await pending.run();
            setPending(null);
            exitSelect();
            load();
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(false);
        }
    };

    const requestDeleteSelected = () => {
        if (selected.length === 0) return;
        const n = selected.length;
        setPending({
            message: `Permanently delete ${n} photo${n === 1 ? '' : 's'}? This cannot be undone.`,
            confirmLabel: 'Delete forever',
            run: () => Promise.all(selected.map((pid) => mediaService.purgeImage(pid))).then(() => undefined),
        });
    };

    const requestEmptyBin = () => {
        if (!id || photos.length === 0) return;
        setPending({
            message: `Permanently delete all ${photos.length} photos in the recycle bin? This cannot be undone.`,
            confirmLabel: 'Empty bin',
            run: () => mediaService.emptyTrash(id).then(() => undefined),
        });
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="min-h-[50vh] flex items-center justify-center">
                    <GlassSpinner size={40} />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                {/* Back */}
                <GlassButton shape="circle" onClick={() => navigate(-1)} aria-label="Back">
                    <IconArrowLeft size={20} glow={false} />
                </GlassButton>

                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                    <div className="w-48 h-48 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.4)] shrink-0 flex items-center justify-center">
                        <span style={{ fontSize: '3rem', opacity: 0.4 }}>🗑️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wider text-muted">Recycle Bin</p>
                        <h1 className="heading-medium" style={{ margin: 0 }}>{libraryName || 'Photos'}</h1>
                        <p className="text-muted mt-2">
                            {photos.length} photo{photos.length === 1 ? '' : 's'}
                            {photos.length > 0 && ' — removed from their album, restorable'}
                        </p>

                        {photos.length > 0 && (
                            <div className="mt-5 flex items-center gap-3 flex-wrap">
                                {!selectMode ? (
                                    <>
                                        <GlassButton onClick={() => setSelectMode(true)}>
                                            <span className="inline-flex items-center gap-2"><IconCheck size={16} glow={false} /> Select</span>
                                        </GlassButton>
                                        <GlassButton variant="danger" onClick={requestEmptyBin} disabled={busy}>
                                            <span className="inline-flex items-center gap-2"><IconTrash size={16} glow={false} /> Empty Bin</span>
                                        </GlassButton>
                                    </>
                                ) : (
                                    <>
                                        <GlassButton
                                            variant="primary"
                                            onClick={restoreSelected}
                                            disabled={busy || selected.length === 0}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <IconSync size={16} glow={false} /> Restore {selected.length || ''}
                                            </span>
                                        </GlassButton>
                                        <GlassButton
                                            variant="danger"
                                            onClick={requestDeleteSelected}
                                            disabled={busy || selected.length === 0}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <IconTrash size={16} glow={false} /> Delete {selected.length || ''} forever
                                            </span>
                                        </GlassButton>
                                        <GlassButton onClick={exitSelect} disabled={busy}>
                                            <span className="inline-flex items-center gap-2"><IconClose size={16} glow={false} /> Done</span>
                                        </GlassButton>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Photos */}
                {photos.length === 0 ? (
                    <GlassEmptyState
                        icon="🗑️"
                        title="Recycle bin is empty"
                        description="Photos you remove from an album appear here, and can be restored."
                    />
                ) : (
                    <GlassPhotoGrid
                        photos={items}
                        selectable={selectMode}
                        selectedIds={selected}
                        onToggleSelect={toggleSelect}
                        onPhotoClick={(i) => selectMode && toggleSelect(items[i].id)}
                    />
                )}
            </div>

            {pending && (
                <GlassModal
                    isOpen
                    onClose={() => !busy && setPending(null)}
                    title="Delete permanently"
                    surfaceOpacity={0.85}
                    footer={
                        <div className="flex justify-end gap-3 w-full">
                            <GlassButton onClick={() => setPending(null)} disabled={busy}>Cancel</GlassButton>
                            <GlassButton variant="danger" onClick={runPending} disabled={busy}>
                                {pending.confirmLabel}
                            </GlassButton>
                        </div>
                    }
                >
                    <GlassText>{pending.message}</GlassText>
                </GlassModal>
            )}
        </MainLayout>
    );
};
