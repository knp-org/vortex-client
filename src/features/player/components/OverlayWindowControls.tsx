import React, { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

/**
 * Minimize / maximize / close controls for the transparent mpv overlay window.
 *
 * The overlay covers the main window (which hosts the mpv video + the app's
 * Titlebar), so the app's own window controls are hidden while a video plays.
 * These buttons drive the *main* window instead of the overlay: the existing
 * geometry sync in `openMpvOverlayWindow` mirrors main's move/resize onto the
 * overlay, so maximizing keeps the two aligned. Minimize hides the overlay and
 * minimizes main (restoring main re-shows the overlay via the focus listener in
 * `openMpvOverlayWindow`). Close exits playback through `onClose`.
 */
export const OverlayWindowControls: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        let unlisten: (() => void) | undefined;
        (async () => {
            const main = await WebviewWindow.getByLabel('main');
            if (!main) return;
            try { setIsMaximized(await main.isMaximized()); } catch { /* ignore */ }
            unlisten = await main.onResized(async () => {
                try { setIsMaximized(await main.isMaximized()); } catch { /* ignore */ }
            });
        })();
        return () => { unlisten?.(); };
    }, []);

    const minimize = async () => {
        try {
            await getCurrentWindow().hide();
            const main = await WebviewWindow.getByLabel('main');
            await main?.minimize();
        } catch (err) {
            console.error('Failed to minimize player window', err);
        }
    };

    const toggleMaximize = async () => {
        try {
            const main = await WebviewWindow.getByLabel('main');
            await main?.toggleMaximize();
        } catch (err) {
            console.error('Failed to maximize player window', err);
        }
    };

    return (
        <div className="flex items-center space-x-1 pointer-events-auto">
            {/* Minimize */}
            <button
                onClick={minimize}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-150 cursor-pointer"
                title="Minimize"
                aria-label="Minimize window"
            >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>

            {/* Maximize / Restore */}
            <button
                onClick={toggleMaximize}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-150 cursor-pointer"
                title={isMaximized ? 'Restore' : 'Maximize'}
                aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
            >
                {isMaximized ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 14V4h10M8 8h12v12H8z" />
                    </svg>
                ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                )}
            </button>

            {/* Close */}
            <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-500 hover:text-white transition-all duration-150 cursor-pointer"
                title="Close"
                aria-label="Close window"
            >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    );
};
