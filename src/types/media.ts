// Media Types

export interface Media {
    id: number;
    title: string;
    file_path?: string;
    plot?: string;
    poster_url?: string;
    backdrop_url?: string;
    still_url?: string;
    runtime?: number;
    stream_url?: string;
    year?: string;
    genres?: string[];
    media_type?: MediaType;
    provider_ids?: Record<string, string | number>;
    cast?: string;
    director?: string;
    series_name?: string;
    season_number?: number;
    episode_number?: number;
    season_count?: number;
    media_info?: string; // JSON string from backend
}

export interface MediaInfo {
    container?: string;
    size?: number;
    bit_rate?: number;
    video?: VideoStream;
    audio: AudioStream[];
    duration?: number;
}

export interface VideoStream {
    codec: string;
    profile?: string;
    width?: number;
    height?: number;
    aspect_ratio?: string;
    bit_rate?: number;
    frame_rate?: string;
    bit_depth?: number;
    pixel_format?: string;
    color_space?: string;
    color_transfer?: string;
    color_primaries?: string;
    ref_frames?: number;
    codec_tag?: string;
}

export interface AudioStream {
    index: number;
    codec: string;
    channels?: number;
    channel_layout?: string;
    sample_rate?: number;
    bit_rate?: number;
    language?: string;
    title?: string;
    default: boolean;
    forced: boolean;
}

export type MediaType = 'movie' | 'episode' | 'series';

export interface CastMember {
    name: string;
    character: string;
    role: string;
    profile_url?: string;
    order: number;
}

export interface SeriesDetail {
    name: string;
    poster_url?: string;
    backdrop_url?: string;
    plot?: string;
    year?: string;
    genres?: string[];
    cast?: string;
    director?: string;
    seasons: Season[];
}

export interface Season {
    season_number: number;
    episode_count: number;
    poster_url?: string;
}

export interface Episode {
    id: number;
    title: string;
    episode_number: number;
    poster_url?: string;
    plot?: string;
    file_path: string;
}

// Used in ContentRow and Dashboard
export interface MediaItem {
    id: string;
    title: string;
    posterUrl: string;
    subtitle?: string;
    isSeries?: boolean;
    seriesName?: string;
}
