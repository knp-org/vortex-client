import { api } from './api';
import type { Library, CreateLibraryRequest, UpdateLibraryRequest } from '@/types';
import type { LibraryProviderInput, LibraryProviderResponse } from '@/types/providers';

export const libraryService = {
    async getAll(): Promise<Library[]> {
        return api.get<Library[]>('/libraries');
    },

    async getById(id: number): Promise<Library> {
        return api.get<Library>(`/libraries/${id}`);
    },

    async create(data: CreateLibraryRequest): Promise<Library> {
        return api.post<Library, CreateLibraryRequest>('/libraries', data);
    },

    async update(id: number, data: UpdateLibraryRequest): Promise<Library> {
        return api.put<Library, UpdateLibraryRequest>(`/libraries/${id}`, data);
    },

    async delete(id: number): Promise<void> {
        return api.del<void>(`/libraries/${id}`);
    },

    async scan(id: number): Promise<void> {
        return api.post<void>(`/libraries/${id}/scan`);
    },

    async refresh(id: number): Promise<void> {
        return api.post<void>(`/libraries/${id}/refresh`);
    },

    async getProviders(id: number): Promise<LibraryProviderResponse[]> {
        return api.get<LibraryProviderResponse[]>(`/libraries/${id}/providers`);
    },

    async updateProviders(id: number, providers: LibraryProviderInput[]): Promise<void> {
        return api.put<void>(`/libraries/${id}/providers`, { providers });
    },
};
