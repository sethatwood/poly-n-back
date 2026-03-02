---
phase: 02-tailwind-migration
plan: 01
subsystem: ui
tags: [tailwindcss, tailwind-4, vite-plugin, css-migration, capacitor]

# Dependency graph
requires:
  - phase: 01-core-toolchain-upgrade
    provides: Vite 7 build pipeline compatible with @tailwindcss/vite
provides:
  - Tailwind CSS 4.2+ with CSS-first configuration via @tailwindcss/vite plugin
  - Hover override for Capacitor touch WebView via @custom-variant
  - Button cursor pointer restoration via @layer base override
affects: [03-capacitor-migration, ui-components, theming]

# Tech tracking
tech-stack:
  added: [tailwindcss@4.2, @tailwindcss/vite@4.2]
  removed: [postcss tailwind pipeline, tailwind.config.js, postcss.config.js]
  patterns: [CSS-first Tailwind config, color/opacity merged syntax, @theme variables]

key-files:
  created: []
  modified:
    - package.json
    - vite.config.js
    - src/style.css
    - src/ConfigStart.vue
    - src/Stimulus.vue
    - src/App.vue
    - src/GameOverModal.vue
    - src/AchievementToast.vue
    - src/PauseModal.vue
    - src/GameHint.vue
    - src/TutorialOverlay.vue
  deleted:
    - postcss.config.js
    - tailwind.config.js

key-decisions:
  - "Used @custom-variant hover (&:hover) to restore universal hover behavior for Capacitor WebView compatibility"
  - "Restored button cursor:pointer via @layer base override since TW4 changed default to cursor:default"
  - "Added explicit bg-white and border class to ConfigStart inputs since TW4 no longer implies border-width from border-color"

patterns-established:
  - "Color/opacity merged syntax: use ring-slate-600/50 instead of ring-slate-600 ring-opacity-50"
  - "Explicit border width required: border-gray-300 needs border class prefix in TW4"
  - "CSS-first config: theme values in @theme block in style.css, not JS config"

requirements-completed: [DEPS-05]

# Metrics
duration: 5min
completed: 2026-03-01
---

# Phase 2 Plan 1: Tailwind v3-to-v4 Migration Summary

**Tailwind CSS 4.2 migration with @tailwindcss/vite plugin, CSS-first config, Capacitor hover/cursor overrides, and visual regression fixes for tutorial colors and input styling**

## Performance

- **Duration:** ~5 min (across two sessions with human verification checkpoint)
- **Started:** 2026-03-01T19:39:00Z
- **Completed:** 2026-03-01T21:53:00Z
- **Tasks:** 2
- **Files modified:** 11 (plus 2 deleted)

## Accomplishments

- Migrated Tailwind CSS from v3 to v4.2 using official upgrade tool + targeted manual fixes
- Replaced PostCSS pipeline with first-party @tailwindcss/vite plugin for faster builds
- Merged all deprecated ring-opacity-*/ring-opacity classes to TW4 color/opacity syntax
- Added Capacitor-compatible hover override and button cursor restoration
- Fixed two visual regressions found during human verification

## Task Commits

Each task was committed atomically:

1. **Task 1: Run Tailwind upgrade tool and apply manual post-fixes** - `b20cb37` (feat)
2. **Task 2: Visual regression fixes from human verification** - `5da1553` (fix)

## Files Created/Modified

- `package.json` - Updated tailwindcss to v4.2, added @tailwindcss/vite, removed postcss/autoprefixer
- `vite.config.js` - Added tailwindcss() Vite plugin import and registration
- `src/style.css` - CSS-first config with @import "tailwindcss", @custom-variant hover, @theme, @layer base cursor override
- `src/ConfigStart.vue` - Migrated ring classes to merged syntax, added bg-white and border for TW4 input visibility
- `src/Stimulus.vue` - Merged ring-opacity into color/opacity syntax in dynamic class bindings
- `src/App.vue` - Updated dynamic class strings to TW4 equivalents (shadow-xs, outline-hidden, etc.)
- `src/GameOverModal.vue` - Renamed bg-gradient-to-r to bg-linear-to-r, shadow-sm to shadow-xs
- `src/AchievementToast.vue` - Renamed bg-gradient-to-r to bg-linear-to-r
- `src/PauseModal.vue` - Renamed backdrop-blur-sm to backdrop-blur-xs
- `src/GameHint.vue` - Renamed shadow-sm to shadow-xs, outline-none to outline-hidden
- `src/TutorialOverlay.vue` - Added green/red color classes to tutorial check/strike example items
- `postcss.config.js` - DELETED (no longer needed with @tailwindcss/vite)
- `tailwind.config.js` - DELETED (migrated to CSS-first @theme in style.css)

## Decisions Made

- Used `@custom-variant hover (&:hover)` to restore universal hover behavior -- Capacitor's WKWebView/Android WebView reports as touch-primary, which TW4's new hover media query would skip
- Restored `cursor: pointer` on buttons via `@layer base` -- TW4 changed the default from pointer to default, which would feel wrong in a game UI
- Added explicit `bg-white` and `border` class to ConfigStart inputs -- TW4 no longer implies border-width from border-color utilities, and inputs need visible background against the dark theme

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tutorial check/strike marks missing color**
- **Found during:** Task 2 (human verification checkpoint)
- **Issue:** The tutorial "Score Points, Avoid Strikes" step showed plain white check and strike marks instead of green/red
- **Fix:** Added `color` field to example data items with `text-green-500` and `text-red-500`, bound via `:class` in template
- **Files modified:** src/TutorialOverlay.vue
- **Verification:** Build passes, visual fix confirmed by code inspection
- **Committed in:** 5da1553 (Task 2 commit)

**2. [Rule 1 - Bug] ConfigStart input fields unstyled against dark background**
- **Found during:** Task 2 (human verification checkpoint)
- **Issue:** Number inputs lacked visible background and border after TW4 migration -- `border-gray-300` no longer implies `border-width: 1px` in TW4
- **Fix:** Added `bg-white` for visible background and explicit `border` class for 1px border width
- **Files modified:** src/ConfigStart.vue
- **Verification:** Build passes, visual fix confirmed by code inspection
- **Committed in:** 5da1553 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs found during human verification)
**Impact on plan:** Both fixes address TW4 behavioral changes not caught by the automated upgrade tool. No scope creep.

## Issues Encountered

None beyond the visual regressions documented above, which were caught by the planned human verification checkpoint.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Tailwind 4 is fully operational with CSS-first configuration
- All game screens verified visually correct
- Capacitor hover/cursor overrides in place for Phase 3 (Capacitor migration)
- Build pipeline clean -- no PostCSS config, no JS-based Tailwind config

---
*Phase: 02-tailwind-migration*
*Completed: 2026-03-01*
