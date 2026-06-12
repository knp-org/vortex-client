import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { usePlatform } from '@/hooks/usePlatform';

export const WindowControls: React.FC = () => {
    const { isTauri } = usePlatform();
    const [isMaximized, setIsMaximized] = useState(false);

    const isLinux = typeof window !== 'undefined' && 
        (navigator.platform?.toLowerCase().includes('linux') || 
         navigator.userAgent?.toLowerCase().includes('linux'));

    const appWindow = getCurrentWindow();

    useEffect(() => {
        if (!isTauri) return;

        // Automatically disable decorations on Linux to support custom controls
        if (isLinux) {
            appWindow.setDecorations(false).catch(err => {
                console.error("Failed to disable decorations on Linux", err);
            });
        }

        // Track maximize state
        const checkMaximized = async () => {
            try {
                const max = await appWindow.isMaximized();
                setIsMaximized(max);
            } catch (err) {
                console.error("Failed to check if window is maximized", err);
            }
        };

        checkMaximized();

        // Listen for resizing to keep status in sync
        const unlistenPromise = appWindow.onResized(() => {
            checkMaximized();
        });

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [isTauri, isLinux, appWindow]);

    if (!isTauri) return null;

    if (isLinux) {
        return (
            <div className="flex items-center space-x-1 z-50">
                {/* Minimize */}
                <button
                    onClick={() => appWindow.minimize()}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-150 cursor-pointer"
                    title="Minimize"
                    aria-label="Minimize window"
                >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>

                {/* Maximize / Restore */}
                <button
                    onClick={() => appWindow.toggleMaximize()}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-150 cursor-pointer"
                    title={isMaximized ? "Restore" : "Maximize"}
                    aria-label={isMaximized ? "Restore window" : "Maximize window"}
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
                    onClick={() => appWindow.close()}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-500 hover:text-white transition-all duration-150 cursor-pointer"
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
    }

    // Default macOS style traffic lights for other platforms
    return (
        <div className="flex items-center space-x-2 p-2 z-50">
            <button
                onClick={() => appWindow.minimize()}
                className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-300 transition-colors cursor-pointer"
                aria-label="Minimize"
            />
            <button
                onClick={() => appWindow.toggleMaximize()}
                className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-300 transition-colors cursor-pointer"
                aria-label="Maximize"
            />
            <button
                onClick={() => appWindow.close()}
                className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-300 transition-colors cursor-pointer"
                aria-label="Close"
            />
        </div>
    );
};

