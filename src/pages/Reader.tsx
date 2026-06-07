import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, Loader2, Settings2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import ePub from 'epubjs';
import { bookService, type BookInfo } from '../services';
import type { ReadingMode } from '../types';
import { READING_MODE_OPTIONS, DEFAULT_READING_MODE } from '../constants/reading';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const isScrollMode = (m: ReadingMode) => m === 'vertical' || m === 'webtoon';
const isHorizontal = (m: ReadingMode) => m === 'horizontal_ltr' || m === 'horizontal_rtl';

/* ------------------------------------------------------------------ */
/* Paged viewer (shared by CBZ image pages and PDF canvas pages)       */
/* ------------------------------------------------------------------ */

interface PagedViewerProps {
    count: number;
    readingMode: ReadingMode;
    initialPage: number;
    onPageChange: (page: number) => void;
    renderPage: (index: number) => React.ReactNode;
}

export interface PagedViewerHandle {
    next: () => void;
    prev: () => void;
}

const PagedViewer = React.forwardRef<PagedViewerHandle, PagedViewerProps>(
    ({ count, readingMode, initialPage, onPageChange, renderPage }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
        const didInitialScroll = useRef(false);
        const [current, setCurrent] = useState(initialPage);

        const goTo = useCallback((index: number, smooth = true) => {
            const clamped = Math.max(0, Math.min(count - 1, index));
            const el = pageRefs.current[clamped];
            if (el) {
                el.scrollIntoView({
                    behavior: smooth ? 'smooth' : 'auto',
                    block: 'center',
                    inline: 'center',
                });
            }
        }, [count]);

        React.useImperativeHandle(ref, () => ({
            next: () => goTo(current + 1),
            prev: () => goTo(current - 1),
        }), [goTo, current]);

        // Track the most-visible page and report it upward.
        useEffect(() => {
            const root = containerRef.current;
            if (!root) return;
            const observer = new IntersectionObserver(
                (entries) => {
                    let best: { index: number; ratio: number } | null = null;
                    for (const e of entries) {
                        if (!e.isIntersecting) continue;
                        const idx = Number((e.target as HTMLElement).dataset.index);
                        if (!best || e.intersectionRatio > best.ratio) {
                            best = { index: idx, ratio: e.intersectionRatio };
                        }
                    }
                    if (best) {
                        setCurrent(best.index);
                        onPageChange(best.index);
                    }
                },
                { root, threshold: [0.25, 0.5, 0.75] },
            );
            pageRefs.current.forEach((el) => el && observer.observe(el));
            return () => observer.disconnect();
        }, [count, onPageChange]);

        // Jump to the restored page once the pages are laid out.
        useEffect(() => {
            if (didInitialScroll.current || count === 0) return;
            didInitialScroll.current = true;
            if (initialPage > 0) {
                requestAnimationFrame(() => goTo(initialPage, false));
            }
        }, [count, initialPage, goTo]);

        const containerClass = isScrollMode(readingMode)
            ? `flex flex-col items-center overflow-y-auto h-full w-full ${readingMode === 'webtoon' ? 'gap-0' : 'gap-4 py-4'}`
            : 'flex flex-row overflow-x-auto h-full w-full snap-x snap-mandatory';

        return (
            <div
                ref={containerRef}
                dir={readingMode === 'horizontal_rtl' ? 'rtl' : 'ltr'}
                className={`${containerClass} reader-scroll`}
            >
                {Array.from({ length: count }, (_, i) => (
                    <div
                        key={i}
                        data-index={i}
                        ref={(el) => { pageRefs.current[i] = el; }}
                        className={
                            isScrollMode(readingMode)
                                ? `w-full max-w-3xl shrink-0 ${readingMode === 'webtoon' ? '' : ''}`
                                : 'h-full min-w-full shrink-0 snap-center flex items-center justify-center'
                        }
                    >
                        {renderPage(i)}
                    </div>
                ))}
            </div>
        );
    },
);
PagedViewer.displayName = 'PagedViewer';

/* ------------------------------------------------------------------ */
/* PDF page — lazily rendered to a canvas when scrolled into view      */
/* ------------------------------------------------------------------ */

const PdfPage: React.FC<{ doc: pdfjsLib.PDFDocumentProxy; index: number; mode: ReadingMode }> = ({ doc, index, mode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderedRef = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const render = async () => {
            if (renderedRef.current) return;
            renderedRef.current = true;
            const page = await doc.getPage(index + 1);
            const base = page.getViewport({ scale: 1 });
            const targetWidth = Math.min(1000, base.width * 2);
            const scale = (targetWidth / base.width) * (window.devicePixelRatio || 1);
            const viewport = page.getViewport({ scale });
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = '100%';
            canvas.style.maxWidth = `${targetWidth / (window.devicePixelRatio || 1)}px`;
            canvas.style.height = 'auto';
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        };

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    render();
                    observer.disconnect();
                }
            },
            { rootMargin: '400px' },
        );
        observer.observe(canvas);
        return () => observer.disconnect();
    }, [doc, index]);

    return (
        <canvas
            ref={canvasRef}
            className={`bg-white block mx-auto ${isHorizontal(mode) ? 'max-h-full w-auto object-contain' : 'w-full'}`}
            style={{ aspectRatio: '0.7' }}
        />
    );
};

/* ------------------------------------------------------------------ */
/* EPUB viewer — reflowable, rendered by epub.js                       */
/* ------------------------------------------------------------------ */

const EpubViewer: React.FC<{
    id: string;
    readingMode: ReadingMode;
    initialPercent: number;
    onProgress: (percent: number) => void;
    navRef: React.MutableRefObject<{ next: () => void; prev: () => void } | null>;
}> = ({ id, readingMode, initialPercent, onProgress, navRef }) => {
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;
        host.innerHTML = '';

        const book: any = ePub(bookService.fileUrl(id));
        const flow = isScrollMode(readingMode) ? 'scrolled-doc' : 'paginated';
        const rendition = book.renderTo(host, {
            width: '100%',
            height: '100%',
            flow,
            manager: isScrollMode(readingMode) ? 'continuous' : 'default',
            spread: isHorizontal(readingMode) ? 'auto' : 'none',
        });

        navRef.current = {
            next: () => rendition.next(),
            prev: () => rendition.prev(),
        };

        let displayed = false;
        book.ready
            .then(() => book.locations.generate(1200))
            .then(() => {
                const target = initialPercent > 0 ? book.locations.cfiFromPercentage(initialPercent / 100) : undefined;
                return rendition.display(target);
            })
            .then(() => { displayed = true; })
            .catch((e: unknown) => console.error('EPUB load failed', e));

        rendition.on('relocated', (location: any) => {
            if (!displayed) return;
            const pct = location?.start?.percentage;
            if (typeof pct === 'number') onProgress(Math.round(pct * 100));
        });

        return () => {
            navRef.current = null;
            try { rendition.destroy(); book.destroy(); } catch { /* noop */ }
        };
        // Re-create the rendition when the layout-affecting reading mode changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, readingMode]);

    return <div ref={hostRef} className="h-full w-full bg-white" />;
};

/* ------------------------------------------------------------------ */
/* Main reader page                                                    */
/* ------------------------------------------------------------------ */

export const Reader: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [info, setInfo] = useState<BookInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [readingMode, setReadingMode] = useState<ReadingMode>(DEFAULT_READING_MODE);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [initialPage, setInitialPage] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);

    const pagedRef = useRef<PagedViewerHandle>(null);
    const epubNavRef = useRef<{ next: () => void; prev: () => void } | null>(null);
    const lastSaved = useRef<number>(-1);

    // Load book info + restore progress.
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            try {
                const [bookInfo, progress] = await Promise.all([
                    bookService.info(id),
                    bookService.getProgress(id).catch(() => ({ position: 0 })),
                ]);
                if (cancelled) return;
                setInfo(bookInfo);
                setReadingMode(bookInfo.reading_mode ?? DEFAULT_READING_MODE);
                setInitialPage(progress.position || 0);
                setCurrentPage(progress.position || 0);
                if (bookInfo.format === 'cbz' && bookInfo.page_count) {
                    setPageCount(bookInfo.page_count);
                }
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load book');
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    // Load the PDF document for PDF books.
    useEffect(() => {
        if (!id || info?.format !== 'pdf') return;
        let cancelled = false;
        const task = pdfjsLib.getDocument({ url: bookService.fileUrl(id) });
        task.promise
            .then((doc) => {
                if (cancelled) return;
                setPdfDoc(doc);
                setPageCount(doc.numPages);
            })
            .catch((e) => { if (!cancelled) setError(`Failed to load PDF: ${e?.message ?? e}`); });
        return () => { cancelled = true; task.destroy(); };
    }, [id, info?.format]);

    // Persist reading position (deduped) for paged formats.
    const saveProgress = useCallback((page: number) => {
        if (!id) return;
        if (page === lastSaved.current) return;
        lastSaved.current = page;
        const total = info?.format === 'epub' ? 100 : (pageCount || 0);
        bookService.saveProgress(id, page, total).catch(() => { /* best effort */ });
    }, [id, info?.format, pageCount]);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        saveProgress(page);
    }, [saveProgress]);

    // Change + persist the reading mode.
    const changeReadingMode = useCallback((mode: ReadingMode) => {
        setReadingMode(mode);
        setMenuOpen(false);
        if (id) bookService.setReadingMode(id, mode).catch(console.error);
    }, [id]);

    // Keyboard navigation: page turn + escape.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { navigate(-1); return; }
            const next = ['ArrowRight', 'ArrowDown', 'PageDown', ' '];
            const prev = ['ArrowLeft', 'ArrowUp', 'PageUp'];
            if (next.includes(e.key)) {
                e.preventDefault();
                pagedRef.current?.next();
                epubNavRef.current?.next();
            } else if (prev.includes(e.key)) {
                e.preventDefault();
                pagedRef.current?.prev();
                epubNavRef.current?.prev();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [navigate]);

    if (error) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-[#0a0a0f] text-white">
                <p className="text-red-400">{error}</p>
                <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">Go Back</button>
            </div>
        );
    }

    if (!info) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[#0a0a0f] text-white/60">
                <Loader2 className="animate-spin" size={28} />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col bg-[#0a0a0f]">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur border-b border-white/10 text-white z-30">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10" title="Back">
                        <ArrowLeft size={20} />
                    </button>
                    <BookOpen size={18} className="text-cyan-400 shrink-0" />
                    <span className="truncate text-sm font-medium">{info.title ?? 'Reading'}</span>
                </div>

                <div className="flex items-center gap-4">
                    {info.format !== 'epub' && pageCount > 0 && (
                        <span className="text-xs text-gray-400 tabular-nums">
                            {currentPage + 1} / {pageCount}
                        </span>
                    )}
                    <div className="relative">
                        <button onClick={() => setMenuOpen((o) => !o)} className="p-2 rounded-full hover:bg-white/10" title="Reading mode">
                            <Settings2 size={18} />
                        </button>
                        {menuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-52 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-xl z-40">
                                {READING_MODE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => changeReadingMode(opt.id)}
                                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-white/5 ${readingMode === opt.id ? 'text-cyan-400' : 'text-gray-300'}`}
                                    >
                                        <span>{opt.label}</span>
                                        {readingMode === opt.id && <Check size={15} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 relative">
                {info.format === 'cbz' && pageCount > 0 && (
                    <PagedViewer
                        ref={pagedRef}
                        count={pageCount}
                        readingMode={readingMode}
                        initialPage={initialPage}
                        onPageChange={handlePageChange}
                        renderPage={(i) => (
                            <img
                                src={bookService.pageUrl(id!, i)}
                                alt={`Page ${i + 1}`}
                                loading="lazy"
                                className={isHorizontal(readingMode) ? 'max-h-full w-auto object-contain mx-auto' : 'w-full block'}
                            />
                        )}
                    />
                )}

                {info.format === 'pdf' && (
                    pdfDoc && pageCount > 0 ? (
                        <PagedViewer
                            ref={pagedRef}
                            count={pageCount}
                            readingMode={readingMode}
                            initialPage={initialPage}
                            onPageChange={handlePageChange}
                            renderPage={(i) => <PdfPage doc={pdfDoc} index={i} mode={readingMode} />}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-white/50">
                            <Loader2 className="animate-spin" size={26} />
                        </div>
                    )
                )}

                {info.format === 'epub' && id && (
                    <EpubViewer
                        id={id}
                        readingMode={readingMode}
                        initialPercent={initialPage}
                        onProgress={handlePageChange}
                        navRef={epubNavRef}
                    />
                )}
            </div>
        </div>
    );
};
