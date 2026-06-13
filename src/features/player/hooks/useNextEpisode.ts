import { useEffect, useState } from 'react';
import { Episode } from '@/types';
import { mediaService } from '@/services';

export interface NextEpisode {
    id: number;
    title: string;
}

/**
 * Resolves the next episode for a TV-show episode being played, so the player
 * can offer a "Next Episode" button near the end. Returns `null` for movies,
 * books, or the last episode of a series.
 *
 * Looks in the current season first, then the first episode of the next
 * non-empty season. Uses the episode's `series_id` (carried on the detail).
 */
export function useNextEpisode(currentId: string | undefined) {
    const [nextEpisode, setNextEpisode] = useState<NextEpisode | null>(null);

    useEffect(() => {
        let cancelled = false;
        setNextEpisode(null);
        if (!currentId) return;

        const resolve = async () => {
            try {
                const ep = await mediaService.episode(currentId);

                // Only TV-show episodes have series context to follow.
                if (ep.series_id == null || ep.season_number == null || ep.episode_number == null) {
                    return;
                }
                const seriesId = ep.series_id;
                const curSeason = ep.season_number;
                const curEp = ep.episode_number;

                const byNumber = (a: Episode, b: Episode) => (a.episode_number ?? 0) - (b.episode_number ?? 0);
                const toNext = (e: Episode): NextEpisode => ({
                    id: e.id,
                    title: e.title || `Episode ${e.episode_number}`,
                });

                // 1. Next episode in the current season.
                const eps = await mediaService.seasonEpisodes(seriesId, curSeason);
                const nextInSeason = [...eps].sort(byNumber).find(e => (e.episode_number ?? 0) > curEp);
                if (nextInSeason) {
                    if (!cancelled) setNextEpisode(toNext(nextInSeason));
                    return;
                }

                // 2. First episode of the next non-empty season.
                const detail = await mediaService.series(seriesId);
                const nextSeason = detail.seasons
                    .filter(s => s.season_number > curSeason && s.episode_count > 0)
                    .sort((a, b) => a.season_number - b.season_number)[0];
                if (!nextSeason) return;

                const nextEps = await mediaService.seasonEpisodes(seriesId, nextSeason.season_number);
                const first = [...nextEps].sort(byNumber)[0];
                if (first && !cancelled) setNextEpisode(toNext(first));
            } catch (e) {
                console.error('Failed to resolve next episode', e);
            }
        };

        resolve();
        return () => { cancelled = true; };
    }, [currentId]);

    return { nextEpisode };
}
