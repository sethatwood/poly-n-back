# Project Research Summary

**Project:** Poly N-Back — Modernization & Hardening (Milestone 1)
**Domain:** Vue 3 + Capacitor cognitive training mobile app (codebase hardening)
**Researched:** 2026-03-01
**Confidence:** HIGH

## Executive Summary

Poly N-Back Milestone 1 is a well-scoped engineering hardening task, not a feature milestone. The existing app has working quad n-back gameplay, high scores, achievements, and audio feedback — but it runs on a 3-year-old stack (Capacitor 5, Vite 4, Tailwind 3, no TypeScript, no tests), and two heavyweight files (488-line App.vue, 311-line gameStore.js) make the codebase fragile. The research conclusively points to a sequential upgrade path followed by incremental refactoring, with TypeScript and tests coming last — not first — because adding them to a moving-target codebase wastes effort. The target state is a production-ready app that can be submitted to the App Store and Play Store with confidence.

The recommended approach is strict sequencing: upgrade dependencies first (Node.js -> Vue/Pinia -> Vite -> Tailwind -> Capacitor), then refactor the architecture (extract composables from App.vue, split gameStore into domain stores), then add TypeScript file-by-file, then write tests against the stable final codebase. Each phase delivers a working app at every commit. The key architectural insight is that the app's "charm" lives in its animations, audio feedback, and game feel — and those are the most fragile parts of the refactor. Watcher chains and timeout management must be handled with deliberate care during component extraction.

The primary risk is Capacitor migration: three major version jumps (5->7, deferring 8 to M2) with sequential native build verification required at each step. The secondary risk is Tailwind v4's class renames causing silent visual regressions in the game's dynamic class bindings. Both risks are well-documented and preventable with the specific mitigations identified in research. The Vite 7 vs Tailwind v4 peer dependency conflict has been resolved in @tailwindcss/vite 4.2.x, making Vite 7 viable. Capacitor 8 is explicitly deferred to M2 due to Xcode 26 requirements and mandatory edge-to-edge layout changes.

---

## Key Findings

### Recommended Stack

All major dependencies require upgrades. The recommended target versions balance stability with modernity, explicitly choosing Capacitor 7 over 8 and TypeScript 5.9 over the 6.0 beta. The @tailwindcss/vite 4.2.x release resolved the previously-blocking Vite 7 peer dependency conflict, making the full Vite 7 + Tailwind 4 combination viable (verify peer deps at migration time).

**Core technologies:**
- **Vue 3.5.x**: No breaking changes from 3.3. Gains `useTemplateRef()`, `useId()`, improved reactivity. Vue 3.6/Vapor not stable — stay on 3.5.
- **Pinia 3.0.x**: "Boring major" per maintainers. Drops deprecated APIs only. This project already uses the correct `defineStore('name', {...})` syntax — migration is near-zero effort.
- **TypeScript 5.9.x**: Current stable. TS 6.0 beta is a bridge release to the Go-based TS 7.0 — do not adopt.
- **Vite 7.x**: Requires Node 20.19+/22.12+. New `baseline-widely-available` browser target. @vitejs/plugin-vue must be upgraded to v6.x in lockstep.
- **Tailwind CSS 4.2.x + @tailwindcss/vite**: Rust-powered engine (5x faster builds). CSS-first config via `@theme`. Automated migration tool (`npx @tailwindcss/upgrade`) handles ~90% of changes.
- **Capacitor 7.4.x** (not 8): Xcode 16+, iOS 14.0+, Android SDK 35. Cap 8 requires Xcode 26+, mandatory edge-to-edge, SPM default — defer to M2.
- **Vitest 4.x + @vue/test-utils**: Native Vite/Vue integration, zero-config TypeScript, ESM-native.
- **Playwright**: WebKit/Safari support critical for iOS-targeted app. Cypress has zero WebKit support — not viable.
- **Node.js 22 LTS**: Required by Vite 7 (22.12+). Also satisfies Tailwind 4 (20+) and future Capacitor 8 (22+).

See `.planning/research/STACK.md` for full version rationale, migration commands, and alternatives considered.

### Expected Features

This milestone is about engineering quality, not new gameplay. Features fall into three clear tiers.

**Must have (table stakes — app store viability):**
- Dependency updates (Capacitor 5->7, Vite 4->7, Tailwind 3->4, Vue 3.3->3.5, Pinia 2->3) — stale SDKs risk app store rejection
- Bug fixes: division-by-zero in accuracy calculations, bounds checking on `stimulusHistory`, feedbackTimeout accumulation, unbounded stimulus history growth
- localStorage -> Capacitor Preferences migration — mobile OSes periodically clear WebView localStorage; data loss = 1-star reviews
- Global error handling + localStorage error guards + audio graceful degradation — white screens are unacceptable
- TypeScript migration — type safety for all subsequent M2 work (subscriptions, sync)
- Component decomposition — 488-line App.vue cannot be tested or safely refactored
- Unit + integration tests with Vitest — zero tests = zero confidence in refactors
- App lifecycle management — auto-pause on background (expected mobile behavior)
- App store compliance: privacy policy, icons (all sizes), splash screen, status bar config, content rating

**Should have (production quality differentiators):**
- Sentry crash reporting (`@sentry/capacitor`) — operational visibility from day one; free tier covers 5K events/month
- Haptic feedback (`@capacitor/haptics`) — three lines of code, makes the app feel native vs. web
- ESLint 9 flat config + Prettier — catch bugs before TypeScript migration begins
- Basic accessibility audit — WCAG 2.2 Level AA contrast ratios, ARIA labels on game buttons

**Defer to M2 (explicitly out of scope):**
- User accounts / authentication, cross-device sync, RevenueCat in-app purchases
- Analytics (Mixpanel, Firebase) — requires consent flows, adds privacy complexity before having users
- Service worker / PWA — native Capacitor apps bundle all assets; service workers don't work in iOS WKWebView
- New game modes — harden the one mode first
- i18n, dark mode toggle, OTA updates (Capgo/Appflow)
- Capacitor 8 upgrade — defer until M2 foundation is solid

See `.planning/research/FEATURES.md` for full feature dependency graph and critical path analysis.

### Architecture Approach

The target architecture splits concerns along three axes: stores own domain state (game rules, audio context, persistence), composables own UI-only stateful logic (animations, feedback timing, managed timeouts), and components are thin shells that render store state and emit events upward. The refactoring is strictly incremental: each step produces a working app.

**Major components after refactoring:**
1. **App.vue** (~80 lines) — thin shell: screen routing, overlay mounting only
2. **MenuScreen.vue** — composes IntroHead, ConfigStart, IntroContent, Footer
3. **GameScreen.vue** — composes GameTimer, Stimulus, ResponseButtons, ScoreDisplay, GameOverDisplay
4. **gameStore.ts** — pure game logic: stimulus generation, response evaluation, score tracking, turn management
5. **audioStore.ts** — singleton Audio context, buffer loading, iOS unlock flow
6. **persistenceStore.ts** — validated read/write wrapper for all localStorage/Capacitor Preferences access
7. **useAnimations.ts, useFeedback.ts, useGameLifecycle.ts, useManagedTimeout.ts** — composables for UI-only state

**Key patterns to follow:**
- Composables for UI-only state (animation flags, feedback visibility) — store for domain state
- Props down / events up for extracted components; overlay components may watch stores directly (cross-cutting)
- `useManagedTimeout` wraps all `setTimeout`/`setInterval` calls — prevents the documented timeout accumulation bug
- Extract composables first (inline in App.vue), then move to files, then extract template sections — never big-bang

**Extraction order (mandatory):** inline composables -> extract composable files -> audioStore -> persistenceStore -> gameStore refinement -> template component extraction -> TypeScript -> tests

See `.planning/research/ARCHITECTURE.md` for full component boundary definitions, data flow diagrams, TypeScript patterns, and anti-patterns.

### Critical Pitfalls

1. **Capacitor Android localStorage wipe (Pitfall 1)** — Cap 5->6 changes `androidScheme` from `http` to `https`, silently destroying all persisted data. Mitigation: this project already has `"androidScheme": "https"` in `capacitor.config.json` — verify it is unchanged after `npx cap migrate` before proceeding. Back up config file first.

2. **Skipping Capacitor versions (Pitfall 2)** — jumping 5->8 directly corrupts native project files in ways that produce cryptic Gradle/Xcode errors. Mitigation: migrate sequentially (5->6, verify build; 6->7, verify build), committing at each step for bisectability. Defer 8 to M2.

3. **Tailwind v4 silent visual regressions (Pitfall 4)** — `npx @tailwindcss/upgrade` handles ~90% of class renames but misses dynamic class bindings. The `buttonClass()` and `feedbackClass()` functions in App.vue construct class strings programmatically — these must be manually audited. Take before/after screenshots of all app states.

4. **Tailwind v4 default color changes (Pitfall 5)** — `border` and `ring` now default to `currentColor` (not gray-200/blue-500). Dark-themed app gains harsh white borders wherever bare `border` or `ring` utilities were used without explicit color.

5. **Component extraction breaks watcher/animation chains (Pitfall 9)** — extracting template sections severs the `watch()` calls in App.vue that drive animation state (`scoreAnimating`, `strikeAnimating`, `feedbackVisible`). Mitigation: map all watchers to their UI elements before extraction; each extracted component owns its own watcher and animation state via composable. Test every animation manually after each extraction step.

Additional watch items: `process.env.NODE_ENV` -> `import.meta.env.DEV` in main.js (Pitfall 10), hover-to-active class audit for mobile touch targets (Pitfall 11), TypeScript strict mode staged adoption starting with `noImplicitAny` (Pitfall 16), `@vitejs/plugin-vue` version must match Vite major (Pitfall 18).

See `.planning/research/PITFALLS.md` for all 18 pitfalls with confidence ratings and phase-specific warnings.

---

## Implications for Roadmap

Based on the combined dependency graph from all four research files, the following phase structure is recommended. Each phase produces a working, shippable app. No phase requires the next to be complete before the previous delivers value.

### Phase 1: Dependency Modernization

**Rationale:** Everything else depends on this. TypeScript requires a stable build, Tailwind 4 requires Vite, Capacitor migration is independent but highest-risk — do it first when the codebase is simplest. This phase has the most critical pitfalls and requires the most careful sequencing.

**Delivers:** Updated dependency tree. Working native builds on iOS and Android with Capacitor 7. Vite 7 + Tailwind 4 build pipeline. Vue 3.5, Pinia 3, Node 22 in place. Dead code removed (postcss, autoprefixer, register-service-worker, @vue/cli-plugin-pwa).

**Addresses (from FEATURES.md):** Dependency updates table stakes item. Enables all subsequent Capacitor plugin features (Preferences, haptics, app lifecycle).

**Avoids:** Pitfall 1 (androidScheme check), Pitfall 2 (sequential Capacitor hops), Pitfall 4+5+6+11 (Tailwind migration), Pitfall 7 (@tailwindcss/vite 4.2.x), Pitfall 10 (import.meta.env), Pitfall 18 (plugin-vue version alignment).

**Migration order within phase:**
1. Node.js 18 -> 22 LTS + .nvmrc
2. Vue 3.5 + Pinia 3 (quick win, validate build)
3. Vite 4 -> 7 + @vitejs/plugin-vue 6.x
4. Tailwind 3 -> 4 (run upgrade tool, manual audit of dynamic classes, screenshot comparison)
5. Capacitor 5 -> 6 (npx cap migrate, verify build, test localStorage persistence)
6. Capacitor 6 -> 7 (npx cap migrate, verify build)
7. ESLint 9 flat config + Prettier (configure before TS migration)

### Phase 2: Bug Fixes & Resilience

**Rationale:** With the dependency foundation stable, address all documented live defects and resilience gaps before introducing new code structure. These are surgical fixes to the existing monolith — easier before the refactor, and they make the refactor safer by establishing what correct behavior looks like.

**Delivers:** No data loss on storage errors. No crashes from division-by-zero or bounds violations. No timeout accumulation. Audio degrades gracefully. Global error handler in place. localStorage migrated to Capacitor Preferences.

**Addresses (from FEATURES.md):** All bug fix items, localStorage error handling, audio failure graceful degradation, data validation on load, timer cleanup, stimulus history cap, global error handler.

**Avoids:** Introducing test infrastructure before the code shape is stable would mean rewriting tests after the refactor.

**Key work:**
- Division-by-zero guards in gameStore getters/actions
- Bounds checking on `respondToStimulus()` stimulus history access
- Button response debouncing (disable on first response per turn)
- Stimulus history capped to `nBack + 50`
- `useManagedTimeout` composable (inline first, then extract) replacing all raw setTimeout calls
- localStorage -> `@capacitor/preferences` migration for highScoreData, achievements, isAudioEnabled, tutorialCompleted
- Data schema validation with defaults on all storage reads
- `app.config.errorHandler` + `window.onerror` + `window.onunhandledrejection`
- Audio readiness state tracking with graceful fallback

### Phase 3: Architecture Refactoring

**Rationale:** Component extraction and store splitting must happen before TypeScript migration. Adding types to the monolithic App.vue would annotate code that is about to move — wasted effort and merge conflicts. Extract first, then type the new smaller files.

**Delivers:** App.vue reduced to ~80 lines. gameStore.js split into gameStore.ts, audioStore.ts, persistenceStore.ts. New composables (useAnimations, useFeedback, useGameLifecycle, useManagedTimeout) extracted to src/composables/. New screen and game components extracted from App.vue.

**Addresses (from FEATURES.md):** Component decomposition (testing enabler), separation of concerns.

**Avoids:** Pitfall 8 (Options API -> script setup conversion happens here, not during TS migration), Pitfall 9 (watcher/animation chain preservation), Anti-pattern 1 (big-bang rewrite).

**Extraction order (strict):**
1. Inline composables inside App.vue's setup() (no template changes)
2. Extract composable files to src/composables/
3. Extract audioStore from gameStore (parallel with step 2 — different files)
4. Extract persistenceStore (parallel — different files)
5. Refine gameStore to use audioStore + persistenceStore
6. Extract template: GameTimer -> ResponseButtons -> ScoreDisplay -> GameOverDisplay -> GameScreen -> MenuScreen -> thin App.vue

### Phase 4: TypeScript Migration

**Rationale:** With the architecture stable, TypeScript is added file-by-file to final component shapes. `allowJs: true` means no broken builds during migration. Strict mode is enabled incrementally to avoid a "wall of errors."

**Delivers:** Full TypeScript codebase. `vue-tsc --noEmit` in CI. All game domain types defined (Stimulus, HighScoreData, FeedbackState, StimulusAttribute). All stores typed with setup syntax.

**Addresses (from FEATURES.md):** TypeScript migration table stakes item. Type safety foundation for M2 (subscriptions, sync).

**Avoids:** Pitfall 16 (strict mode staged: noImplicitAny -> strictNullChecks -> strict: true).

**Migration order within phase:**
1. tsconfig.json with strict: false, allowJs: true
2. Rename vite.config.js -> vite.config.ts, src/main.js -> src/main.ts
3. Create src/types/game.ts (shared interfaces)
4. All new composable + store files written as .ts from creation
5. Leaf components first (Footer, IntroHead) -> modal components -> store-connected components -> complex components
6. gameStore.ts + audioStore.ts + persistenceStore.ts
7. App.vue last
8. Enable strict: true, fix remaining issues
9. Add `vue-tsc --noEmit` to CI

### Phase 5: Test Infrastructure

**Rationale:** Tests written last are written once, in TypeScript, against the final codebase shape. Tests written during migration get rewritten after each structural change — wasted effort. The test suite targets the stable, typed, decomposed codebase.

**Delivers:** Vitest + @vue/test-utils for unit and integration tests. Playwright for E2E (web layer). 90%+ coverage on gameStore. Game flow integration tests. CI pipeline with type-check + test + build steps.

**Addresses (from FEATURES.md):** Unit test infrastructure, integration test coverage.

**Avoids:** Pitfall 17 (tests after migrations, not before).

**Test priorities:**
1. gameStore: stimulus generation, response evaluation, score calculation, turn management (highest value — core product)
2. persistenceStore: error handling paths, schema validation, defaults
3. audioStore: graceful degradation on init failure
4. Integration: start-to-game-over flow, pause/resume, modal transitions
5. E2E (Playwright): full game session on Chromium + WebKit (Safari critical for iOS target)

### Phase 6: App Store Polish & Compliance

**Rationale:** App store compliance items (privacy policy, icons, splash screen, status bar, haptics) can be done in parallel with any engineering phase but are grouped here as a final polish pass before submission. Some items require native plugin installation that is cleaner after all Capacitor migrations are complete.

**Delivers:** App store-ready build. Privacy policy hosted and linked in-app. All icon sizes generated. Splash screen configured. Status bar themed. Haptic feedback on game events. Sentry crash reporting active. Background/foreground lifecycle handling. Basic accessibility audit complete.

**Addresses (from FEATURES.md):** All app store compliance items, differentiators (Sentry, haptics, accessibility, structured logging).

**Key work:**
- Privacy policy: "we collect no personal data" hosted at polynback.com/privacy
- `@capacitor/assets` for icon generation from single source image
- `@capacitor/splash-screen`: launchAutoHide, theme color #0f1729
- `@capacitor/status-bar`: dark content, background #0f1729
- `@capacitor/app` appStateChange listener: auto-pause game on background
- `@capacitor/haptics`: light/medium/heavy impacts on correct/incorrect/game-over
- Sentry: `@sentry/capacitor` + Vue 3 integration, routes to global error handler
- Audit all `hover:` classes for corresponding `active:` states (Tailwind v4 mobile hover change)
- WCAG 2.2 contrast audit, ARIA labels on game buttons

### Phase Ordering Rationale

- Dependency upgrades first because every subsequent phase requires them; Capacitor migration is highest-risk and done first when the codebase is at its simplest
- Bug fixes second because they are surgical edits to existing code, easier before structural changes; they also define what correct behavior looks like for the subsequent tests
- Architecture refactoring third — smaller files are easier to type; Options API -> script setup conversion happens here naturally
- TypeScript fourth — typed against final component shapes; `allowJs` means zero broken-build risk during migration
- Tests fifth — written once in TypeScript against the stable final codebase; test config is trivial with Vite 7 already in place
- App store polish sixth — many items require plugins installed after Capacitor migration; groups nicely as a submission-gate phase

### Research Flags

**Phases that may need additional research during planning:**
- **Phase 1 (Dependency Modernization):** Check `@tailwindcss/vite` peer dependency against Vite 7 at execution time (`npm info @tailwindcss/vite peerDependencies`) — resolved in 4.2.x as of research date but confirm. Also check whether Capacitor 8 + Xcode 26 situation has changed before committing to Capacitor 7 target.
- **Phase 6 (App Store Compliance):** iOS and Android submission requirements evolve. Verify App Store Review Guidelines version at submission time. `@capacitor/assets` API may have changed.

**Phases with standard, well-documented patterns (skip research-phase):**
- **Phase 2 (Bug Fixes):** All bugs are documented in CONCERNS.md with specific line numbers and clear fixes. Standard JavaScript/Vue patterns.
- **Phase 3 (Architecture Refactoring):** Vue composable extraction and Pinia store splitting are well-documented patterns. The extraction order is fully specified in ARCHITECTURE.md.
- **Phase 4 (TypeScript Migration):** Gradual `allowJs` migration is the established industry pattern. Vue TypeScript guide covers all patterns needed.
- **Phase 5 (Test Infrastructure):** Vitest + @vue/test-utils config is trivial with Vite 7 in place. Playwright config is standard.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All major versions verified against official release notes, changelogs, and migration guides. One uncertainty: @tailwindcss/vite peer dep resolved in 4.2.x — verify at execution time. |
| Features | HIGH | Well-established patterns for mobile app hardening. App store requirements sourced from official Apple/Google guidelines. Feature dependencies are clearly mapped. |
| Architecture | HIGH | Vue composable and Pinia store patterns sourced from official Vue/Pinia documentation. Extraction order derived from actual codebase analysis. |
| Pitfalls | HIGH | Most critical pitfalls sourced from official migration guides and verified GitHub issues. Two MEDIUM-confidence items: @tailwindcss/vite Vite 7 conflict (resolved in 4.2.x), Capacitor 8 CocoaPods->SPM migration behavior (defer to M2 eliminates this risk for M1). |

**Overall confidence: HIGH**

### Gaps to Address

- **Vite 7 + @tailwindcss/vite compatibility:** Research confirms resolution in 4.2.x, but this should be verified with `npm info @tailwindcss/vite peerDependencies` before starting Phase 1. If not yet resolved, target Vite 6 instead with minimal impact.
- **Capacitor 7 native build environment:** Sequential migration (5->6->7) is well-documented, but actual native build verification on each step depends on local Xcode/Android Studio versions matching requirements (Xcode 16+, Android Studio Ladybug). Verify toolchain versions before starting.
- **Sentry @sentry/capacitor compatibility with Capacitor 7:** Research confirmed Sentry Capacitor SDK exists with Vue integration, but exact version compatibility with Cap 7 (vs Cap 8) should be verified at Phase 6 implementation time.
- **App Store approval timeline:** Research addresses submission requirements but not review timeline. Plan for 1-3 day review cycles on first submission.

---

## Sources

### Primary (HIGH confidence)
- [Vue 3.5 Announcement](https://blog.vuejs.org/posts/vue-3-5) — version features, breaking changes
- [Vite 7 Announcement](https://vite.dev/blog/announcing-vite7) — Node requirements, baseline browser target
- [Vite Migration Guides v5/v6/v7](https://vite.dev/guide/migration) — breaking changes per version
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) — class renames, config migration, color defaults, hover changes
- [Capacitor 6 Migration Guide](https://capacitorjs.com/docs/updating/6-0) — androidScheme change, sequential migration requirement
- [Capacitor 7 Migration Guide](https://capacitorjs.com/docs/updating/7-0) — Xcode 16+, SDK 35, Gradle 8.7.2
- [Capacitor 8 Migration Guide](https://capacitorjs.com/docs/updating/8-0) — SPM default, edge-to-edge, Xcode 26 (deferred to M2)
- [Pinia v2 to v3 Migration](https://pinia.vuejs.org/cookbook/migration-v2-v3.html) — deprecated API removals
- [Vue TypeScript Guide](https://vuejs.org/guide/typescript/overview) — script setup vs Options API for TS
- [Vue Testing Guide](https://vuejs.org/guide/scaling-up/testing) — Vitest + @vue/test-utils patterns
- [Vue Composables Official Guide](https://vuejs.org/guide/reusability/composables.html) — naming, lifecycle cleanup, patterns
- [Pinia Composing Stores](https://pinia.vuejs.org/cookbook/composing-stores.html) — cross-store composition
- [Capacitor App Plugin API](https://capacitorjs.com/docs/apis/app) — appStateChange for lifecycle
- [Capacitor Preferences Plugin API](https://capacitorjs.com/docs/apis/preferences) — replaces localStorage
- [Sentry Capacitor SDK](https://docs.sentry.io/platforms/javascript/guides/capacitor/) — Vue 3 integration
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — submission requirements
- [Capacitor 6 localStorage Bug — GitHub #7548](https://github.com/ionic-team/capacitor/issues/7548) — androidScheme data loss confirmed
- [Vue releases](https://github.com/vuejs/core/releases) — v3.5.28 latest confirmed Feb 2026
- [Pinia releases](https://github.com/vuejs/pinia/releases) — v3.0.4 latest confirmed

### Secondary (MEDIUM confidence)
- [@tailwindcss/vite Vite 7 issue — vitejs/vite#20284](https://github.com/vitejs/vite/issues/20284) — peer dep conflict, resolved in 4.2.x
- [tailwindlabs/tailwindcss#18381](https://github.com/tailwindlabs/tailwindcss/issues/18381) — Vite 7 support tracking
- [TypeScript 6.0 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-beta/) — confirmed bridge release, do not adopt
- [Inline Vue Composables Refactoring Pattern](https://alexop.dev/posts/inline-vue-composables-refactoring/) — step-by-step extraction approach
- [Playwright vs Cypress 2026](https://bugbug.io/blog/test-automation-tools/cypress-vs-playwright/) — WebKit support comparison
- [App Store Requirements 2026](https://natively.dev/articles/app-store-requirements) — submission checklist

### Tertiary (LOW confidence, for general direction only)
- [Vue.js 2025 In Review](https://vueschool.io/articles/news/vue-js-2025-in-review-and-a-peek-into-2026/) — ecosystem direction
- [Cognitive Training App Quality Review (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10258500/) — user expectations in brain training space
- Community discussions on multi-version Capacitor upgrade regeneration approach

---

*Research completed: 2026-03-01*
*Ready for roadmap: yes*
