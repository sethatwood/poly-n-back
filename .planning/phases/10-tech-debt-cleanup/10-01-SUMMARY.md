---
phase: 10-tech-debt-cleanup
plan: 01
subsystem: linting
tags: [eslint, vue-block-lang, ci, lint-check, typescript]

# Dependency graph
requires:
  - phase: 07-typescript-migration
    provides: TypeScript migration of all .vue files (enabling vue/block-lang re-enable)
  - phase: 08-testing-ci
    provides: CI pipeline and test infrastructure
provides:
  - Zero-error eslint across all source and test files
  - vue/block-lang rule enforcement on all .vue components
  - lint:check npm script for CI (no --fix)
  - Lint step in CI check job (before type-check)
  - All eslint-disable comments justified with -- suffix
affects: [all-future-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "eslint-disable-next-line comments MUST include -- justification suffix"
    - "CI lint:check runs before type-check for fastest feedback"

key-files:
  created: []
  modified:
    - eslint.config.js
    - package.json
    - .github/workflows/ci.yml
    - src/stores/audioStore.ts
    - src/main.ts
    - src/stores/__tests__/audioStore.test.ts
    - src/stores/__tests__/persistenceStore.test.ts
    - src/stores/__tests__/gameFlow.integration.test.ts
    - src/stores/__tests__/stateTransitions.integration.test.ts

key-decisions:
  - "eslint-disable justifications use -- suffix convention for consistent documentation"
  - "Unused app variable removed by dropping assignment rather than adding underscore prefix"

patterns-established:
  - "eslint-disable-next-line with -- justification: all disable comments must explain why the cast is necessary"
  - "CI lint ordering: lint:check before type-check before test:unit before build"

requirements-completed: [DEPS-08]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 10 Plan 01: ESLint Cleanup Summary

**Zero-error ESLint with justified disable comments, re-enabled vue/block-lang rule, and CI lint enforcement via lint:check step**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T22:23:09Z
- **Completed:** 2026-03-02T22:26:14Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Resolved all 20 ESLint errors across 6 source/test files with justified disable comments
- Re-enabled vue/block-lang rule (removed temporary off override from Phase 07 migration)
- Added lint:check npm script (eslint without --fix) for CI use
- Integrated lint:check into CI check job, running before type-check for fastest feedback
- Fixed unused app variable in stateTransitions.integration.test.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Add eslint-disable-next-line justifications to all 20 lint errors** - `5468e00` (fix)
2. **Task 2: Re-enable vue/block-lang, add lint:check script, integrate lint into CI** - `0616ee2` (feat)

## Files Created/Modified
- `src/stores/audioStore.ts` - Added disable justification for Safari webkitAudioContext compat
- `src/main.ts` - Added justification to existing disable for dev-only window.gameStore
- `src/stores/__tests__/audioStore.test.ts` - Added 12 disable justifications for browser API removal mocks
- `src/stores/__tests__/persistenceStore.test.ts` - Added 3 disable justifications for Preferences mock methods
- `src/stores/__tests__/gameFlow.integration.test.ts` - Added 1 disable justification for Preferences._reset mock
- `src/stores/__tests__/stateTransitions.integration.test.ts` - Removed unused app variable, added 2 disable justifications
- `eslint.config.js` - Removed vue/block-lang: off override to re-enable enforcement
- `package.json` - Added lint:check script
- `.github/workflows/ci.yml` - Added npm run lint:check step to check job

## Decisions Made
- eslint-disable justifications use `--` suffix convention for consistent documentation across the codebase
- Unused `app` variable in stateTransitions was removed by dropping the assignment entirely rather than adding an underscore prefix, since the value was not needed in the test setup

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Lint enforcement active in CI -- any future lint regressions will fail the build
- All .vue files enforced to have lang="ts" via vue/block-lang
- Ready for Plan 02 (remaining tech debt items)

## Self-Check: PASSED

All 9 modified files verified present. Both task commits (5468e00, 0616ee2) verified in git log. SUMMARY.md exists.

---
*Phase: 10-tech-debt-cleanup*
*Completed: 2026-03-02*
