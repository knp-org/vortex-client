import { api } from '@/shared/api';
import type { Setting, TranscodeSettings, TranscodeSettingsRequest } from '@/types';

export const settingsService = {
    async getAll(): Promise<Setting[]> {
        return api.get<Setting[]>('/settings');
    },

    async set(key: string, value: string): Promise<void> {
        return api.post<void, Setting>('/settings', { key, value });
    },

    async getTranscode(): Promise<TranscodeSettings> {
        return api.get<TranscodeSettings>('/settings/transcode');
    },

    async updateTranscode(data: TranscodeSettingsRequest): Promise<TranscodeSettings> {
        return api.post<TranscodeSettings, TranscodeSettingsRequest>('/settings/transcode', data);
    },

    // Per-user preferences (scoped to the authenticated caller).
    async getUserSettings(): Promise<Setting[]> {
        return api.get<Setting[]>('/me/settings');
    },

    async setUserSetting(key: string, value: string): Promise<void> {
        return api.post<void, Setting>('/me/settings', { key, value });
    },
};
