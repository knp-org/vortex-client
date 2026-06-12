import { useCallback, useEffect, useRef, useState } from 'react';

interface AutoHideOptions {
    hideDelayMs?: number;
    /** When true, controls auto-hide even while paused (mpv overlay). */
    hideWhilePaused?: boolean;
}

export const useAutoHideControls = (
    playing: boolean,
    options: number | AutoHideOptions = 3000,
) => {
    const hideDelayMs = typeof options === 'number' ? options : options.hideDelayMs ?? 3000;
    const hideWhilePaused = typeof options === 'object' ? options.hideWhilePaused ?? false : false;

    const [showControls, setShowControls] = useState(true);
    const timeoutRef = useRef<number | null>(null);

    const resetControlsTimeout = useCallback(() => {
        setShowControls(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (hideWhilePaused || playing) {
            timeoutRef.current = window.setTimeout(() => setShowControls(false), hideDelayMs);
        }
    }, [playing, hideDelayMs, hideWhilePaused]);

    useEffect(() => {
        resetControlsTimeout();
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [playing, resetControlsTimeout]);

    return { showControls, resetControlsTimeout };
};
