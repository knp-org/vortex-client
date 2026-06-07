import React, { useEffect } from 'react';
import { PlayerControls, useMpvPlayerBackend } from '../player';

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
        </div>
    );
};
