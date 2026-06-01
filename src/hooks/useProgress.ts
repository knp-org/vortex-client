import { useEffect, useRef, RefObject } from 'react';

interface UseProgressOptions {
    mediaId: string | undefined;
    videoRef: RefObject<HTMLVideoElement>;
    isPlaying: boolean;
    saveInterval?: number; // ms, default 10000
}

export function useProgress({
    mediaId,
    videoRef,
    isPlaying,
    saveInterval = 10000,
}: UseProgressOptions): void {
    const isPlayingRef = useRef(isPlaying);
    isPlayingRef.current = isPlaying;

    useEffect(() => {
        if (!mediaId) return;

        const intervalId = window.setInterval(() => {
            if (videoRef.current && isPlayingRef.current) {
                const position = Math.floor(videoRef.current.currentTime);
                const total = Math.floor(videoRef.current.duration) || 0;

                if (position > 0 && total > 0) {
                    fetch(`/api/v1/media/${mediaId}/progress`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ position, total_duration: total }),
                    }).catch(console.error);
                }
            }
        }, saveInterval);

        return () => clearInterval(intervalId);
    }, [mediaId, saveInterval, videoRef]);

    // Save progress on unmount using sendBeacon
    useEffect(() => {
        return () => {
            if (videoRef.current && mediaId) {
                const position = Math.floor(videoRef.current.currentTime);
                const total = Math.floor(videoRef.current.duration) || 0;

                if (position > 0 && total > 0) {
                    navigator.sendBeacon(
                        `/api/v1/media/${mediaId}/progress`,
                        JSON.stringify({ position, total_duration: total })
                    );
                }
            }
        };
    }, [mediaId, videoRef]);
}
