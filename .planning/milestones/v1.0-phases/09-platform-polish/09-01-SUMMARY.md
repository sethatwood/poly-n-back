---
phase: 09-platform-polish
plan: 01
subsystem: ui
tags: [capacitor, haptics, auto-pause, app-lifecycle, native-plugins]

# Dependency graph
requires:
  - phase: 03-capacitor-migration
    provides: Capacitor 8 native project setup with iOS/Android targets
  - phase: 05-store-extraction
    provides: gameStore with Pinia setup syntax, persistenceStore for preferences
  - phase: 06-component-extraction
    provides: GameScreen component with audio toggle pattern
provides:
  - Auto-pause on app background via @capacitor/app appStateChange listener
  - Haptics utility (hapticsCorrect, hapticsIncorrect, hapticsGameOver)
  - isHapticsEnabled preference with toggleHaptics action in gameStore
  - Haptics toggle UI button in GameScreen
  - @sentry/capacitor and @sentry/vue installed for Plan 02
affects: [09-02-sentry-error-monitoring]

# Tech tracking
tech-stack:
  added: ["@capacitor/app@8.0.1", "@capacitor/haptics@8.0.1", "@sentry/capacitor@3.1.0", "@sentry/vue@10.40.0"]
  patterns: [capacitor-plugin-wrapper, preference-gated-feature, app-lifecycle-listener]

key-files:
  created:
    - src/utils/haptics.ts
  modified:
    - src/stores/gameStore.ts
    - src/composables/useGameLifecycle.ts
    - src/components/GameScreen.vue
    - src/App.vue
    - vite.config.js
    - package.json

key-decisions:
  - "PluginListenerHandle imported from @capacitor/core (not @capacitor/app) -- Cap 8 exports it from core"
  - "Added Vite resolve alias for @ to fix runtime @/ imports that were previously type-only erased"
  - "Haptics toggle uses inline SVG smartphone icon with white/gray-400 color states matching audio toggle pattern"

patterns-established:
  - "Capacitor plugin wrapper: thin try-catch async functions in src/utils/ that never throw"
  - "Preference-gated feature: ref(false) + toggle function + persistenceStore.savePreference pattern"
  - "App lifecycle listener: register in composable setup, cleanup in onUnmounted"

requirements-completed: [PLSH-01, PLSH-02]

# Metrics
duration: 9min
completed: 2026-03-02
---

# Phase 9 Plan 1: Platform Polish - Auto-Pause & Haptics Summary

**Auto-pause on app background via @capacitor/app and opt-in haptic feedback for correct, incorrect, and game-over events**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-02T18:40:01Z
- **Completed:** 2026-03-02T18:49:50Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- App automatically pauses active gameplay when backgrounded; does not auto-resume or pause on menu/game-over
- Haptics utility with three feedback functions (light impact for correct, warning for incorrect, error for game-over)
- Haptics toggle in GameScreen UI with persisted preference (defaults OFF)
- All 4 Capacitor plugins registered via cap sync on both iOS and Android

## Task Commits

Each task was committed atomically:

1. **Task 1: Install plugins, create haptics utility, add auto-pause listener and haptics state** - `1656250` (feat)
2. **Task 2: Add haptics toggle UI to GameScreen and run cap sync** - `dc0cd36` (feat)

## Files Created/Modified
- `src/utils/haptics.ts` - Thin no-throw wrapper around @capacitor/haptics with correct/incorrect/gameOver functions
- `src/stores/gameStore.ts` - Added isHapticsEnabled state, toggleHaptics action, haptics calls in respondToStimulus
- `src/composables/useGameLifecycle.ts` - Added appStateChange listener for auto-pause on background
- `src/components/GameScreen.vue` - Added haptics toggle button next to audio toggle
- `src/App.vue` - Wired toggle-haptics event to gameStore.toggleHaptics
- `vite.config.js` - Added @ resolve alias for runtime path resolution
- `package.json` - Added @capacitor/app, @capacitor/haptics, @sentry/capacitor, @sentry/vue
- `package-lock.json` - Lockfile updated
- `android/app/capacitor.build.gradle` - Cap sync registered new plugins
- `android/capacitor.settings.gradle` - Cap sync registered new plugins
- `ios/App/CapApp-SPM/Package.swift` - Cap sync registered new plugins

## Decisions Made
- PluginListenerHandle imported from @capacitor/core (not @capacitor/app) since Capacitor 8 exports it from core
- Added Vite resolve alias for @ path mapping -- previously only configured in tsconfig (worked for type-only imports that get erased, but runtime imports like haptics.ts failed at build time)
- Haptics toggle uses inline SVG smartphone icon with white/gray-400 color states, matching the existing audio toggle visual pattern
- Used flex layout with gap-2 for the toggle button container instead of ml-2 margin for cleaner spacing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed PluginListenerHandle import source**
- **Found during:** Task 1 (auto-pause listener)
- **Issue:** Plan specified `import { App, type PluginListenerHandle } from '@capacitor/app'` but Cap 8 exports PluginListenerHandle from @capacitor/core
- **Fix:** Split import: `App` from `@capacitor/app`, `PluginListenerHandle` from `@capacitor/core`
- **Files modified:** src/composables/useGameLifecycle.ts
- **Verification:** vue-tsc --noEmit passes
- **Committed in:** 1656250 (Task 1 commit)

**2. [Rule 3 - Blocking] Added Vite resolve alias for @ path**
- **Found during:** Task 2 (production build)
- **Issue:** `npm run build` failed -- Rollup could not resolve `@/utils/haptics` import because vite.config.js had no @ alias (tsconfig paths are TypeScript-only, not Vite runtime)
- **Fix:** Added `resolve.alias` mapping `@` to `./src` in vite.config.js using `fileURLToPath`
- **Files modified:** vite.config.js
- **Verification:** npm run build succeeds, all 58 tests pass
- **Committed in:** dc0cd36 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary for compilation and build. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- @sentry/capacitor and @sentry/vue already installed, ready for Plan 02 (Sentry error monitoring)
- All native plugins registered on both platforms via cap sync
- Haptics and auto-pause features are fully functional

## Self-Check: PASSED

All created files verified present. Both task commits (1656250, dc0cd36) verified in git log.

---
*Phase: 09-platform-polish*
*Completed: 2026-03-02*
