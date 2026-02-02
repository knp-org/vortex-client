// Player Types
export interface SubtitleTrack {
    id: string;
    label: string;
    language: string;
    source: string;
    url: string;
}

export interface DeviceProfile {
    video_codecs: string[];
    audio_codecs: string[];
    containers: string[];
}

export function detectCapabilities(): DeviceProfile {
    const videoCodecs = [
        { id: 'h264', type: 'video/mp4; codecs="avc1.42E01E"' },
        { id: 'hevc', type: 'video/mp4; codecs="hvc1.1.6.L93.B0"' },
        { id: 'vp9', type: 'video/webm; codecs="vp9"' },
        { id: 'av1', type: 'video/mp4; codecs="av01.0.05M.08"' }
    ];

    const audioCodecs = [
        { id: 'aac', type: 'audio/mp4; codecs="mp4a.40.2"' },
        { id: 'mp3', type: 'audio/mpeg' },
        { id: 'opus', type: 'audio/webm; codecs="opus"' },
        { id: 'vorbis', type: 'audio/webm; codecs="vorbis"' },
        { id: 'ac3', type: 'audio/mp4; codecs="ac-3"' },
        { id: 'eac3', type: 'audio/mp4; codecs="ec-3"' },
        { id: 'flac', type: 'audio/mp4; codecs="flac"' }
    ];

    return {
        video_codecs: videoCodecs
            .filter(c => MediaSource.isTypeSupported(c.type))
            .map(c => c.id),
        audio_codecs: audioCodecs
            .filter(c => MediaSource.isTypeSupported(c.type))
            .map(c => c.id),
        containers: ['mp4', 'webm', 'mov'] // Standard browser containers
    };
}

export interface StreamInfo {
    needs_transcode: boolean;
    video_codec: string | null;
    audio_codec: string | null;
    container: string | null;
    direct_stream_url: string;
    hls_url: string | null;
    duration_seconds: number | null;
}

export interface PlaybackProgress {
    media_id: number;
    position: number;
    total_duration: number;
    last_watched: string;
}
