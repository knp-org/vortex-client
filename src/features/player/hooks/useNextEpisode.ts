import { useEffect, useState } from 'react';
import { Media, Episode, SeriesDetail } from '@/types';
import { api } from '@/services';

export interface NextEpisode {
    id: number;
    title: string;
}

/**
 * Resolves the next episode for a TV-show episode being played, so the player
 * can offer a "Next Episode" button near the end. Returns `null` for movies,
 * books, or the last episode of a series (nothing to play next).
 *
 * Looks for the next episode in the current season first, then falls back to
 * the first episode of the next non-empty season.
 */
export function useNextEpisode(currentId: string | undefined) {
    const [nextEpisode, setNextEpisode] = useState<NextEpisode | null>(null);

    useEffect(() => {
        let cancelled = false;
        setNextEpisode(null);
        if (!currentId) return;

        const resolve = async () => {
            try {
                const media = await api.get<Media>(`/media/${currentId}`);

                // Only TV-show episodes have a next episode.
                const isEpisode =
                    media.media_type === 'episode' ||
                    (!!media.series_name && media.episode_number != null);
                if (
                    !isEpisode ||
                    !media.series_name ||
                    media.season_number == null ||
                    media.episode_number == null
                ) {
                    return;
                }

                const name = encodeURIComponent(media.series_name);
                const curSeason = media.season_number;
                const curEp = media.episode_number;

                const byNumber = (a: Episode, b: Episode) => a.episode_number - b.episode_number;
                const toNext = (e: Episode): NextEpisode => ({
                    id: e.id,
                    title: e.title || `Episode ${e.episode_number}`,
                });

                // 1. Next episode in the current season.
                const eps = await api.get<Episode[]>(`/series/${name}/season/${curSeason}`);
                const nextInSeason = [...eps].sort(byNumber).find(e => e.episode_number > curEp);
                if (nextInSeason) {
                    if (!cancelled) setNextEpisode(toNext(nextInSeason));
                    return;
                }

                // 2. First episode of the next non-empty season.
                const detail = await api.get<SeriesDetail>(`/series/${name}/detail`);
                const nextSeason = detail.seasons
                    .filter(s => s.season_number > curSeason && s.episode_count > 0)
                    .sort((a, b) => a.season_number - b.season_number)[0];
                if (!nextSeason) return;

                const nextEps = await api.get<Episode[]>(`/series/${name}/season/${nextSeason.season_number}`);
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
