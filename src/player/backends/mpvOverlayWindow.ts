import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/dpi';
import { listen } from '@tauri-apps/api/event';

export const openMpvOverlayWindow = async (
    mediaId: string,
    onClosed: () => void,
): Promise<() => void> => {
    const main = getCurrentWindow();
    let pos: PhysicalPosition | null = null;
    let size: PhysicalSize | null = null;
    try { pos = await main.outerPosition(); } catch { /* ignore */ }
    try { size = await main.innerSize(); } catch { /* ignore */ }

    try {
        const existing = await WebviewWindow.getByLabel('mpv-overlay');
        if (existing) await existing.close();
    } catch { /* ignore */ }

    const overlay = new WebviewWindow('mpv-overlay', {
        url: `index.html?mpvOverlay=${mediaId}`,
        transparent: true,
        decorations: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        focus: true,
        width: size ? size.width : 1280,
        height: size ? size.height : 720,
        x: pos ? pos.x : 0,
        y: pos ? pos.y : 0,
    });

    overlay.once('tauri://created', async () => {
        try {
            if (pos) await overlay.setPosition(pos);
            if (size) await overlay.setSize(size);
            await overlay.setAlwaysOnTop(true);
            await overlay.setFocus();
        } catch { /* ignore */ }
    });
    overlay.once('tauri://error', (e) => console.error('overlay window error', e));

    const unMoved = await main.onMoved(({ payload }) => {
        overlay.setPosition(new PhysicalPosition(payload.x, payload.y)).catch(() => {});
    });
    const unResized = await main.onResized(({ payload }) => {
        overlay.setSize(new PhysicalSize(payload.width, payload.height)).catch(() => {});
    });
    const unClosed = await listen('mpv-closed', () => {
        onClosed();
    });

    return () => {
        unMoved();
        unResized();
        unClosed();
    };
};

export const closeMpvOverlayWindow = () => {
    WebviewWindow.getByLabel('mpv-overlay').then((w) => {
        if (w) w.close();
    }).catch(() => {});
};
