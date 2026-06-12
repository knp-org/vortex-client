# Vortex Client — Architecture

How this codebase is organized and the rules for adding to it. **If you are an AI
agent or a new contributor, read this first.** For UI/visual rules see
[DESIGN.md](./DESIGN.md).

The stack is React 19 + TypeScript + Vite, packaged for desktop with Tauri.

---

## The model: pragmatic feature-sliced

Three layers with a **one-directional** dependency rule:

```
pages  →  features  →  shared
```

A layer may import from layers to its right, never to its left. `shared` knows
nothing about any feature. Features do not import each other's internals.

```
src/
├── app/            # The shell: providers, router, app entry. Wires everything.
├── shared/         # Feature-agnostic & reusable. Knows nothing about media/books/etc.
│   ├── ui/         #   Button, Input, Select, Toggle, Modal, ConfirmModal, Spinner…
│   ├── api/        #   http client, url helpers (resolveUrl, withAuthToken)
│   ├── hooks/      #   generic hooks (usePlatform, useKeyboardShortcuts…)
│   ├── lib/        #   pure utility functions
│   ├── types/      #   cross-cutting types
│   └── styles/     #   global css
├── features/       # Vertical slices. Each owns its full stack and is self-contained.
│   ├── auth/
│   ├── library/
│   ├── media/
│   ├── books/
│   ├── player/
│   ├── reader/
│   └── settings/
└── pages/          # Thin route components. Compose features. No business logic.
```

### Every feature folder has the same shape

```
features/<name>/
├── api.ts          # all server calls for this feature
├── types.ts        # this feature's types
├── hooks/          # data + logic hooks (useMediaDetail, useSeries…)
├── components/     # feature-specific presentation
└── index.ts        # PUBLIC API barrel — the ONLY entry other code may import
```

---

## The 6 rules

1. **Import with the `@/` alias, never `../..`.**
   `import { Button } from '@/shared/ui'` — not `'../../shared/ui'`.
   (`@` is mapped to `src/` in both `tsconfig.json` and `vite.config.ts`.)

2. **Cross-feature imports go through the barrel only.**
   `import { MediaCard } from '@/features/media'` ✅
   `import { MediaCard } from '@/features/media/components/MediaCard'` ❌
   A feature's internals are private; only its `index.ts` is public.

3. **Dependencies flow one way:** `pages → features → shared`.
   If a feature needs another feature, that's a signal — lift the shared piece
   up into `shared/`.

4. **One component per file; the filename equals the export name.**
   `MediaCard.tsx` exports `MediaCard`.

5. **Soft cap ~250 lines per file.** Past that, split: data/logic → `hooks/`,
   view → `components/`.

6. **Pages are thin.** A page calls a feature hook for data and lays out feature
   components. It contains no fetching or business logic.

### Where does new code go?

| You're adding…                          | Put it in…                          |
| --------------------------------------- | ----------------------------------- |
| A reusable button/input/modal primitive | `shared/ui/`                        |
| A generic, feature-agnostic hook        | `shared/hooks/`                     |
| A server call for an existing feature   | that feature's `api.ts`             |
| A screen-specific component             | that feature's `components/`        |
| A whole new screen/domain               | a new `features/<name>/` slice      |
| A new route                             | `app/router.tsx` + a thin `pages/`  |

---

## Current state (migration in progress)

The target layout above is being adopted incrementally. Each phase keeps the
build green (`npm run build`) and changes no runtime behavior.

- [x] **Phase 0 — Path aliases.** `@/*` alias added; all parent-relative
      imports rewritten. (Codemod: `scripts/codemod-aliases.mjs`.)
- [ ] **Phase 1 — `shared/` layer.** Move `components/common`→`shared/ui`,
      `services/api`→`shared/api`, generic hooks/types/styles.
- [ ] **Phase 2 — Carve features** one at a time:
      auth → library → settings → books → media → player → reader.
- [ ] **Phase 3 — Split god files** (MediaDetail, Player, Reader, MetadataTab)
      into hooks + components.
- [ ] **Phase 4 — Enforce boundaries** with ESLint (`import/no-restricted-paths`).
- [ ] **Phase 5 — Docs** per feature + keep this file current.

Until a slice is migrated, today's folders still apply:
`components/{common,features,layout}`, `pages/`, `services/`, `types/`,
`hooks/`, `context/`, `player/`, `layouts/`, `constants/`, `styles/`.

---

## Build & run

```bash
npm run dev          # vite dev server (port 1420)
npm run build        # tsc typecheck + vite production build — run before pushing
npm run tauri dev    # desktop app
```

> Builds require Node 22. If the system `node` is older, use `/usr/local/bin/node`
> (e.g. `export PATH=/usr/local/bin:$PATH`).
