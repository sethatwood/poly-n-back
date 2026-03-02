---
phase: 08-testing-ci
plan: 01
subsystem: testing
tags: [vitest, happy-dom, pinia-testing, vue-test-utils, coverage-v8]

requires:
  - phase: 07-typescript-migration
    provides: TypeScript codebase with strict types for all stores/composables/components
provides:
  - Vitest 4 test runner with happy-dom environment
  - Global AudioContext/fetch/localStorage stubs for store-safe test imports
  - In-memory @capacitor/preferences manual mock
  - npm test:unit and test:unit:watch scripts
  - Smoke test confirming Pinia + Vitest integration
affects: [08-02, 08-03, 08-04]

tech-stack:
  added: [vitest 4, @vue/test-utils 2, @pinia/testing 1, happy-dom 20, @vitest/coverage-v8 4]
  patterns: [setupFiles for global stubs, __mocks__ for manual module mocks, separate vitest.config.ts]

key-files:
  created:
    - vitest.config.ts
    - src/test-setup.ts
    - __mocks__/@capacitor/preferences.ts
    - src/stores/__tests__/smoke.test.ts
  modified:
    - package.json

key-decisions:
  - "Separate vitest.config.ts instead of merging into vite.config.js to avoid TypeScript/Vite 7 config conflicts"
  - "Class-based AudioContext mock for new AudioCtx() compatibility in audioStore eager init"
  - "Map-based Preferences mock with _reset() for test isolation"

patterns-established:
  - "setupFiles pattern: global stubs in src/test-setup.ts run before all test file imports"
  - "__mocks__/@capacitor/ directory: manual mocks for Capacitor plugins"
  - "Test file convention: src/**/*.test.ts colocated with source"

requirements-completed: [TEST-01]

duration: 2min
completed: 2026-03-02
---

# Phase 8 Plan 1: Test Infrastructure Setup Summary

**Vitest 4 with happy-dom, global AudioContext/fetch stubs, and in-memory Capacitor Preferences mock enabling safe store imports in tests**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T14:34:25Z
- **Completed:** 2026-03-02T14:37:24Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Installed vitest 4, @vue/test-utils 2, @pinia/testing 1, happy-dom 20, @vitest/coverage-v8 4
- Created vitest.config.ts with happy-dom environment, globals, @/ alias, and coverage configuration
- Created test-setup.ts with AudioContext, fetch, and localStorage stubs that prevent audioStore eager init crash
- Created __mocks__/@capacitor/preferences.ts with Map-based in-memory implementation
- Smoke test confirms Pinia + Vitest integration works end-to-end

## Task Commits

Each task was committed atomically:

1. **Task 1: Install test dependencies and add npm scripts** - `ef202f8` (chore)
2. **Task 2: Create vitest.config.ts, test-setup.ts, and Capacitor Preferences mock** - `15b60b9` (feat)

## Files Created/Modified
- `vitest.config.ts` - Vitest configuration with happy-dom, globals, @/ alias, setupFiles, v8 coverage
- `src/test-setup.ts` - Global AudioContext, fetch, and localStorage stubs for store-safe test imports
- `__mocks__/@capacitor/preferences.ts` - In-memory Map-based Preferences mock with get/set/remove/clear/_reset
- `src/stores/__tests__/smoke.test.ts` - Smoke test verifying Pinia + Vitest integration
- `package.json` - Added test:unit and test:unit:watch scripts, 5 new devDependencies

## Decisions Made
- Used separate vitest.config.ts instead of merging into vite.config.js -- avoids TypeScript config conflicts with Vite 7
- Class-based AudioContext mock (not plain object) so `new AudioCtx()` works in audioStore's eager init
- Map-based Preferences mock with `_reset()` helper for test isolation between test files
- Did not add vitest.config.ts to tsconfig.json include -- type-check passes without it, Vitest handles its own TS

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Test infrastructure complete -- Plans 02-04 can now write store tests, component tests, and E2E tests
- `npm run test:unit` exits cleanly with 1 passing smoke test
- AudioContext/fetch stubs prevent audioStore eager init from crashing test runner
- Capacitor Preferences mock ready for persistenceStore tests
- type-check and build both remain green

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 08-testing-ci*
*Completed: 2026-03-02*
