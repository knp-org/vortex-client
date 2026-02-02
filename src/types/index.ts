// Centralized Type Definitions
// Import from here instead of defining interfaces inline

// Library Types
export type { Library, LibraryType, CreateLibraryRequest, UpdateLibraryRequest } from './library';

// Media Types
export type {
    Media,
    MediaType,
    CastMember,
    SeriesDetail,
    Season,
    Episode,
    MediaItem
} from './media';

// Settings Types
export type {
    SettingsTab,
    Setting,
    TranscodeSettings,
    TranscodeSettingsRequest
} from './settings';

// Player Types
export type {
    SubtitleTrack,
    StreamInfo,
    PlaybackProgress,
    DeviceProfile
} from './player';

export { detectCapabilities } from './player';

// System Types
export type { SystemAction } from './system';
