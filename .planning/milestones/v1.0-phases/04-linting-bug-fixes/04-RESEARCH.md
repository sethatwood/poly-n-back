# Phase 4: Linting & Bug Fixes - Research

**Researched:** 2026-03-01
**Domain:** Code quality tooling (ESLint/Prettier) and gameplay resilience (bug fixes)
**Confidence:** HIGH

## Summary

Phase 4 covers two distinct workstreams: (1) setting up ESLint and Prettier from scratch using modern flat config, and (2) fixing 10 documented bugs in the game store, audio system, and persistence layer. The project currently has zero linting or formatting configuration -- no `.eslintrc`, no `.prettierrc`, no lint scripts. All source files are plain JavaScript (`.js` and `.vue`).

The bug fixes are well-scoped. The game store (`src/store/gameStore.js`) contains the majority of issues: division-by-zero in accuracy calculations, missing bounds checks in `respondToStimulus()`, no debouncing on response buttons, unbounded `stimulusHistory` growth, unmanaged `setTimeout`/`setInterval` calls, and all persistence via raw `localStorage` (5 read sites, 6 write sites across 4 files). The audio system works but crashes if `AudioContext` construction fails or sound files fail to load. There is no global error handler installed.

**Primary recommendation:** Set up ESLint 10 + Prettier first (establishes the quality gate), then fix bugs in dependency order: math guards first, then debouncing, then storage migration to `@capacitor/preferences`, then audio resilience, then global error handler last (catches anything the other fixes missed).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| eslint | ^10.0.2 | JavaScript/Vue linting | Latest stable; flat config only; eslintrc removed. DEPS-08 says "ESLint 9" but ESLint 10 was released Feb 2026 and is the current stable. Since this is a fresh install with no legacy eslintrc to migrate, ESLint 10 is the correct target. |
| eslint-plugin-vue | ^10.8.0 | Vue SFC linting | Official Vue plugin; v10 supports ESLint 10 flat config natively |
| prettier | ^3.8.1 | Code formatting | De facto formatter; no competing standard |
| eslint-config-prettier | ^10.1.8 | Disables ESLint rules that conflict with Prettier | Required to prevent ESLint and Prettier from fighting over formatting |
| globals | ^17.4.0 | Global variable definitions for ESLint | Provides `globals.browser` for flat config `languageOptions` |
| @capacitor/preferences | ^8.0.1 | Native key-value storage | Replaces localStorage; uses UserDefaults (iOS) / SharedPreferences (Android); required by FIX-06 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | -- | -- | All bug fixes use vanilla JS patterns or existing dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ESLint 10 | ESLint 9.39.x | DEPS-08 literally says "ESLint 9" but v10 is current stable, flat-config-only, and a clean setup. No benefit to pinning v9 for a greenfield config. Recommend v10. |
| eslint-config-prettier | eslint-plugin-prettier | eslint-plugin-prettier runs Prettier as an ESLint rule (red squiggles for formatting). Heavier, slower, noisier. eslint-config-prettier (disable conflicting rules) + standalone Prettier is the recommended approach per Prettier team. |

**Installation:**
```bash
npm install --save-dev eslint eslint-plugin-vue eslint-config-prettier prettier globals
npm install @capacitor/preferences
npx cap sync
```

## Architecture Patterns

### Pattern 1: ESLint 10 Flat Config for Vue 3
**What:** Single `eslint.config.js` at project root using ESM imports
**When to use:** All JavaScript/Vue linting
**Example:**
```javascript
// eslint.config.js
// Source: https://eslint.vuejs.org/user-guide/
import pluginVue from 'eslint-plugin-vue';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import globals from 'globals';

export default [
  // Vue recommended rules (spread because it's an array)
  ...pluginVue.configs['flat/recommended'],

  // Project-specific overrides
  {
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Adjust as needed after initial lint pass
    },
  },

  // Prettier MUST be last -- disables formatting rules
  eslintConfigPrettier,
];
```

### Pattern 2: Capacitor Preferences Wrapper
**What:** Async read/write wrapper around `@capacitor/preferences` with JSON serialization and schema validation
**When to use:** All persistent storage (replaces every `localStorage` call)
**Example:**
```javascript
// Source: https://capacitorjs.com/docs/apis/preferences
import { Preferences } from '@capacitor/preferences';

async function loadWithDefaults(key, defaults) {
  try {
    const { value } = await Preferences.get({ key });
    if (value === null) return defaults;
    const parsed = JSON.parse(value);
    // Schema validation: check expected shape
    if (typeof parsed !== typeof defaults) return defaults;
    return parsed;
  } catch {
    return defaults;
  }
}

async function save(key, data) {
  try {
    await Preferences.set({ key, value: JSON.stringify(data) });
  } catch (e) {
    console.warn(`Storage write failed for key "${key}":`, e);
    // Swallow quota exceeded or other write errors (FIX-10)
  }
}
```

### Pattern 3: Managed Timeout Utility
**What:** A composable or utility that tracks all `setTimeout`/`setInterval` handles and clears them on component unmount
**When to use:** Every component and store that uses timers
**Example:**
```javascript
// useManagedTimeout composable
import { onUnmounted } from 'vue';

export function useManagedTimeout() {
  const timeouts = new Set();
  const intervals = new Set();

  function managedSetTimeout(fn, delay) {
    const id = setTimeout(() => {
      timeouts.delete(id);
      fn();
    }, delay);
    timeouts.add(id);
    return id;
  }

  function managedSetInterval(fn, delay) {
    const id = setInterval(fn, delay);
    intervals.add(id);
    return id;
  }

  function clearManagedTimeout(id) {
    clearTimeout(id);
    timeouts.delete(id);
  }

  function clearManagedInterval(id) {
    clearInterval(id);
    intervals.delete(id);
  }

  function clearAll() {
    timeouts.forEach(clearTimeout);
    intervals.forEach(clearInterval);
    timeouts.clear();
    intervals.clear();
  }

  onUnmounted(clearAll);

  return {
    managedSetTimeout,
    managedSetInterval,
    clearManagedTimeout,
    clearManagedInterval,
    clearAll,
  };
}
```

**Note:** This composable uses `onUnmounted` so it works in component `setup()`. For the Pinia store (which is not a component), timer cleanup must be handled manually in `resetGameState()` and `stopGame()` -- the store already does `clearInterval(timer.value)` in those functions. The composable is for the Vue components (App.vue, AchievementToast.vue, GameHint.vue) that have their own timeouts.

### Pattern 4: Audio System Graceful Degradation
**What:** Wrap AudioContext creation and all audio operations in try-catch, track readiness state, silently skip on failure
**When to use:** The `audioManager` object in `gameStore.js`
**Example:**
```javascript
const audioManager = {
  context: null,
  buffers: {},
  unlocked: false,
  ready: false, // NEW: track overall readiness

  async init() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.warn('AudioContext not available. Game will run silently.');
        return; // ready stays false
      }
      this.context = new AudioCtx();
      await Promise.allSettled([ // allSettled, not all -- partial load OK
        this.loadSound('stimulus', stimulusSoundUrl),
        this.loadSound('increment', incrementSoundUrl),
        this.loadSound('strike', strikeSoundUrl),
      ]);
      this.ready = true;
    } catch (e) {
      console.warn('Audio initialization failed. Game will run silently.', e);
      this.context = null;
      this.ready = false;
    }
  },

  play(soundName) {
    if (!this.ready || !this.context || !this.buffers[soundName]) return;
    try {
      if (this.context.state === 'suspended') {
        this.context.resume();
      }
      const source = this.context.createBufferSource();
      source.buffer = this.buffers[soundName];
      source.connect(this.context.destination);
      source.start(0);
    } catch (e) {
      console.warn(`Audio playback failed for "${soundName}":`, e);
      // Swallow -- game continues silently
    }
  }
};
```

### Pattern 5: Global Error Handler
**What:** Install `app.config.errorHandler` + `window.onerror` + `window.onunhandledrejection` in `main.js`
**When to use:** Once, at app startup
**Example:**
```javascript
// Source: https://vuejs.org/api/application.html#app-config-errorhandler
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]', err, info);
};

window.onerror = (message, source, lineno, colno, error) => {
  console.error('[Global Error]', { message, source, lineno, colno, error });
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
});
```

### Anti-Patterns to Avoid
- **Raw `localStorage` in Capacitor apps:** Mobile OSs can and do purge `localStorage`. Use `@capacitor/preferences` for anything the user cares about.
- **`Promise.all` for audio loading:** If one sound file fails, `Promise.all` rejects the entire batch. Use `Promise.allSettled` so partial loads succeed.
- **Checking `disabled` only in template:** Vue template `:disabled` prevents new clicks from rendering as enabled, but rapid taps can fire multiple events before Vue re-renders. The store action must also guard.
- **Unguarded division:** `Math.round(a / b * 100)` produces `NaN` when `b === 0`. Always guard with `if (b === 0) return 0`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-platform persistent storage | Custom localStorage wrapper | `@capacitor/preferences` | Handles iOS UserDefaults, Android SharedPreferences, web localStorage fallback automatically |
| ESLint Vue parsing | Custom parser config | `eslint-plugin-vue` flat configs | Bundles `vue-eslint-parser` setup, rule sets, and recommended presets |
| Formatting rule conflicts | Manual rule disabling | `eslint-config-prettier/flat` | Automatically disables all ESLint rules that conflict with Prettier |

**Key insight:** The persistence migration is the most complex "don't hand-roll" item. `@capacitor/preferences` is async (returns Promises), while `localStorage` is sync. Every read site needs to become async, which ripples through store initialization. Plan for this.

## Common Pitfalls

### Pitfall 1: Async Store Initialization
**What goes wrong:** `@capacitor/preferences` API is entirely async (`get()` returns a Promise), but the current store initializes `highScoreData` and `isAudioEnabled` synchronously inline with `ref()`. Moving to Preferences means these refs start with defaults and get populated after an async load.
**Why it happens:** `localStorage.getItem()` is synchronous; `Preferences.get()` is not.
**How to avoid:** Initialize refs with safe defaults, then call an async `loadPersistedState()` function during app startup (in `main.js` or an `onMounted` in `App.vue`). Ensure the game cannot start until persisted state is loaded.
**Warning signs:** High scores resetting to 0 on app restart, audio preference not remembered.

### Pitfall 2: ESLint Flat Config Spread Syntax
**What goes wrong:** `pluginVue.configs['flat/recommended']` is an **array**, not an object. Forgetting to spread it (`...pluginVue.configs['flat/recommended']`) causes ESLint to silently ignore Vue rules.
**Why it happens:** Legacy eslintrc used string references in `extends`; flat config uses array spreading.
**How to avoid:** Always spread Vue plugin configs: `...pluginVue.configs['flat/recommended']`.
**Warning signs:** ESLint runs but reports zero Vue-specific issues.

### Pitfall 3: Prettier/ESLint Config Ordering
**What goes wrong:** If `eslintConfigPrettier` is not the LAST entry in the flat config array, formatting rules from other plugins remain active and conflict with Prettier.
**Why it happens:** Flat config applies rules in array order; later entries override earlier ones.
**How to avoid:** Always place `eslintConfigPrettier` as the final element.
**Warning signs:** ESLint auto-fix and Prettier produce different output, causing infinite fix loops.

### Pitfall 4: Capacitor Preferences Requires `npx cap sync`
**What goes wrong:** Installing `@capacitor/preferences` via npm without running `npx cap sync` means the native plugin isn't registered. iOS/Android builds fail or fall back to web-only behavior silently.
**Why it happens:** Capacitor plugins have a native component that `cap sync` copies into the native projects.
**How to avoid:** Always run `npx cap sync` after installing any `@capacitor/*` package.
**Warning signs:** `Preferences.get()` returns null on device even after `set()`.

### Pitfall 5: Division by Zero in Game Over Logic
**What goes wrong:** In `respondToStimulus()` at the game-over branch (line 300-301), `previousPotentialCorrectAnswers` and `highScoreData.potentialCorrectAnswers` are used as divisors without zero-checks. If a player gets 3 strikes before any matches are possible, these are 0, producing `NaN`.
**Why it happens:** The game allows immediate incorrect responses before enough history for matches.
**How to avoid:** Guard every division: `if (divisor === 0) return 0`.
**Warning signs:** "NaN%" displayed in game over screen, high score comparison logic breaks.

### Pitfall 6: localStorage Data Already Exists in Production
**What goes wrong:** Users who already have data in `localStorage` will lose it if the migration to `@capacitor/preferences` doesn't read existing `localStorage` values first.
**Why it happens:** `@capacitor/preferences` uses a different storage backend on native platforms.
**How to avoid:** On first launch with the new code, read from `localStorage`, write to Preferences, then clear the localStorage keys. This is a one-time migration.
**Warning signs:** Long-time users report lost high scores after update.

## Code Examples

### Existing Bug: Division by Zero (FIX-01)
```javascript
// CURRENT (gameStore.js lines 114-123) -- finalScoreAccuracy uses
// previousPotentialCorrectAnswers as divisor, highScoreAccuracy uses
// highScoreData.potentialCorrectAnswers. Both can be 0.

// ALSO: respondToStimulus() lines 300-301 compute currentAccuracy and
// hsAccuracy inline with unguarded division.

// FIX: Guard all four division sites:
const finalScoreAccuracy = computed(() => {
  const total = previousPotentialCorrectAnswers.value;
  if (total === 0) return 0;
  return Math.round((score.value / total) * 100);
});
```

### Existing Bug: Missing Debounce Guard (FIX-03)
```javascript
// CURRENT: respondToStimulus() does NOT check respondedThisTurn before
// processing. The template disables the button, but rapid taps can
// fire before Vue re-renders. Line 324 sets respondedThisTurn AFTER
// processing, and it's OUTSIDE the nBackIndex >= 0 guard.

// FIX: Add guard at top of respondToStimulus():
function respondToStimulus(stimulusType) {
  if (respondedThisTurn.value[stimulusType]) return; // DEBOUNCE GUARD
  respondedThisTurn.value[stimulusType] = true;      // Mark BEFORE processing
  // ... rest of logic
}
```

### Existing Bug: Unbounded History (FIX-04)
```javascript
// CURRENT: stimulusHistory grows without limit (line 181 pushes every turn).
// In a long game session this is unbounded memory growth.

// FIX: Cap history after push:
stimulusHistory.value.push({ ...currentStimulus.value });
const maxHistory = nBack.value + 50;
if (stimulusHistory.value.length > maxHistory) {
  stimulusHistory.value = stimulusHistory.value.slice(-maxHistory);
}
```

### localStorage Sites Requiring Migration (FIX-06, FIX-07, FIX-10)
```
File                     | Key                | Read/Write | Line(s)
-------------------------|--------------------|-----------|---------
src/store/gameStore.js   | highScoreData      | Read      | 79
src/store/gameStore.js   | isAudioEnabled     | Read      | 83
src/store/gameStore.js   | isAudioEnabled     | Write     | 191
src/store/gameStore.js   | highScoreData      | Write     | 239, 316
src/AchievementToast.vue | achievements       | Read      | 90
src/AchievementToast.vue | achievements       | Write     | 107
src/App.vue              | tutorialCompleted  | Read      | 213
src/TutorialOverlay.vue  | tutorialCompleted  | Write     | 152
```

Total: 4 distinct keys, 5 read sites, 6 write sites across 4 files.

### setTimeout/setInterval Sites Requiring Management (FIX-05)
```
File                     | Type        | Purpose           | Line(s) | Cleanup?
-------------------------|-------------|-------------------|---------|---------
src/store/gameStore.js   | setTimeout  | Flash border      | 184     | No
src/store/gameStore.js   | setInterval | Game timer        | 248     | Yes (clearInterval in stopGame/resetGameState)
src/AchievementToast.vue | setTimeout  | Toast auto-hide   | 114     | Yes (onUnmounted)
src/GameHint.vue         | setTimeout  | Hint auto-hide    | 66      | Yes (onUnmounted)
src/App.vue              | setTimeout  | Score animation   | 225     | No
src/App.vue              | setTimeout  | Strike animation  | 233     | No
src/App.vue              | setTimeout  | Feedback hide     | 289     | Partial (clears prev, not on unmount)
```

3 unmanaged timeouts in App.vue, 1 unmanaged timeout in gameStore.js.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ESLint 9 with optional flat config | ESLint 10 with mandatory flat config | Feb 2026 | eslintrc completely removed; only eslint.config.js |
| eslint-plugin-vue 9.x | eslint-plugin-vue 10.x | 2025 | Flat config arrays built-in; `flat/recommended` preset |
| `@capacitor/storage` | `@capacitor/preferences` | Capacitor 5 | Renamed; API identical; old package deprecated |
| `localStorage` for Capacitor apps | `@capacitor/preferences` | Capacitor 3+ | Mobile OSs can purge localStorage; Preferences uses native storage |

**Deprecated/outdated:**
- `.eslintrc.*` files: Removed in ESLint 10. Use `eslint.config.js` only.
- `@capacitor/storage`: Renamed to `@capacitor/preferences` in Capacitor 5.

## Open Questions

1. **ESLint 9 vs 10**
   - What we know: DEPS-08 says "ESLint 9 flat config." ESLint 10.0.2 is current stable (released Feb 2026). ESLint 10 removed eslintrc entirely and is flat-config-only. eslint-plugin-vue 10.x supports ESLint 10.
   - What's unclear: Whether the user specifically wants ESLint 9 or just meant "modern ESLint with flat config."
   - Recommendation: Use ESLint 10. It is the current stable, this is a fresh setup (no legacy config to migrate), and pinning v9 would mean using an already-superseded major version. The requirement's intent ("flat config and Prettier passing") is fully met by v10.

2. **One-time localStorage migration**
   - What we know: Existing users have data in `localStorage` under 4 keys. Moving to `@capacitor/preferences` changes the storage backend on native.
   - What's unclear: Whether there are real users with saved data worth preserving vs. this being a pre-release app.
   - Recommendation: Implement a one-time migration (read localStorage, write to Preferences, clear localStorage) regardless. It is cheap to build and prevents data loss. The migration runs once on first app launch after update.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEPS-08 | ESLint 9 flat config + Prettier configured and passing on all source files | Standard Stack (ESLint 10 + eslint-plugin-vue + Prettier + eslint-config-prettier), Pattern 1 (flat config), Pitfalls 2-3 |
| FIX-01 | Accuracy calculations guarded against division by zero | Code Example (division by zero), Pitfall 5; 4 division sites identified in gameStore.js |
| FIX-02 | stimulusHistory access bounds-checked in respondToStimulus() | Existing `nBackIndex >= 0` check at line 275 already handles this; verify `respondedThisTurn` is set correctly |
| FIX-03 | Button responses debounced to prevent multiple responses per stimulus turn | Code Example (debounce guard), Anti-pattern (template-only disabled check) |
| FIX-04 | Stimulus history capped to nBack + 50 entries | Code Example (unbounded history) |
| FIX-05 | All setTimeout/setInterval calls use managed timeout utility with automatic cleanup | Pattern 3 (useManagedTimeout), timer audit table (7 sites, 3 unmanaged) |
| FIX-06 | Persistent data migrated from localStorage to @capacitor/preferences | Pattern 2 (Preferences wrapper), localStorage audit table (4 keys, 5 reads, 6 writes), Pitfalls 1, 4, 6 |
| FIX-07 | All storage reads validate data schema and fall back to defaults on corruption | Pattern 2 (loadWithDefaults), Pitfall 1 (async initialization) |
| FIX-08 | Global error handler installed | Pattern 5 (errorHandler + onerror + unhandledrejection) |
| FIX-09 | Audio system degrades gracefully when AudioContext unavailable or sounds fail to load | Pattern 4 (audio degradation), Anti-pattern (Promise.all for audio) |
| FIX-10 | All storage writes wrapped in try-catch for quota exceeded errors | Pattern 2 (save function with try-catch) |
</phase_requirements>

## Sources

### Primary (HIGH confidence)
- [eslint-plugin-vue User Guide](https://eslint.vuejs.org/user-guide/) - Flat config setup, recommended presets, Vue 3 configuration
- [@capacitor/preferences API docs](https://capacitorjs.com/docs/apis/preferences) - Full API reference, install command, platform behavior
- [eslint-config-prettier README](https://github.com/prettier/eslint-config-prettier) - Flat config import syntax (`/flat`), placement rules
- [ESLint 10.0.0 Release](https://eslint.org/blog/2026/02/eslint-v10.0.0-released/) - Breaking changes, eslintrc removal, Node.js requirements
- [MDN Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) - AudioContext state handling, autoplay policy

### Secondary (MEDIUM confidence)
- [Vue School: Upgrading ESLint v8 to v9](https://vueschool.io/articles/vuejs-tutorials/upgrading-eslint-from-v8-to-v9-in-vue-js/) - Migration patterns (verified against official docs)
- [Chrome Autoplay Policy](https://developer.chrome.com/blog/autoplay) - Browser autoplay behavior details
- [Vue.js Error Handling Guide](https://enterprisevue.dev/blog/error-handling-in-vue-3/) - app.config.errorHandler patterns

### Tertiary (LOW confidence)
- None. All findings verified against official sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified via `npm view`, official docs consulted for each
- Architecture: HIGH - Patterns derived from official documentation and verified API signatures
- Pitfalls: HIGH - Identified from direct source code analysis of the actual codebase

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable domain; ESLint/Prettier/Capacitor are mature)
