# Roadmap: Poly N-Back -- Milestone 1 (Harden the Foundation)

## Overview

Milestone 1 transforms the working-but-fragile Poly N-Back app into a production-ready codebase that can confidently support monetization in M2. The journey follows a strict sequence: modernize the dependency stack first (when the codebase is simplest and risk is highest), fix all documented bugs, restructure the monolithic architecture into testable units, add TypeScript for safety, write tests against the stable final shape, and finish with native platform polish. Every phase produces a working app. The game's charm -- its animations, audio feedback, and "one more round" feel -- is preserved or enhanced at every step.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Core Toolchain Upgrade** - Node 22, Vue 3.5, Pinia 3, Vite 7, dead dependency removal
- [x] **Phase 2: Tailwind Migration** - Tailwind 3 to 4 with visual regression audit
- [x] **Phase 3: Capacitor Migration** - Direct 5 to 8 with fresh native project regeneration and verified builds
- [x] **Phase 4: Linting & Bug Fixes** - ESLint 9 setup and all documented defect resolutions
- [x] **Phase 5: Store Extraction** - audioStore, persistenceStore, composables extracted from monolith
- [x] **Phase 6: Component Extraction** - App.vue decomposed into focused screen and game components
- [ ] **Phase 7: TypeScript Migration** - Full type safety with incremental strict mode adoption
- [ ] **Phase 8: Testing & CI** - Vitest unit/integration tests, Playwright E2E, CI pipeline
- [ ] **Phase 9: Platform Polish** - Auto-pause, haptic feedback, Sentry crash reporting
- [ ] **Phase 10: Tech Debt Cleanup** - Fix lint errors, add lint to CI, re-enable vue/block-lang, fix docs

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
- [x] 01-02-PLAN.md -- Upgrade Pinia 3 and migrate gameStore to setup syntax

### Phase 2: Tailwind Migration
**Goal**: The visual styling system is modernized to Tailwind 4 without any visual regressions in the game UI
**Depends on**: Phase 1
**Requirements**: DEPS-05
**Success Criteria** (what must be TRUE):
  1. Tailwind CSS 4.2+ is installed with @tailwindcss/vite replacing the PostCSS pipeline
  2. All game screens look identical to pre-migration (menu, gameplay, game over, pause, tutorial overlay)
  3. Dynamic class bindings in game logic (button colors, feedback states, score animations) render correctly
  4. Dark theme has no unintended white borders or color shifts from Tailwind 4 default changes
**Plans:** 1 plan
- [x] 02-01-PLAN.md -- Migrate Tailwind 3 to 4 with upgrade tool, manual post-fixes, and visual verification

### Phase 3: Capacitor Migration
**Goal**: The native shell is updated from Capacitor 5 directly to 8 with fresh native project regeneration and verified iOS/Android builds
**Depends on**: Phase 2
**Requirements**: DEPS-06
**Success Criteria** (what must be TRUE):
  1. Capacitor 8 is installed with all core packages at matching major version (core, cli, ios, android at ^8.1.0)
  2. iOS build compiles and runs in Xcode 26 simulator without errors
  3. Android build compiles and runs in Android Studio without errors
  4. Existing persisted data (high scores, achievements, audio preference, tutorial state) remains accessible on both platforms
  5. Audio playback and iOS audio context unlock continue working on device
  6. App ID is com.polynback on both platforms
**Plans:** 1 plan
- [x] 03-01-PLAN.md -- Upgrade Capacitor 5 to 8 with fresh native projects, config migration to TS, and build verification

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
**Plans:** 3 plans
- [ ] 04-01-PLAN.md -- ESLint 10 + Prettier setup, game logic guards (division-by-zero, debounce, bounds check, history cap)
- [ ] 04-02-PLAN.md -- Storage migration from localStorage to @capacitor/preferences with schema validation
- [ ] 04-03-PLAN.md -- Audio graceful degradation, useManagedTimeout composable, global error handler

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
**Plans:** 3 plans
- [ ] 05-01-PLAN.md -- Create audioStore + persistenceStore, rename store/ to stores/, update all imports
- [ ] 05-02-PLAN.md -- Refactor gameStore to delegate to new stores, migrate all direct Preferences access to persistenceStore
- [ ] 05-03-PLAN.md -- Extract useAnimations, useFeedback, useGameLifecycle composables from App.vue

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
**Plans:** 2 plans
- [x] 06-01-PLAN.md -- Create sub-components (GameTimer, ResponseButtons, ScoreDisplay, GameOverDisplay) and MenuScreen
- [x] 06-02-PLAN.md -- Create GameScreen, reduce App.vue to thin shell, visual verification

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
**Plans:** 4 plans
- [x] 07-01-PLAN.md -- TypeScript infrastructure, domain types, entry point migration, ESLint TS config
- [x] 07-02-PLAN.md -- Convert stores and composables to TypeScript with full type annotations
- [x] 07-03-PLAN.md -- Convert all Vue components to script setup lang="ts", finalize strict mode
- [x] 07-04-PLAN.md -- Complex component TypeScript migration and tsconfig finalization

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
**Plans:** 4 plans
- [x] 08-01-PLAN.md -- Vitest infrastructure, test mocks, npm scripts
- [x] 08-02-PLAN.md -- Store unit tests (gameStore, audioStore, persistenceStore)
- [x] 08-03-PLAN.md -- Store integration tests (game flows, composables)
- [x] 08-04-PLAN.md -- Playwright E2E smoke tests and GitHub Actions CI pipeline

### Phase 9: Platform Polish
**Goal**: The app behaves like a native mobile application with crash visibility and platform-appropriate feedback
**Depends on**: Phase 3 (Capacitor plugins), Phase 8 (tests in place)
**Requirements**: PLSH-01, PLSH-02, PLSH-03
**Success Criteria** (what must be TRUE):
  1. Game automatically pauses when the user switches to another app or locks their phone
  2. Haptic feedback fires on correct, incorrect, and game-over events when the user has opted in (toggle exists in settings, off by default)
  3. Sentry receives crash reports with Vue component context when an unhandled error occurs
**Plans:** 2 plans
- [ ] 09-01-PLAN.md -- Install @capacitor/app + @capacitor/haptics, wire auto-pause and haptic feedback
- [ ] 09-02-PLAN.md -- Wire @sentry/capacitor + @sentry/vue crash reporting with environment config

### Phase 10: Tech Debt Cleanup
**Goal**: All addressable tech debt from the milestone audit is resolved so M2 builds on a clean foundation
**Depends on**: Phase 8 (CI pipeline exists), Phase 9 (all phases complete)
**Requirements**: DEPS-08 (lint regression fix)
**Gap Closure:** Closes LINT-CI-GAP integration gap and 6 tech debt items from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. `npm run lint` passes with zero errors on all source and test files
  2. CI `check` job includes `npm run lint` step
  3. `vue/block-lang` ESLint rule is re-enabled and enforces `lang="ts"` on all components
  4. DEPS-06 description in REQUIREMENTS.md matches actual migration path (direct 5→8)
  5. No `any` casts without explicit `eslint-disable-next-line` justification comments
  6. Android build compiles and runs in Android Studio without errors
**Plans:** 1/2 plans executed

## Progress

**Execution Order:**
Phases execute in numeric order: 1 to 2 to 3 to 4 to 5 to 6 to 7 to 8 to 9 to 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Toolchain Upgrade | 2/2 | Complete | 2026-03-01 |
| 2. Tailwind Migration | 1/1 | Complete | 2026-03-01 |
| 3. Capacitor Migration | 1/1 | Complete | 2026-03-01 |
| 4. Linting & Bug Fixes | 3/3 | Complete | 2026-03-01 |
| 5. Store Extraction | 3/3 | Complete | 2026-03-01 |
| 6. Component Extraction | 2/2 | Complete | 2026-03-02 |
| 7. TypeScript Migration | 4/4 | Complete | 2026-03-02 |
| 8. Testing & CI | 4/4 | Complete | 2026-03-02 |
| 9. Platform Polish | 2/2 | Complete | 2026-03-02 |
| 10. Tech Debt Cleanup | 1/2 | In Progress|  |
