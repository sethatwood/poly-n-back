# Feature Landscape: Production Hardening

**Domain:** Cognitive training mobile app (Vue 3 + Capacitor) -- codebase hardening milestone
**Researched:** 2026-03-01
**Confidence:** HIGH (well-established patterns, verified against official docs and current ecosystem)

## Context

This feature landscape covers Milestone 1: "Harden the Foundation" -- everything needed to make an existing, charming but fragile Vue 3 + Capacitor game app production-ready for app store submission. This is NOT about new gameplay features. It is about engineering quality, reliability, and app store compliance.

The existing app has: working quad n-back gameplay, high scores, achievements, audio feedback, basic mobile layout. It lacks: tests, TypeScript, error handling, monitoring, accessibility, proper native lifecycle management, and has stale dependencies (Capacitor 5, Vite 4, Tailwind 3).

---

## Table Stakes

Features/capabilities without which the app will either be rejected from stores, get bad reviews, or have operational blind spots that make paid-user support impossible.

### Engineering Foundation

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| TypeScript migration | Type safety prevents entire classes of runtime bugs. The existing codebase has documented implicit coercion issues and missing type annotations. Without TS, every subsequent feature (M2 subscriptions, sync) is built on sand. | High | Full migration of all `.vue` and `.js` files to `<script setup lang="ts">`. Vue 3.5+ and Pinia both have excellent TS support. Do after dependency updates. |
| Unit test infrastructure (Vitest) | Zero tests means zero confidence in refactors. The game logic (score calculation, accuracy, stimulus matching, n-back comparison) is the core product -- regressions here are catastrophic. | Medium | Vitest + @vue/test-utils. Prioritize store actions (game logic) over component rendering tests. Target 90%+ coverage on `gameStore`. |
| Integration test coverage | Individual units passing does not guarantee the game flow works. Start-to-game-over flow, pause/resume, modal transitions all need coverage. | Medium | Mount App component with real store, simulate user flows. Fake timers for game loop testing. |
| Dependency updates (Capacitor 5->8, Vite 4->7, Tailwind 3->4, Vue 3.3->3.5, Pinia 2->3) | Capacitor 5 is 3 major versions behind. Security patches, performance improvements, and new platform requirements (Android API 36, iOS 15 minimum) all mandate this. App store submissions on stale SDKs risk rejection. | High | Must be sequential: Vue/Vite first (foundational), then Tailwind (CSS), then Capacitor (most breaking changes). Capacitor 8 requires Node 22, Xcode 26+, Android Studio 2025.2.1+. |
| Component decomposition | 488-line App.vue is a maintenance and testing nightmare. Extracting components enables isolated testing, faster comprehension, and safer refactoring. | Medium | Extract: game display area, control buttons, config panel, modal container. Keep App.vue as orchestrator only (~100 lines). |

### Error Handling & Resilience

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Global error handler (`app.config.errorHandler`) | Unhandled errors currently go to browser console only. Users see white screens with no feedback. Production apps must catch, report, and gracefully recover from errors. | Low | Vue 3 provides `app.config.errorHandler` and `app.config.warnHandler`. Also add `window.onerror` and `window.onunhandledrejection` for non-Vue errors. |
| Error boundary components | A crash in AchievementToast should not take down the entire game. Error boundaries isolate failures to the component that caused them. | Low | Vue 3 `onErrorCaptured` hook. Wrap non-critical components (achievements, hints, modals) in boundaries that show fallback UI. |
| localStorage error handling | Documented concern: `JSON.parse()` without try-catch, no `QuotaExceededError` handling. Corrupted localStorage crashes app on startup. | Low | Wrap all reads in try-catch with sensible defaults. Wrap all writes in try-catch with silent degradation. Create a `useStorage` utility. |
| Audio failure graceful degradation | Audio loading failures are silent. Users do not know sound is broken. Audio is part of the core game feedback loop. | Low | Track audio readiness state. If initialization fails, disable audio toggle and show brief notification. Game must remain fully playable without audio. |
| Network error handling for assets | Audio files loaded via `fetch()` with no retry logic. Failed loads silently degrade experience. | Low | Bundle audio assets directly in the build output rather than fetching at runtime. For a Capacitor native app, all assets ship with the binary -- no network needed. |

### App Store Compliance

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Privacy policy | Mandatory for both iOS and Android app store submission regardless of whether the app collects data. Must be accessible in-app and linked in store listing. | Low | Even though Poly N-Back collects no PII, a privacy policy stating "we collect no personal data" is required. Host at polynback.com/privacy or polynback.fun/privacy. |
| App icons (all sizes) | App store submission requires icons at specific resolutions for both platforms. Missing sizes = rejection. | Low | Capacitor 8 provides `@capacitor/assets` tool for generating all required icon sizes from a single source image. |
| Splash screen configuration | Apps without splash screens show white flash on launch. Looks broken and unprofessional. Apple/Google both expect proper launch screens. | Low | `@capacitor/splash-screen` plugin. Configure `launchShowDuration`, `launchAutoHide`, match app theme color `#0f1729`. |
| App completeness | Apple rejects apps with placeholder content, "coming soon" features, or incomplete flows. 40%+ of rejections are for incomplete apps. | Low | Audit all UI for placeholder text. Ensure every button has a destination. Remove any dead code paths or unreachable UI states. |
| Content rating | Both stores require honest completion of content rating questionnaire. | Low | Cognitive training game with no violence, no user-generated content, no social features = lowest age rating. |
| Correct build format | Google Play requires AAB (Android App Bundle) format. iOS requires proper signing and provisioning profiles. | Low | Capacitor 8 handles this. Ensure `capacitor build android` produces AAB, not APK. |

### Data Persistence & Reliability

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Migrate localStorage to Capacitor Preferences | Mobile OSes periodically clear `window.localStorage` in WebView contexts. Apple and Google both document this behavior. High scores and achievements vanishing = terrible UX and 1-star reviews. | Medium | `@capacitor/preferences` uses native `UserDefaults` (iOS) and `SharedPreferences` (Android). Falls back to localStorage on web. All current localStorage usage must migrate. |
| Data validation on load | Corrupted or incomplete data from storage should not crash the app. Every stored value needs schema validation and default fallbacks. | Low | Validate `highScoreData` has all required fields. Validate `achievements` is a valid JSON array. Use defaults if validation fails. |

### Memory & Performance

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Timer cleanup on unmount | Documented concern: `feedbackTimeout` can be overwritten without clearing previous instance. Accumulating timeouts in long sessions causes memory buildup. | Low | Create a `useManagedTimeout` composable that auto-clears on component unmount. Replace all raw `setTimeout`/`setInterval` calls. |
| Stimulus history cap | `stimulusHistory` grows unbounded. Extended sessions (1000+ stimuli) accumulate significant memory. | Low | Cap to `nBack + 50` entries using shift-on-push or circular buffer. Only need `nBack` entries for game logic. |
| Audio context cleanup | AudioContext never cleaned up on app unmount. Multiple buffer sources created without management. | Low | Close AudioContext in app teardown. Track active buffer sources. |

### App Lifecycle Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Background/foreground state handling | When a user switches away from the app mid-game, the game timer keeps running in the background. Coming back to a game-over state is confusing. | Medium | Use `@capacitor/app` plugin's `appStateChange` listener. Auto-pause game when app goes to background. Resume when returning to foreground. |
| Status bar configuration | Status bar must match app theme. Inconsistent styling looks broken. | Low | `@capacitor/status-bar` plugin. Set style to dark content, background color to match app theme `#0f1729`. Handle Android 13+ splash screen timing. |

### Bug Fixes (Documented Concerns)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Division-by-zero guards | Accuracy calculations can produce `Infinity` or `NaN` if `potentialCorrectAnswers` is zero. | Low | Add explicit zero-check guards in all division operations in gameStore getters and actions. |
| Response validation bounds checking | `respondToStimulus()` accesses `stimulusHistory[nBackIndex]` without validating array bounds. | Low | Add guard: `if (nBackIndex < 0 \|\| nBackIndex >= stimulusHistory.length) return early`. |
| Button response debouncing | Rapid clicks could theoretically record multiple responses for a single stimulus. | Low | Debounce or gate responses per stimulus turn. Disable buttons immediately on first response of each type per turn. |

---

## Differentiators

Not expected for a basic app store listing, but these significantly improve perceived quality and set the app apart from typical brain training apps that feel generic or cheaply made.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Crash reporting (Sentry) | Operational visibility into what breaks in production. Without this, you only learn about bugs from 1-star reviews. Sentry has an official `@sentry/capacitor` SDK with native crash support on iOS and Android. Free tier covers 5K events/month. | Medium | Integrate with Vue 3 via `Sentry.init({ app })`. Captures unhandled exceptions, promise rejections, and native crashes. Worth doing in M1 because it pays dividends immediately on launch. |
| Haptic feedback | Physical feedback on correct/incorrect responses makes the game feel native and premium. Competitors like Lumosity and Peak use haptics extensively. Brain training apps without haptics feel like web pages, not apps. | Low | `@capacitor/haptics` plugin. Light impact on correct answer, medium impact on incorrect, heavy on game over. Three lines of code per feedback point. |
| Basic accessibility (color contrast, semantic markup) | WCAG 2.2 Level AA compliance is increasingly expected. EAA (European Accessibility Act) mandates it for EU users as of June 2025. More practically: good contrast and readable text directly improve the experience for ALL users, not just those with disabilities. | Medium | Audit color contrast ratios (4.5:1 minimum). Add ARIA labels to game buttons. Ensure screen readers can navigate core game flow. Poly N-Back's visual nature makes full accessibility complex, but basic compliance is achievable. |
| ESLint + Prettier configuration | Consistent code style across the entire codebase prevents style-related merge conflicts and catches bugs before runtime. ESLint 9 flat config is the current standard. | Low | `eslint` + `@eslint/js` + `eslint-plugin-vue` + `typescript-eslint` + `prettier`. Configure before TS migration so linting catches issues during conversion. |
| Performance guard (bundle size monitoring) | As dependencies update (Capacitor 5->8 adds weight), monitoring bundle size prevents bloat that degrades app startup time. | Low | `rollup-plugin-visualizer` for Vite. Add bundle size check to CI. Set threshold alerts. |
| Structured logging utility | Replace scattered `console.log`/`console.warn` with a structured logger that can be silenced in production and routed to Sentry in error cases. | Low | Simple wrapper: `logger.info()`, `logger.warn()`, `logger.error()`. Production mode suppresses info/warn, routes errors to Sentry. |

---

## Anti-Features

Things to explicitly NOT build in Milestone 1. These are tempting but belong in M2 or later, and building them now would delay the foundation work or create premature complexity.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User accounts / authentication | M2 scope. Requires backend (Laravel), database, session management. Building auth before the foundation is solid means building on sand. | Keep all data local. Migrate localStorage to Capacitor Preferences for reliability. Auth comes in M2 with Laravel backend. |
| Cross-device sync | Requires accounts + backend + conflict resolution. Massive complexity for zero current users paying. | Local-only data in M1. Sync in M2 after accounts exist. |
| RevenueCat / in-app purchases | App store submission without monetization is simpler (no IAP review, no subscription flow testing). Get approved first, add payments second. | Submit free app in M1 (or end of M1). Add RevenueCat in M2. |
| Analytics / event tracking (Mixpanel, Firebase Analytics) | Different from crash reporting. Analytics require privacy policy updates, consent flows, and data processing agreements. Premature optimization of metrics before you have users. | Sentry for errors is sufficient for M1. Add analytics in M2 when there are users to analyze. |
| Service worker / offline mode | Capacitor native apps bundle all assets locally -- they are inherently offline-capable. Service workers do not work in iOS WKWebView. The existing `registerServiceWorker.js` is already disabled and uses a legacy `@vue/cli-plugin-pwa`. | Remove the dead service worker code. Native Capacitor app does not need it. If web PWA support is desired later, use `vite-plugin-pwa` (not the Vue CLI plugin). |
| New game modes (Zen, Time Attack, etc.) | M2 scope per PROJECT.md. Adding modes before the foundation is solid means testing N modes x M configurations. | Harden the one existing mode. New modes in M2 build on the hardened foundation. |
| E2E testing (Playwright/Cypress) | Valuable but heavy setup. Unit + integration tests provide 90% of the safety net. E2E adds CI complexity and flakiness for diminishing returns at this stage. | Unit tests (Vitest) + integration tests (Vitest + @vue/test-utils) cover game logic and flows. E2E can come in M2 if mobile-specific behaviors need testing. |
| Internationalization (i18n) | No evidence of international user demand. Adds complexity to every string in the app. | English only for M1. If international users appear post-launch, add in a future milestone. |
| Over-the-air updates (Capgo/Appflow) | Useful for hotfixes after launch, but adds infrastructure dependency and cost before there are users to update. | Standard app store update flow for M1. Consider OTA updates if rapid iteration becomes necessary post-launch. |
| Dark mode toggle | The app is already dark-themed by default. A toggle adds UI surface area, theme management complexity, and testing burden for negligible benefit. | Keep the existing dark theme. It matches the cognitive training "focus zone" aesthetic. |
| Complex accessibility (VoiceOver game narration) | Full screen reader support for a fast-paced visual pattern matching game is extremely complex and may fundamentally conflict with the game mechanic (timed visual stimuli). | Basic accessibility (contrast, labels, semantic HTML) in M1. If accessibility demand materializes, consider a dedicated accessible game mode in a future milestone. |

---

## Feature Dependencies

```
Dependency updates ──────────┬──→ TypeScript migration
                             ├──→ Capacitor Preferences (needs Cap 8)
                             ├──→ App lifecycle management (needs @capacitor/app 8.x)
                             ├──→ Status bar config (needs @capacitor/status-bar 8.x)
                             ├──→ Splash screen config (needs @capacitor/splash-screen 8.x)
                             ├──→ Haptic feedback (needs @capacitor/haptics 8.x)
                             └──→ Sentry integration (needs @sentry/capacitor compatible version)

TypeScript migration ────────┬──→ Unit test infrastructure (tests should be written in TS)
                             └──→ ESLint + Prettier (TS-aware linting)

Component decomposition ─────┬──→ Error boundary components (wrap extracted components)
                             └──→ Integration tests (test composed component tree)

Unit test infrastructure ────┬──→ Integration test coverage (builds on unit test setup)
                             └──→ CI pipeline test step (run tests in CI)

localStorage error handling ─→ Capacitor Preferences migration (fix handling first, then migrate)

Global error handler ────────→ Sentry integration (Sentry hooks into error handler)

Bug fixes (all) ─────────────→ Unit tests (write tests that prove fixes, prevent regressions)

Timer cleanup ───────────────→ App lifecycle management (pause timers on background)
```

### Critical Path

The longest dependency chain is:

1. **Dependency updates** (foundation everything else builds on)
2. **TypeScript migration** (requires updated deps)
3. **Component decomposition** (easier with TS, enables testing)
4. **Unit tests + bug fixes** (test the decomposed, typed code)
5. **Integration tests** (test the assembled system)

Parallel work possible: App store compliance items (privacy policy, icons, splash screen) can happen alongside any engineering work. Sentry integration can happen after dependency updates, independent of TS migration.

---

## M1 Hardening Recommendation

### Must Complete (App Store Viability)

1. **Dependency updates** -- everything else depends on current tooling
2. **Bug fixes** (division-by-zero, bounds checking, timer cleanup, stimulus history cap) -- these are live defects
3. **localStorage -> Capacitor Preferences migration** -- data loss prevention
4. **Error handling** (global handler, localStorage guards, audio degradation) -- crash prevention
5. **TypeScript migration** -- type safety for all subsequent work
6. **Component decomposition** -- testability and maintainability
7. **Unit + integration tests** -- regression prevention
8. **App lifecycle management** (background/foreground pause) -- expected mobile behavior
9. **App store compliance** (privacy policy, icons, splash screen, status bar) -- submission requirements

### Should Complete (Production Quality)

10. **Sentry crash reporting** -- operational visibility from day one
11. **Haptic feedback** -- native feel for minimal effort
12. **ESLint + Prettier** -- code quality enforcement
13. **Basic accessibility** -- contrast audit, ARIA labels

### Defer to M2

- Everything in Anti-Features list
- Performance monitoring dashboards
- Advanced accessibility (screen reader game modes)

---

## Sources

### Official Documentation (HIGH confidence)
- [Capacitor App Plugin API](https://capacitorjs.com/docs/apis/app)
- [Capacitor Preferences Plugin API](https://capacitorjs.com/docs/apis/preferences)
- [Capacitor Status Bar Plugin API](https://capacitorjs.com/docs/apis/status-bar)
- [Capacitor Splash Screen Plugin API](https://capacitorjs.com/docs/apis/splash-screen)
- [Capacitor Haptics Plugin API](https://capacitorjs.com/docs/apis/haptics)
- [Capacitor 8 Migration Guide](https://capacitorjs.com/docs/updating/8-0)
- [Vue.js Testing Guide](https://vuejs.org/guide/scaling-up/testing)
- [Sentry Capacitor SDK](https://docs.sentry.io/platforms/javascript/guides/capacitor/)
- [Sentry Vue Integration](https://docs.sentry.io/platforms/javascript/guides/vue/)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Verified Sources (MEDIUM confidence)
- [App Store Requirements 2026](https://natively.dev/articles/app-store-requirements) -- Comprehensive submission guide
- [Error Handling in Capacitor Apps](https://capgo.app/blog/error-handling-in-capacitor-apps-ux-best-practices/) -- UX patterns for error handling
- [Apple App Store Rejection Reasons 2025](https://twinr.dev/blogs/apple-app-store-rejection-reasons-2025/) -- Common rejection data
- [WCAG 2.2 Mobile Application Guidance](https://www.w3.org/TR/wcag2mobile-22/) -- Accessibility standards
- [Vue 3 + TypeScript Best Practices 2025](https://eastondev.com/blog/en/posts/dev/20251124-vue3-typescript-best-practices/) -- Enterprise architecture patterns
- [Capacitor Storage Guide](https://ionic.io/blog/choosing-a-data-storage-solution-ionic-storage-capacitor-storage-sqlite-or-ionic-secure-storage) -- Data storage comparison

### Community/WebSearch (LOW confidence, needs validation)
- [Cognitive Training App Quality Review (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10258500/) -- User expectations in brain training space
- [Mobile App Performance Monitoring Patterns](https://www.metricfire.com/blog/how-to-monitor-mobile-game-application-performance/) -- Monitoring approaches
