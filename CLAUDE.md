# CLAUDE.md

Guidance for AI agents working in this repo.

## Read first
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — folder layout, the rules, and the
  "where does new code go?" table. Follow it for every change.
- **[DESIGN.md](./DESIGN.md)** — the "Liquid Glass" UI/UX rules. All UI must comply.
  These rules are implemented by the **`@knp-org/liquid-glass-ui`** package — use its
  components instead of hand-rolling the aesthetic (see the UI rule below).
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

## UI: build everything from `@knp-org/liquid-glass-ui`
All web/desktop UI is composed from the **`@knp-org/liquid-glass-ui`** component
library (the canonical implementation of DESIGN.md). Treat it as the only way to
render UI:

- **Use a library component for everything it covers.** Buttons, inputs, cards,
  modals, tables, tabs, tooltips, dropdowns, toggles, sliders, badges, alerts,
  spinners, skeletons, navbars, breadcrumbs, pagination, empty states, avatars,
  dividers, lists — and the `GlassHeading`/`GlassText` typography and `Icon*` set.
  Import from the barrel: `import { GlassButton, GlassCard } from '@knp-org/liquid-glass-ui'`.
- **Never hand-roll a glass surface.** Do not reimplement backdrop-blur panels,
  translucent white overlays, hairline borders, custom buttons/inputs, or inline
  SVG icons when a `Glass*`/`Icon*` component already exists. Reach for raw HTML
  elements (`<button>`, `<input>`, `<div className="glass...">`) only for plain
  layout containers with no glass styling.
- **Style via props and tokens, not overrides.** Use the component's own props
  (`variant`, `shape`, `size`, …) and the library's CSS custom properties. Passing
  `className` is fine (it merges with the glass classes), but don't fork the
  aesthetic with local one-off styles.
- **Any new component goes in the library, not this repo.** If a needed
  component/pattern isn't in `@knp-org/liquid-glass-ui`, **add it to that package
  (`../liquid-glass-ui`) and import it here** — never author a new UI component
  inside vortex-client. This is non-negotiable: no bespoke variants, no
  local one-off glass components. Only `features/player` and `features/reader`
  may use bespoke media-controller DOM (see rule #6).
  - Workflow: edit `../liquid-glass-ui/src/`, export it from `src/index.ts`, then
    `cd ../liquid-glass-ui && export PATH=/usr/local/bin:$PATH && npm run build && npm pack`.
    The tarball is consumed via `file:` — a full `npm install` of it is slow, so
    refresh the extracted copy directly (`cp -r package/dist/* node_modules/@knp-org/liquid-glass-ui/dist/`),
    then reconcile the lockfile with a real install when convenient.

## Build
Web builds need Node 22. Run `export PATH=/usr/local/bin:$PATH` first if the system
`node` is older, then `npm run build` (runs `eslint` + `tsc` + `vite build`) before
pushing; `npm run lint` checks boundaries on their own. Android: `./gradlew
assembleDebug` from `android_app/`.
