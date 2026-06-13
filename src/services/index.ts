// API Services - Centralized API layer
export { api, ApiError, getApiBase, resolveUrl, resolveImageUrl, withAuthToken } from '@/shared/api';
export { libraryService } from './libraries';
export { bookService } from './books';
export type { BookInfo, BookFormat } from './books';
export { mediaService } from './media';
export type { IdentifyBody } from './media';
export { authService } from './auth';
export type { AuthUser, SetupStatus, CreateUserBody } from './auth';
export { settingsService } from './settings';
export { systemService } from './system';
export { providerService } from './providers';

// Re-export types from centralized types module
export type {
    Library,
    CreateLibraryRequest,
    UpdateLibraryRequest,
    Setting,
    TranscodeSettings,
    TranscodeSettingsRequest,
    SystemAction
} from '@/types';
