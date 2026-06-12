# Vortex Client — Architecture

How this codebase is organized and the rules for adding to it. **If you are an AI
agent or a new contributor, read this first.** For UI/visual rules see
[DESIGN.md](./DESIGN.md).

The stack is React 19 + TypeScript + Vite, packaged for desktop with Tauri.

---

## The model: pragmatic feature-sliced

Three layers with a **one-directional** dependency rule:

```
shell (App/routing)  →  features  →  shared
```

A layer may import from layers to its right, never to its left. `shared` knows
nothing about any feature. Features never import each other's internals — only
their public barrels.

```
src/
├── App.tsx, main.tsx   # The shell: providers + routing. Imports feature barrels.
├── components/layout/  # Shell chrome: Header, Sidebar (used around feature screens).
├── layouts/            # MainLayout — page scaffold.
│
├── shared/             # Feature-agnostic & reusable. Knows nothing about any feature.
│   ├── ui/             #   Button, Input, Select, Toggle, ConfirmModal, MultiDirectoryPicker…
│   ├── api/            #   http client + url helpers (resolveUrl, withAuthToken)
│   ├── hooks/          #   generic hooks (usePlatform…)
│   └── styles/         #   global css
│
├── features/           # Vertical slices. Each is self-contained behind a barrel.
│   ├── auth/           #   AuthContext + Login screen
│   ├── library/        #   library view + add/edit dialogs
│   ├── media/          #   Dashboard, MediaDetail, MediaCard, carousels
│   ├── books/          #   book/comic series detail
│   ├── player/         #   video player + mpv backend + overlay
│   ├── reader/         #   pdf/epub reader (lazy-loaded)
│   └── settings/       #   settings screen + tabs
│
├── services/           # Central API layer: one module per domain (libraries, books…).
├── types/              # Central type definitions (barrel: '@/types').
├── constants/          # Shared constants.
└── assets/             # Static assets.
```

> **Pragmatic note:** `services/` and `types/` are kept central rather than split
> into each feature. At this size they're small, barrel-exported, and trivially
> discoverable (`@/services`, `@/types`). A feature should add its own local
> `api.ts`/`types.ts` only when doing so clearly reduces coupling.

### Every feature folder has the same shape

```
features/<name>/
├── components/     # feature-specific presentation (incl. the route screen)
├── hooks/          # data + logic hooks (useMediaDetail, useProgress…)
├── api.ts          # (optional) feature-local server calls — else use central @/services
├── types.ts        # (optional) feature-local types — else use central @/types
└── index.ts        # PUBLIC API barrel — the ONLY entry other code may import
```

---

## The 6 rules

1. **Import with the `@/` alias, never `../..`.**
   `import { Button } from '@/shared/ui'` — not `'../../shared/ui'`.
   (`@` is mapped to `src/` in both `tsconfig.json` and `vite.config.ts`.)

2. **Cross-feature imports go through the barrel; intra-feature imports are relative.**
   From another feature: `import { MediaCard } from '@/features/media'` ✅ —
   never `'@/features/media/components/MediaCard'` ❌ (a feature's internals are
   private; only its `index.ts` is public).
   Inside the same feature, import siblings with a relative path:
   `import { HeroCarousel } from './HeroCarousel'` ✅.
   **This is enforced by ESLint** (`no-restricted-imports`) — a violation fails
   `npm run lint` and `npm run build`.

3. **Dependencies flow one way:** `shell → features → shared`.
   A feature importing another feature's internals is a signal — lift the shared
   piece up into `shared/`, or import the other feature's public barrel.

4. **One component per file; the filename equals the export name.**
   `MediaCard.tsx` exports `MediaCard`.

5. **Soft cap ~250 lines per file.** Past that, split: data/logic → `hooks/`,
   view → `components/`.

6. **Route screens are thin.** A screen calls a feature hook for data and lays
   out feature components. Keep fetching/business logic in hooks, not the view.

### Where does new code go?

| You're adding…                          | Put it in…                              |
| --------------------------------------- | --------------------------------------- |
| A reusable button/input/modal primitive | `shared/ui/`                            |
| A generic, feature-agnostic hook        | `shared/hooks/`                         |
| A server call for an existing domain    | that domain's module in `services/`     |
| A new shared type                       | `types/` (export via `@/types` barrel)  |
| A screen-specific component             | that feature's `components/`            |
| A whole new screen/domain               | a new `features/<name>/` slice + barrel |
| A new route                             | a `<Route>` in `App.tsx` → feature barrel |

---

## Current state (migration in progress)

The target layout above is being adopted incrementally. Each phase keeps the
build green (`npm run build`) and changes no runtime behavior.

- [x] **Phase 0 — Path aliases.** `@/*` alias added; all parent-relative
      imports rewritten. (Codemod: `scripts/codemod-aliases.mjs`.)
- [x] **Phase 1 — `shared/` layer.** `components/common`→`shared/ui`,
      `services/api`→`shared/api`, `usePlatform`→`shared/hooks`, `glass.css`→
      `shared/styles`. Each has a barrel `index.ts`.
- [x] **Phase 2 — Features carved.** All 7 slices exist under `features/`
      (auth, library, settings, books, media, player, reader), each with a
      barrel `index.ts`. UI + feature hooks are vertical; **`services/` and
      `types/` stay central** (clean barrels, easy to find) and a feature owns
      its own `api.ts`/`types.ts` only if that reduces coupling.
- [~] **Phase 3 — God files split (partial).** Logic extracted into feature
      hooks + presentational components:
      `MediaDetail` (595→331; `useMediaDetail`, `CastRow`, `EpisodesSection`),
      `BookSeriesDetail` (327→238; `useBookSeriesDetail`),
      `MetadataTab` (381→74; `ConfigFieldInput`, `ProviderCard`, `useMetadataProviders`).
      **Deferred on purpose:** `Player` (548) and `Reader` (441) are ref/timing/DOM
      controllers (HLS, embedded mpv, pdf.js/epub.js). Splitting them blindly risks
      playback/render regressions that can't be caught by `tsc`/lint — they need a
      careful, manually-tested extraction. Left intact rather than risk it.
- [x] **Phase 4 — Boundaries enforced** by ESLint (`eslint.config.js`, flat
      config). Plain `no-restricted-imports` on import strings (no resolver
      needed): deep feature imports and `shared/services/types → features`
      imports are errors. Wired into `npm run build` (`eslint src && tsc &&
      vite build`), so violations fail the build.
- [x] **Phase 5 — Shell consolidated.** `App.tsx` + the layout chrome
      (`Header`, `Sidebar`, `MainLayout`) now live under `app/`. `main.tsx` stays
      as the Vite entry and imports `@/app/App`. Feature index of responsibilities
      + public barrels: [features/README.md](./src/features/README.md).

---

## Build & run

```bash
npm run dev          # vite dev server (port 1420)
npm run lint         # eslint — checks the architecture boundaries
npm run build        # eslint + tsc typecheck + vite build — run before pushing
npm run tauri dev    # desktop app
```

> Builds require Node 22. If the system `node` is older, use `/usr/local/bin/node`
> (e.g. `export PATH=/usr/local/bin:$PATH`).
