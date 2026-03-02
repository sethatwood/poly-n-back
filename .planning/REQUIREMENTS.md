# Requirements: Poly N-Back -- Milestone 1 (Harden the Foundation)

**Defined:** 2026-03-01
**Core Value:** The n-back gameplay loop must feel incredible -- responsive, satisfying, impossible to put down.

## v1 Requirements

Requirements for Milestone 1. Each maps to roadmap phases.

### Dependency Modernization

- [x] **DEPS-01**: Node.js upgraded from 18 to 22 LTS with .nvmrc file
- [x] **DEPS-02**: Vue upgraded from 3.3 to 3.5.x with no regressions
- [x] **DEPS-03**: Pinia upgraded from 2 to 3 with deprecated API removals addressed
- [x] **DEPS-04**: Vite upgraded from 4 to 7 with @vitejs/plugin-vue 6.x
- [x] **DEPS-05**: Tailwind CSS upgraded from 3 to 4.2+ with @tailwindcss/vite replacing PostCSS pipeline
- [x] **DEPS-06**: Capacitor upgraded from 5 to 8 (sequential 5->6->7->8, native build verified at each step)
- [x] **DEPS-07**: Dead dependencies removed (postcss, autoprefixer, register-service-worker, @vue/cli-plugin-pwa, registerServiceWorker.js)
- [x] **DEPS-08**: ESLint 9 flat config + Prettier configured and passing on all source files

### Bug Fixes & Resilience

- [x] **FIX-01**: Accuracy calculations guarded against division by zero (gameStore getters and stopGame action)
- [x] **FIX-02**: stimulusHistory access bounds-checked in respondToStimulus() before array lookup
- [x] **FIX-03**: Button responses debounced to prevent multiple responses per stimulus turn
- [x] **FIX-04**: Stimulus history capped to nBack + 50 entries to prevent unbounded memory growth
- [x] **FIX-05**: All setTimeout/setInterval calls use managed timeout utility with automatic cleanup on unmount
- [x] **FIX-06**: Persistent data migrated from localStorage to @capacitor/preferences (high scores, achievements, audio preference, tutorial state)
- [x] **FIX-07**: All storage reads validate data schema and fall back to defaults on corruption
- [x] **FIX-08**: Global error handler installed (app.config.errorHandler + window.onerror + window.onunhandledrejection)
- [x] **FIX-09**: Audio system tracks readiness state and degrades gracefully when AudioContext unavailable or sounds fail to load
- [x] **FIX-10**: All storage writes wrapped in try-catch to handle quota exceeded errors

### Architecture

- [x] **ARCH-01**: App.vue reduced to ~80 lines (thin shell: screen routing and overlay mounting only)
- [x] **ARCH-02**: GameScreen component extracted (composes game timer, stimulus, response buttons, score display, game over)
- [x] **ARCH-03**: MenuScreen component extracted (composes config, intro content, footer)
- [x] **ARCH-04**: Game sub-components extracted: GameTimer, ResponseButtons, ScoreDisplay, GameOverDisplay
- [x] **ARCH-05**: audioStore extracted from gameStore (singleton AudioContext, buffer loading, iOS unlock flow)
- [x] **ARCH-06**: persistenceStore extracted from gameStore (validated read/write wrapper for @capacitor/preferences)
- [x] **ARCH-07**: Composables extracted: useAnimations, useFeedback, useGameLifecycle, useManagedTimeout
- [x] **ARCH-08**: gameStore refined to use audioStore and persistenceStore (contains pure game logic only)

### TypeScript

- [x] **TS-01**: TypeScript configured with tsconfig.json (allowJs: true for incremental migration)
- [x] **TS-02**: Game domain types defined (Stimulus, HighScoreData, FeedbackState, StimulusAttribute, GameState)
- [x] **TS-03**: All Pinia stores fully typed with setup syntax
- [x] **TS-04**: All composables fully typed with explicit return types
- [x] **TS-05**: All Vue components migrated to `<script setup lang="ts">`
- [x] **TS-06**: Strict mode enabled incrementally (noImplicitAny -> strictNullChecks -> strict: true)
- [x] **TS-07**: vue-tsc --noEmit type checking passing with zero errors

### Testing

- [ ] **TEST-01**: Vitest + @vue/test-utils configured and running
- [ ] **TEST-02**: gameStore unit tests covering stimulus generation, response evaluation, score calculation, turn management, and high score logic
- [ ] **TEST-03**: persistenceStore unit tests covering error handling paths, schema validation, and default fallbacks
- [ ] **TEST-04**: audioStore unit tests covering initialization failure and graceful degradation
- [ ] **TEST-05**: Integration tests for full game flow (start -> gameplay -> game over)
- [ ] **TEST-06**: Integration tests for state transitions (menu -> game -> pause -> resume -> game over)
- [ ] **TEST-07**: Playwright E2E configured with WebKit + Chromium test targets
- [ ] **TEST-08**: CI pipeline runs type-check, unit tests, and build on every push

### Polish

- [ ] **PLSH-01**: Game auto-pauses when app is backgrounded via @capacitor/app appStateChange listener
- [ ] **PLSH-02**: Haptic feedback on correct/incorrect/game-over via @capacitor/haptics (opt-in toggle, off by default)
- [ ] **PLSH-03**: Sentry crash reporting active via @sentry/capacitor with Vue 3 error handler integration

## v2 Requirements

Deferred to Milestone 2 (Monetized Platform). Tracked but not in current roadmap.

### App Store Submission

- **STORE-01**: App icons generated for all required sizes via @capacitor/assets
- **STORE-02**: Splash screen configured with theme color
- **STORE-03**: Status bar themed to match app design
- **STORE-04**: Privacy policy hosted and linked in-app settings
- **STORE-05**: Content rating metadata configured
- **STORE-06**: Accessibility audit (WCAG 2.2 contrast ratios, ARIA labels on game buttons)

### User Accounts & Sync

- **ACCT-01**: User can create account with email/password via Laravel Sanctum
- **ACCT-02**: User can log in with social providers (Google, Apple)
- **ACCT-03**: User game data syncs across devices when logged in
- **ACCT-04**: User can play without account (current behavior preserved)

### Subscriptions

- **SUB-01**: RevenueCat integration for iOS and Android subscriptions
- **SUB-02**: Freemium gate distinguishes free vs premium features
- **SUB-03**: User can subscribe at $4.99/month or $29.99/year

### Game Modes

- **MODE-01**: Zen Mode (no strikes, no timer pressure)
- **MODE-02**: Time Attack (2-minute fixed sessions)
- **MODE-03**: Endless Mode (progressive difficulty increase)
- **MODE-04**: Daily Challenge (fixed seed, once per day)

### Stats & Progression

- **STAT-01**: Session history with per-attribute accuracy tracking
- **STAT-02**: Streaks and achievement progression system
- **STAT-03**: Stats dashboard with charts

### Platform

- **PLAT-01**: Laravel API backend deployed on Forge
- **PLAT-02**: Marketing site at polynback.com
- **PLAT-03**: Web teaser with limited free play funneling to app stores
- **PLAT-04**: polynback.fun -> polynback.com cutover

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Ads of any kind | Focus is sacred in cognitive training -- never |
| New game attributes (sound, size, rotation, 2D grid) | M2+ feature expansion, not hardening |
| Service worker / PWA | iOS WKWebView doesn't support service workers; Capacitor bundles assets natively |
| Dark mode toggle | App is already dark-themed; toggle adds complexity without value |
| i18n / localization | English-only for v1 and v2; revisit when user base warrants it |
| OTA updates (Capgo/Appflow) | Adds dependency and cost; standard app store updates sufficient |
| Analytics (Mixpanel/Firebase) | Requires consent flows and privacy complexity; defer until real user base |
| Real-time chat / social features | High complexity, not core to cognitive training value |
| Video content | Storage/bandwidth costs, not aligned with product |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPS-01 | Phase 1: Core Toolchain Upgrade | Complete |
| DEPS-02 | Phase 1: Core Toolchain Upgrade | Complete |
| DEPS-03 | Phase 1: Core Toolchain Upgrade | Complete |
| DEPS-04 | Phase 1: Core Toolchain Upgrade | Complete |
| DEPS-05 | Phase 2: Tailwind Migration | Complete |
| DEPS-06 | Phase 3: Capacitor Migration | Complete |
| DEPS-07 | Phase 1: Core Toolchain Upgrade | Complete |
| DEPS-08 | Phase 4: Linting & Bug Fixes | Complete |
| FIX-01 | Phase 4: Linting & Bug Fixes | Complete |
| FIX-02 | Phase 4: Linting & Bug Fixes | Complete |
| FIX-03 | Phase 4: Linting & Bug Fixes | Complete |
| FIX-04 | Phase 4: Linting & Bug Fixes | Complete |
| FIX-05 | Phase 4: Linting & Bug Fixes | Complete |
| FIX-06 | Phase 4: Linting & Bug Fixes | Complete |
| FIX-07 | Phase 4: Linting & Bug Fixes | Complete |
| FIX-08 | Phase 4: Linting & Bug Fixes | Complete |
| FIX-09 | Phase 4: Linting & Bug Fixes | Complete |
| FIX-10 | Phase 4: Linting & Bug Fixes | Complete |
| ARCH-01 | Phase 6: Component Extraction | Complete |
| ARCH-02 | Phase 6: Component Extraction | Complete |
| ARCH-03 | Phase 6: Component Extraction | Complete |
| ARCH-04 | Phase 6: Component Extraction | Complete |
| ARCH-05 | Phase 5: Store Extraction | Complete |
| ARCH-06 | Phase 5: Store Extraction | Complete |
| ARCH-07 | Phase 5: Store Extraction | Complete |
| ARCH-08 | Phase 5: Store Extraction | Complete |
| TS-01 | Phase 7: TypeScript Migration | Complete |
| TS-02 | Phase 7: TypeScript Migration | Complete |
| TS-03 | Phase 7: TypeScript Migration | Complete |
| TS-04 | Phase 7: TypeScript Migration | Complete |
| TS-05 | Phase 7: TypeScript Migration | Complete |
| TS-06 | Phase 7: TypeScript Migration | Complete |
| TS-07 | Phase 7: TypeScript Migration | Complete |
| TEST-01 | Phase 8: Testing & CI | Pending |
| TEST-02 | Phase 8: Testing & CI | Pending |
| TEST-03 | Phase 8: Testing & CI | Pending |
| TEST-04 | Phase 8: Testing & CI | Pending |
| TEST-05 | Phase 8: Testing & CI | Pending |
| TEST-06 | Phase 8: Testing & CI | Pending |
| TEST-07 | Phase 8: Testing & CI | Pending |
| TEST-08 | Phase 8: Testing & CI | Pending |
| PLSH-01 | Phase 9: Platform Polish | Pending |
| PLSH-02 | Phase 9: Platform Polish | Pending |
| PLSH-03 | Phase 9: Platform Polish | Pending |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap creation*
