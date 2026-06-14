// Media Types — aligned with the server's per-type catalog API.

/**
 * A lightweight card returned by listing/recent/search endpoints. `kind` tells you
 * which detail view to open and how to read `id`:
 *  - movie | episode | book | music_video -> id is a media item id (`/media/:id`)
 *  - series -> id is a series id (`/series/:id/detail`)
 */
export interface Card {
    id: number;
    kind: 'movie' | 'series' | 'episode' | 'book' | 'music_video' | string;
    title?: string;
    poster_url?: string;
    year?: number;
    stream_url?: string;
}

export interface CreditDto {
    name: string;
    character?: string;
    role?: string;
    profile_url?: string;
    ord?: number;
}

export interface MovieDetail {
    id: number;
    title?: string;
    year?: number;
    plot?: string;
    tagline?: string;
    runtime?: number;
    rating?: number;
    age_rating?: string;
    studio?: string;
    collection_name?: string;
    origin_country?: string;
    creator?: string;
    poster_url?: string;
    backdrop_url?: string;
    trailer_url?: string;
    provider_ids?: string; // JSON string from the server
    genres: string[];
    cast: CreditDto[];
    stream_url: string;
}

export interface Season {
    id: number;
    season_number: number;
    episode_count: number;
    poster_url?: string;
}

export interface SeriesDetail {
    id: number;
    name: string;
    year?: number;
    plot?: string;
    poster_url?: string;
    backdrop_url?: string;
    rating?: number;
    age_rating?: string;
    studio?: string;
    trailer_url?: string;
    collection_name?: string;
    origin_country?: string;
    creator?: string;
    provider_ids?: string;
    genres: string[];
    tags: string[];
    cast: CreditDto[];
    seasons: Season[];
}

export interface Episode {
    id: number;
    series_id?: number;
    series_name?: string;
    season_number?: number;
    episode_number?: number;
    title?: string;
    plot?: string;
    still_url?: string;
    runtime?: number;
    air_date?: string;
    stream_url?: string;
}

export interface BookDetail {
    id: number;
    title?: string;
    plot?: string;
    poster_url?: string;
    page_count?: number;
    reading_mode?: string;
    publisher?: string;
    published_date?: string;
    isbn?: string;
}

export interface Track {
    id: number;
    track_number?: number;
    disc_number?: number;
    title?: string;
    artist?: string;
    album?: string;
    cover_url?: string;
    duration?: number;
    stream_url: string;
}

/** One lyric line; `time` (seconds) is present only for synced (LRC) lyrics. */
export interface LyricLine {
    time?: number | null;
    text: string;
}

export interface Lyrics {
    synced: boolean;
    /** lrc | txt | embedded | lrclib | none */
    source: string;
    lines: LyricLine[];
}

export interface AlbumDetail {
    id: number;
    title: string;
    artist_id?: number;
    artist?: string;
    year?: number;
    cover_url?: string;
    tracks: Track[];
}

export interface ArtistDetail {
    id: number;
    name: string;
    bio?: string;
    image_url?: string;
    albums: Card[];
}

export interface Playlist {
    id: number;
    name: string;
    track_count: number;
    created_at?: string;
}

export interface PlaylistDetail {
    id: number;
    name: string;
    tracks: Track[];
}

/** Per-user "continue watching" entry. */
export interface ContinueItem {
    id: number;
    kind: string;
    title?: string;
    poster_url?: string;
    position: number;
    total_duration: number;
    reading_style?: string;
    stream_url: string;
}

// Detailed media info produced by the server's ffprobe path (transcode endpoints).
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

export type MediaType = 'movie' | 'episode' | 'series' | 'book' | 'music_video';

// UI card model used by ContentRow / Dashboard carousels.
export interface MediaItem {
    id: string;
    title: string;
    posterUrl: string;
    progress?: number; // 0-100
    subtitle?: string;
    /** kind from the server card, so click handlers know where to navigate. */
    kind?: string;
}
