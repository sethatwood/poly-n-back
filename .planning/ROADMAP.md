# Roadmap: Poly N-Back -- Milestone 1 (Harden the Foundation)

## Overview

Milestone 1 transforms the working-but-fragile Poly N-Back app into a production-ready codebase that can confidently support monetization in M2. The journey follows a strict sequence: modernize the dependency stack first (when the codebase is simplest and risk is highest), fix all documented bugs, restructure the monolithic architecture into testable units, add TypeScript for safety, write tests against the stable final shape, and finish with native platform polish. Every phase produces a working app. The game's charm -- its animations, audio feedback, and "one more round" feel -- is preserved or enhanced at every step.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Core Toolchain Upgrade** - Node 22, Vue 3.5, Pinia 3, Vite 7, dead dependency removal
- [ ] **Phase 2: Tailwind Migration** - Tailwind 3 to 4 with visual regression audit
- [ ] **Phase 3: Capacitor Migration** - Sequential 5 to 6 to 7 to 8 with native build verification
- [ ] **Phase 4: Linting & Bug Fixes** - ESLint 9 setup and all documented defect resolutions
- [ ] **Phase 5: Store Extraction** - audioStore, persistenceStore, composables extracted from monolith
- [ ] **Phase 6: Component Extraction** - App.vue decomposed into focused screen and game components
- [ ] **Phase 7: TypeScript Migration** - Full type safety with incremental strict mode adoption
- [ ] **Phase 8: Testing & CI** - Vitest unit/integration tests, Playwright E2E, CI pipeline
- [ ] **Phase 9: Platform Polish** - Auto-pause, haptic feedback, Sentry crash reporting

## Phase Details

### Phase 1: Core Toolchain Upgrade
**Goal**: The app builds and runs on a modern toolchain -- Node 22, Vue 3.5, Pinia 3, Vite 7 -- with all dead dependencies removed
**Depends on**: Nothing (first phase)
**Requirements**: DEPS-01, DEPS-02, DEPS-03, DEPS-04, DEPS-07
**Success Criteria** (what must be TRUE):
  1. App builds and runs identically to current behavior on Node 22 with Vite 7 dev server
  2. .nvmrc file exists and specifies Node 22 LTS
  3. Vue 3.5, Pinia 3, and Vite 7 with @vitejs/plugin-vue 6.x are installed and the app starts without console errors
  4. Dead dependencies (postcss, autoprefixer, register-service-worker, @vue/cli-plugin-pwa) are gone from package.json and registerServiceWorker.js is deleted
  5. All existing gameplay works without regression (start game, play rounds, see scores, hear audio)
**Plans:** 2 plans
- [x] 01-01-PLAN.md -- Upgrade deps (Node 22, Vue 3.5, Vite 7) and remove dead packages
- [ ] 01-02-PLAN.md -- Upgrade Pinia 3 and migrate gameStore to setup syntax

### Phase 2: Tailwind Migration
**Goal**: The visual styling system is modernized to Tailwind 4 without any visual regressions in the game UI
**Depends on**: Phase 1
**Requirements**: DEPS-05
**Success Criteria** (what must be TRUE):
  1. Tailwind CSS 4.2+ is installed with @tailwindcss/vite replacing the PostCSS pipeline
  2. All game screens look identical to pre-migration (menu, gameplay, game over, pause, tutorial overlay)
  3. Dynamic class bindings in game logic (button colors, feedback states, score animations) render correctly
  4. Dark theme has no unintended white borders or color shifts from Tailwind 4 default changes
**Plans**: TBD

### Phase 3: Capacitor Migration
**Goal**: The native shell is updated through four major versions (5 to 8) with verified iOS and Android builds at each step
**Depends on**: Phase 2
**Requirements**: DEPS-06
**Success Criteria** (what must be TRUE):
  1. Capacitor 8 is installed with all core plugins at matching major version
  2. iOS build compiles and runs in Xcode 26 simulator without errors
  3. Android build compiles and runs in Android Studio without errors
  4. Existing persisted data (high scores, achievements, audio preference, tutorial state) survives the migration on both platforms
  5. Audio playback and iOS audio context unlock continue working on device
**Plans**: TBD

### Phase 4: Linting & Bug Fixes
**Goal**: All documented defects are resolved and code quality tooling prevents new ones
**Depends on**: Phase 3
**Requirements**: DEPS-08, FIX-01, FIX-02, FIX-03, FIX-04, FIX-05, FIX-06, FIX-07, FIX-08, FIX-09, FIX-10
**Success Criteria** (what must be TRUE):
  1. ESLint 9 flat config and Prettier pass on all source files with zero warnings
  2. Playing a game where the user makes zero responses does not crash or show NaN (division by zero guarded)
  3. Rapidly tapping a response button only registers one response per stimulus turn (debounced)
  4. Game data persists across app restarts via Capacitor Preferences (not localStorage) and corrupted data falls back to defaults
  5. Audio failures (blocked AudioContext, missing sound files) do not prevent gameplay -- the game plays silently instead of crashing
**Plans**: TBD

### Phase 5: Store Extraction
**Goal**: Game logic is cleanly separated from audio management, data persistence, and UI animation concerns
**Depends on**: Phase 4
**Requirements**: ARCH-05, ARCH-06, ARCH-07, ARCH-08
**Success Criteria** (what must be TRUE):
  1. audioStore exists as a standalone Pinia store managing AudioContext, buffer loading, and iOS unlock flow
  2. persistenceStore exists as a standalone Pinia store wrapping Capacitor Preferences with schema validation and error handling
  3. Composables (useAnimations, useFeedback, useGameLifecycle, useManagedTimeout) are extracted to src/composables/ with explicit APIs
  4. gameStore contains only pure game logic (stimulus generation, response evaluation, score tracking, turn management) and delegates to audioStore and persistenceStore
  5. All gameplay behavior is identical to before extraction -- no animation, audio, or state regressions
**Plans**: TBD

### Phase 6: Component Extraction
**Goal**: The monolithic App.vue is decomposed into focused screen and game components that each own their rendering and local state
**Depends on**: Phase 5
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04
**Success Criteria** (what must be TRUE):
  1. App.vue is reduced to approximately 80 lines (thin shell: screen routing and overlay mounting only)
  2. GameScreen component exists and composes GameTimer, ResponseButtons, ScoreDisplay, and GameOverDisplay
  3. MenuScreen component exists and composes configuration, intro content, and footer
  4. All animations (score pulse, strike flash, feedback fade) work identically to before extraction
  5. Game flow (menu to game to pause to resume to game over to menu) works without state leaks or broken transitions
**Plans**: TBD

### Phase 7: TypeScript Migration
**Goal**: The entire codebase has full type safety with TypeScript strict mode, catching bugs at compile time
**Depends on**: Phase 6
**Requirements**: TS-01, TS-02, TS-03, TS-04, TS-05, TS-06, TS-07
**Success Criteria** (what must be TRUE):
  1. All .js and .vue files use TypeScript (script setup lang="ts" for components, .ts for stores and composables)
  2. Game domain types (Stimulus, HighScoreData, FeedbackState, StimulusAttribute, GameState) are defined in src/types/ and used throughout
  3. All Pinia stores and composables have explicit type annotations with no implicit any
  4. TypeScript strict mode is fully enabled (strict: true in tsconfig.json)
  5. vue-tsc --noEmit passes with zero errors
**Plans**: TBD

### Phase 8: Testing & CI
**Goal**: The codebase has comprehensive automated test coverage and a CI pipeline that catches regressions on every push
**Depends on**: Phase 7
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08
**Success Criteria** (what must be TRUE):
  1. Vitest unit tests cover gameStore logic (stimulus generation, response evaluation, score calculation, turn management, high score persistence)
  2. Vitest unit tests cover persistenceStore error handling, schema validation, and default fallbacks
  3. Vitest unit tests cover audioStore initialization failure and graceful degradation
  4. Integration tests verify full game flows (start to game over, menu to game to pause to resume to game over)
  5. Playwright E2E tests run against WebKit and Chromium targets
  6. CI pipeline runs type-check, unit tests, and build on every push to the repository
**Plans**: TBD

### Phase 9: Platform Polish
**Goal**: The app behaves like a native mobile application with crash visibility and platform-appropriate feedback
**Depends on**: Phase 3 (Capacitor plugins), Phase 8 (tests in place)
**Requirements**: PLSH-01, PLSH-02, PLSH-03
**Success Criteria** (what must be TRUE):
  1. Game automatically pauses when the user switches to another app or locks their phone
  2. Haptic feedback fires on correct, incorrect, and game-over events when the user has opted in (toggle exists in settings, off by default)
  3. Sentry receives crash reports with Vue component context when an unhandled error occurs
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 to 2 to 3 to 4 to 5 to 6 to 7 to 8 to 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Toolchain Upgrade | 0/2 | Planned | - |
| 2. Tailwind Migration | 0/? | Not started | - |
| 3. Capacitor Migration | 0/? | Not started | - |
| 4. Linting & Bug Fixes | 0/? | Not started | - |
| 5. Store Extraction | 0/? | Not started | - |
| 6. Component Extraction | 0/? | Not started | - |
| 7. TypeScript Migration | 0/? | Not started | - |
| 8. Testing & CI | 0/? | Not started | - |
| 9. Platform Polish | 0/? | Not started | - |
