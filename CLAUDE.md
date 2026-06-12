# CLAUDE.md

Guidance for AI agents working in this repo.

## Read first
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — folder layout, the 6 rules, and the
  "where does new code go?" table. Follow it for every change.
- **[DESIGN.md](./DESIGN.md)** — the "Liquid Glass" UI/UX rules. All UI must comply.

## Non-negotiables
1. Import with the `@/` alias, never `../..`. (`@` → `src/`.)
2. Import features through their barrel (`@/features/x`), never their internals.
3. Dependency direction is one-way: `pages → features → shared`.
4. One component per file; filename = export name. Keep files under ~250 lines.
5. Pages stay thin — no fetching or business logic in them.

## Build
Builds need Node 22. Run `export PATH=/usr/local/bin:$PATH` first if the system
`node` is older, then `npm run build` (`tsc` + `vite build`) before pushing.
