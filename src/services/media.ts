import { api } from '@/shared/api';
import type { Card, MovieDetail, BookDetail, SeriesDetail, Season, Episode, ContinueItem, MediaInfo, AlbumDetail, ArtistDetail, Lyrics, Track } from '@/types';

export interface IdentifyBody {
    provider_id: string;
    media_type?: 'movie' | 'series';
    provider_name?: string;
}

/**
 * Catalog reads/actions against the per-type API. Series are addressed by id
 * (`/series/:id/...`); listing/recent/search return ready-to-render cards
 * (grouping is done server-side).
 */
export const mediaService = {
    // Listings (cards)
    libraryItems: (libraryId: number | string) => api.get<Card[]>(`/libraries/${libraryId}/media`),
    libraryTracks: (libraryId: number | string) => api.get<Track[]>(`/libraries/${libraryId}/tracks`),
    recent: () => api.get<Card[]>('/recent'),
    search: (query: string) => api.get<Card[]>(`/library/search?query=${encodeURIComponent(query)}`),
    continueWatching: () => api.get<ContinueItem[]>('/continue'),

    // Details
    movie: (id: number | string) => api.get<MovieDetail>(`/media/${id}`),
    book: (id: number | string) => api.get<BookDetail>(`/media/${id}`),
    episode: (id: number | string) => api.get<Episode>(`/media/${id}`),

    // Full ffprobe media info (for the Media Info dialog).
    mediaInfo: (id: number | string) => api.get<MediaInfo>(`/stream/${id}/mediainfo`),

    // Series (by id)
    series: (id: number | string) => api.get<SeriesDetail>(`/series/${id}/detail`),
    seriesList: (libraryId?: number) =>
        api.get<Card[]>(libraryId != null ? `/series?library_id=${libraryId}` : '/series'),
    seasons: (id: number | string) => api.get<Season[]>(`/series/${id}/seasons`),
    seasonEpisodes: (id: number | string, season: number) =>
        api.get<Episode[]>(`/series/${id}/season/${season}`),

    // Metadata actions
    refreshMedia: (id: number | string) => api.post(`/media/${id}/refresh`),
    identifyMedia: (id: number | string, body: IdentifyBody) => api.post(`/media/${id}/identify`, body),
    refreshSeries: (id: number | string) => api.post(`/series/${id}/refresh`),
    identifySeries: (id: number | string, body: IdentifyBody) => api.post(`/series/${id}/identify`, body),

    // Music
    album: (id: number | string) => api.get<AlbumDetail>(`/albums/${id}`),
    artists: (libraryId?: number) =>
        api.get<Card[]>(libraryId != null ? `/artists?library_id=${libraryId}` : '/artists'),
    artist: (id: number | string) => api.get<ArtistDetail>(`/artists/${id}`),
    lyrics: (id: number | string) => api.get<Lyrics>(`/media/${id}/lyrics`),

    // Favorites (per-user)
    favorites: () => api.get<Card[]>('/favorites'),
    addFavorite: (id: number | string) => api.post(`/favorites/${id}`),
    removeFavorite: (id: number | string) => api.del(`/favorites/${id}`),
};
