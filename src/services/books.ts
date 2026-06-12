import { api, resolveUrl, withAuthToken } from './api';
import type { ReadingMode } from '@/types';

export type BookFormat = 'cbz' | 'pdf' | 'epub';

export interface BookInfo {
    id: number;
    title?: string;
    format: BookFormat;
    page_count?: number | null;
    reading_mode: ReadingMode;
}

export const bookService = {
    async info(id: number | string): Promise<BookInfo> {
        return api.get<BookInfo>(`/books/${id}/info`);
    },

    /** Absolute, auth-tokenised URL for a CBZ page image (loaded via <img>). */
    pageUrl(id: number | string, index: number): string {
        return withAuthToken(resolveUrl(`/api/v1/books/${id}/page/${index}`));
    },

    /** Absolute, auth-tokenised URL for the raw book file (PDF/EPUB rendering). */
    fileUrl(id: number | string): string {
        return withAuthToken(resolveUrl(`/api/v1/books/${id}/file`));
    },

    async setReadingMode(id: number | string, reading_mode: ReadingMode): Promise<void> {
        return api.post(`/books/${id}/reading-mode`, { reading_mode });
    },

    async getProgress(id: number | string): Promise<{ position: number }> {
        return api.get<{ position: number }>(`/media/${id}/progress`);
    },

    async saveProgress(id: number | string, position: number, total_duration: number): Promise<void> {
        return api.post(`/media/${id}/progress`, { position, total_duration });
    },
};
