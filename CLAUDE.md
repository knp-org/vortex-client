# CLAUDE.md

Guidance for AI agents working in this repo.

## Read first
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — folder layout, the rules, and the
  "where does new code go?" table. Follow it for every change.
- **[DESIGN.md](./DESIGN.md)** — the "Liquid Glass" UI/UX rules. All UI must comply.
- **[src/features/README.md](./src/features/README.md)** — per-feature responsibilities
  and public barrels.

## Two clients
- **Web & Desktop** — React 19 + TS + Vite + Tauri, at the repo root (`src/`).
- **Android** — Kotlin + Jetpack Compose + Media3, in `android_app/`.
  Mirror features across both where it makes sense (they share the same server API).

## Non-negotiables (ESLint enforces #2 and #3 — a violation fails the build)
1. Import with the `@/` alias, never `../..`. (`@` → `src/`.) Exception: imports
   *within the same feature* use a relative path (`./Sibling`).
2. Import another feature through its barrel (`@/features/x`), never its internals.
3. Dependency direction is one-way: `shell → features → shared`. `shared`,
   `services`, and `types` must never import a feature.
4. One component per file; filename = export name. Keep files under ~250 lines —
   split data/logic into `hooks/`, view into `components/`.
5. Route screens stay thin — no fetching or business logic in the view.
6. **Do not split `features/player` or `features/reader`.** They're ref/timing/DOM
   media controllers (HLS, embedded mpv, pdf.js/epub.js); splitting risks
   playback/render regressions that `tsc`/lint can't catch.

## Build
Web builds need Node 22. Run `export PATH=/usr/local/bin:$PATH` first if the system
`node` is older, then `npm run build` (runs `eslint` + `tsc` + `vite build`) before
pushing; `npm run lint` checks boundaries on their own. Android: `./gradlew
assembleDebug` from `android_app/`.
