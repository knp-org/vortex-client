// Settings Types

export type SettingsTab = 'libraries' | 'account' | 'users' | 'metadata' | 'transcoding' | 'system' | 'player';

export interface Setting {
    key: string;
    value: string;
}

export interface TranscodeSettings {
    current_encoder: string;
    available_encoders: string[];
    thread_count: number | null;
    preset: string | null;
    throttle_transcodes: boolean;
    max_bitrate: number | null;
    system_threads: number;
}

export interface TranscodeSettingsRequest {
    encoder: string;
    thread_count?: number | null;
    preset?: string | null;
    throttle_transcodes?: boolean;
    max_bitrate?: number | null;
}
