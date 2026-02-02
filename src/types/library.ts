// Library Types
export interface Library {
    id: number;
    name: string;
    path: string;
    library_type: LibraryType;
}

export type LibraryType = 'movies' | 'tv_shows' | 'music_videos';

export interface CreateLibraryRequest {
    name: string;
    path: string;
    library_type: string;
}

export interface UpdateLibraryRequest {
    name?: string;
    path?: string;
    library_type?: string;
}
