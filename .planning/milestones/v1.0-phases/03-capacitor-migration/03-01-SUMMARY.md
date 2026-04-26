---
phase: 03-capacitor-migration
plan: 01
subsystem: infra
tags: [capacitor, ios, android, spm, native, mobile]

# Dependency graph
requires:
  - phase: 02-tailwind-migration
    provides: "Working Vite 7 + TW4 build producing dist/"
provides:
  - "Capacitor 8.1.0 native shell (iOS SPM + Android Gradle 8.14.3)"
  - "capacitor.config.ts with app ID com.polynback"
  - "Fresh iOS project using Swift Package Manager"
  - "Fresh Android project with compileSdk 36, targetSdk 36, AGP 8.13.0"
affects: [04-linting-bug-fixes, 09-platform-polish]

# Tech tracking
tech-stack:
  added: ["@capacitor/core@^8.1.0", "@capacitor/cli@^8.1.0", "@capacitor/ios@^8.1.0", "@capacitor/android@^8.1.0", "typescript (devDep)"]
  patterns: ["capacitor.config.ts (TypeScript config)", "SPM for iOS (not CocoaPods)", "Fresh native project regeneration for major version jumps"]

key-files:
  created: ["capacitor.config.ts", "ios/App/CapApp-SPM/Package.swift", "ios/debug.xcconfig"]
  modified: ["package.json", "package-lock.json", "android/variables.gradle", "android/build.gradle", "android/app/build.gradle", "ios/App/App.xcodeproj/project.pbxproj", "ios/App/App/Info.plist", ".planning/ROADMAP.md"]

key-decisions:
  - "Direct jump from Cap 5 to 8 (skip 6, 7) via fresh native project regeneration"
  - "App ID changed from fun.polynback to com.polynback"
  - "Keep server.androidScheme: https explicitly (matches Cap 8 default, prevents data loss risk)"
  - "Use SPM for iOS instead of CocoaPods (Cap 8 default for new projects)"

patterns-established:
  - "Fresh native regeneration: delete ios/ and android/, then npx cap add, for major Capacitor version jumps"
  - "TypeScript config: capacitor.config.ts over JSON for type checking and conditional logic"

requirements-completed: [DEPS-06]

# Metrics
duration: 9min
completed: 2026-03-01
---

# Phase 3 Plan 1: Capacitor Migration Summary

**Capacitor 8.1.0 with fresh iOS (SPM) and Android native projects, app ID com.polynback, verified on iOS simulator**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-01T22:32:54Z
- **Completed:** 2026-03-01T22:41:53Z
- **Tasks:** 2
- **Files modified:** 29

## Accomplishments
- Upgraded all four Capacitor packages from ^5.5.1 to ^8.1.0 in a single direct jump
- Created capacitor.config.ts with new app ID com.polynback replacing fun.polynback
- Regenerated fresh iOS project using Swift Package Manager (replacing CocoaPods)
- Regenerated fresh Android project with Gradle 8.14.3, AGP 8.13.0, compileSdk 36, targetSdk 36
- iOS build verified in Xcode 26 simulator -- app loads, WebView renders correctly
- Updated ROADMAP.md Phase 3 description to reflect direct 5-to-8 approach

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade Capacitor packages, create TS config, and regenerate native projects** - `7b72a7e` (feat)
2. **Task 2: Verify iOS and Android builds with gameplay test** - checkpoint:human-verify (iOS approved, Android skipped -- not installed)

## Files Created/Modified
- `capacitor.config.ts` - New TypeScript config with appId com.polynback, background color #0f1729, androidScheme https
- `package.json` - Capacitor packages upgraded to ^8.1.0, typescript added as devDep
- `package-lock.json` - Lock file updated with Cap 8 dependency tree
- `ios/` - Fresh Cap 8 iOS project with SPM (CapApp-SPM package, .xcodeproj, Info.plist)
- `android/` - Fresh Cap 8 Android project (Gradle 8.14.3, AGP 8.13.0, compileSdk 36, targetSdk 36, minSdk 24)
- `android/app/src/main/java/com/polynback/MainActivity.java` - Renamed from fun/polynback to com/polynback
- `.planning/ROADMAP.md` - Phase 3 bullet updated from "Sequential 5 to 6 to 7 to 8" to "Direct 5 to 8"
- `capacitor.config.json` - Deleted (replaced by .ts version)
- `ios/App/Podfile` - Deleted (replaced by SPM)
- `ios/App/Podfile.lock` - Deleted (replaced by SPM)

## Decisions Made
- **Direct 5-to-8 jump:** Skipped intermediate Capacitor versions (6, 7) by regenerating native projects fresh. No custom native code existed, so there was nothing to migrate incrementally.
- **App ID com.polynback:** Changed from fun.polynback per user decision. App is not live, so zero migration consequences.
- **SPM over CocoaPods:** Used `--packagemanager SPM` for iOS. SPM is Cap 8's default for new projects and the future direction. No third-party plugins require CocoaPods.
- **Explicit androidScheme: https:** Kept in config even though it matches Cap 8 default. Documents intent and prevents data loss risk if defaults ever change.
- **Android verification deferred:** Android Studio not installed on this machine. iOS verification confirmed the migration works. Android can be verified when Android Studio is available.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed TypeScript as devDependency**
- **Found during:** Task 1 (native project generation)
- **Issue:** Capacitor 8 CLI requires TypeScript to parse capacitor.config.ts files. `npx cap add ios` failed with "Could not find installation of TypeScript."
- **Fix:** Ran `npm install -D typescript` before retrying cap add commands
- **Files modified:** package.json, package-lock.json
- **Verification:** `npx cap add ios --packagemanager SPM` succeeded after installation
- **Committed in:** 7b72a7e (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** TypeScript was a missing prerequisite for Cap 8's .ts config support. Essential for the migration to work. No scope creep -- TypeScript will also be needed for Phase 7 (TypeScript Migration).

## Issues Encountered
- Android Studio not found at `/Applications/Android Studio.app` when running `npx cap open android`. Android verification skipped. iOS-only verification approved by user.
- Standard Xcode simulator console warnings observed (WebPrivacy, RBSServiceErrorDomain entitlement errors, RTIInputSystemClient) -- all normal and expected for simulator builds.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Capacitor 8 native shell is fully operational on iOS
- Android project is generated and synced, ready for verification when Android Studio is available
- All dependency upgrades complete (Node 22, Vue 3.5, Pinia 3, Vite 7, TW4, Cap 8) -- Phase 4 (Linting & Bug Fixes) can proceed
- TypeScript devDependency is now available for Phase 7 migration

## Self-Check: PASSED

All claimed artifacts verified:
- capacitor.config.ts: FOUND
- ios/: FOUND
- android/: FOUND
- 03-01-SUMMARY.md: FOUND
- Commit 7b72a7e: FOUND

---
*Phase: 03-capacitor-migration*
*Completed: 2026-03-01*
