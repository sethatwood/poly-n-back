---
phase: 05-store-extraction
plan: 01
subsystem: state-management
tags: [pinia, vue3, web-audio-api, capacitor-preferences, store-extraction]

# Dependency graph
requires:
  - phase: 04-linting-bug-fixes
    provides: Clean gameStore with persistence helpers and audio manager
provides:
  - Standalone audioStore Pinia store (Web Audio API singleton)
  - Standalone persistenceStore Pinia store (Capacitor Preferences wrapper)
  - Renamed src/stores/ directory with all imports updated
affects: [05-02-gameStore-wiring, 05-03-composable-extraction]

# Tech tracking
tech-stack:
  added: []
  patterns: [pinia-setup-store-for-singleton-services, non-serializable-plain-variables-in-store]

key-files:
  created:
    - src/stores/audioStore.js
    - src/stores/persistenceStore.js
  modified:
    - src/stores/gameStore.js (moved from src/store/)
    - src/main.js
    - src/App.vue
    - src/AchievementToast.vue
    - src/Stimulus.vue
    - src/IntroContent.vue
    - src/GameHint.vue

key-decisions:
  - "Used plain let variables (not refs) for AudioContext and buffers in audioStore to avoid Pinia DevTools serialization warnings"
  - "Called init() eagerly inside audioStore setup function to preserve current module-load-time initialization behavior"
  - "persistenceStore checks Preferences for _migrated flag before checking its own migrated ref, matching current gameStore behavior exactly"

patterns-established:
  - "Pinia store for singleton services: use plain let for non-serializable objects, ref() only for reactive state exposed to consumers"
  - "Store directory convention: src/stores/ (plural) for multiple Pinia store files"

requirements-completed: [ARCH-05, ARCH-06]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 5 Plan 1: Store File Creation Summary

**Standalone audioStore and persistenceStore Pinia stores created alongside renamed src/stores/ directory with all 6 consumer import paths updated**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T02:24:51Z
- **Completed:** 2026-03-02T02:26:35Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created audioStore.js as a Pinia setup store wrapping Web Audio API with reactive ready/unlocked state, eager initialization, and sound playback
- Created persistenceStore.js as a Pinia setup store wrapping Capacitor Preferences with schema validation, error handling, and localStorage migration
- Renamed src/store/ to src/stores/ and updated all import paths across 6 consumer files with zero build errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create audioStore.js and persistenceStore.js** - `2e18d17` (feat)
2. **Task 2: Rename store directory and update all imports** - `19c116a` (refactor)

## Files Created/Modified
- `src/stores/audioStore.js` - Pinia store: AudioContext singleton, buffer loading, iOS unlock, play()
- `src/stores/persistenceStore.js` - Pinia store: loadPreference(), savePreference(), migrateFromLocalStorage()
- `src/stores/gameStore.js` - Moved from src/store/ (content unchanged)
- `src/main.js` - Import path updated to ./stores/gameStore
- `src/App.vue` - Import path updated to ./stores/gameStore
- `src/AchievementToast.vue` - Import path updated to ./stores/gameStore
- `src/Stimulus.vue` - Import path updated to ./stores/gameStore
- `src/IntroContent.vue` - Import path updated to ./stores/gameStore
- `src/GameHint.vue` - Import path updated to ./stores/gameStore

## Decisions Made
- Used plain `let` variables (not refs) for `context` and `buffers` in audioStore -- AudioContext and AudioBuffer are non-serializable browser objects that would cause Pinia DevTools serialization warnings if wrapped in ref(). Only `ready` and `unlocked` are reactive refs.
- Called `init()` eagerly at end of audioStore setup function (before return) to preserve current behavior where audioManager.init() runs at module load time, ensuring sounds are pre-loaded before first gameplay.
- persistenceStore's migrateFromLocalStorage checks Preferences for `_migrated` flag first (matching exact current gameStore behavior), then sets its own reactive `migrated` ref.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- audioStore and persistenceStore are standalone and ready for Plan 05-02 to wire them into gameStore
- All imports resolve correctly, build passes, app runs identically to before
- gameStore.js content is untouched -- Plan 05-02 will refactor it to delegate to the new stores

## Self-Check: PASSED

All 10 files verified present. Both task commits (2e18d17, 19c116a) confirmed in git log.

---
*Phase: 05-store-extraction*
*Completed: 2026-03-02*
