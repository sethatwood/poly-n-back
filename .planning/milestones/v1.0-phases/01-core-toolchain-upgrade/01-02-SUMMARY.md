---
phase: 01-core-toolchain-upgrade
plan: 02
subsystem: infra
tags: [pinia-3, setup-syntax, state-management, migration]

# Dependency graph
requires:
  - phase: 01-core-toolchain-upgrade/01
    provides: Vue 3.5 + Vite 7 build toolchain (Pinia 3 requires Vue 3.5+)
provides:
  - Pinia 3 with setup syntax gameStore (ref/computed/function)
  - Clean store API ready for Phase 5 store extraction
  - No options API remnants (no this., no state/actions/getters blocks)
affects: [05-store-extraction, 07-typescript-migration]

# Tech tracking
tech-stack:
  added: [pinia@3.0.4]
  patterns: [Pinia setup syntax with ref/computed/function, explicit return of all store members]

key-files:
  created: []
  modified: [src/store/gameStore.js, package.json, package-lock.json]

key-decisions:
  - "Migrated gameStore in-place to Pinia 3 setup syntax while store is a single file -- minimizes risk vs doing it after extraction"

patterns-established:
  - "Pinia setup syntax: all state as ref(), getters as computed(), actions as plain functions"
  - "All store members explicitly returned from setup function (22 refs, 3 computed, 14 functions)"

requirements-completed: [DEPS-03]

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 1 Plan 2: Pinia 3 + Setup Syntax Migration Summary

**Pinia 3 upgrade with full gameStore migration from options API to setup syntax (22 refs, 3 computed, 14 functions)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T19:25:00Z
- **Completed:** 2026-03-01T19:29:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Upgraded Pinia from 2 to 3.0.4
- Migrated gameStore.js from options API (state/actions/getters) to setup syntax (ref/computed/function)
- Eliminated all `this.` references from the store (closure-scoped instead)
- All 22 state properties, 3 getters, and 14 actions preserved and returned from setup function
- User verified gameplay works identically: timer, stimuli, audio, response feedback, scoring, game over, localStorage persistence

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade Pinia 3 and migrate gameStore to setup syntax** - `9a4e923` (feat)
2. **Task 2: Verify gameplay works after all upgrades** - checkpoint:human-verify (approved, no commit needed)

## Files Created/Modified
- `src/store/gameStore.js` - Rewritten from options API to setup syntax (372 lines)
- `package.json` - Pinia upgraded from ^2.x to ^3.0.4
- `package-lock.json` - Updated dependency tree for Pinia 3

## Decisions Made
- Migrated gameStore in-place to setup syntax while it is still a single file -- this is the lowest-risk moment to change API style, before Phase 5 splits it into multiple stores

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 1 is now complete: Node 22, Vue 3.5, Vite 7, Pinia 3 (setup syntax), dead deps removed
- Clean foundation ready for Phase 2 (Tailwind 3 to 4 migration)
- gameStore setup syntax positions Phase 5 (Store Extraction) to focus purely on splitting, not syntax migration
- Phase 7 (TypeScript) gets a cleaner starting point with setup syntax already in place

## Self-Check: PASSED

All files verified present, commit hash 9a4e923 found in git log, pinia confirmed in package.json.

---
*Phase: 01-core-toolchain-upgrade*
*Completed: 2026-03-01*
