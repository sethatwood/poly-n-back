---
phase: 07-typescript-migration
plan: 04
subsystem: ui
tags: [vue, typescript, script-setup, strict-mode, vue-tsc, ReturnType]

# Dependency graph
requires:
  - phase: 07-typescript-migration/03
    provides: "10 leaf components converted to script setup lang=ts"
provides:
  - "All 17 Vue components use <script setup lang=\"ts\"> with typed props/emits"
  - "vue-tsc --noEmit passes with zero errors under strict mode"
  - "tsconfig.json allowJs removed -- full TypeScript-only codebase"
  - "GameScreen gameStore prop typed as ReturnType<typeof useGameStore>"
affects: [08-testing-ci]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ReturnType<typeof useStore> for store prop typing across component boundaries"
    - "Computed property wrapper for array index access in templates (strict mode)"
    - "Non-null assertion (!) for guarded array index access in stores"

key-files:
  created: []
  modified:
    - src/App.vue
    - src/TutorialOverlay.vue
    - src/AchievementToast.vue
    - src/GameHint.vue
    - src/components/GameScreen.vue
    - src/components/MenuScreen.vue
    - src/components/ResponseButtons.vue
    - src/stores/gameStore.ts
    - tsconfig.json

key-decisions:
  - "Non-null assertions for array index access in gameStore (indices guaranteed valid by bounds checks)"
  - "Computed activeStep property in TutorialOverlay to avoid template type errors from array indexing"
  - "Pre-existing eslint any in audioStore.ts left out-of-scope (not caused by this plan)"

patterns-established:
  - "ReturnType<typeof useGameStore> for passing store as prop"
  - "Record<string, T> for typed constant dictionaries (ACHIEVEMENTS, hints)"
  - "Computed wrapper for safe array index access in strict-mode templates"

requirements-completed: [TS-05, TS-07]

# Metrics
duration: 6min
completed: 2026-03-02
---

# Phase 7 Plan 4: Complex Component TypeScript Migration Summary

**Final 7 complex components converted to `<script setup lang="ts">`, allowJs removed, vue-tsc zero errors under strict mode**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-02T05:00:48Z
- **Completed:** 2026-03-02T05:06:53Z
- **Tasks:** 2
- **Files modified:** 23

## Accomplishments
- Converted 7 remaining complex components (App, GameScreen, MenuScreen, ResponseButtons, TutorialOverlay, AchievementToast, GameHint) to `<script setup lang="ts">`
- GameScreen gameStore prop properly typed as `ReturnType<typeof useGameStore>` instead of generic `Object`
- Removed allowJs from tsconfig.json -- entire src/ is TypeScript-only
- Fixed 18 vue-tsc strict mode errors (array index access in gameStore and template type safety in TutorialOverlay)
- All 17 Vue components now use `<script setup lang="ts">` with typed props and emits

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert remaining 7 components to script setup lang="ts"** - `02cbaf2` (feat)
2. **Task 2: Finalize tsconfig, fix vue-tsc errors, format codebase** - `f6ee2ca` (chore)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified
- `src/App.vue` - Root component converted to script setup with typed StimulusAttribute, composable destructuring
- `src/components/GameScreen.vue` - gameStore typed as ReturnType<typeof useGameStore>, responseButtons as ResponseButton[]
- `src/components/MenuScreen.vue` - Script setup with typed number props, forwarding emits
- `src/components/ResponseButtons.vue` - Props typed with ResponseButton[], RespondedThisTurn, feedbackClass function type
- `src/TutorialOverlay.vue` - Steps typed as TutorialStep[], computed activeStep for template safety
- `src/AchievementToast.vue` - ACHIEVEMENTS as Record<string, Achievement>, typed refs and async unlock
- `src/GameHint.vue` - hints as Record<string, GameHintDef>, typed showHint function
- `src/stores/gameStore.ts` - Non-null assertions for array index access under strict mode
- `tsconfig.json` - allowJs removed (migration complete)

## Decisions Made
- Used non-null assertions (`!`) for array index access in gameStore where indices are guaranteed valid by preceding bounds checks (e.g., `nBackIndex >= 0`, `stimulusHistory.length >= nBack`)
- Added computed `activeStep` property in TutorialOverlay to avoid `steps[currentStep]` "possibly undefined" errors in templates (cleaner than non-null assertion in templates)
- Left pre-existing eslint `@typescript-eslint/no-explicit-any` error in audioStore.ts (line 31) out of scope -- not caused by this plan's changes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vue-tsc strict mode errors in gameStore.ts**
- **Found during:** Task 2 (type-check)
- **Issue:** 12 errors from array index access returning `T | undefined` under strict mode with noUncheckedIndexedAccess
- **Fix:** Added non-null assertions (`!`) on array accesses where bounds are guaranteed by preceding if-checks
- **Files modified:** src/stores/gameStore.ts
- **Verification:** `npm run type-check` passes with zero errors
- **Committed in:** f6ee2ca (Task 2 commit)

**2. [Rule 1 - Bug] Fixed vue-tsc template type errors in TutorialOverlay.vue**
- **Found during:** Task 2 (type-check)
- **Issue:** 5 errors from `steps[currentStep]` being "possibly undefined" in template expressions
- **Fix:** Added computed `activeStep` property that wraps the indexed access with non-null assertion, replaced all template references
- **Files modified:** src/TutorialOverlay.vue
- **Verification:** `npm run type-check` passes with zero errors
- **Committed in:** f6ee2ca (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs from strict mode enforcement)
**Impact on plan:** Both fixes necessary for vue-tsc zero-error requirement. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full TypeScript strict mode coverage achieved across the entire codebase
- All 17 Vue components use `<script setup lang="ts">` with typed props and emits
- vue-tsc --noEmit passes clean with zero errors
- No .js files remain in src/ -- allowJs removed from tsconfig
- Phase 8 (Testing/CI) can proceed with full type safety as a foundation
- One pre-existing eslint `any` in audioStore.ts (line 31) should be addressed in a future cleanup

## Self-Check: PASSED

All files exist, all commits verified, SUMMARY.md present.

---
*Phase: 07-typescript-migration*
*Completed: 2026-03-02*
