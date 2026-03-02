# Phase 10: Tech Debt Cleanup - Research

**Researched:** 2026-03-02
**Domain:** ESLint configuration, CI pipeline integration, TypeScript type safety, documentation accuracy, Android native builds
**Confidence:** HIGH

## Summary

Phase 10 resolves all addressable tech debt identified in the v1.0 milestone audit. The scope is well-bounded: 20 ESLint `@typescript-eslint/no-explicit-any` errors across 5 files (4 test files + 1 source file), a missing `npm run lint` step in the CI `check` job, a disabled `vue/block-lang` ESLint rule that can now be re-enabled, and an Android build that needs verification. The DEPS-06 documentation item from the audit has already been resolved -- REQUIREMENTS.md line 17 already reads "direct 5->8".

All fixes are mechanical and low-risk. The ESLint errors are in test mock manipulation code where `any` casts are needed to access test-only methods (`_reset`) on mocked modules or to simulate missing browser APIs (`AudioContext`, `webkitAudioContext`). The correct fix is `eslint-disable-next-line` comments with justification, not removing the casts. The CI lint step is a single line addition to `.github/workflows/ci.yml`. The `vue/block-lang` rule re-enablement requires removing one line from `eslint.config.js` -- the underlying `@vue/eslint-config-typescript` already configures this rule to require `lang="ts"` by default.

**Primary recommendation:** Fix all 20 lint errors with targeted `eslint-disable-next-line` comments at each cast site, add `npm run lint` to CI, remove the `vue/block-lang: 'off'` override from eslint.config.js, verify the Android build in Android Studio, and update any stale documentation.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEPS-08 | ESLint 9 flat config + Prettier configured and passing on all source files | Lint currently fails with 20 errors. Research identifies all 20 error locations, root causes, and fix strategy (eslint-disable-next-line with justification comments). Adding lint to CI prevents future regressions. |
</phase_requirements>

## Current State Analysis

### Error Inventory (20 errors in 5 files)

| File | Errors | Rule | Root Cause |
|------|--------|------|------------|
| `src/stores/__tests__/audioStore.test.ts` | 12 | `@typescript-eslint/no-explicit-any` | `(globalThis as any).AudioContext = undefined` and `(window as any).AudioContext = undefined` / `webkitAudioContext = undefined` -- simulating missing browser APIs in 4 test blocks (3 casts each) |
| `src/stores/__tests__/persistenceStore.test.ts` | 3 | `@typescript-eslint/no-explicit-any` | `(Preferences as any)._reset()` and `(Preferences as any).set = vi.fn()...` -- accessing test-only mock methods |
| `src/stores/__tests__/stateTransitions.integration.test.ts` | 3 | `@typescript-eslint/no-explicit-any` (2) + `@typescript-eslint/no-unused-vars` (1) | `(Preferences as any)._reset()` casts + unused `app` variable on line 54 |
| `src/stores/__tests__/gameFlow.integration.test.ts` | 1 | `@typescript-eslint/no-explicit-any` | `(Preferences as any)._reset()` cast |
| `src/stores/audioStore.ts` | 1 | `@typescript-eslint/no-explicit-any` | `(window as any).webkitAudioContext` -- Safari AudioContext compat |

### CI Pipeline Gap

Current `.github/workflows/ci.yml` `check` job runs:
1. `npm run type-check`
2. `npm run test:unit`
3. `npm run build`

Missing: `npm run lint` step. This is why the 20 lint errors from Phase 7/8 went undetected.

### vue/block-lang Rule Status

- **Current:** `'vue/block-lang': 'off'` in `eslint.config.js` line 23
- **Origin:** Disabled in Phase 7 Plan 01 during incremental TypeScript migration (all 16 .vue files lacked `lang="ts"`)
- **Current state:** All 16 components now have `<script setup lang="ts">` (verified via grep)
- **Fix:** Remove the `'vue/block-lang': 'off'` line. The `@vue/eslint-config-typescript` `vueTsConfigs.recommended` already configures this rule as `["error", { script: { lang: ["ts"], allowNoLang: false } }]`
- **Effect:** Any future `.vue` file without `lang="ts"` on its `<script>` block will fail lint

### DEPS-06 Documentation Status

- **Audit claim:** "REQUIREMENTS.md DEPS-06 description still says 'sequential 5->6->7->8' vs actual 'direct 5->8'"
- **Actual current text (line 17):** `Capacitor upgraded from 5 to 8 (direct 5->8 with fresh native project regeneration, native build verified)`
- **Assessment:** Already correct. This was likely fixed between the audit snapshot and the current HEAD. No action needed.

### Android Build Status

- Android project directory exists at `./android/` with proper Capacitor 8 structure
- `build.gradle` uses AGP 8.13.0, compileSdk/targetSdk 36, minSdk 24
- `capacitor.config.ts` sets `androidScheme: 'https'` and `backgroundColor: '#0f1729'`
- Assets are synced (`android/app/src/main/assets/capacitor.config.json` exists)
- Build was never verified in Android Studio (noted in audit, Phase 3, and Phase 9)
- **Requires human action:** Opening Android Studio, syncing Gradle, and running the app on emulator/device

### Existing eslint-disable Comments (already in codebase)

| File | Line | Comment | Justification |
|------|------|---------|---------------|
| `src/main.ts` | 33 | `eslint-disable-next-line @typescript-eslint/no-explicit-any` | Dev-only debug: `(window as any).gameStore = useGameStore()` |

This is the only existing `eslint-disable` in the `src/` directory. It has no justification comment, which should be added for consistency with the success criteria.

## Architecture Patterns

### Pattern 1: eslint-disable-next-line with Justification

**What:** Add `eslint-disable-next-line` comments with an explanatory reason at each intentional `any` cast site.
**When to use:** When `any` is genuinely needed (mock manipulation, missing browser API types) and there is no typed alternative.
**Example:**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
(globalThis as any).AudioContext = undefined;
```

### Pattern 2: Grouped eslint-disable for Repeated Casts

**What:** When multiple consecutive lines all need the same disable, a single `eslint-disable-next-line` only covers one line. Each line needs its own comment.
**When to use:** The audioStore tests have 3 consecutive casts (globalThis, window.AudioContext, window.webkitAudioContext) in 4 separate test blocks = 12 total comments needed.
**Example:**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
(globalThis as any).AudioContext = undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
(window as any).AudioContext = undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
(window as any).webkitAudioContext = undefined;
```

### Pattern 3: Preferences Mock _reset Access

**What:** The Preferences mock at `__mocks__/@capacitor/preferences.ts` exposes a `_reset()` method for clearing the Map-based store between tests. The TypeScript types from `@capacitor/preferences` don't include this method, so `(Preferences as any)._reset()` is necessary.
**Alternative considered:** Creating a typed helper (e.g., `resetPreferencesMock()`) that encapsulates the cast. However, this adds indirection for 4 call sites and the `eslint-disable-next-line` approach is more direct and conventional.
**Example:**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: _reset is a test-only method on the Preferences mock
(Preferences as any)._reset();
```

### Pattern 4: CI Lint Integration

**What:** Add `npm run lint` as a step in the CI `check` job, placed before `type-check` so lint feedback is fastest.
**Example:**
```yaml
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit
      - run: npm run build
```

**Note:** `npm run lint` includes `--fix` flag. In CI this is safe -- it won't persist changes. However, for CI clarity, consider whether a non-fix lint check (`eslint .` without `--fix`) would be more appropriate. The `--fix` flag in CI means auto-fixable errors won't fail the build. Since the goal is to catch regressions, removing `--fix` in CI is the safer choice.

### Anti-Patterns to Avoid

- **Blanket eslint-disable for entire files:** Never use `/* eslint-disable */` at the top of test files. Individual line-level disables are required per success criteria.
- **Removing the `no-explicit-any` rule from test files:** This would hide legitimate `any` usage that should be typed. The rule should remain active; only justified exceptions get `eslint-disable-next-line`.
- **Creating separate ESLint config for test files to relax rules:** Over-engineering for 20 cast sites. eslint-disable-next-line is the standard approach.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Typed Preferences mock access | Custom type augmentation for `@capacitor/preferences` | `eslint-disable-next-line` at each cast | Type augmentation creates maintenance burden and misleads about the real API surface |
| CI lint step | Custom shell script with error filtering | `npm run lint` (or `npx eslint .`) in CI yaml | One-line addition, standard pattern |
| vue/block-lang enforcement | Custom check script | Remove `'off'` override, let `@vue/eslint-config-typescript` handle it | Already configured correctly upstream |

**Key insight:** All fixes in this phase are small, targeted changes to existing configuration. No new libraries, no new patterns, no architectural changes.

## Common Pitfalls

### Pitfall 1: lint --fix in CI
**What goes wrong:** Using `npm run lint` (which includes `--fix`) in CI means auto-fixable lint errors pass CI silently. Developers push code with fixable lint issues and CI doesn't catch them.
**Why it happens:** The `package.json` `lint` script includes `--fix` for developer convenience.
**How to avoid:** Either: (a) add a separate `lint:check` script (`eslint .` without `--fix`) for CI, or (b) accept that `--fix` in CI is fine since the fixed output isn't persisted and the command still exits non-zero for non-auto-fixable errors. Since all 20 current errors are `no-explicit-any` (not auto-fixable), `--fix` vs no-fix doesn't matter for this specific case. For long-term CI hygiene, a dedicated `lint:check` script is better.
**Warning signs:** CI passes but local `npx eslint .` shows errors.

### Pitfall 2: Forgetting the Justification Comment
**What goes wrong:** Adding `eslint-disable-next-line` without a reason violates the success criteria: "No `any` casts without explicit `eslint-disable-next-line` justification comments."
**Why it happens:** Copy-paste speed, not reading the full success criteria.
**How to avoid:** Every `eslint-disable-next-line` MUST have a `-- reason` suffix. Template: `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- {category}: {explanation}`.
**Warning signs:** `eslint-disable-next-line` without `--` separator.

### Pitfall 3: vue/block-lang Breaking Unexpected Files
**What goes wrong:** Re-enabling `vue/block-lang` and discovering a `.vue` file without `lang="ts"` that was missed.
**Why it happens:** New files added without awareness of the rule.
**How to avoid:** After removing the `'off'` override, run `npx eslint .` and verify zero new errors. All 16 components have been verified via grep to have `<script setup lang="ts">`.
**Warning signs:** ESLint errors mentioning "block lang" after the rule change.

### Pitfall 4: Android Build Environment Issues
**What goes wrong:** Android build fails due to missing SDK versions, AGP version mismatch, or Gradle sync failures.
**Why it happens:** AGP 8.13.0 requires specific SDK tools and JDK versions. The machine may not have the exact Android SDK 36 installed.
**How to avoid:** Open Android Studio first, let it detect and install missing SDK components, sync Gradle, then build. Don't attempt command-line `gradlew assembleDebug` without verifying SDK setup first.
**Warning signs:** "SDK not found" errors, "Unsupported Java version" errors.

### Pitfall 5: Unused Variable Fix Breaking Test
**What goes wrong:** The `stateTransitions.integration.test.ts` has an unused `app` variable (line 54). Removing it or prefixing with `_` could break the test if `withSetup()` needs to be called for its side effects.
**Why it happens:** `withSetup()` returns `{ result, app }` -- the `app` is destructured but only `result` (aliased to `lifecycle`) is used. However, `withSetup()` also calls `app.mount()` which must execute.
**How to avoid:** Use `_app` prefix convention: `const { result: lifecycle, app: _app } = withSetup(gameStore)`. Or destructure without `app`: `const { result: lifecycle } = withSetup(gameStore)` -- this is cleaner since `app` is genuinely unused in that block.
**Warning signs:** Test failures after renaming the variable.

## Code Examples

### Fix 1: audioStore.ts webkitAudioContext Cast (1 error)

```typescript
// Source: src/stores/audioStore.ts line 31
// Current:
const AudioCtx =
  window.AudioContext || (window as any).webkitAudioContext;

// Fixed:
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Safari compat: webkitAudioContext not in standard Window type
const AudioCtx =
  window.AudioContext || (window as any).webkitAudioContext;
```

Note: The `eslint-disable-next-line` must go on the line immediately before the `window.AudioContext` line, since that's where the `(window as any)` expression is. However, the expression spans two lines. The `any` cast is on line 31. The disable comment must be on line 30 (or immediately before the line containing `any`).

### Fix 2: audioStore.test.ts Grouped Casts (12 errors, 4 blocks x 3 lines)

```typescript
// Source: src/stores/__tests__/audioStore.test.ts
// Pattern repeats in 4 test blocks (lines 92-94, 154-156, 171-173, 271-273)

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
(globalThis as any).AudioContext = undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
(window as any).AudioContext = undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
(window as any).webkitAudioContext = undefined;
```

### Fix 3: Preferences Mock _reset Casts (4 errors across 3 files)

```typescript
// Source: multiple test files
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: _reset is a test-only method on the Preferences mock
(Preferences as any)._reset();
```

### Fix 4: persistenceStore.test.ts set Override (2 errors)

```typescript
// Source: src/stores/__tests__/persistenceStore.test.ts lines 86, 91
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: override set to simulate disk full error
(Preferences as any).set = vi.fn().mockRejectedValue(new Error('disk full'));

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: restore original set after test
(Preferences as any).set = originalSet;
```

### Fix 5: Unused Variable (1 error)

```typescript
// Source: src/stores/__tests__/stateTransitions.integration.test.ts line 54
// Current:
let app: App;
// ...
app = setup.app;

// Fixed (option A -- destructure without app):
const setup = withSetup(gameStore);
lifecycle = setup.result;
// app is not used in this block, so don't destructure it

// Fixed (option B -- underscore prefix):
let _app: App;
// ...
_app = setup.app;
```

### Fix 6: CI Lint Step

```yaml
# Source: .github/workflows/ci.yml
# Add before type-check:
- run: npx eslint .
```

Or add a new npm script for CI:
```json
"lint:check": "eslint ."
```

### Fix 7: vue/block-lang Re-enablement

```javascript
// Source: eslint.config.js
// Remove this line:
'vue/block-lang': 'off',
```

### Fix 8: main.ts eslint-disable Justification

```typescript
// Source: src/main.ts line 33
// Current:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).gameStore = useGameStore();

// Fixed (add justification):
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dev-only: expose store for console debugging
(window as any).gameStore = useGameStore();
```

## Task Breakdown Recommendation

This phase has 6 distinct success criteria that group naturally into 2-3 plans:

**Plan 1: Lint Fixes + CI Integration**
- Add `eslint-disable-next-line` with justification to all 20 error sites (19 `no-explicit-any` + 1 `no-unused-vars`)
- Add justification to existing `eslint-disable-next-line` in `main.ts`
- Re-enable `vue/block-lang` by removing the `'off'` override
- Add `npm run lint` (or `npx eslint .`) to CI `check` job
- Verify `npm run lint` passes with zero errors
- Verify CI config is valid

**Plan 2: Android Build Verification**
- Run `npm run build` to ensure fresh web assets
- Run `npx cap sync android` to sync to native project
- Open in Android Studio, sync Gradle, build and run
- Document any issues encountered

**DEPS-06 documentation fix is NOT needed** -- already correct in current HEAD.

## Open Questions

1. **`npm run lint` vs `npx eslint .` in CI**
   - What we know: `npm run lint` includes `--fix`. In CI, fixes aren't persisted but auto-fixable errors won't cause CI failure.
   - What's unclear: Whether the project wants strict no-fix checking in CI.
   - Recommendation: Add a `lint:check` script (`eslint .` without `--fix`) for CI use. Keeps `lint` script convenient for developers while CI catches all issues.

2. **Android build environment readiness**
   - What we know: Android Studio is installed, project structure exists, AGP 8.13.0 with SDK 36.
   - What's unclear: Whether the machine has Android SDK 36 installed and whether Gradle sync will succeed on first try.
   - Recommendation: This is a human verification step. Document the `npx cap sync android` + Android Studio build flow and note that SDK downloads may be needed.

3. **App.vue line count (219 vs ~80 target)**
   - What we know: The audit notes this as tech debt, but also acknowledges the thin shell pattern was achieved (verbose due to overlay prop bindings).
   - What's unclear: Whether this should be addressed in Phase 10.
   - Recommendation: Out of scope for Phase 10. The ROADMAP success criteria do not mention App.vue line count. This is acceptable debt for M2.

## Sources

### Primary (HIGH confidence)
- **Direct codebase inspection** -- ESLint config, CI workflow, test files, source files all read directly
- **`npx eslint .` output** -- 20 errors confirmed with exact file/line/rule information
- **`vue-tsc --noEmit`** -- passes clean (zero type errors)
- **`npm run lint`** -- confirms 20 errors match `npx eslint .` output
- **`@vue/eslint-config-typescript` source** -- `node_modules/@vue/eslint-config-typescript/dist/index.cjs` confirms `scriptLangs: ["ts"]` default and `vue/block-lang` configuration
- **`.planning/v1.0-MILESTONE-AUDIT.md`** -- tech debt inventory

### Secondary (MEDIUM confidence)
- **eslint-plugin-vue `block-lang` rule source** -- `node_modules/eslint-plugin-vue/dist/rules/block-lang.js` confirms option schema (lang set + allowNoLang boolean)

## Metadata

**Confidence breakdown:**
- Lint fixes: HIGH -- all 20 errors identified with exact locations and fix patterns
- CI integration: HIGH -- single YAML line addition, standard pattern
- vue/block-lang: HIGH -- rule configuration verified in upstream package source
- DEPS-06 docs: HIGH -- verified already correct in current HEAD (no fix needed)
- Android build: MEDIUM -- project structure verified, but actual build requires human execution
- Pitfalls: HIGH -- all pitfalls derived from direct codebase inspection

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable domain, no external dependency changes expected)
