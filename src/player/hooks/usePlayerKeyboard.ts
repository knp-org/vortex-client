import { useEffect } from 'react';
import type { PlayerControlActions } from '../types';

interface PlayerKeyboardOptions {
    playing: boolean;
    muted: boolean;
    isFullscreen: boolean;
    duration: number;
    volume: number;
    actions: Pick<
        PlayerControlActions,
        'onPlayPause' | 'onSkip' | 'onVolumeChange' | 'onToggleMute' | 'onToggleFullscreen' | 'onBack' | 'onInteraction'
    >;
    /** When false, Escape navigates back only if not fullscreen (web player). */
    exitOnEscape?: boolean;
}

export const usePlayerKeyboard = ({
    playing,
    muted,
    isFullscreen,
    duration,
    volume,
    actions,
    exitOnEscape = false,
}: PlayerKeyboardOptions) => {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            actions.onInteraction();
            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    actions.onPlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    actions.onSkip(-10);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    actions.onSkip(10);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    actions.onVolumeChange(Math.min(1, volume + 0.05));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    actions.onVolumeChange(Math.max(0, volume - 0.05));
                    break;
                case 'f':
                    e.preventDefault();
                    actions.onToggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    actions.onToggleMute();
                    break;
                case 'Escape':
                    if (exitOnEscape || !isFullscreen) {
                        actions.onBack();
                    }
                    break;
                case 'q':
                    if (exitOnEscape) actions.onBack();
                    break;
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [playing, muted, isFullscreen, duration, volume, actions, exitOnEscape]);
};
