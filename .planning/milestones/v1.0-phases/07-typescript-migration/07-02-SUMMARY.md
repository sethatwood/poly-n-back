---
phase: 07-typescript-migration
plan: 02
subsystem: stores
tags: [typescript, pinia, composables, type-annotations, domain-types]

# Dependency graph
requires:
  - phase: 07-typescript-migration-01
    provides: TypeScript infrastructure, tsconfig, domain types in src/types/game.ts
provides:
  - Fully typed Pinia stores (gameStore, audioStore, persistenceStore) with domain type imports
  - Fully typed composables with explicit return types and GameStore parameter type
  - ReturnType<typeof useGameStore> pattern for composable store typing
affects: [07-03, 07-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [store-type-annotations, generic-persistence, rettype-store-param, set-timeout-rettype]

key-files:
  created: []
  modified:
    - src/stores/gameStore.ts (renamed from .js, full type annotations)
    - src/stores/audioStore.ts (renamed from .js, SoundName type, AudioContext typing)
    - src/stores/persistenceStore.ts (renamed from .js, generic loadPreference<T>/savePreference<T>)
    - src/composables/useAnimations.ts (renamed from .js, GameStore param, Ref return)
    - src/composables/useFeedback.ts (renamed from .js, GameStore param, ComputedRef return)
    - src/composables/useGameLifecycle.ts (renamed from .js, GameStore param, all handlers typed)
    - src/composables/useManagedTimeout.ts (renamed from .js, Set<ReturnType<typeof setTimeout>>)

key-decisions:
  - "Used non-null assertion (!) for clearInterval(timer.value!) since timer is always set before clear is called"
  - "currentStimulus initial value changed from ref({}) to ref<Stimulus>({ color: 'purple', emoji: 'fire', position: 'left', shape: 'circle' }) for strict type safety"
  - "resetHighScore now includes nBack: null to satisfy HighScoreData interface (was missing in original JS)"

patterns-established:
  - "Store typing: All Pinia setup stores use typed refs (ref<T>) and typed function params/returns"
  - "Composable store param: GameStore = ReturnType<typeof useGameStore> pattern for DI without circular imports"
  - "Generic persistence: loadPreference<T>/savePreference<T> with unknown-typed JSON.parse and Record casts for validation"
  - "Timer typing: ReturnType<typeof setTimeout/setInterval> to avoid Node vs browser type conflicts"

requirements-completed: [TS-03, TS-04]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 7 Plan 02: Stores & Composables TypeScript Migration Summary

**3 Pinia stores and 4 composables converted to TypeScript with domain type imports, generic persistence, and ReturnType-based store parameter typing**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T04:49:54Z
- **Completed:** 2026-03-02T04:53:05Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- All three Pinia stores (gameStore, audioStore, persistenceStore) fully typed with domain types from src/types/game.ts
- All four composables (useAnimations, useFeedback, useGameLifecycle, useManagedTimeout) typed with explicit return types
- GameStore parameter type derived via ReturnType<typeof useGameStore> in all composables -- no circular imports
- Generic loadPreference<T>/savePreference<T> with unknown-typed JSON.parse and Record<string, unknown> casts for validation
- No .js files remain in src/stores/ or src/composables/
- App builds successfully with all changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert Pinia stores to TypeScript** - `72d0361` (feat)
2. **Task 2: Convert composables to TypeScript** - `75f7e30` (feat)

## Files Created/Modified
- `src/stores/gameStore.ts` - Fully typed game store with Stimulus, HighScoreData, FeedbackState, RespondedThisTurn, StimulusAttribute types
- `src/stores/audioStore.ts` - Typed audio store with SoundName type, AudioContext | null, Record<string, AudioBuffer>
- `src/stores/persistenceStore.ts` - Typed persistence store with generic loadPreference<T> and savePreference<T>
- `src/composables/useAnimations.ts` - Typed animations with GameStore param, Ref<boolean> returns
- `src/composables/useFeedback.ts` - Typed feedback with GameStore param, ComputedRef<boolean> and StimulusAttribute returns
- `src/composables/useGameLifecycle.ts` - Typed lifecycle with GameStore param, all handler signatures
- `src/composables/useManagedTimeout.ts` - Typed timeout with Set<ReturnType<typeof setTimeout>>

## Decisions Made
- Used non-null assertion (`!`) for `clearInterval(timer.value!)` since timer is always set before clear is called -- avoids unnecessary null check
- Changed `currentStimulus` initial value from `ref({})` to `ref<Stimulus>({ color: 'purple', emoji: 'fire', position: 'left', shape: 'circle' })` -- empty object not assignable to Stimulus under strict mode
- Added `nBack: null` to `resetHighScore()` to satisfy HighScoreData interface -- was missing in the original JS but needed for type correctness
- Used `(window as any).webkitAudioContext` cast for Safari WebAudio prefix -- non-standard API needs explicit cast

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added missing nBack field in resetHighScore**
- **Found during:** Task 1 (gameStore conversion)
- **Issue:** `resetHighScore()` created `{ score: 0, potentialCorrectAnswers: 0 }` which is missing the `nBack` field required by `HighScoreData` interface
- **Fix:** Added `nBack: null` to the object literal in resetHighScore
- **Files modified:** src/stores/gameStore.ts
- **Verification:** Build passes, type matches HighScoreData interface
- **Committed in:** 72d0361 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for type correctness. The missing field was a latent bug in the original JS that would have caused a TypeScript error under strict mode.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All stores and composables are fully typed -- Plan 03 (Vue component migration) can use typed store interfaces
- ReturnType<typeof useGameStore> pattern is established for downstream components
- Domain types from src/types/game.ts are actively imported and used throughout stores/composables

## Self-Check: PASSED

All 7 modified files verified on disk. Both task commits verified in git log.

---
*Phase: 07-typescript-migration*
*Completed: 2026-03-02*
