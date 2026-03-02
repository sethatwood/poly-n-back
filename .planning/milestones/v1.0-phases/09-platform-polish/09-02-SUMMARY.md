---
phase: 09-platform-polish
plan: 02
subsystem: monitoring
tags: [sentry, crash-reporting, capacitor, vue, error-handling]

# Dependency graph
requires:
  - phase: 09-platform-polish
    provides: "@sentry/capacitor 3.1.0 and @sentry/vue 10.40.0 installed (Plan 01)"
provides:
  - "initSentry module with @sentry/capacitor v3 siblingOptions.vueOptions pattern"
  - "Conditional error handling: Sentry in production, console.error in development"
  - ".env.production with placeholder VITE_SENTRY_DSN for user configuration"
  - "Vite env type declarations for VITE_SENTRY_DSN and VITE_APP_VERSION"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: ["siblingOptions.vueOptions pattern for @sentry/capacitor v3 Vue integration", "conditional error handling by environment (PROD vs DEV)"]

key-files:
  created: [src/sentry.ts, .env.production]
  modified: [src/main.ts, src/env.d.ts]

key-decisions:
  - "trackComponents placed in tracingOptions (not root VueOptions) per @sentry/vue 10.40.0 type definitions"
  - "attachErrorHandler: true explicitly set since VueOptions requires it (not optional)"

patterns-established:
  - "Sentry init guard: early return when DSN empty for graceful skip in unconfigured environments"
  - "Environment-conditional error handling: Sentry owns errors in PROD, console.error preserved in DEV"

requirements-completed: [PLSH-03]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 9 Plan 2: Sentry Crash Reporting Summary

**Sentry crash reporting with Vue component context using @sentry/capacitor v3 siblingOptions.vueOptions pattern, conditional on production environment**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T18:53:08Z
- **Completed:** 2026-03-02T18:55:48Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- Created `src/sentry.ts` with initSentry function using @sentry/capacitor v3 siblingOptions.vueOptions pattern
- Updated `src/main.ts` with conditional error handling: Sentry in production, console.error handlers in development
- Added `.env.production` with placeholder DSN and version for user configuration
- Added Vite env type declarations for VITE_SENTRY_DSN and VITE_APP_VERSION

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Sentry module, update main.ts, configure environment** - `d762d31` (feat)

**Plan metadata:** _(pending)_ (docs: complete plan)

## Files Created/Modified
- `src/sentry.ts` - Sentry initialization module with initSentry(app) using siblingOptions.vueOptions pattern
- `src/main.ts` - Conditional Sentry init in production, console.error handlers in development
- `.env.production` - Placeholder VITE_SENTRY_DSN and VITE_APP_VERSION for user configuration
- `src/env.d.ts` - ImportMetaEnv type declarations for VITE_SENTRY_DSN and VITE_APP_VERSION

## Decisions Made
- `trackComponents` placed inside `tracingOptions` (not root `VueOptions`) per @sentry/vue 10.40.0 type definitions -- the plan's research had it at root level but the actual types put it under `TracingOptions`
- `attachErrorHandler: true` explicitly set since `VueOptions` interface requires it as a non-optional boolean property

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] trackComponents is a TracingOptions property, not direct VueOptions**
- **Found during:** Task 1 (type checking)
- **Issue:** Plan specified `trackComponents: true` at the root of `vueOptions`, but @sentry/vue 10.40.0 types define it under `TracingOptions`
- **Fix:** Moved `trackComponents: true` inside `tracingOptions: { trackComponents: true }` within `vueOptions`
- **Files modified:** src/sentry.ts
- **Verification:** `npx vue-tsc --noEmit` passes
- **Committed in:** d762d31 (Task 1 commit)

**2. [Rule 1 - Bug] VueOptions requires attachErrorHandler property**
- **Found during:** Task 1 (type checking)
- **Issue:** `attachErrorHandler` is a required (non-optional) boolean in `VueOptions` interface, but plan omitted it
- **Fix:** Added `attachErrorHandler: true` to vueOptions (we want Sentry to capture Vue errors)
- **Files modified:** src/sentry.ts
- **Verification:** `npx vue-tsc --noEmit` passes
- **Committed in:** d762d31 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs in plan's type assumptions)
**Impact on plan:** Both fixes necessary for TypeScript correctness. No scope creep -- same functionality, correct types.

## Issues Encountered
None -- type errors were caught by vue-tsc and fixed immediately.

## User Setup Required
To enable Sentry crash reporting in production:
1. Create a Sentry project at https://sentry.io
2. Copy the DSN from Project Settings > Client Keys
3. Create `.env.production.local` with your DSN: `VITE_SENTRY_DSN=https://your-key@sentry.io/project-id`
4. Update `VITE_APP_VERSION` to match your release version
5. The `.env.production.local` file is gitignored (via `*.local` pattern) to protect your DSN

## Next Phase Readiness
- Sentry integration complete -- ready for production crash monitoring once user provides DSN
- This is the final plan in Phase 9 (Platform Polish) and the final phase in Milestone 1

## Self-Check: PASSED

All files verified present. Commit d762d31 verified in git log.

---
*Phase: 09-platform-polish*
*Completed: 2026-03-02*
