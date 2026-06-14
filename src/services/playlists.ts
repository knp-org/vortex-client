import { api } from '@/shared/api';
import type { Playlist, PlaylistDetail } from '@/types';

export const playlistService = {
    list: () => api.get<Playlist[]>('/me/playlists'),
    get: (id: number) => api.get<PlaylistDetail>(`/me/playlists/${id}`),
    create: (name: string) => api.post<Playlist>('/me/playlists', { name }),
    remove: (id: number) => api.del(`/me/playlists/${id}`),
    addTrack: (id: number, itemId: number) => api.post(`/me/playlists/${id}/tracks`, { item_id: itemId }),
    removeTrack: (id: number, itemId: number) => api.del(`/me/playlists/${id}/tracks/${itemId}`),
};
