import type { SubtitleTrack, AudioTrack } from '@/types';

export interface PlayerControlState {
    playing: boolean;
    currentTime: number;
    duration: number;
    /** Volume normalized to 0–1 for the UI slider. */
    volume: number;
    muted: boolean;
    isFullscreen: boolean;
    title: string;
    showControls: boolean;
}

export interface PlayerControlActions {
    onPlayPause: () => void;
    onSeek: (time: number) => void;
    /** Called while dragging the seek bar (mpv defers commit until release). */
    onSeekPreview?: (time: number) => void;
    onSeekCommit?: (time: number) => void;
    onSkip: (seconds: number) => void;
    onVolumeChange: (volume: number) => void;
    onToggleMute: () => void;
    onToggleFullscreen: () => void;
    onBack: () => void;
    onInteraction: () => void;
}

export interface TrackSelection {
    subtitles: SubtitleTrack[];
    activeSubtitleId: string | null;
    onSelectSubtitle: (id: string | null) => void;
    audioTracks: AudioTrack[];
    activeAudioIndex: number | null;
    onSelectAudio: (index: number) => void;
}

export interface PlayerBackend extends PlayerControlState, PlayerControlActions {
    isLoading?: boolean;
    tracks?: TrackSelection;
}
