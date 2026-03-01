---
phase: 01-core-toolchain-upgrade
plan: 01
subsystem: infra
tags: [node-22, vue-3.5, vite-7, toolchain, dependencies]

# Dependency graph
requires: []
provides:
  - Node 22 runtime environment (.nvmrc + CI)
  - Vue 3.5.29 with Vite 7.3.1 build toolchain
  - Clean dependency tree (dead packages removed)
  - CI deploy workflow on Node 22
affects: [02-tailwind-capacitor-upgrade, all-subsequent-phases]

# Tech tracking
tech-stack:
  added: [vue@3.5.29, vite@7.3.1, "@vitejs/plugin-vue@6.0.4"]
  patterns: [import.meta.env for client-side env detection, lockfileVersion 3]

key-files:
  created: [.nvmrc]
  modified: [package.json, package-lock.json, src/main.js, postcss.config.js, .github/workflows/deploy.yml]

key-decisions:
  - "Regenerated package-lock.json from scratch to eliminate stale Vite 4 resolution trees"
  - "Removed all dead dependencies in one pass rather than incremental cleanup"

patterns-established:
  - "Node 22 as runtime baseline for local dev and CI"
  - "import.meta.env.DEV instead of process.env.NODE_ENV for Vite client code"

requirements-completed: [DEPS-01, DEPS-02, DEPS-04, DEPS-07]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 1 Plan 1: Core Toolchain Upgrade Summary

**Node 22 + Vue 3.5 + Vite 7 toolchain with clean dependency tree (202 packages, down from 985)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T19:21:24Z
- **Completed:** 2026-03-01T19:24:17Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Upgraded to Vue 3.5.29, Vite 7.3.1, @vitejs/plugin-vue 6.0.4
- Removed 4 dead dependencies: postcss, autoprefixer, register-service-worker, @vue/cli-plugin-pwa
- Clean dependency tree: 202 packages (down from 985) with lockfileVersion 3
- CI deploy workflow updated from Node 18 to Node 22
- App builds and dev server runs identically to before

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade dependencies and remove dead packages** - `d5b2845` (feat)
2. **Task 2: Update CI deploy workflow and verify dev server** - `850a941` (chore)

## Files Created/Modified
- `.nvmrc` - Pins Node version to 22 for nvm users
- `package.json` - Updated vue, vite, plugin-vue; removed 4 dead deps
- `package-lock.json` - Regenerated clean from scratch (lockfileVersion 3)
- `src/main.js` - Removed SW import, replaced process.env with import.meta.env.DEV
- `postcss.config.js` - Removed autoprefixer plugin, kept only tailwindcss
- `.github/workflows/deploy.yml` - Changed node-version from 18 to 22
- `src/registerServiceWorker.js` - Deleted (dead code)

## Decisions Made
- Regenerated package-lock.json from scratch (rm node_modules + lockfile, fresh npm install) to eliminate stale Vite 4 resolution trees -- per user decision in plan
- Removed all dead dependencies in a single pass rather than incremental approach

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Node 22 + Vite 7 foundation is in place for all subsequent phases
- Ready for Phase 1 Plan 2: Tailwind v4 migration and Capacitor 5-to-6 upgrade
- Vite 7 is prerequisite for @tailwindcss/vite plugin compatibility

## Self-Check: PASSED

All files verified present, deleted file confirmed absent, both commit hashes found in git log.

---
*Phase: 01-core-toolchain-upgrade*
*Completed: 2026-03-01*
