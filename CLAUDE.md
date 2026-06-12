# CLAUDE.md

Guidance for AI agents working in this repo.

## Read first
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — folder layout, the 6 rules, and the
  "where does new code go?" table. Follow it for every change.
- **[DESIGN.md](./DESIGN.md)** — the "Liquid Glass" UI/UX rules. All UI must comply.

## Non-negotiables (ESLint enforces #2 and #3 — a violation fails the build)
1. Import with the `@/` alias, never `../..`. (`@` → `src/`.) Exception: imports
   *within the same feature* use a relative path (`./Sibling`).
2. Import another feature through its barrel (`@/features/x`), never its internals.
3. Dependency direction is one-way: `shell → features → shared`. `shared`,
   `services`, and `types` must never import a feature.
4. One component per file; filename = export name. Keep files under ~250 lines.
5. Route screens stay thin — no fetching or business logic in the view.

## Build
Builds need Node 22. Run `export PATH=/usr/local/bin:$PATH` first if the system
`node` is older, then `npm run build` (runs `eslint` + `tsc` + `vite build`)
before pushing. Use `npm run lint` to check boundaries on their own.
