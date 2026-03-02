---
phase: 08-testing-ci
plan: 03
subsystem: testing
tags: [vitest, integration-tests, pinia, game-flow, state-machine, composable]

# Dependency graph
requires:
  - phase: 08-01
    provides: "Test infrastructure (Vitest, happy-dom, Capacitor/AudioContext mocks)"
provides:
  - "Integration tests for full game flow (start -> play -> game over) with real stores"
  - "Integration tests for state transitions (menu -> game -> pause -> resume -> game over -> menu)"
  - "withSetup helper for testing composables that use onUnmounted"
affects: [08-04]

# Tech tracking
tech-stack:
  added: []
  patterns: ["withSetup composable test helper for Vue lifecycle context", "driveToGameOver helper for deterministic game-over in tests"]

key-files:
  created:
    - src/stores/__tests__/gameFlow.integration.test.ts
    - src/stores/__tests__/stateTransitions.integration.test.ts
  modified: []

key-decisions:
  - "withSetup creates minimal Vue app with createPinia to provide onUnmounted lifecycle for composable tests"
  - "driveToGameOver helper encapsulates deterministic 3-strike sequence for reuse across state transition tests"

patterns-established:
  - "Integration test pattern: real Pinia stores + mocked external APIs (Capacitor Preferences, AudioContext)"
  - "withSetup pattern: mount composable in real Vue app for lifecycle hook support"
  - "Deterministic stimulus helper: use isDeterministic mode with known nBack=2 to verify exact match/mismatch behavior"

requirements-completed: [TEST-05, TEST-06]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 08 Plan 03: Store Integration Tests Summary

**14 integration tests verifying full game flows and state transitions across real Pinia stores with only external APIs mocked**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T14:41:05Z
- **Completed:** 2026-03-02T14:44:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- 5 game flow integration tests: start-to-game-over, score increments, high score persistence, state restoration, audio toggle
- 9 state transition integration tests: menu-to-game, pause, resume, quit, game-over-modal, play-again, main-menu, full round-trip cycle, unmount cleanup
- All tests use real gameStore + audioStore + persistenceStore together, mocking only Capacitor Preferences and AudioContext

## Task Commits

Each task was committed atomically:

1. **Task 1: Write game flow integration tests** - `adcd78e` (feat)
2. **Task 2: Write state transition integration tests** - `c2679d8` (feat)

## Files Created/Modified
- `src/stores/__tests__/gameFlow.integration.test.ts` - Full game flow integration tests (start -> play -> game over, persistence, audio toggle)
- `src/stores/__tests__/stateTransitions.integration.test.ts` - State transition integration tests (menu -> game -> pause -> resume -> game over -> menu, cleanup)

## Decisions Made
- Used `withSetup` helper that mounts a minimal Vue app via `createApp` to provide `onUnmounted` lifecycle context for composable tests
- Created `driveToGameOver` helper to encapsulate the deterministic 3-strike game-over sequence, reused in 4 tests
- Separate `createPinia()` in `withSetup` since composable needs its own app-level Pinia while test `beforeEach` sets global active Pinia for direct store access

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Integration test coverage established for both game flows and state transitions
- Ready for Plan 04 (CI pipeline) with full test suite of 48 tests passing
- All tests run in under 2 seconds total

## Self-Check: PASSED

- FOUND: src/stores/__tests__/gameFlow.integration.test.ts
- FOUND: src/stores/__tests__/stateTransitions.integration.test.ts
- FOUND: commit adcd78e
- FOUND: commit c2679d8

---
*Phase: 08-testing-ci*
*Completed: 2026-03-02*
