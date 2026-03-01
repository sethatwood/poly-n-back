# Domain Pitfalls

**Domain:** Vue 3 / Capacitor mobile app modernization (dependency upgrades, TypeScript migration, component extraction)
**Researched:** 2026-03-01

---

## Critical Pitfalls

Mistakes that cause data loss, app-breaking regressions, or force rewrites.

---

### Pitfall 1: Capacitor Android Scheme Change Wipes localStorage

**What goes wrong:** Upgrading from Capacitor 5 to 6 changes the default `androidScheme` from `http` to `https`. Because browsers isolate storage by origin (scheme + host), this change makes all existing localStorage and IndexedDB data inaccessible. High scores, audio preferences, tutorial completion status, and achievements are silently lost.

**Why it happens:** Capacitor 6 changed the default to `https` to enable Android Autofill features. The migration tool (`npx cap migrate`) updates the scheme automatically without warning that stored data becomes unreachable.

**Consequences:** Users lose all persisted data (high scores, settings, achievements, tutorial-completed flag). The app appears to "reset" after update. For this project: `highScoreData`, `isAudioEnabled`, `tutorialCompleted`, and `achievements` in localStorage all vanish. Since the app is live at polynback.fun, any users who installed a native build would lose progress.

**Prevention:**
- **Before migrating:** Check current `capacitor.config.json` for `androidScheme`. This project already has `"androidScheme": "https"` set, which means the scheme is ALREADY `https` -- no change occurs during migration and data is preserved. Verify this is the case before proceeding.
- **If androidScheme were missing or set to `http`:** You would need to explicitly set it to `http` in config to preserve data, then plan a separate data migration later.
- **Regardless:** Back up the `capacitor.config.json` before running `npx cap migrate` and verify the scheme value is unchanged after migration.

**Detection:** After Capacitor upgrade, open the app on Android and check if high scores and settings persist. Test in emulator before any production build.

**Confidence:** HIGH -- verified via [Capacitor 6.0 migration guide](https://capacitorjs.com/docs/updating/6-0) and [GitHub issue #7548](https://github.com/ionic-team/capacitor/issues/7548).

**Phase:** Dependency upgrades (Capacitor migration step).

---

### Pitfall 2: Multi-Version Capacitor Hop Without Sequential Migration

**What goes wrong:** Attempting to jump directly from Capacitor 5 to 8 (skipping 6 and 7) by just changing version numbers in package.json. The native projects (ios/ and android/) contain version-specific Gradle configs, Podfiles, Xcode settings, SDK targets, and Kotlin versions that each major version expects to transform incrementally.

**Why it happens:** The `npx cap migrate` CLI tool is designed for single-version hops (5->6, 6->7, 7->8). It applies incremental patches to native project files. Skipping versions means the tool finds unexpected file states and either fails silently or produces corrupt native configs.

**Consequences:** Android builds fail with Gradle errors (wrong AGP version, missing SDK targets, Kotlin version mismatches). iOS builds fail with Xcode project configuration errors. Debugging these is extremely time-consuming because error messages point to native build tooling, not Capacitor migration.

**Prevention:**
- Migrate sequentially: 5 -> 6, test build, then 6 -> 7, test build, then 7 -> 8, test build.
- At each step: run `npx cap migrate`, verify native builds compile, verify the app runs.
- Keep each step in a separate commit so you can bisect if something breaks.
- Each version has specific requirements:
  - **Cap 6:** Node 18+, Xcode 15+, Android Studio Hedgehog, minSdk 22, targetSdk 34
  - **Cap 7:** Node 20+, Xcode 16+, Android Studio Ladybug, minSdk 23, targetSdk 35, Gradle 8.7.2
  - **Cap 8:** Node 22+, Xcode 26+, Android Studio Otter, minSdk 24, targetSdk 36, Gradle 8.13.0

**Detection:** Build failures immediately after version bump. Native project files with conflicting version numbers.

**Confidence:** HIGH -- each migration guide explicitly documents the sequential approach: [Cap 6](https://capacitorjs.com/docs/updating/6-0), [Cap 7](https://capacitorjs.com/docs/updating/7-0), [Cap 8](https://capacitorjs.com/docs/updating/8-0).

**Phase:** Dependency upgrades (must be first major task).

---

### Pitfall 3: Capacitor 8 iOS Project Switches from CocoaPods to Swift Package Manager

**What goes wrong:** Capacitor 8 CLI defaults to creating Swift Package Manager (SPM) projects instead of CocoaPods. The existing project has a CocoaPods-based iOS setup (Podfile, Podfile.lock, Pods/ directory). Running `npx cap migrate` or re-initializing the iOS project could conflict with or silently replace the existing dependency management approach.

**Why it happens:** Capacitor 8 adopted SPM as the default for new projects. Migration tooling may attempt to convert the project or generate conflicting configurations.

**Consequences:** iOS build fails due to mixed dependency management. Pods still referenced in Xcode project but SPM packages also configured. Manual cleanup of the iOS project required.

**Prevention:**
- During the Capacitor 7 -> 8 migration, explicitly check whether `npx cap migrate` attempts to convert from CocoaPods to SPM.
- If the project is simple (no custom CocoaPods beyond Capacitor defaults), regenerating the iOS project from scratch may be cleaner: delete `ios/`, run `npx cap add ios`, then `npx cap sync`.
- If there are custom native configurations (status bar colors, splash screens, etc.), document them before deleting the native project.
- The `capacitor.config.json` has `backgroundColor: "#0f1729"` for iOS -- this must be re-applied.

**Detection:** Xcode build errors mentioning both Pod references and SPM packages. `pod install` failures after migration.

**Confidence:** MEDIUM -- confirmed SPM is the new default in [Cap 8 migration guide](https://capacitorjs.com/docs/updating/8-0), but the exact behavior of `npx cap migrate` on existing CocoaPods projects needs validation during execution.

**Phase:** Dependency upgrades (Capacitor 8 step specifically).

---

### Pitfall 4: Tailwind v4 Renamed Utilities Cause Silent Visual Regressions

**What goes wrong:** Tailwind v4 renamed dozens of utility classes. The most impactful for this project: `shadow-sm` becomes `shadow-xs`, `shadow` becomes `shadow-sm`, `rounded-sm` becomes `rounded-xs`, `rounded` becomes `rounded-sm`. If the upgrade tool misses occurrences (in dynamic class bindings, computed class strings, or ternary expressions), the app renders with wrong shadows, wrong border radii, or missing styles -- with zero build errors.

**Why it happens:** The `npx @tailwindcss/upgrade` tool handles ~90% of mechanical changes but struggles with:
- Dynamic class construction in JavaScript (e.g., the `buttonClass()` function in App.vue that builds class strings with template literals)
- Conditional classes in `:class` bindings with ternary operators
- Classes split across multiple lines in template expressions

**Consequences:** Buttons, cards, and game elements render with subtly wrong visual treatment. The "charm" the project explicitly aims to preserve is damaged without any error or warning. On a solo project with no QA, these regressions can ship.

**Prevention:**
- Run the `npx @tailwindcss/upgrade` tool first, then manually audit ALL dynamic class bindings in `.vue` files.
- Specifically audit `App.vue`'s `buttonClass()` function (line 260-267) and `feedbackClass()` function (line 270-278) which construct classes programmatically.
- Search the entire codebase for old utility names after upgrade: `shadow-sm`, `rounded-sm`, `rounded`, `shadow`, `blur-sm`, `blur`, `ring` (bare, without size suffix).
- Take before/after screenshots of every screen state (menu, gameplay, game over, pause modal, tutorial) and compare pixel-by-pixel.
- Additional renamed classes to watch for:
  - `outline-none` -> `outline-hidden`
  - `flex-shrink-*` -> `shrink-*`
  - `flex-grow-*` -> `grow-*`
  - `ring` (bare) now means 1px instead of 3px -- use `ring-3` for old behavior

**Detection:** Visual comparison of all app states before and after migration. No automated detection possible for visual regressions without screenshot tests.

**Confidence:** HIGH -- confirmed in [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide). The renamed utilities list is extensive and well-documented.

**Phase:** Tailwind migration.

---

### Pitfall 5: Tailwind v4 Default Color Changes Break Dark UI

**What goes wrong:** Tailwind v4 changes several default color behaviors: `border` now defaults to `currentColor` instead of `gray-200`, `ring` defaults to `currentColor` instead of `blue-500`, and placeholder text uses opacity-based coloring. For a dark-themed app like Poly N-Back (background `#0f1729`), borders that previously showed as subtle gray now show as the text color (white), creating harsh, unexpected borders.

**Why it happens:** Tailwind v4 aligned default colors with CSS standards (`currentColor`). This is more predictable in general but breaks assumptions in dark-theme apps that relied on the implicit gray defaults.

**Consequences:** Game UI elements gain bright white borders where there were subtle gray ones. Ring effects on focus states become white instead of blue. The visual polish of the game degrades.

**Prevention:**
- After upgrade, search for bare `border` utilities without explicit color (e.g., `border` without `border-gray-*`).
- Search for bare `ring` utilities without explicit color.
- Add explicit color values wherever defaults were relied upon: `border` -> `border border-gray-700` (or whatever the intended color was).
- The `*:focus-visible` style in `style.css` uses explicit `rgba(59, 130, 246, 0.5)` (not Tailwind utilities), so it is safe.

**Detection:** Visual inspection of all bordered/ringed elements. Any element with just `border` or `ring` class without a color class.

**Confidence:** HIGH -- documented in [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide) under "Default border color" and "Default ring color."

**Phase:** Tailwind migration.

---

### Pitfall 6: Tailwind v4 CSS Import Syntax and Config File Migration

**What goes wrong:** Tailwind v4 completely replaces the configuration approach. The `@tailwind base; @tailwind components; @tailwind utilities;` directives in `style.css` must become `@import "tailwindcss";`. The `tailwind.config.js` file is replaced by `@theme` blocks in CSS. The PostCSS plugin changes from `tailwindcss` to `@tailwindcss/postcss` (or better, `@tailwindcss/vite` for Vite projects).

**Why it happens:** Tailwind v4 moved to a CSS-first configuration model. The old JS config file and directives are not recognized.

**Consequences:** Build completely fails with unrecognized directive errors. No styles load at all. Everything breaks visibly.

**Prevention:**
- Run `npx @tailwindcss/upgrade` which handles this automatically for most cases.
- Manually verify `style.css` is updated from `@import 'tailwindcss/base'` etc. to `@import "tailwindcss"`.
- Migrate `tailwind.config.js` theme extensions to `@theme` block in CSS:
  ```css
  @import "tailwindcss";
  @theme {
    --font-sans: 'Share Tech Mono', monospace;
  }
  ```
- Replace PostCSS plugin setup: remove `tailwindcss` from `postcss.config.js` and either use `@tailwindcss/postcss` or (recommended) add `@tailwindcss/vite` to `vite.config.js` plugins and remove PostCSS entirely.
- The `postcss.config.js` and `tailwind.config.js` files can both be deleted after migration.
- **Content paths:** Tailwind v4 uses automatic content detection -- the `content: [...]` array in `tailwind.config.js` is no longer needed. However, verify it picks up all `.vue` files.

**Detection:** Build failure immediately -- this is a "loud" failure, not a silent regression. The app will not compile.

**Confidence:** HIGH -- [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide).

**Phase:** Tailwind migration.

---

### Pitfall 7: Vite 7 and @tailwindcss/vite Peer Dependency Conflict

**What goes wrong:** As of March 2026, `@tailwindcss/vite` declares a peer dependency of `"vite": "^5.2.0 || ^6"`, which does not include Vite 7. Installing both together causes npm to reject the dependency tree with `ERESOLVE` errors.

**Why it happens:** Tailwind Labs has not yet updated the peer dependency range to include Vite 7. Vite 7 was released June 2025 and the Tailwind team has been slow to update. The issue is tracked at [tailwindlabs/tailwindcss#18381](https://github.com/tailwindlabs/tailwindcss/issues/18381).

**Consequences:** Cannot use the recommended `@tailwindcss/vite` plugin with Vite 7. Must either use workarounds or limit Vite version.

**Prevention:**
- **Option A (recommended):** Target Vite 6 instead of Vite 7. Vite 6 has minimal breaking changes from 5 and is fully compatible with Tailwind v4, Vue 3, and all other dependencies. Vite 7's main addition (Rolldown for dependency optimization) is not critical for this project.
- **Option B:** Use Vite 7 with `@tailwindcss/postcss` instead of `@tailwindcss/vite`. This works but is slightly slower.
- **Option C:** Use `npm install --force` or add `overrides` in package.json to force Vite 7 + @tailwindcss/vite. Risky -- may cause runtime issues.
- **Check before deciding:** By the time this phase is executed, Tailwind may have released a version with Vite 7 support. Check `npm info @tailwindcss/vite peerDependencies` before committing to a Vite version.

**Detection:** `npm install` fails immediately with dependency resolution error.

**Confidence:** MEDIUM -- the issue is confirmed as of March 2026 ([vitejs/vite#20284](https://github.com/vitejs/vite/issues/20284), [tailwindcss#18381](https://github.com/tailwindlabs/tailwindcss/issues/18381)), but may be resolved by the time migration is executed. The latest @tailwindcss/vite is 4.2.1 -- check its peer deps at migration time.

**Phase:** Dependency upgrades (Vite + Tailwind must be coordinated).

---

## Moderate Pitfalls

---

### Pitfall 8: TypeScript Migration Breaks Options API Component

**What goes wrong:** App.vue uses the Options API pattern (`export default { setup() { ... } }`) rather than `<script setup>`. When adding `lang="ts"` to the script tag, TypeScript cannot infer types for the Options API `setup()` return object, leading to a cascade of type errors in template bindings. The `defineComponent()` wrapper is required for proper type inference but adds boilerplate.

**Why it happens:** Vue 3's TypeScript support is optimized for `<script setup>` with Composition API. The Options API requires `defineComponent()` for type inference, and even then, complex return types from `setup()` can be hard to type correctly.

**Prevention:**
- Convert App.vue (and all components) from Options API to `<script setup>` syntax as part of the TypeScript migration. Do NOT just add `lang="ts"` to existing Options API components.
- Migration order matters: extract components FIRST (to make each file smaller), THEN convert to `<script setup lang="ts">`.
- The current `setup()` function returns 20+ values -- in `<script setup>`, these are automatically available to the template without explicit returns.
- Use `defineProps` and `defineEmits` with TypeScript generics for type-safe props/events.

**Detection:** TypeScript errors on build after adding `lang="ts"`. Template binding errors in IDE.

**Confidence:** HIGH -- [Vue TypeScript guide](https://vuejs.org/guide/typescript/overview) explicitly recommends `<script setup>` for TypeScript projects.

**Phase:** TypeScript migration (must come AFTER component extraction).

---

### Pitfall 9: Component Extraction Breaks Watcher and Event Chains

**What goes wrong:** Extracting UI sections from the 488-line App.vue into child components severs existing `watch()` calls that depend on direct access to the game store. Event handler chains (e.g., `handlePause` -> `gameStore.pauseGame()`) work fine, but watchers on store state that trigger local UI effects (score animation, strike animation, feedback toast) are tightly coupled to the parent component's lifecycle.

**Why it happens:** The current App.vue has watchers on `gameStore.score`, `gameStore.incorrectResponses`, and `gameStore.lastFeedback.timestamp` that trigger local reactive refs (`scoreAnimating`, `strikeAnimating`, `feedbackVisible`). When extracting the score display or feedback indicator into separate components, these watchers and the reactive refs they control must move together.

**Consequences:** Extracted component renders correctly but animations stop working. Score doesn't pulse. Strike counter doesn't shake. Feedback indicator doesn't appear. The "charm" regresses.

**Prevention:**
- Map all watchers before extracting: identify which watcher belongs with which UI element.
- Each extracted component should own its own animation state and its own watcher on the store.
- Test each animation after extraction: score pulse, strike shake, feedback flash, button correct/incorrect flash, timer urgency pulse.
- The `feedbackTimeout` variable (line 282) is a closure variable, not a ref -- it must be properly managed in the new component's lifecycle (cleared in `onUnmounted`).
- Consider extracting game logic watchers into a composable (`useScoreAnimation`, `useFeedbackDisplay`) that can be used by any component.

**Detection:** Manual visual testing of all animation states during gameplay after each component extraction.

**Confidence:** HIGH -- directly observed in the codebase. The coupling between watchers, timeouts, and local refs is visible in `App.vue` lines 222-293.

**Phase:** Component extraction.

---

### Pitfall 10: process.env.NODE_ENV Check Breaks in Vite 5+

**What goes wrong:** `main.js` line 16 uses `process.env.NODE_ENV` to conditionally expose the game store for debugging. In Vite 5+, `process.env` is not automatically available in browser code. The check may silently fail (store not exposed) or throw a runtime error depending on Vite version and configuration.

**Why it happens:** Vite replaces `process.env.NODE_ENV` during build but the behavior has become stricter across versions. The recommended approach is `import.meta.env.DEV` / `import.meta.env.PROD`.

**Consequences:** Development debugging breaks silently. In worst case, runtime error on app startup in development mode.

**Prevention:**
- Replace `process.env.NODE_ENV === 'development'` with `import.meta.env.DEV` in `main.js`.
- This is a one-line change but easy to miss.

**Detection:** Check browser console for errors after Vite upgrade. Test dev mode specifically.

**Confidence:** MEDIUM -- Vite has historically handled `process.env.NODE_ENV` replacement, but the recommended pattern is `import.meta.env`. The change is trivial but worth noting. [Vite env docs](https://vite.dev/guide/env-and-mode).

**Phase:** Dependency upgrades (Vite migration step).

---

### Pitfall 11: Tailwind v4 Hover Behavior Change on Mobile

**What goes wrong:** Tailwind v4 wraps hover utilities in `@media (hover: hover)`, meaning hover styles only apply on devices with hover capability (mouse/trackpad). On mobile (touch-only), `hover:` prefixed styles no longer apply at all -- including `:active` states that some browsers previously triggered via hover.

**Why it happens:** This is a correctness improvement -- hover states on touch devices were always somewhat broken. But it changes observable behavior.

**Consequences:** For this game (primarily mobile): `hover:bg-blue-500` on game buttons, `hover:bg-gray-500` on audio toggle, and `hover:text-white` on pause button will no longer show any visual feedback on mobile tap. If the active/pressed states rely solely on `hover:` classes, buttons appear unresponsive.

**Prevention:**
- Audit all `hover:` classes in the codebase and ensure corresponding `active:` classes exist for touch feedback.
- The game buttons already have `active:scale-95 active:bg-blue-700` which is good -- these will still work.
- The audio toggle button has `hover:bg-gray-500` but no `active:` equivalent -- add one.
- The pause button has `hover:text-white` but no `active:` equivalent -- add one.
- If you need hover to work on touch: add `@custom-variant hover (&:hover);` to your CSS, but this re-enables the old (broken) behavior.

**Detection:** Test all interactive elements on a real mobile device or mobile emulator after Tailwind migration.

**Confidence:** HIGH -- [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide) documents this under "Hover styles on mobile."

**Phase:** Tailwind migration.

---

### Pitfall 12: Pinia Store `defineStore` Syntax May Need Update

**What goes wrong:** Pinia v3 removed the deprecated `defineStore({ id: 'game' })` syntax, requiring `defineStore('game', { ... })` instead. This project already uses the correct syntax (`defineStore('game', { ... })` in gameStore.js line 65), so no change is needed. However, if this is not verified before upgrading, the store silently fails to register.

**Why it happens:** Pinia v3 is a cleanup release that removes deprecated APIs.

**Consequences:** If the deprecated syntax were used, the store would fail to initialize and the entire app would break.

**Prevention:**
- Verify `gameStore.js` uses `defineStore('game', { ... })` syntax (it does).
- Also verify `PiniaStorePlugin` is not used anywhere (it isn't -- the project only uses `createPinia()`).
- The migration from Pinia 2 to 3 should be the simplest upgrade in the stack. No code changes expected for this project.

**Detection:** App fails to load store on startup. Console errors about invalid store definition.

**Confidence:** HIGH -- [Pinia v2 to v3 migration guide](https://pinia.vuejs.org/cookbook/migration-v2-v3.html). Verified against current codebase.

**Phase:** Dependency upgrades (low risk, bundle with other npm updates).

---

### Pitfall 13: Native Project Files Become Stale Across 3 Major Capacitor Versions

**What goes wrong:** The existing `ios/` and `android/` directories contain native project files generated by Capacitor 5. After migrating through 3 major versions, these files accumulate incremental patches that may leave behind deprecated configs, old SDK references, or orphaned files. The native projects work but carry technical debt and may behave unexpectedly.

**Why it happens:** Each `npx cap migrate` adds and modifies files but doesn't always clean up files from previous versions. Over 3 major hops, the cruft accumulates.

**Consequences:** Build warnings, unexpected runtime behavior on specific OS versions, difficulty debugging native issues, App Store review rejections for targeting old SDKs.

**Prevention:**
- After completing all Capacitor version hops (5->6->7->8), consider regenerating native projects from scratch:
  1. Document any custom native configurations (background colors, status bar settings, splash screens, app icons).
  2. Delete `ios/` and `android/` directories.
  3. Run `npx cap add ios` and `npx cap add android`.
  4. Run `npx cap sync`.
  5. Re-apply custom native configurations.
- The project's native customizations are minimal: just `backgroundColor: "#0f1729"` in capacitor.config.json and standard Capacitor defaults.
- This also resolves Pitfall 3 (CocoaPods -> SPM migration) cleanly.

**Detection:** Gradle deprecation warnings, Xcode warnings about outdated settings, stale Podfile references.

**Confidence:** MEDIUM -- based on community patterns for multi-version Capacitor upgrades. The regeneration approach is recommended by [Quasar Framework's Capacitor guide](https://quasar.dev/quasar-cli-vite/developing-capacitor-apps/capacitor-version-support/) and Capacitor community discussions.

**Phase:** Dependency upgrades (final step after all Capacitor version hops).

---

## Minor Pitfalls

---

### Pitfall 14: Tailwind v4 Button Cursor Default Change

**What goes wrong:** Tailwind v4's Preflight changes the default cursor on `<button>` elements from `pointer` to `default`. Game buttons will no longer show a pointer cursor on hover (desktop).

**Prevention:** Add `cursor-pointer` explicitly to button elements or add a global CSS rule: `button { cursor: pointer; }`. The game is primarily mobile so this is cosmetic.

**Confidence:** HIGH -- [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide).

**Phase:** Tailwind migration.

---

### Pitfall 15: Tailwind v4 Important Modifier Position Change

**What goes wrong:** The `!` important modifier moved from before the utility to after: `!bg-red-500` becomes `bg-red-500!`. If any templates use the `!` prefix, they silently stop working.

**Prevention:** Search codebase for `!` prefix in class strings. The upgrade tool handles this but verify in dynamic class bindings.

**Confidence:** HIGH -- [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide).

**Phase:** Tailwind migration.

---

### Pitfall 16: TypeScript Strict Mode Reveals Hidden Bugs

**What goes wrong:** Enabling TypeScript's `strict` mode surfaces dozens of legitimate issues that existed silently in JavaScript: nullable access without checks (`highScoreData.nBack` could be null), implicit `any` types, and unreachable code paths. The developer sees a wall of errors and either waters down strict mode or gets stuck fixing issues for days.

**Prevention:**
- Start with `strict: false` in `tsconfig.json` and enable strict options incrementally:
  1. `noImplicitAny: true` first (forces type annotations)
  2. `strictNullChecks: true` second (catches the null/undefined bugs in CONCERNS.md)
  3. `strict: true` last (enables all remaining checks)
- This staged approach prevents the "wall of errors" problem and lets you address each category of issue systematically.
- The CONCERNS.md already documents the exact issues `strictNullChecks` will catch (division by zero, unvalidated localStorage reads, optional nBack field).

**Detection:** TypeScript compiler output. Count of errors at each strictness level.

**Confidence:** HIGH -- standard TypeScript migration pattern, documented across multiple migration guides.

**Phase:** TypeScript migration.

---

### Pitfall 17: Testing Infrastructure Depends on Correct Migration Order

**What goes wrong:** Setting up Vitest before completing dependency upgrades means configuring test infrastructure twice -- once for the old stack, once for the new. Setting up tests after TypeScript migration means the extracted components and new types are already established, and tests can be written once in their final form.

**Prevention:**
- Dependency upgrades FIRST (Capacitor, Vite, Tailwind, Pinia, Vue).
- Component extraction SECOND.
- TypeScript migration THIRD.
- Test infrastructure FOURTH (tests are written against the final codebase shape).
- This order minimizes rework and means every test written is a test that survives.

**Detection:** Having to rewrite test configs or test files after a subsequent migration step.

**Confidence:** MEDIUM -- based on general software engineering principles and reports from teams doing similar migrations.

**Phase:** All phases (ordering concern).

---

### Pitfall 18: @vitejs/plugin-vue Version Must Match Vite Major Version

**What goes wrong:** The project uses `@vitejs/plugin-vue ^4.2.3` which is paired with Vite 4. When upgrading Vite, the plugin must also be upgraded to the matching major version. Mismatched versions cause cryptic build errors or silent SFC compilation issues.

**Prevention:**
- Vite 5 requires `@vitejs/plugin-vue` v5.x
- Vite 6 requires `@vitejs/plugin-vue` v5.x or v6.x (check compatibility)
- Vite 7 requires `@vitejs/plugin-vue` v6.x
- Always upgrade both together: `npm install vite@latest @vitejs/plugin-vue@latest`

**Detection:** Build errors about SFC compilation, missing Vue compiler, or HMR failures.

**Confidence:** MEDIUM -- based on npm registry version alignment and [Vite plugin docs](https://vite.dev/plugins/).

**Phase:** Dependency upgrades (Vite step).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Capacitor 5->6 | localStorage data loss (Pitfall 1) | Verify `androidScheme` is already `https` (it is) |
| Capacitor 5->6->7->8 | Skipping versions (Pitfall 2) | Sequential migration with build verification at each step |
| Capacitor 7->8 | CocoaPods -> SPM (Pitfall 3) | Plan to regenerate native projects (Pitfall 13) |
| Vite upgrade | Version ceiling (Pitfall 7) | Target Vite 6 unless Tailwind adds Vite 7 support |
| Vite upgrade | process.env usage (Pitfall 10) | Replace with import.meta.env.DEV |
| Vite upgrade | Plugin version mismatch (Pitfall 18) | Upgrade @vitejs/plugin-vue together with Vite |
| Tailwind 3->4 | Silent visual regressions (Pitfall 4) | Screenshot comparison of all states before/after |
| Tailwind 3->4 | Default color changes (Pitfall 5) | Audit bare border/ring classes |
| Tailwind 3->4 | Config file migration (Pitfall 6) | Run upgrade tool, verify CSS imports |
| Tailwind 3->4 | Mobile hover (Pitfall 11) | Add active: states alongside hover: states |
| Component extraction | Broken animations (Pitfall 9) | Map watchers to components, test each animation |
| TypeScript migration | Options API incompatibility (Pitfall 8) | Convert to script setup during TS migration |
| TypeScript migration | Strict mode overwhelm (Pitfall 16) | Enable strict options incrementally |
| Test infrastructure | Wasted effort on wrong codebase (Pitfall 17) | Tests come LAST, after all migrations |

## Recommended Migration Order (Based on Pitfalls)

Based on dependency chains and pitfall avoidance:

1. **Capacitor 5->6->7->8** -- must be sequential, involves native builds, highest risk of data loss
2. **Vite 4->6** (skip 5, target 6 for Tailwind compatibility) + **@vitejs/plugin-vue** + **Vue 3.5** + **Pinia 3**
3. **Tailwind 3->4** -- requires Vite to be settled first, visual regression testing
4. **Component extraction** -- smaller files are easier to type
5. **TypeScript migration** -- types are written once on final component shapes
6. **Test infrastructure** -- tests are written once against final codebase

## Sources

- [Capacitor 6.0 Migration Guide](https://capacitorjs.com/docs/updating/6-0) -- HIGH confidence
- [Capacitor 7.0 Migration Guide](https://capacitorjs.com/docs/updating/7-0) -- HIGH confidence
- [Capacitor 8.0 Migration Guide](https://capacitorjs.com/docs/updating/8-0) -- HIGH confidence
- [Capacitor 6 localStorage Bug - GitHub #7548](https://github.com/ionic-team/capacitor/issues/7548) -- HIGH confidence
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) -- HIGH confidence
- [Tailwind v4 @apply in Vue SFC - GitHub #15717](https://github.com/tailwindlabs/tailwindcss/issues/15717) -- MEDIUM confidence
- [Vite 7 + @tailwindcss/vite Incompatibility - GitHub #20284](https://github.com/vitejs/vite/issues/20284) -- MEDIUM confidence (may be resolved by execution time)
- [@tailwindcss/vite Vite 7 Support - GitHub #18381](https://github.com/tailwindlabs/tailwindcss/issues/18381) -- MEDIUM confidence
- [Pinia v2 to v3 Migration](https://pinia.vuejs.org/cookbook/migration-v2-v3.html) -- HIGH confidence
- [Vite 5 Migration Guide](https://v5.vite.dev/guide/migration) -- HIGH confidence
- [Vite 6 Migration Guide](https://v6.vite.dev/guide/migration) -- HIGH confidence
- [Vue TypeScript Overview](https://vuejs.org/guide/typescript/overview) -- HIGH confidence
- [Vue TypeScript with Composition API](https://vuejs.org/guide/typescript/composition-api) -- HIGH confidence
- [Vite Environment Variables](https://vite.dev/guide/env-and-mode) -- HIGH confidence

---

*Pitfalls analysis: 2026-03-01*
