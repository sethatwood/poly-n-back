# Technology Stack

**Project:** Poly N-Back -- Modernization & Hardening (Milestone 1)
**Researched:** 2026-03-01
**Focus:** Migration paths, TypeScript adoption, test infrastructure

---

## Current State

| Technology | Current Version | Target Version | Jump Size |
|------------|----------------|----------------|-----------|
| Vue | 3.3.4 | 3.5.28 | Minor (safe) |
| Vite | 4.4.5 | 7.x | 3 majors (significant) |
| Tailwind CSS | 3.3.5 | 4.2.x | 1 major (breaking) |
| Pinia | 2.1.7 | 3.0.4 | 1 major (minimal) |
| Capacitor | 5.5.1 | 7.x or 8.x | 2-3 majors (significant) |
| TypeScript | None | 5.9.x | New addition |
| Node.js | 18+ | 22.x LTS | 2 majors |

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vue | ^3.5.28 | UI framework | Latest stable 3.5.x. No breaking changes from 3.3. Gains: `useTemplateRef()`, `useId()`, improved SSR perf, better reactivity. Vue 3.6 with Vapor Mode is upcoming but not stable yet -- stay on 3.5.x. | HIGH |
| Pinia | ^3.0.4 | State management | "Boring major release" per maintainers. Drops deprecated APIs only. Requires Vue 3, TS 5+. Migration is near-zero effort if using `defineStore('name', {...})` syntax (not the deprecated `defineStore({id: 'name'})` pattern). | HIGH |
| TypeScript | ^5.9.x | Type safety | Current stable. TS 6.0 is in beta (Feb 2026) but is a bridge release to Go-based TS 7.0 -- do not adopt 6.0 beta. 5.9 is battle-tested. | HIGH |

### Build Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vite | ^7.x | Build tool / dev server | Released June 2025. Requires Node 20.19+/22.12+. Drops Node 18. New `baseline-widely-available` browser target. Smooth upgrade path from Vite 6 (which itself was smooth from Vite 5). Rolldown integration available but optional via `rolldown-vite` -- skip for M1, it is Vite 8 territory. | HIGH |
| @vitejs/plugin-vue | ^6.0.4 | Vue SFC support in Vite | Latest version, compatible with Vite 7 and Vue 3.5. | HIGH |

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^4.2.1 | Utility CSS | Massive rewrite: Rust-powered engine, CSS-first config via `@theme`, 5x faster builds. Automated migration tool (`npx @tailwindcss/upgrade`). Requires Node 20+. | HIGH |
| @tailwindcss/vite | ^4.2.1 | Vite integration | Replaces `tailwindcss` PostCSS plugin + `autoprefixer` + `postcss-import`. All built in. Earlier 4.1.x had Vite 7 peer dependency conflict -- resolved in 4.2.x. | MEDIUM |

### Mobile Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Capacitor | ^7.4.5 | Native mobile bridge | See detailed rationale below. Target 7, not 8. | HIGH |
| @capacitor/ios | ^7.4.5 | iOS native integration | Requires Xcode 16+, iOS 14.0+ deployment target | HIGH |
| @capacitor/android | ^7.4.5 | Android native integration | Requires Android Studio Ladybug 2024.2.1+, Target SDK 35, Min SDK 23 | HIGH |

### TypeScript Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| vue-tsc | latest | CLI type checking for Vue SFCs | Wraps tsc with Vue SFC understanding via Volar. Run as `vue-tsc --noEmit` in CI. Requires TS 5.0+. | HIGH |
| @vue/tsconfig | latest | Base tsconfig for Vue projects | Official Vue team tsconfig presets. Saves manual tsconfig authoring. | MEDIUM |

### Test Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | ^4.0.x | Unit + component testing | Made by Vue/Vite team. Native Vite integration, zero-config TS, ESM-native. Browser Mode now stable in v4. | HIGH |
| @vue/test-utils | ^2.4.6 | Vue component test helpers | Official Vue testing library. `mount()`, `shallowMount()`, reactive prop testing. Stable, works with Vue 3.5. | HIGH |
| happy-dom | latest | DOM environment for unit tests | Faster than jsdom for most use cases. Sufficient API coverage for a game UI (no complex form/iframe needs). Use jsdom only if happy-dom gaps surface. | MEDIUM |
| Playwright | latest | E2E testing (web layer) | Better than Cypress: multi-browser (Chrome, Firefox, WebKit/Safari), faster parallel execution, native `async/await`, better CI support. Safari/WebKit testing is critical for an iOS-targeted app. Cypress lacks WebKit support entirely. | HIGH |

### Supporting Libraries (Keep)

| Library | Version | Purpose | Action |
|---------|---------|---------|--------|
| postcss | Remove | No longer needed | Tailwind v4 with @tailwindcss/vite handles everything |
| autoprefixer | Remove | No longer needed | Built into Tailwind v4 |
| register-service-worker | Remove | Currently disabled | Dead code per codebase analysis; service worker is disabled |
| @vue/cli-plugin-pwa | Remove | Legacy, currently disabled | Vestige of Vue CLI era, not compatible with Vite |

---

## Capacitor: Why 7, Not 8

**Recommendation: Capacitor 7.4.5 (latest 7.x)**

Capacitor 8 requires Xcode 26.0+ (released Sept 2025, now at 26.3) and Node 22+. While technically available, there are practical concerns:

1. **Xcode 26 adoption**: Released only ~6 months ago. CI/CD environments and team tooling may lag behind. Capacitor 7 requires Xcode 16+ which is universally available.
2. **Edge-to-edge mandatory in Cap 8**: Android edge-to-edge layout becomes mandatory with CSS variable approach replacing `adjustMarginsForEdgeToEdge`. This is a UI-impacting change that needs careful testing on a game with specific safe-area handling.
3. **iOS 15.0 vs 14.0 deployment target**: Cap 8 raises to iOS 15.0. Cap 7 requires 14.0. Both are fine for 2026, but 7 gives broader reach.
4. **SPM default in Cap 8**: New iOS projects default to Swift Package Manager instead of CocoaPods. Existing CocoaPods project needs explicit `--packagemanager CocoaPods` flag or full SPM migration.
5. **Three major version jumps (5->8) vs two (5->7)**: Sequential migration 5->6->7 is safer and each `npx cap migrate` handles one version's breaking changes. Adding the 7->8 step introduces the edge-to-edge and SPM changes on top of everything else.

**Upgrade to 8 in Milestone 2** when the foundation is solid and you can properly test edge-to-edge behavior.

**Confidence: HIGH** -- based on official Capacitor migration docs for each version.

---

## Migration Order (Critical)

Dependencies between upgrades dictate a strict order:

```
Step 1: Node.js 18 -> 22 LTS
   (Required by: Vite 7, Tailwind 4, Capacitor 7+)

Step 2: Vue 3.3.4 -> 3.5.x + Pinia 2 -> 3
   (No breaking changes. Quick win. Validates build pipeline.)

Step 3: Vite 4 -> 5 -> 6 -> 7
   (Sequential: each major has migration guide. Can batch 4->7 in practice
    since breaking changes are minimal per step. Key changes:
    - 4->5: Rollup 4, Node 18+ (already done), minor API changes
    - 5->6: Sass modern API default, resolve.conditions changes
    - 6->7: Node 20.19+/22.12+ (already done), baseline browser target
    Plugin update: @vitejs/plugin-vue 4.x -> 6.x alongside.)

Step 4: Tailwind CSS 3 -> 4
   (AFTER Vite 7 is stable. Requires Vite 7 for @tailwindcss/vite plugin.
    Run `npx @tailwindcss/upgrade` for automated migration.
    Key manual work: class renames, config -> CSS @theme, PostCSS cleanup.)

Step 5: Capacitor 5 -> 6 -> 7
   (Sequential: `npx cap migrate` at each step.
    5->6: Minimal breaking changes, Node 18+ (done)
    6->7: Xcode 16+, iOS 14.0 target, Android SDK 35, Node 20+ (done)
    Regenerate ios/ and android/ native projects if migration gets messy.)

Step 6: Add TypeScript
   (AFTER all dependency upgrades. Adding TS to a moving-target codebase
    is painful. Stable foundation first, then type.)

Step 7: Add test infrastructure
   (AFTER TypeScript. Tests should be written in TS. Vitest config is
    trivial with Vite 7 already in place.)
```

**Rationale for this order:**
- Node.js first because everything else requires it
- Vue/Pinia are safe minor/boring-major upgrades that validate the build works
- Vite next because Tailwind v4's Vite plugin needs Vite 7
- Tailwind after Vite because `@tailwindcss/vite` replaces the PostCSS pipeline
- Capacitor is independent of the above but should happen on a stable build
- TypeScript after dependency upgrades avoids fighting type mismatches during version transitions
- Tests last because they should target the final stack, not a transitional one

---

## Vite 4 -> 7: Detailed Migration Path

While there are 3 major versions to cross, each step is documented as relatively smooth.

### Vite 4 -> 5 (Can be done in one step)
- **Node**: Already requires 18+ (already on 18)
- **Rollup**: Upgraded to Rollup 4 internally (transparent unless custom Rollup plugins)
- **Worker plugins**: Must be function returning array (not relevant to this project)
- **Dev server**: Better HTML serving consistency
- **Action**: `npm install vite@5 @vitejs/plugin-vue@5`

### Vite 5 -> 6
- **Sass**: Legacy API deprecated, modern API default (no Sass in this project -- non-issue)
- **CSS changes**: `json.stringify` behavior change (unlikely to affect)
- **PostCSS**: Upgraded internally
- **Action**: `npm install vite@6 @vitejs/plugin-vue@5` (plugin-vue 5.x supports Vite 5-6)

### Vite 6 -> 7
- **Node**: Requires 20.19+/22.12+ (already on 22)
- **Browser target**: New `baseline-widely-available` default (good for mobile targets)
- **ESM-only distribution**: Project already uses `"type": "module"` -- no issue
- **Sass legacy API removed**: Not using Sass -- non-issue
- **Action**: `npm install vite@7 @vitejs/plugin-vue@6`

**Practical approach**: Jump directly from Vite 4 to 7, fix any issues. The project's Vite config is minimal (just the Vue plugin). If direct jump fails, step through 4->5->6->7.

---

## Tailwind CSS 3 -> 4: Key Changes for This Project

### Automated Migration
```bash
npx @tailwindcss/upgrade
```
Handles most renames and config conversion automatically. Run on a branch, review diff.

### Manual Attention Required

1. **Config migration**: `tailwind.config.js` -> CSS `@theme` block or `@config` reference
   ```css
   /* Before: tailwind.config.js with custom font */
   /* After: */
   @import "tailwindcss";
   @theme {
     --font-sans: 'Share Tech Mono', monospace;
   }
   ```

2. **Build pipeline**: Remove `tailwindcss`, `postcss`, `autoprefixer` from PostCSS config. Replace with `@tailwindcss/vite` plugin in `vite.config.ts`.

3. **Class renames** (grep the codebase for these):
   - `shadow-sm` -> `shadow-xs`, `shadow` -> `shadow-sm`
   - `rounded-sm` -> `rounded-xs`, `rounded` -> `rounded-sm`
   - `blur-sm` -> `blur-xs`, `blur` -> `blur-sm`
   - `outline-none` -> `outline-hidden`
   - `ring` -> `ring-3` (ring width changed from 3px to 1px default)
   - `bg-gradient-to-*` -> `bg-linear-to-*`

4. **Opacity utilities**: `bg-opacity-*` removed, use `bg-black/50` syntax instead

5. **Import syntax**: `@tailwind base; @tailwind components; @tailwind utilities;` -> `@import "tailwindcss";`

6. **Browser support**: Safari 16.4+, Chrome 111+, Firefox 128+. This is fine for a modern mobile app.

---

## TypeScript Migration Strategy

### Approach: Gradual, File-by-File

Do NOT attempt a big-bang migration. Use TypeScript's `allowJs` to let `.js` and `.ts` coexist.

### Step 1: Infrastructure
```bash
npm install -D typescript vue-tsc @vue/tsconfig
```

Create `tsconfig.json`:
```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue", "src/**/*.js"],
  "exclude": ["node_modules"]
}
```

### Step 2: Rename Entry Points
- `vite.config.js` -> `vite.config.ts`
- `src/main.js` -> `src/main.ts`

### Step 3: Convert Stores First
The Pinia game store (`src/store/gameStore.js`) contains the core game logic. Converting it to TypeScript with proper interfaces for game state gives the highest value per effort.

### Step 4: Convert Components
For each `.vue` SFC, change `<script setup>` to `<script setup lang="ts">`. Add type annotations incrementally. Use `defineProps<{}>()` and `defineEmits<{}>()` for typed component interfaces.

### Step 5: Type Checking in CI
Add to `package.json`:
```json
{
  "scripts": {
    "type-check": "vue-tsc --noEmit"
  }
}
```

**Key principle**: `allowJs: true` means you never have a broken build. Files can be migrated one at a time, validated, and committed individually.

---

## Test Infrastructure Setup

### Unit + Component Tests: Vitest + Vue Test Utils

```bash
npm install -D vitest @vue/test-utils happy-dom
```

`vitest.config.ts` (or inline in `vite.config.ts`):
```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,js}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/*.{test,spec}.ts']
    }
  }
})
```

**Why happy-dom over jsdom**: Faster execution, sufficient API for a game UI (no iframes, no complex form APIs). Switch to jsdom only if specific browser APIs are missing.

**Why not Vitest Browser Mode for M1**: Browser Mode (stable in v4) is excellent but adds Playwright as a test dependency and runs slower. For M1's goal of establishing baseline coverage of game logic and component rendering, happy-dom unit tests are the right tradeoff. Browser Mode can be adopted later for integration tests that need real browser behavior.

### E2E Tests: Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

`playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
})
```

**Why Playwright over Cypress**:
1. **WebKit/Safari support**: Critical for an iOS-targeted app. Cypress has zero WebKit support.
2. **Parallel execution**: Native parallelism, faster CI runs for a solo dev.
3. **Mobile viewport emulation**: Built-in device profiles for iPhone/Pixel.
4. **Modern async/await API**: No Cypress-style chaining or `cy.wait()` hacks.
5. **Lighter CI footprint**: No Electron overhead.

**Limitation (both tools)**: Neither Playwright nor Cypress test the actual Capacitor native app. They test the web layer in a browser. True native mobile E2E requires Appium -- defer to M2 when app store submission is relevant.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Build tool | Vite 7 | Vite 8 (Rolldown) | Vite 8 uses Rolldown/Oxc replacing esbuild/Rollup. Too bleeding-edge for a stabilization milestone. Available as `rolldown-vite` drop-in if needed later. |
| CSS framework | Tailwind 4 | Stay on Tailwind 3 | v3 works but is no longer receiving features. v4 migration is well-tooled and automated. Rust engine is significantly faster. |
| Mobile | Capacitor 7 | Capacitor 8 | Xcode 26 requirement, mandatory edge-to-edge, SPM default. Too many simultaneous changes. Upgrade in M2. |
| Mobile | Capacitor 7 | React Native / Expo | Already tried and rejected per PROJECT.md. Lost the charm. Vue+Capacitor is the committed stack. |
| State management | Pinia 3 | Vuex | Deprecated. Pinia is the official Vue state management library. |
| Test runner | Vitest 4 | Jest | Jest lacks native ESM, Vite integration, and Vue SFC understanding. Vitest is the Vue/Vite ecosystem standard. |
| E2E | Playwright | Cypress | No WebKit support (critical for iOS app), slower parallel execution, heavier CI footprint. |
| DOM env | happy-dom | jsdom | jsdom is more complete but slower. Game UI has simple DOM needs. |
| TS migration | Gradual (allowJs) | Big-bang | Big-bang blocks all development until migration is complete. Gradual allows incremental progress alongside feature work. |
| Capacitor 8 | Defer | Adopt now | Edge-to-edge, SPM migration, Xcode 26 requirement add risk to a stabilization milestone |

---

## Package Changes Summary

### Remove
```bash
npm uninstall autoprefixer postcss register-service-worker @vue/cli-plugin-pwa
```

### Update (in order)
```bash
# Step 1: Core framework
npm install vue@^3.5 pinia@^3

# Step 2: Build tooling
npm install -D vite@^7 @vitejs/plugin-vue@^6

# Step 3: Tailwind
npm install -D @tailwindcss/vite@^4.2
# (remove old tailwindcss, postcss, autoprefixer from devDeps)

# Step 4: Capacitor (run sequentially)
npm install @capacitor/core@6 @capacitor/cli@6 @capacitor/ios@6 @capacitor/android@6
npx cap migrate
npm install @capacitor/core@7 @capacitor/cli@7 @capacitor/ios@7 @capacitor/android@7
npx cap migrate
```

### Add
```bash
# TypeScript
npm install -D typescript@^5.9 vue-tsc @vue/tsconfig

# Testing
npm install -D vitest@^4 @vue/test-utils happy-dom
npm install -D @playwright/test
npx playwright install
```

---

## Node.js Version

**Target: Node.js 22.x LTS (codename Jod)**

- Current LTS, maintenance support through April 2027
- Required by Capacitor 8 (if upgrading later), compatible with everything in this stack
- Vite 7 requires 20.19+ or 22.12+ -- Node 22 satisfies both
- Tailwind 4 requires Node 20+ -- satisfied
- Update `.github/workflows/deploy.yml` from Node 18 to Node 22
- Add `.nvmrc` or `.node-version` file with `22` for consistency

**Confidence: HIGH**

---

## Sources

### Official Documentation (HIGH confidence)
- [Vue 3.5 Announcement](https://blog.vuejs.org/posts/vue-3-5)
- [Vite 7 Announcement](https://vite.dev/blog/announcing-vite7)
- [Vite Migration Guides](https://vite.dev/guide/migration) (v5, v6, v7)
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Capacitor 6 Migration](https://capacitorjs.com/docs/updating/6-0)
- [Capacitor 7 Migration](https://capacitorjs.com/docs/updating/7-0)
- [Capacitor 8 Migration](https://capacitorjs.com/docs/updating/8-0)
- [Pinia v2 to v3 Migration](https://pinia.vuejs.org/cookbook/migration-v2-v3.html)
- [Vue TypeScript Guide](https://vuejs.org/guide/typescript/overview)
- [Vue Testing Guide](https://vuejs.org/guide/scaling-up/testing)
- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils Documentation](https://test-utils.vuejs.org/)

### GitHub / npm (HIGH confidence)
- [Vue releases](https://github.com/vuejs/core/releases) -- v3.5.28 latest (Feb 2026)
- [Pinia releases](https://github.com/vuejs/pinia/releases) -- v3.0.4 latest
- [@tailwindcss/vite Vite 7 issue](https://github.com/vitejs/vite/issues/20284) -- resolved in 4.2.x
- [Tailwind Vite 7 support discussion](https://github.com/tailwindlabs/tailwindcss/discussions/18396)
- [TypeScript 6.0 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-beta/)

### Web Research (MEDIUM confidence)
- [Vue.js 2025 In Review](https://vueschool.io/articles/news/vue-js-2025-in-review-and-a-peek-into-2026/)
- [Vite 7 overview](https://syntackle.com/blog/vite-7-is-here/)
- [Capacitor 8 migration guide (third-party)](https://noumansehgal.com/blog/migrating-capacitor-7-to-8-guide)
- [Tailwind v4 migration best practices](https://www.digitalapplied.com/blog/tailwind-css-v4-2026-migration-best-practices)
- [Playwright vs Cypress 2026](https://bugbug.io/blog/test-automation-tools/cypress-vs-playwright/)
- [Vue testing pyramid with Vitest](https://alexop.dev/posts/vue3_testing_pyramid_vitest_browser_mode/)
