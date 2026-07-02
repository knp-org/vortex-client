import React, { useEffect } from 'react';
import { PlayerControls } from './PlayerControls';
import { OverlayWindowControls } from './OverlayWindowControls';
import { useMpvPlayerBackend } from '../backends/useMpvPlayerBackend';

/**
 * Transparent, always-on-top overlay window that renders the player controls
 * over the mpv video (which is embedded in the main window). It drives mpv via
 * the `mpv_command` IPC command and polls `mpv_state` for playback state.
 */
export const MpvOverlay: React.FC<{ id?: string }> = ({ id }) => {
    const backend = useMpvPlayerBackend(id);

    useEffect(() => {
        const prev = {
            html: document.documentElement.style.background,
            body: document.body.style.background,
        };
        document.documentElement.style.background = 'transparent';
        document.body.style.background = 'transparent';
        const root = document.getElementById('root');
        if (root) root.style.background = 'transparent';
        return () => {
            document.documentElement.style.background = prev.html;
            document.body.style.background = prev.body;
        };
    }, []);

    return (
        <div
            className="fixed inset-0 select-none"
            style={{ background: 'transparent' }}
            onMouseMove={backend.onInteraction}
            onClick={backend.onInteraction}
        >
            <PlayerControls
                {...backend}
                overlayMode
                seekOnRelease
            />

            {/* Window controls (min/max/close). The overlay hides the main
                window's Titlebar, so surface them here and drive the main
                window. Kept above the auto-hiding player controls. */}
            <div className="absolute top-2 right-2 z-30">
                <OverlayWindowControls onClose={backend.onBack} />
            </div>
        </div>
    );
};
