# Features

Each folder is a self-contained vertical slice. Import a feature **only through
its barrel** (`@/features/<name>`) — never its internals. Inside a feature, files
import each other with relative paths. See [../../ARCHITECTURE.md](../../ARCHITECTURE.md).

Shape: `features/<name>/{ components/, hooks/, index.ts }`. Data/state lives in
`hooks/`; presentation in `components/`; `index.ts` is the public API.

| Feature | Responsibility | Public barrel exports (`@/features/<name>`) |
| --- | --- | --- |
| **auth** | Authentication state + login screen | `AuthProvider`, `useAuth`, `Login` |
| **library** | A library's contents view + add/edit library dialogs | `Library`, `AddLibraryModal`, `EditLibraryModal` |
| **media** | Movie/series browse + detail, the media poster card | `Dashboard`, `MediaDetail`, `MediaCard`, `useProgress` |
| **books** | Book/comic series detail | `BookSeriesDetail` |
| **player** | Video player (HLS + embedded mpv) + controls toolkit | `Player`, `MpvOverlay`, `PlayerControls`, `useMpvPlayerBackend`, … |
| **reader** | On-demand pdf/epub reader (lazy-loaded) | `Reader` |
| **settings** | Settings screen + tabs (account, libraries, metadata, player, …) | `Settings` |

Cross-feature use today: `library` and `settings` consume `media`/`library`
barrels. Lower layers a feature may import freely: `@/shared/*`, `@/services`,
`@/types`, and `@/app/layout/MainLayout` (page scaffold).
