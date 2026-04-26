---
phase: 07-typescript-migration
plan: 03
subsystem: ui
tags: [vue, typescript, script-setup, composition-api, defineProps, defineEmits]

# Dependency graph
requires:
  - phase: 07-typescript-migration/02
    provides: "Typed stores and composables for component consumption"
provides:
  - "10 leaf Vue components converted to <script setup lang=\"ts\"> with typed props/emits"
  - "Options API fully eliminated from leaf components"
  - "defineProps<T>() and defineEmits<T>() type-only syntax across all leaf components"
affects: [07-typescript-migration/04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "defineProps<Props>() type-only props declaration"
    - "defineEmits<{ event: [] }>() type-only emits declaration"
    - "Options API to Composition API conversion pattern (data->ref, methods->functions, watch option->watch())"

key-files:
  created: []
  modified:
    - src/ConfigStart.vue
    - src/Stimulus.vue
    - src/PauseModal.vue
    - src/IntroHead.vue
    - src/IntroContent.vue
    - src/Footer.vue
    - src/GameOverModal.vue
    - src/components/GameTimer.vue
    - src/components/ScoreDisplay.vue
    - src/components/GameOverDisplay.vue

key-decisions:
  - "Used parseInt(String(x)) in ConfigStart for v-model number inputs to handle potential string coercion"
  - "Stimulus emoji prop typed as string (not StimulusEmoji) since template only reads gameStore.currentStimulus.emoji directly"
  - "GameOverModal isNewHighScore uses optional prop (?) -- falsy default matches prior default: false behavior"

patterns-established:
  - "defineProps<Props>() with local interface for all component props"
  - "defineEmits<{ event: [payload] }>() with labeled tuple syntax for emit types"

requirements-completed: [TS-05]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 7 Plan 3: Leaf Component TypeScript Migration Summary

**10 leaf/Options-API Vue components converted to `<script setup lang="ts">` with defineProps<T>() and defineEmits<T>() type-only syntax**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T04:55:50Z
- **Completed:** 2026-03-02T04:58:00Z
- **Tasks:** 1
- **Files modified:** 10

## Accomplishments
- Converted 4 Options API components (ConfigStart, Stimulus, PauseModal, IntroHead) to Composition API with `<script setup lang="ts">`
- Converted 5 setup()-wrapper components (IntroContent, GameOverModal, GameTimer, ScoreDisplay, GameOverDisplay) to `<script setup lang="ts">`
- Added `<script setup lang="ts">` to 1 template-only component (Footer)
- All 10 components use defineProps<T>() and defineEmits<T>() type-only syntax
- Net reduction of 64 lines (158 added, 222 removed) by eliminating Options API boilerplate

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert Options API components and simple leaf components** - `ade032d` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified
- `src/ConfigStart.vue` - Full Options API conversion: data()->ref, methods->functions, watch option->watch(), typed props/emits
- `src/Stimulus.vue` - Mixed Options API + setup() merged into pure script setup with StimulusColor/Position/Shape types
- `src/PauseModal.vue` - Options API -> script setup with typed props (show, score, strikes) and emits (resume, quit)
- `src/IntroHead.vue` - Options API name-only wrapper removed, minimal script setup
- `src/IntroContent.vue` - setup() wrapper removed, typed emits for showTutorial
- `src/Footer.vue` - Added script setup lang="ts" block to template-only component
- `src/GameOverModal.vue` - setup() wrapper removed, typed props including optional isNewHighScore
- `src/components/GameTimer.vue` - setup() wrapper removed, typed props including optional feedbackType
- `src/components/ScoreDisplay.vue` - setup() wrapper removed, typed props for score/strikes display
- `src/components/GameOverDisplay.vue` - setup() wrapper removed, HighScoreData import type for typed props

## Decisions Made
- Used `parseInt(String(x))` in ConfigStart to handle potential string coercion from v-model on number inputs
- Typed Stimulus emoji prop as `string` rather than `StimulusEmoji` since the template primarily reads `gameStore.currentStimulus.emoji` directly
- GameOverModal `isNewHighScore` uses optional prop (`?`) rather than `withDefaults` -- a missing boolean prop is falsy, matching the prior `default: false` behavior

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 10 leaf components now use `<script setup lang="ts">` with typed props and emits
- Options API is fully eliminated from these components
- Plan 04 can now convert the remaining complex components (App.vue, GameScreen, overlays) and finalize the migration
- The vue/block-lang ESLint rule (disabled in 07-01) can be re-enabled after Plan 04 converts all remaining .vue files

---
*Phase: 07-typescript-migration*
*Completed: 2026-03-02*
