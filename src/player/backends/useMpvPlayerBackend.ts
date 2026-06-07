import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { emit } from '@tauri-apps/api/event';
import { api } from '../../services';
import { useMediaTitle } from '../hooks/useMediaTitle';
import { useAutoHideControls } from '../hooks/useAutoHideControls';
import { usePlayerKeyboard } from '../hooks/usePlayerKeyboard';

interface MpvSnapshot {
    time: number;
    duration: number;
    paused: boolean;
    volume: number;
    aid: number | boolean | null;
    sid: number | boolean | null;
}

export const useMpvPlayerBackend = (mediaId?: string) => {
    const title = useMediaTitle(mediaId);

    const [paused, setPaused] = useState(false);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const lastTimeRef = useRef(0);
    const lastDurationRef = useRef(0);
    const exitedRef = useRef(false);
    const seekingRef = useRef(false);

    const { showControls, resetControlsTimeout } = useAutoHideControls(!paused, {
        hideDelayMs: 3500,
        hideWhilePaused: true,
    });

    const saveProgress = useCallback(() => {
        const pos = Math.floor(lastTimeRef.current);
        const total = Math.floor(lastDurationRef.current);
        if (mediaId && pos > 5 && total > 0) {
            api.post(`/media/${mediaId}/progress`, { position: pos, total_duration: total }).catch(() => {});
        }
    }, [mediaId]);

    const handleExit = useCallback(async () => {
        if (exitedRef.current) return;
        exitedRef.current = true;
        saveProgress();
        try { await invoke('mpv_stop'); } catch { /* already gone */ }
        try { await emit('mpv-closed'); } catch { /* no listener */ }
        try { await getCurrentWindow().close(); } catch { /* ignore */ }
    }, [saveProgress]);

    useEffect(() => {
        const poll = window.setInterval(async () => {
            try {
                const s = await invoke<MpvSnapshot>('mpv_state');
                lastTimeRef.current = s.time;
                lastDurationRef.current = s.duration;
                if (!seekingRef.current) setTime(s.time);
                setDuration(s.duration);
                setPaused(s.paused);
                setVolume(Math.min(1, Math.max(0, s.volume / 100)));
                setMuted(s.volume <= 0);
                if (s.time > 5 && s.duration > 0 && Math.floor(s.time) % 10 === 0) saveProgress();
            } catch {
                clearInterval(poll);
                handleExit();
            }
        }, 500);
        return () => clearInterval(poll);
    }, [handleExit, saveProgress]);

    const cmd = (...args: (string | number | boolean)[]) =>
        invoke('mpv_command', { args }).catch((e) => console.error('mpv_command failed', args, e));

    const onPlayPause = useCallback(() => {
        setPaused((p) => {
            const next = !p;
            cmd('set_property', 'pause', next);
            return next;
        });
    }, []);

    const onSeekCommit = useCallback((t: number) => {
        seekingRef.current = false;
        setTime(t);
        lastTimeRef.current = t;
        cmd('seek', t, 'absolute');
    }, []);

    const onSeekPreview = useCallback((t: number) => {
        seekingRef.current = true;
        setTime(t);
    }, []);

    const onSkip = useCallback((delta: number) => {
        const next = Math.max(0, Math.min(duration || 0, lastTimeRef.current + delta));
        onSeekCommit(next);
    }, [duration, onSeekCommit]);

    const onVolumeChange = useCallback((v: number) => {
        setVolume(v);
        setMuted(v <= 0);
        cmd('set_property', 'volume', Math.round(v * 100));
    }, []);

    const onToggleMute = useCallback(() => {
        setMuted((m) => {
            const next = !m;
            cmd('set_property', 'mute', next);
            return next;
        });
    }, []);

    const onToggleFullscreen = useCallback(async () => {
        setIsFullscreen((prev) => {
            const next = !prev;
            void (async () => {
                try {
                    const main = await WebviewWindow.getByLabel('main');
                    if (main) await main.setFullscreen(next);
                    await getCurrentWindow().setFullscreen(next);
                } catch (e) {
                    console.error('fullscreen toggle failed', e);
                }
            })();
            return next;
        });
    }, []);

    const onBack = handleExit;
    const onInteraction = resetControlsTimeout;
    const onSeek = onSeekCommit;

    const keyboardActions = useMemo(
        () => ({
            onPlayPause,
            onSkip,
            onVolumeChange,
            onToggleMute,
            onToggleFullscreen,
            onBack,
            onInteraction,
        }),
        [onPlayPause, onSkip, onVolumeChange, onToggleMute, onToggleFullscreen, onBack, onInteraction],
    );

    usePlayerKeyboard({
        playing: !paused,
        muted,
        isFullscreen,
        duration,
        volume,
        actions: keyboardActions,
        exitOnEscape: true,
    });

    return {
        playing: !paused,
        currentTime: time,
        duration,
        volume,
        muted,
        isFullscreen,
        title,
        showControls,
        onPlayPause,
        onSeek,
        onSeekPreview,
        onSeekCommit,
        onSkip,
        onVolumeChange,
        onToggleMute,
        onToggleFullscreen,
        onBack,
        onInteraction,
    };
};
