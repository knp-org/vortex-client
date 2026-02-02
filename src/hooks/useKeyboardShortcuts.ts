import { useEffect } from 'react';
import { VideoPlayerControls } from './useVideoPlayer';

interface UseKeyboardShortcutsOptions {
    controls: VideoPlayerControls;
    isFullscreen: boolean;
    onEscape?: () => void;
    resetControlsTimeout?: () => void;
}

/**
 * Hook for video player keyboard shortcuts.
 * - Space/K: Play/Pause
 * - Left Arrow: Skip back 10s
 * - Right Arrow: Skip forward 10s
 * - F: Toggle fullscreen
 * - M: Toggle mute
 * - Escape: Exit fullscreen or go back
 */
export function useKeyboardShortcuts({
    controls,
    isFullscreen,
    onEscape,
    resetControlsTimeout,
}: UseKeyboardShortcutsOptions): void {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    controls.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    controls.skip(-10);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    controls.skip(10);
                    break;
                case 'f':
                    e.preventDefault();
                    controls.toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    controls.toggleMute();
                    break;
                case 'Escape':
                    if (!isFullscreen && onEscape) {
                        onEscape();
                    }
                    break;
            }
            resetControlsTimeout?.();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [controls, isFullscreen, onEscape, resetControlsTimeout]);
}
