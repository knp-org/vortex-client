import { useEffect, useRef, RefObject } from 'react';
import { api, resolveUrl, withAuthToken } from '../services';

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
                    api.post(`/media/${mediaId}/progress`, { position, total_duration: total })
                        .catch(console.error);
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
                    // sendBeacon can't set an Authorization header, so pass the token in the URL.
                    const data = new Blob(
                        [JSON.stringify({ position, total_duration: total })],
                        { type: 'application/json' }
                    );
                    navigator.sendBeacon(withAuthToken(resolveUrl(`/api/v1/media/${mediaId}/progress`)), data);
                }
            }
        };
    }, [mediaId, videoRef]);
}
