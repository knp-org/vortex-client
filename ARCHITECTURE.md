# Vortex Client — Architecture

How this codebase is organized and the rules for adding to it. **If you are an AI
agent or a new contributor, read this first.** For UI/visual rules see
[DESIGN.md](./DESIGN.md); for a per-feature index see
[src/features/README.md](./src/features/README.md).

The stack is React 19 + TypeScript + Vite, packaged for desktop with Tauri.

---

## The model: pragmatic feature-sliced

Three layers with a **one-directional** dependency rule:

```
shell (app/)  →  features  →  shared
```

A layer may import from layers to its right, never to its left. `shared` knows
nothing about any feature. Features never import each other's internals — only
their public barrels.

```
src/
├── main.tsx            # Vite entry; imports @/app/App.
│
├── app/                # The shell: providers, routing, and app-level chrome.
│   ├── App.tsx         #   providers + <Route> definitions (imports feature barrels)
│   └── layout/         #   Header, Sidebar, MainLayout (page scaffold)
│
├── shared/             # Feature-agnostic & reusable. Knows nothing about any feature.
│   ├── ui/             #   Button, Input, Select, Toggle, ConfirmModal, MultiDirectoryPicker…
│   ├── api/            #   http client + url helpers (resolveUrl, withAuthToken)
│   ├── hooks/          #   generic hooks (usePlatform…)
│   └── styles/         #   global css
│
├── features/           # Vertical slices. Each is self-contained behind a barrel.
│   ├── auth/           #   auth state + login screen
│   ├── library/        #   library view + add/edit dialogs
│   ├── media/          #   Dashboard, MediaDetail, MediaCard, carousels
│   ├── books/          #   book/comic series detail
│   ├── player/         #   video player + mpv backend + overlay
│   ├── reader/         #   pdf/epub/cbz reader (lazy-loaded)
│   └── settings/       #   settings screen + tabs
│
├── services/           # Central API layer: one module per domain (libraries, books…).
├── types/              # Central type definitions (barrel: @/types).
├── constants/          # Shared constants.
└── assets/             # Static assets.
```

> **Why `services/` and `types/` are central** (not split into each feature):
> at this size they're small, barrel-exported, and trivially discoverable
> (`@/services`, `@/types`). A feature should add its own local `api.ts`/`types.ts`
> only when doing so clearly reduces coupling.

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

## The rules

1. **Import with the `@/` alias, never `../..`.**
   `import { Button } from '@/shared/ui'` — not `'../../shared/ui'`.
   (`@` is mapped to `src/` in both `tsconfig.json` and `vite.config.ts`.)

2. **Cross-feature imports go through the barrel; intra-feature imports are relative.**
   From another feature: `import { MediaCard } from '@/features/media'` ✅ —
   never `'@/features/media/components/MediaCard'` ❌ (a feature's internals are
   private; only its `index.ts` is public).
   Inside the same feature, import siblings with a relative path:
   `import { HeroCarousel } from './HeroCarousel'` ✅.

3. **Dependencies flow one way:** `shell → features → shared`. `shared`,
   `services`, and `types` must never import a feature. A feature needing another
   feature's internals is a signal — lift the shared piece into `shared/`, or
   import the other feature's public barrel.

4. **One component per file; the filename equals the export name.**
   `MediaCard.tsx` exports `MediaCard`.

5. **Keep files small (~250 lines).** Past that, split: data/logic → `hooks/`,
   view → `components/`.
   *Exception:* `features/player` and `features/reader` are deliberately kept as
   large single-file controllers — they are ref/timing/DOM-heavy media engines
   (HLS, embedded mpv, pdf.js/epub.js) where splitting risks playback/render
   regressions that `tsc` and lint cannot catch. **Do not split them.**

6. **Route screens are thin.** A screen calls a feature hook for data and lays
   out feature components. Keep fetching/business logic in hooks, not the view.

> Rules **2** and **3** are enforced by ESLint (`eslint.config.js`,
> `no-restricted-imports` on import strings). A deep feature import or a
> `shared/services/types → feature` import is an error, so `npm run lint` and
> `npm run build` fail on a violation — the structure can't silently rot.

### Where does new code go?

| You're adding…                          | Put it in…                               |
| --------------------------------------- | ---------------------------------------- |
| A reusable button/input/modal primitive | `shared/ui/`                             |
| A generic, feature-agnostic hook        | `shared/hooks/`                          |
| A server call for an existing domain    | that domain's module in `services/`      |
| A new shared type                       | `types/` (export via `@/types` barrel)   |
| A screen-specific component             | that feature's `components/`             |
| A whole new screen/domain               | a new `features/<name>/` slice + barrel  |
| A new route                             | a `<Route>` in `app/App.tsx` → feature barrel |

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
