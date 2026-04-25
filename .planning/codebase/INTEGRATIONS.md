# External Integrations

**Analysis Date:** 2026-04-25

## APIs & External Services

**Error Tracking:**
- Sentry - Crash and error monitoring in production
  - SDK/Client: `@sentry/capacitor` (3.1.0) and `@sentry/vue` (10.40.0)
  - Auth: `VITE_SENTRY_DSN` (env var)
  - Initialization: `src/sentry.ts`
  - Active only in production (`import.meta.env.PROD`)

## Data Storage

**Local Preferences (Device Storage):**
- Capacitor Preferences API (`@capacitor/preferences`)
  - Client: `@capacitor/preferences` 8.0.1
  - Location: `src/stores/persistenceStore.ts`
  - Keys stored:
    - `highScoreData` - Player high scores and statistics
    - `isAudioEnabled` - Audio preference flag
    - `achievements` - Player achievement tracking
    - `tutorialCompleted` - Tutorial completion status
    - `_migrated` - Migration tracking flag

**File Storage:**
- Not currently used. Static assets only (images, fonts in `public/`)

**Caching:**
- In-memory Pinia stores for runtime state
- No external caching service (Milestone 2 is backend-free)

## Authentication & Identity

**Auth Provider:**
- None (Backend-free in Milestone 2)
- In-App Purchase (IAP) planned for Milestone 2 but not yet implemented
  - iOS StoreKit integration deferred
  - Google Play Billing integration deferred

## Monitoring & Observability

**Error Tracking:**
- Sentry (v10.40.0 for Vue, v3.1.0 for Capacitor)
  - Configured in `src/sentry.ts`
  - Captures Vue errors, unhandled rejections, global errors
  - Version included in release name: `poly-n-back@{VITE_APP_VERSION}`
  - Environment tracking: uses `import.meta.env.MODE`
  - Component tracking enabled via `trackComponents: true`

**Logs:**
- Development: Console-based logging (console.error, console.warn)
  - Error handler in `src/main.ts` logs to console in development
  - Global error handlers for development debugging
- Production: Sentry error tracking (no local logging)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- Sentry error reporting (one-way)
- App lifecycle callbacks (native):
  - App pause/resume events via `@capacitor/app`
  - Handled in `src/composables/useGameLifecycle.ts`

## Native Mobile Features

**Capacitor Plugins Used:**

**@capacitor/app 8.0.1:**
- App lifecycle management (pause/resume)
- Location: `src/composables/useGameLifecycle.ts`
- Listens for app state changes to pause/resume game

**@capacitor/preferences 8.0.1:**
- Persistent device storage
- Replaces browser localStorage with native secure storage
- Location: `src/stores/persistenceStore.ts`
- Migration from localStorage to Capacitor Preferences in `migrateFromLocalStorage()`

**@capacitor/haptics 8.0.1:**
- Haptic feedback (vibration)
- No-throw implementation in `src/utils/haptics.ts`
- Functions:
  - `hapticsCorrect()` - Light impact for correct answers
  - `hapticsIncorrect()` - Warning notification for incorrect
  - `hapticsGameOver()` - Error notification for game end
- Failures silently ignored (haptics optional)

**@capacitor/ios 8.1.0 & @capacitor/android 8.1.0:**
- Native runtime bridges
- Xcode/Android Studio project files in `ios/` and `android/` directories
- Capacitor config: `capacitor.config.ts`
  - App ID: `com.polynback`
  - App Name: `Poly N-Back`
  - Web directory: `dist/` (Vite build output)
  - Android scheme: HTTPS
  - Background color: `#0f1729` (dark theme)

**@capacitor/cli 8.1.0:**
- Development tool for managing native code synchronization
- Commands: `npx cap sync`, `npx cap build`, `npx cap open`

## Native Project Configuration

**iOS:**
- Location: `ios/App/`
- Xcode project: `ios/App/App.xcodeproj`
- Swift AppDelegate: `ios/App/App/AppDelegate.swift`
- Configuration: `ios/App/App/Info.plist`
- Assets: `ios/App/App/Assets.xcassets`
- Package manager: CocoaPods (via Capacitor)
- Deployment target: iOS configured for app store

**Android:**
- Location: `android/`
- Gradle build system: `android/build.gradle`, `android/app/build.gradle`
- App namespace: `com.polynback`
- Min SDK: rootProject variable (typical: API 24)
- Target SDK: rootProject variable (typical: API 34+)
- Build types: Debug and Release (with ProGuard obfuscation disabled)
- Google Services: `google-services.json` optional (for Firebase/push notifications)
  - Currently not applied (Firebase not in use)

## Environment Configuration

**Required env vars:**
- `VITE_SENTRY_DSN` - Sentry Data Source Name for error tracking
- `VITE_APP_VERSION` - Application version string (used in release naming)

**Secrets location:**
- `.env.production` - Production environment configuration (committed, no secrets)
- No .env files with secrets in repo (follows best practices)

## Third-Party Services Summary

**Active in Production:**
- Sentry error tracking only

**Planned (Milestone 2 - Not Yet Implemented):**
- Apple App Store (StoreKit 2 for IAP)
- Google Play Store (Google Play Billing for IAP)

**Not Used:**
- Firebase (no push notifications in M2)
- Backend APIs (backend-free in M2, deferred to M3)
- Cloud storage
- Analytics services

---

*Integration audit: 2026-04-25*
