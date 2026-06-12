import { useEffect, useRef } from 'react';
import type { PlayerControlActions } from '../types';
import { api } from '@/services';
import type { Setting } from '@/types/settings';

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
    const skipTimes = useRef({ fwd: 10, bwd: 10 });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await api.get<Setting[]>('/settings');
                const pSettings = data.find(s => s.key === 'player_settings');
                if (pSettings) {
                    const parsed = JSON.parse(pSettings.value);
                    if (parsed.skipForwardTime) skipTimes.current.fwd = parsed.skipForwardTime;
                    if (parsed.skipBackwardTime) skipTimes.current.bwd = parsed.skipBackwardTime;
                }
            } catch (e) {}
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            actions.onInteraction();
            
            const skipFwd = skipTimes.current.fwd;
            const skipBwd = skipTimes.current.bwd;

            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    actions.onPlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    actions.onSkip(-skipBwd);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    actions.onSkip(skipFwd);
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
