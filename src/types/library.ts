// Library Types
export interface Library {
    id: number;
    name: string;
    paths: string[];
    library_type: LibraryType;
    default_reading_mode?: ReadingMode | null;
}

export type LibraryType = 'movies' | 'tv_shows' | 'music_videos' | 'books' | 'other';

/** Reading layout for Books libraries. Shared verbatim with the server. */
export type ReadingMode = 'vertical' | 'horizontal_ltr' | 'horizontal_rtl' | 'webtoon';

export interface CreateLibraryRequest {
    name: string;
    paths: string[];
    library_type: string;
    default_reading_mode?: string | null;
}

export interface UpdateLibraryRequest {
    name?: string;
    paths?: string[];
    library_type?: string;
    default_reading_mode?: string | null;
}
