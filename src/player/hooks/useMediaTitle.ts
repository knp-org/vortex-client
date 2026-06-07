import { useEffect, useState } from 'react';
import { api } from '../../services';

type MediaMeta = {
    title?: string;
    series_name?: string;
    season_number?: number;
    episode_number?: number;
};

export const formatMediaTitle = (media: MediaMeta): string => {
    if (media.series_name && media.season_number != null && media.episode_number != null) {
        return `${media.series_name} - S${media.season_number}E${media.episode_number}${media.title ? ` - ${media.title}` : ''}`;
    }
    return media.title ?? '';
};

export const useMediaTitle = (mediaId?: string) => {
    const [title, setTitle] = useState('');

    useEffect(() => {
        if (!mediaId) return;
        api.get<MediaMeta>(`/media/${mediaId}`)
            .then((media) => {
                const formatted = formatMediaTitle(media);
                if (formatted) setTitle(formatted);
            })
            .catch(() => {});
    }, [mediaId]);

    return title;
};
