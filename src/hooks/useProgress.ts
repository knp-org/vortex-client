import { useEffect, useRef, RefObject } from 'react';

interface UseProgressOptions {
    mediaId: string | undefined;
    videoRef: RefObject<HTMLVideoElement>;
    isPlaying: boolean;
    saveInterval?: number; // ms, default 10000
}

/**
 * Hook to save video playback progress periodically and on unmount.
 * Uses sendBeacon for reliable save on page leave.
 */
export function useProgress({
    mediaId,
    videoRef,
    isPlaying,
    saveInterval = 10000,
}: UseProgressOptions): void {
    const progressIntervalRef = useRef<number | null>(null);

    // Save progress periodically while playing
    useEffect(() => {
        if (!mediaId) return;

        progressIntervalRef.current = window.setInterval(() => {
            if (videoRef.current && isPlaying) {
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

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [mediaId, isPlaying, saveInterval, videoRef]);

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
