// Centralized Type Definitions
// Import from here instead of defining interfaces inline

// Library Types
export type { Library, LibraryType, ReadingMode, CreateLibraryRequest, UpdateLibraryRequest } from './library';

// Media Types
export type {
    Card,
    CreditDto,
    MovieDetail,
    BookDetail,
    ContinueItem,
    Track,
    LyricLine,
    Lyrics,
    AlbumDetail,
    ArtistDetail,
    Photo,
    GalleryDetail,
    ImageDetail,
    Playlist,
    PlaylistDetail,
    MediaType,
    MediaInfo,
    AudioStream,
    VideoStream,
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
    AudioTrack,
    StreamInfo,
    PlaybackProgress,
    DeviceProfile
} from './player';

export { detectCapabilities } from './player';

// System Types
export type { SystemAction } from './system';

// Provider Types
export type {
    FieldType,
    ConfigField,
    ProviderManifest,
    ProviderInfo,
    ProviderConfigResponse,
    TestResult
} from './providers';
