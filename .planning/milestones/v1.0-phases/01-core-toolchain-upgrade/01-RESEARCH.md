# Phase 1: Core Toolchain Upgrade - Research

**Researched:** 2026-03-01
**Domain:** Build toolchain modernization (Node, Vite, Vue, Pinia)
**Confidence:** HIGH

## Summary

This phase upgrades the build toolchain from Node 18 / Vite 4 / Vue 3.3 / Pinia 2 to Node 22 / Vite 7 / Vue 3.5 / Pinia 3, removes dead dependencies, and migrates the Pinia store to setup syntax. The upgrade path is well-documented and straightforward because: (1) Vue 3.3 to 3.5 has zero breaking changes, (2) Pinia 2 to 3 only removes already-deprecated APIs that the project does not use, (3) the Vite config is minimal (just the Vue plugin) so the three major version jump (4 to 7) has almost no impact, and (4) the user already has Node 22.22.0 installed locally.

The most substantive work is the Pinia setup syntax migration (converting gameStore.js from options API to composition-style `ref`/`computed`/`function`). The store is 311 lines with state, 8 actions, and 3 getters -- a single-session rewrite. A secondary concern is ensuring postcss.config.js continues to work after removing `autoprefixer` while Tailwind 3 is still in use (Phase 2 handles the full Tailwind 4 migration).

**Primary recommendation:** Upgrade packages in dependency order (Node/npm first, then Vue, then Pinia, then Vite + plugin-vue), verify the app builds after each step, then do dead dep cleanup and Pinia syntax migration as final steps.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Stay with npm -- Node 22 ships npm 10 which is a meaningful speed improvement over current npm 8
- No migration to pnpm or bun -- user's work machine relies on npm for day job projects
- Delete and regenerate package-lock.json after upgrades to get clean v3 lockfile
- Remove from package.json: postcss, autoprefixer, register-service-worker, @vue/cli-plugin-pwa
- Delete src/registerServiceWorker.js and remove its import from main.js
- Keep public/manifest.json and PWA icon files -- web version may become a marketing funnel to drive app store installs
- Keep index.html manifest link intact
- Migrate gameStore.js from options API (state/actions/getters) to setup syntax (ref/computed/function) during this phase

### Claude's Discretion
- Upgrade sequencing order (which dep to upgrade first)
- How to handle any Vite 7 config changes (vite.config.js adjustments)
- Whether to update .github/workflows/deploy.yml to Node 22 now or defer to Phase 8

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEPS-01 | Node.js upgraded from 18 to 22 LTS with .nvmrc file | Node 22.22.0 already installed; .nvmrc format documented; deploy.yml needs `node-version: 22` |
| DEPS-02 | Vue upgraded from 3.3 to 3.5.x with no regressions | Zero breaking changes between 3.3 and 3.5; latest stable is 3.5.29; drop-in upgrade |
| DEPS-03 | Pinia upgraded from 2 to 3 with deprecated API removals addressed | Project uses `defineStore('game', { ... })` which is the supported syntax; no deprecated APIs in use; Pinia 3 requires Vue ^3.5.11 so Vue must be upgraded first; setup syntax migration pattern documented |
| DEPS-04 | Vite upgraded from 4 to 7 with @vitejs/plugin-vue 6.x | Minimal vite.config.js (only vue plugin) means few breaking changes apply; plugin-vue 6.0.4 supports Vite ^7; must fix `process.env.NODE_ENV` to `import.meta.env.DEV` in main.js |
| DEPS-07 | Dead dependencies removed (postcss, autoprefixer, register-service-worker, @vue/cli-plugin-pwa, registerServiceWorker.js) | registerServiceWorker.js is already fully commented out / disabled; postcss.config.js needs autoprefixer removed but tailwindcss plugin kept for Phase 2 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vue | 3.5.29 | UI framework | Latest stable 3.5.x; zero breaking changes from 3.3 |
| pinia | 3.0.4 | State management | Latest Pinia 3; requires Vue ^3.5.11; drops Vue 2 support and deprecated APIs |
| vite | 7.3.1 | Build tool & dev server | Latest stable; requires Node 20.19+ / 22.12+ |
| @vitejs/plugin-vue | 6.0.4 | Vue SFC compilation for Vite | Paired with Vite 7; peer dep `vite: ^5 \|\| ^6 \|\| ^7 \|\| ^8.0.0-0` |
| node | 22 (LTS "Jod") | Runtime | Current LTS; user already has 22.22.0; npm 10.9.4 included |

### Supporting (unchanged in this phase)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | 3.3.5 (unchanged) | Utility CSS | Stays at v3 until Phase 2 |
| @capacitor/* | 5.5.1 (unchanged) | Native mobile bridge | Stays at v5 until Phase 3 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| npm | pnpm | Faster installs, stricter deps -- but user locked in npm for work compatibility |
| npm | bun | Fastest installs -- but user locked in npm |

**Installation:**
```bash
# After creating .nvmrc and ensuring Node 22:
npm install vue@^3.5.29 pinia@^3.0.4
npm install -D vite@^7.3.1 @vitejs/plugin-vue@^6.0.4
npm uninstall postcss autoprefixer register-service-worker @vue/cli-plugin-pwa
rm package-lock.json && npm install
```

## Architecture Patterns

### Recommended Upgrade Sequence

The order matters because of peer dependency chains:

```
Step 1: .nvmrc + verify Node 22 active
Step 2: npm install vue@^3.5.29           (no breaking changes)
Step 3: npm install pinia@^3.0.4          (requires vue ^3.5.11 -- step 2 satisfies this)
Step 4: npm install -D vite@^7.3.1 @vitejs/plugin-vue@^6.0.4
Step 5: Verify app builds and runs (npm run dev, npm run build)
Step 6: Remove dead deps + registerServiceWorker.js + fix postcss.config.js
Step 7: Fix process.env.NODE_ENV -> import.meta.env.DEV in main.js
Step 8: Verify app builds and runs again
Step 9: Migrate gameStore.js to setup syntax
Step 10: Final verification -- full gameplay test
```

### Pattern: Pinia Setup Store (for gameStore migration)

**What:** Convert options API store (`state`/`actions`/`getters`) to composition API (`ref`/`computed`/`function`)
**When to use:** Pinia 3 supports both syntaxes, but user chose setup syntax to front-load migration for Phases 5 and 7

**Mapping rules:**
```javascript
// OPTIONS API (current)
defineStore('game', {
  state: () => ({ count: 0 }),
  getters: { double: (state) => state.count * 2 },
  actions: { increment() { this.count++ } },
})

// SETUP SYNTAX (target)
defineStore('game', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  function increment() { count.value++ }
  return { count, double, increment }
})
```
Source: https://pinia.vuejs.org/core-concepts/#Setup-Stores

**Critical rule:** ALL state properties MUST be returned from the setup function. Failure to return a ref breaks SSR, devtools, and plugins.

### Pattern: gameStore Specific Migration Notes

The current gameStore.js has these elements that need special attention during migration:

1. **`this` references in actions** -- In setup syntax, there is no `this`. All state access uses `.value` on refs directly (e.g., `this.score` becomes `score.value`).

2. **Actions calling other actions** -- In options API, `this.playSound('stimulus')` works. In setup syntax, just call `playSound('stimulus')` directly since the function is in the same closure scope.

3. **`setInterval` referencing state** -- The `startGame` action creates a `setInterval` that reads `this.isPaused`, `this.timeLeft`, etc. In setup syntax, these become `isPaused.value`, `timeLeft.value`, etc.

4. **External `audioManager` object** -- The `audioManager` singleton defined outside the store is fine. It doesn't need to change. The store functions (`playSound`, `unlockAudio`) just call into it.

5. **Getters that reference other state** -- `finalScoreAccuracy` and `highScoreAccuracy` use `state.score`, `state.previousPotentialCorrectAnswers`, etc. These become `computed` that reference the refs directly.

6. **`localStorage` reads in state initialization** -- `highScoreData` and `isAudioEnabled` initialize from localStorage. In setup syntax, these become `ref(JSON.parse(localStorage.getItem(...)) || default)`.

### Anti-Patterns to Avoid
- **Upgrading all deps simultaneously:** Upgrade in dependency order so if something breaks, you know which package caused it.
- **Skipping the lockfile regeneration:** The old lockfile has Vite 4 resolution trees. A stale lockfile can silently install wrong peer versions. Delete and regenerate.
- **Mixing options and setup syntax in one store:** Once migrated, the store should be fully setup syntax. No hybrid patterns.
- **Using `this` in setup stores:** Setup stores are closures. `this` is undefined. All state access is through the ref `.value`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Environment detection | Custom `process.env` checks | `import.meta.env.DEV` / `import.meta.env.PROD` | Vite provides these; they enable tree-shaking in production builds |
| Lockfile maintenance | Manual dependency resolution | `rm package-lock.json && npm install` | npm 10 generates clean v3 lockfiles; manual edits cause inconsistencies |
| Vendor prefixing (temporary) | Autoprefixer config | Rely on Vite 7 browser targets (Chrome 107+, Safari 16+) | Vite 7's default build targets are modern enough that vendor prefixes are rarely needed; Tailwind 4 (Phase 2) bundles autoprefixer anyway |

**Key insight:** This phase is pure plumbing. Every change has an existing, well-documented migration path. Resist the urge to add features or refactor beyond what the toolchain upgrade requires.

## Common Pitfalls

### Pitfall 1: Pinia 3 peer dependency on Vue 3.5.11+
**What goes wrong:** Installing Pinia 3 before upgrading Vue results in a peer dependency error (`pinia@3.0.4 requires vue@^3.5.11`).
**Why it happens:** Pinia 3 dropped Vue 2 support and pinned its minimum Vue version to 3.5.11.
**How to avoid:** Upgrade Vue to ^3.5.29 before installing Pinia 3.
**Warning signs:** `npm ERR! ERESOLVE` during install mentioning vue version conflict.

### Pitfall 2: process.env.NODE_ENV not replaced in Vite client code
**What goes wrong:** `process.env.NODE_ENV` in main.js evaluates to `undefined` at runtime instead of `'development'` or `'production'`.
**Why it happens:** Vite uses `import.meta.env` for client-side environment detection. `process.env` is a Node.js API not available in the browser. Vite historically did some `process.env.NODE_ENV` replacement but the recommended approach is `import.meta.env.DEV`.
**How to avoid:** Replace `if (process.env.NODE_ENV === 'development')` with `if (import.meta.env.DEV)` in main.js.
**Warning signs:** Debug code not executing in dev mode, or executing in production.

### Pitfall 3: postcss.config.js after removing autoprefixer
**What goes wrong:** After removing `autoprefixer` from postcss.config.js, the config only has `tailwindcss: {}`. This works fine -- Tailwind 3 runs as a PostCSS plugin independently. But if the `postcss` package itself is also uninstalled from devDependencies, Vite still uses its own built-in PostCSS, so Tailwind 3 continues to work.
**Why it happens:** Vite bundles PostCSS internally. The explicit `postcss` devDependency is redundant.
**How to avoid:** Remove `autoprefixer` from the postcss.config.js plugins object, remove `postcss` and `autoprefixer` from devDependencies. Keep postcss.config.js with just `tailwindcss: {}`. Verify Tailwind classes still work after the change.
**Warning signs:** Missing Tailwind utility classes in the rendered page.

### Pitfall 4: Stale package-lock.json after major version jumps
**What goes wrong:** npm resolves transitive dependencies against the old lockfile tree, pulling in outdated or incompatible sub-dependencies.
**Why it happens:** The lockfile was generated with Vite 4's dependency tree. Vite 7 has completely different internal dependencies (e.g., Rollup 4 instead of Rollup 3).
**How to avoid:** Delete `package-lock.json` entirely and run `npm install` fresh after all package.json changes are complete. The user locked this decision in CONTEXT.md.
**Warning signs:** Unexpected warnings during install, or runtime errors from transitive dependencies.

### Pitfall 5: Forgetting to return all refs from setup store
**What goes wrong:** A state property works in the store functions but is invisible to components, devtools, and SSR.
**Why it happens:** Pinia setup stores require ALL reactive state to be returned. Unlike options API where `state()` automatically exposes everything, setup stores only expose what you explicitly return.
**How to avoid:** After migration, compare the returned object against the original `state()` object. Every property must appear in the return statement.
**Warning signs:** `undefined` values when accessing store properties from components, devtools showing incomplete state.

### Pitfall 6: Deploy workflow breaks after merge
**What goes wrong:** GitHub Pages deploy fails because the workflow still uses `node-version: 18`.
**Why it happens:** The deploy.yml references Node 18 explicitly. While new deps may install fine on Node 18, there's a risk of version-specific behavior differences.
**How to avoid:** Update `.github/workflows/deploy.yml` to `node-version: 22` during this phase. This is low-risk and prevents CI failures.
**Warning signs:** Failed GitHub Actions runs after merging the upgrade branch.

## Code Examples

### Creating .nvmrc
```bash
# Source: nvm documentation
echo "22" > .nvmrc
```

### Fixing main.js environment check
```javascript
// BEFORE (process.env is Node-only, unreliable in Vite)
if (process.env.NODE_ENV === 'development') {
  window.gameStore = useGameStore();
}

// AFTER (import.meta.env.DEV is Vite's built-in boolean)
if (import.meta.env.DEV) {
  window.gameStore = useGameStore();
}
```
Source: https://vite.dev/guide/env-and-mode

### postcss.config.js after cleanup
```javascript
// BEFORE
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

// AFTER (autoprefixer removed; Tailwind 3 still works via Vite's built-in PostCSS)
export default {
  plugins: {
    tailwindcss: {},
  },
}
```

### gameStore.js setup syntax migration (skeleton)
```javascript
// Source: https://pinia.vuejs.org/core-concepts/#Setup-Stores
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import stimulusSoundUrl from '../assets/stimulus.wav';
import incrementSoundUrl from '../assets/ting.mp3';
import strikeSoundUrl from '../assets/whip.mp3';

// audioManager stays unchanged (module-level singleton)
const audioManager = { /* ...unchanged... */ };
audioManager.init();

export const useGameStore = defineStore('game', () => {
  // --- State (ref) ---
  const currentStimulus = ref({});
  const score = ref(0);
  const incorrectResponses = ref(0);
  const isPaused = ref(false);
  const isStopped = ref(false);
  const nBack = ref(2);
  const timeLeft = ref(5);
  const timerInterval = ref(5);
  const timer = ref(null);
  const stimulusHistory = ref([]);
  const highScoreData = ref(
    JSON.parse(localStorage.getItem('highScoreData')) || { score: 0, potentialCorrectAnswers: 0, nBack: null }
  );
  const isAudioEnabled = ref(
    JSON.parse(localStorage.getItem('isAudioEnabled')) ?? true
  );
  const respondedThisTurn = ref({ color: false, emoji: false, position: false, shape: false });
  const lastFeedback = ref({ type: null, button: null, timestamp: null });
  const flashBorder = ref(false);
  const showGameOverModal = ref(false);
  const isNewHighScore = ref(false);
  const potentialCorrectAnswers = ref(0);
  const previousPotentialCorrectAnswers = ref(0);
  const level = ref(1);
  const isDeterministic = ref(false);
  const deterministicIndex = ref(0);
  const deterministicStimuli = ref([ /* ...unchanged array... */ ]);

  // --- Getters (computed) ---
  const isEarlyInGame = computed(() => {
    const nBackIndex = stimulusHistory.value.length - nBack.value - 1;
    return nBackIndex < 0;
  });

  const finalScoreAccuracy = computed(() => {
    if (potentialCorrectAnswers.value === 0) return 0;
    return Math.round((score.value / previousPotentialCorrectAnswers.value) * 100);
  });

  const highScoreAccuracy = computed(() => {
    const highScorePotential = highScoreData.value.potentialCorrectAnswers;
    if (highScorePotential === 0) return 0;
    return Math.round((highScoreData.value.score / highScorePotential) * 100);
  });

  // --- Actions (functions) ---
  function playSound(soundName) {
    if (isAudioEnabled.value) {
      audioManager.play(soundName);
    }
  }

  function generateRandomStimulus() { /* ...same logic, no this... */ }
  function setNewStimulus() { /* ...replace this.X with X.value... */ }
  function startGame(time = 5) { /* ...replace this.X with X.value... */ }
  function stopGame() { /* ...replace this.X with X.value... */ }
  function respondToStimulus(stimulusType) { /* ...replace this.X with X.value... */ }
  // ... etc for all actions ...

  // --- MUST return everything ---
  return {
    // state
    currentStimulus, score, incorrectResponses, isPaused, isStopped,
    nBack, timeLeft, timerInterval, timer, stimulusHistory, highScoreData,
    isAudioEnabled, respondedThisTurn, lastFeedback, flashBorder,
    showGameOverModal, isNewHighScore, potentialCorrectAnswers,
    previousPotentialCorrectAnswers, level, isDeterministic,
    deterministicIndex, deterministicStimuli,
    // getters
    isEarlyInGame, finalScoreAccuracy, highScoreAccuracy,
    // actions
    generateRandomStimulus, setNewStimulus, toggleAudio, unlockAudio,
    playSound, toggleDeterministicMode, resetGameState, dismissGameOverModal,
    resetHighScore, startGame, pauseGame, resumeGame, stopGame,
    respondToStimulus,
  };
});
```

### deploy.yml Node version update
```yaml
# BEFORE
- name: Set up Node
  uses: actions/setup-node@v4
  with:
    node-version: 18
    cache: 'npm'

# AFTER
- name: Set up Node
  uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: 'npm'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vite 4 + Rollup 3 | Vite 7 + Rollup 4 (Rolldown optional) | Vite 5 (Nov 2023) | Rollup 4 faster builds, ESM-first |
| `build.target: 'modules'` | `build.target: 'baseline-widely-available'` | Vite 7 (Jun 2025) | Higher minimum browser versions (Chrome 107+, Safari 16+) |
| Pinia options API | Pinia setup syntax (both supported) | Pinia 2.0 (available since launch) | Setup syntax enables composable reuse, better TS inference |
| `process.env.NODE_ENV` | `import.meta.env.DEV` / `import.meta.env.PROD` | Vite 1.0 (recommended since inception) | Proper tree-shaking, browser-native module semantics |
| Sass legacy API | Sass modern API only | Vite 7 (Jun 2025) | N/A -- project uses Tailwind, not Sass |
| `splitVendorChunkPlugin` | `build.rollupOptions.output.manualChunks` | Removed in Vite 7 | N/A -- project did not use this plugin |
| npm lockfile v2 | npm lockfile v3 | npm 9+ | Smaller lockfiles, deterministic installs |

**Deprecated/outdated:**
- `register-service-worker`: Vue CLI ecosystem package. Capacitor bundles assets natively, no service worker needed.
- `@vue/cli-plugin-pwa`: Vue CLI plugin. Project already uses Vite, not Vue CLI.
- `postcss` (explicit dep): Vite bundles PostCSS internally. No need for separate install.
- `autoprefixer`: Redundant with Vite 7's modern browser targets. Will be fully unnecessary after Tailwind 4 migration (Phase 2) which bundles prefixing.

## Open Questions

1. **Tailwind 3 + no autoprefixer: any edge cases?**
   - What we know: Vite 7's default build targets (Chrome 107+, Safari 16+) are modern enough that vendor prefixes are rarely needed. The project uses standard Tailwind utilities with no exotic CSS.
   - What's unclear: Whether any specific Tailwind 3 utilities relied upon by the project generate CSS that needs prefixing for Safari 16.
   - Recommendation: Remove autoprefixer, verify visually on Safari (or iOS simulator). If any issues arise, they'll be moot after Phase 2 (Tailwind 4 bundles prefixing). LOW risk.

2. **Deploy workflow timing**
   - What we know: `.github/workflows/deploy.yml` uses `node-version: 18`. The new deps will likely still install on Node 18 (Vite 7 requires 20.19+), meaning CI will break.
   - What's unclear: Whether to update now (cleaner) or defer to Phase 8.
   - Recommendation: Update to `node-version: 22` now. It's a one-line change and prevents deploy failures. Vite 7 hard-requires Node 20.19+, so this is not optional -- it MUST be done in this phase or CI breaks.

## Sources

### Primary (HIGH confidence)
- npm registry (direct queries) -- @vitejs/plugin-vue 6.0.4 peerDependencies: `vite: ^5 || ^6 || ^7 || ^8.0.0-0`, `vue: ^3.2.25`
- npm registry -- pinia 3.0.4 peerDependencies: `vue: ^3.5.11`, `typescript: >=4.5.0`
- npm registry -- vite 7.3.1 (latest stable), vue 3.5.29 (latest stable)
- npm registry -- @tailwindcss/vite peerDependencies: `vite: ^5.2.0 || ^6 || ^7` (resolved for Vite 7)
- https://vite.dev/guide/migration -- Vite 6 to 7 migration guide
- https://vite.dev/blog/announcing-vite7 -- Vite 7 release announcement
- https://v5.vite.dev/guide/migration -- Vite 4 to 5 migration guide
- https://v6.vite.dev/guide/migration -- Vite 5 to 6 migration guide
- https://pinia.vuejs.org/cookbook/migration-v2-v3.html -- Pinia 2 to 3 migration
- https://pinia.vuejs.org/core-concepts/#Setup-Stores -- Pinia setup stores documentation
- https://vite.dev/guide/env-and-mode -- Vite environment variables

### Secondary (MEDIUM confidence)
- https://blog.vuejs.org/posts/vue-3-5 -- Vue 3.5 announcement (confirms zero breaking changes)

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry; peer dependencies confirmed compatible
- Architecture: HIGH -- Pinia setup syntax is well-documented; gameStore migration path is clear from code analysis
- Pitfalls: HIGH -- all pitfalls derived from official migration guides and confirmed against project codebase

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable ecosystem, slow-moving)
