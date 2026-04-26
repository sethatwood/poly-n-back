# Phase 5: Store Extraction - Research

**Researched:** 2026-03-01
**Domain:** Pinia store decomposition, Vue 3 composable extraction, Web Audio API management, Capacitor Preferences persistence
**Confidence:** HIGH

## Summary

The current `gameStore.js` (485 lines) is a monolithic Pinia setup store that mixes four distinct concerns: pure game logic (stimulus generation, response evaluation, scoring, turn management), audio management (Web Audio API singleton, buffer loading, iOS unlock), data persistence (Capacitor Preferences read/write with schema validation, localStorage migration), and UI feedback state (flashBorder, lastFeedback, showGameOverModal). Additionally, `App.vue` (589 lines) contains animation logic (score pulse, strike shake timers), feedback toast visibility management, and game lifecycle orchestration (start/pause/resume/quit flows) that belong in composables.

The extraction is a pure refactor -- no new libraries are needed. The project already has Pinia 3.0.4 (setup store syntax), Vue 3.5.29, and @capacitor/preferences 8.0.1. The work is decomposing the existing gameStore into three stores (gameStore, audioStore, persistenceStore) and extracting four composables (useAnimations, useFeedback, useGameLifecycle, useManagedTimeout -- the last already exists). The critical constraint is behavioral equivalence: every animation timing, audio trigger, persistence write, and game state transition must work identically after extraction.

**Primary recommendation:** Extract bottom-up -- persistenceStore first (no dependencies on other stores), audioStore second (no store dependencies, just a Web Audio wrapper), then refactor gameStore to delegate to both. Extract composables last since they consume stores and can be verified against the already-stabilized store layer.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ARCH-05 | audioStore extracted from gameStore (singleton AudioContext, buffer loading, iOS unlock flow) | Pinia setup store pattern for singleton services; current audioManager object (lines 9-69 of gameStore.js) maps directly to a store with reactive `ready`/`unlocked` state |
| ARCH-06 | persistenceStore extracted from gameStore (validated read/write wrapper for @capacitor/preferences) | Capacitor Preferences API is string-only; current loadPreference/savePreference/migrateFromLocalStorage helpers (lines 121-181) form a complete extraction unit with schema validation already implemented |
| ARCH-07 | Composables extracted: useAnimations, useFeedback, useGameLifecycle, useManagedTimeout | Vue composable patterns for single-responsibility extraction; App.vue contains animation watchers (lines 298-321), feedback visibility logic (lines 367-384), and lifecycle handlers (lines 331-429) ready to extract |
| ARCH-08 | gameStore refined to use audioStore and persistenceStore (contains pure game logic only) | Pinia cross-store composition pattern: call useAudioStore()/usePersistenceStore() at top of setup function; replace direct audioManager.play() calls with audioStore.play(); replace Preferences calls with persistenceStore methods |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pinia | ^3.0.4 | State management (all stores) | Already installed; setup store syntax supports cross-store composition natively |
| vue | ^3.5.29 | Composable extraction (ref, computed, watch, onUnmounted) | Already installed; Composition API is the foundation for composable pattern |
| @capacitor/preferences | ^8.0.1 | Persistent key-value storage | Already installed; used by current persistence helpers |

### Supporting

No new libraries needed. This phase is purely a decomposition refactor.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pinia store for audio | Plain module singleton | Store gives reactive `ready`/`unlocked` state visible in DevTools; module singleton is simpler but opaque |
| Pinia store for persistence | Plain composable | Store makes persistence state (loading, error) globally observable; composable would work but lacks DevTools visibility |
| Manual schema validation | zod/valibot | Current validation is simple type+key checks; adding a schema library is overkill for 3 keys |

**Installation:**
```bash
# No new packages required
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── stores/               # Pinia stores (renamed from store/)
│   ├── gameStore.js      # Pure game logic only
│   ├── audioStore.js     # Web Audio API singleton management
│   └── persistenceStore.js # Capacitor Preferences wrapper
├── composables/          # Vue composables (already exists)
│   ├── useManagedTimeout.js  # Already exists
│   ├── useAnimations.js      # Score pulse, strike shake, stimulus flash timing
│   ├── useFeedback.js        # Feedback toast visibility and button flash state
│   └── useGameLifecycle.js   # Start/pause/resume/quit orchestration
└── ... (components unchanged)
```

**Note on directory rename:** The current store directory is `src/store/` (singular). Move to `src/stores/` (plural) to follow Pinia convention and accommodate multiple store files. Update all imports accordingly.

### Pattern 1: Cross-Store Composition (gameStore delegates to audioStore)

**What:** gameStore calls audioStore for sound playback instead of accessing the audioManager object directly.
**When to use:** Whenever one store's action needs to trigger behavior owned by another store.
**Example:**
```javascript
// src/stores/gameStore.js
import { defineStore } from 'pinia';
import { useAudioStore } from './audioStore';

export const useGameStore = defineStore('game', () => {
  const audioStore = useAudioStore(); // Call at top, before any await

  function playSound(soundName) {
    if (isAudioEnabled.value) {
      audioStore.play(soundName);
    }
  }

  // ... rest of game logic
});
```
Source: [Pinia Composing Stores](https://pinia.vuejs.org/cookbook/composing-stores.html)

### Pattern 2: Persistence Store as Validated Wrapper

**What:** A standalone Pinia store that wraps Capacitor Preferences with typed load/save methods and schema validation.
**When to use:** Any component or store that needs to read/write persistent data.
**Example:**
```javascript
// src/stores/persistenceStore.js
import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Preferences } from '@capacitor/preferences';

export const usePersistenceStore = defineStore('persistence', () => {
  const migrated = ref(false);

  async function loadPreference(key, defaults) {
    try {
      const { value } = await Preferences.get({ key });
      if (value === null) return defaults;
      const parsed = JSON.parse(value);
      if (typeof parsed !== typeof defaults) return defaults;
      if (typeof defaults === 'object' && defaults !== null && !Array.isArray(defaults)) {
        for (const k of Object.keys(defaults)) {
          if (!(k in parsed)) return defaults;
        }
      }
      return parsed;
    } catch {
      return defaults;
    }
  }

  async function savePreference(key, data) {
    try {
      await Preferences.set({ key, value: JSON.stringify(data) });
    } catch (e) {
      console.warn(`Storage write failed for key "${key}":`, e);
    }
  }

  async function migrateFromLocalStorage() {
    if (migrated.value) return;
    const result = await Preferences.get({ key: '_migrated' });
    if (result.value) { migrated.value = true; return; }
    // ... migration logic ...
    migrated.value = true;
  }

  return { migrated, loadPreference, savePreference, migrateFromLocalStorage };
});
```

### Pattern 3: Audio Store as Reactive Singleton

**What:** A Pinia store wrapping the Web Audio API audioManager object, exposing reactive `ready` and `unlocked` state.
**When to use:** Any store or component that needs to play sounds or check audio readiness.
**Example:**
```javascript
// src/stores/audioStore.js
import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useAudioStore = defineStore('audio', () => {
  const context = ref(null);
  const buffers = ref({});
  const unlocked = ref(false);
  const ready = ref(false);

  async function init() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.warn('AudioContext not available. Game will run silently.');
        return;
      }
      context.value = new AudioCtx();
      // ... load sounds ...
      ready.value = true;
    } catch (e) {
      console.warn('Audio initialization failed.', e);
    }
  }

  function unlock() {
    if (unlocked.value || !ready.value || !context.value) return;
    if (context.value.state === 'suspended') {
      context.value.resume();
    }
    unlocked.value = true;
  }

  function play(soundName) {
    if (!ready.value || !context.value || !buffers.value[soundName]) return;
    try {
      if (context.value.state === 'suspended') context.value.resume();
      const source = context.value.createBufferSource();
      source.buffer = buffers.value[soundName];
      source.connect(context.value.destination);
      source.start(0);
    } catch (e) {
      console.warn(`Audio playback failed for "${soundName}":`, e);
    }
  }

  // Auto-initialize
  init();

  return { ready, unlocked, init, unlock, play };
});
```

**Critical detail:** `context` and `buffers` refs hold non-serializable objects (AudioContext, AudioBuffer). These should NOT be returned from the store -- keep them internal. Only expose `ready`, `unlocked`, and action methods. This prevents Pinia DevTools serialization warnings and avoids leaking browser API objects.

### Pattern 4: Composable Extraction from App.vue

**What:** Move animation-related watchers and timeout logic from App.vue setup() into dedicated composables.
**When to use:** When a component's setup function exceeds ~50 lines of logic for a single concern.
**Example:**
```javascript
// src/composables/useAnimations.js
import { ref, watch } from 'vue';
import { useManagedTimeout } from './useManagedTimeout';

export function useAnimations(gameStore) {
  const { managedSetTimeout } = useManagedTimeout();
  const scoreAnimating = ref(false);
  const strikeAnimating = ref(false);

  watch(() => gameStore.score, (newScore, oldScore) => {
    if (newScore > oldScore) {
      scoreAnimating.value = true;
      managedSetTimeout(() => { scoreAnimating.value = false; }, 400);
    }
  });

  watch(() => gameStore.incorrectResponses, (newStrikes, oldStrikes) => {
    if (newStrikes > oldStrikes) {
      strikeAnimating.value = true;
      managedSetTimeout(() => { strikeAnimating.value = false; }, 500);
    }
  });

  return { scoreAnimating, strikeAnimating };
}
```

### Anti-Patterns to Avoid

- **Circular store dependencies:** gameStore should depend on audioStore and persistenceStore, but neither audioStore nor persistenceStore should depend on gameStore. Keep the dependency graph acyclic.
- **Returning non-serializable refs from stores:** AudioContext and AudioBuffer objects cause DevTools serialization issues. Keep them as internal `ref()` or plain variables within the store closure; don't include them in the return statement. Alternatively, use `markRaw()` if they must be reactive.
- **Calling useStore() after await:** In Pinia setup stores, all `useStore()` calls must come before any `await` statement to ensure correct Pinia instance binding (critical for SSR, good practice everywhere).
- **Over-extracting composables:** Don't create a composable for every 5-line function. The four target composables (useAnimations, useFeedback, useGameLifecycle, useManagedTimeout) each encapsulate a coherent, multi-part concern with watchers and state.
- **Breaking the audioManager auto-init:** The current `audioManager.init()` is called at module load time (line 72). The audioStore must preserve this eager initialization behavior so sounds are pre-loaded before first gameplay.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation for preferences | Custom deep-validation library | Current type+key check pattern | Only 3-4 stored keys with simple shapes; existing validation is sufficient |
| Audio context lifecycle | Custom event system for audio ready/unlock | Pinia reactive state (ready/unlocked refs) | Reactive refs naturally propagate state changes to watchers |
| Store-to-store communication | Custom event bus / mitt | Pinia cross-store composition (useOtherStore()) | Native Pinia pattern; works with DevTools; no extra dependency |

**Key insight:** This phase adds zero new dependencies. Every tool needed (Pinia setup stores, Vue composables, Capacitor Preferences API) is already installed and in use. The work is purely structural decomposition.

## Common Pitfalls

### Pitfall 1: Breaking Audio Initialization Timing
**What goes wrong:** Moving audioManager into a Pinia store but forgetting to call `init()` eagerly, causing sounds to not be loaded when the first game starts.
**Why it happens:** Pinia stores are lazily instantiated (first `useStore()` call creates the instance). If no component/store calls `useAudioStore()` early enough, `init()` never runs.
**How to avoid:** Call `useAudioStore()` in `main.js` after `app.use(pinia)` or ensure `gameStore` (which is used at app startup) calls `useAudioStore()` at its top level, triggering audio init.
**Warning signs:** Sounds don't play on first game after app reload.

### Pitfall 2: Losing Reactivity When Destructuring Store State
**What goes wrong:** Destructuring refs from a store loses reactivity: `const { ready } = useAudioStore()` gives a plain boolean, not a reactive ref.
**Why it happens:** Pinia stores return unwrapped reactive objects. Destructured primitives are copied by value.
**How to avoid:** Use `storeToRefs()` for reactive destructuring: `const { ready } = storeToRefs(useAudioStore())`. Or access via `audioStore.ready` directly.
**Warning signs:** UI doesn't update when store state changes after destructuring.

### Pitfall 3: Circular Store Initialization
**What goes wrong:** If audioStore tries to use gameStore (e.g., to check `isAudioEnabled`) AND gameStore uses audioStore, store creation enters infinite recursion.
**Why it happens:** Pinia setup stores execute their setup function on first instantiation. Mutual top-level `useStore()` calls create a cycle.
**How to avoid:** Keep the dependency graph one-directional: `gameStore -> audioStore` and `gameStore -> persistenceStore`. Audio/persistence stores should never import gameStore. Pass `isAudioEnabled` as a parameter or let gameStore gate audio calls.
**Warning signs:** "Maximum call stack size exceeded" error on app load.

### Pitfall 4: Async Race Conditions in Persistence Loading
**What goes wrong:** `loadPersistedState()` is async. If components read `highScoreData` or `isAudioEnabled` before the load completes, they see default values that flash-update when the real data arrives.
**Why it happens:** The current pattern in App.vue `onMounted` already handles this, but extracting persistence into a separate store could break the sequencing.
**How to avoid:** Keep `loadPersistedState()` on gameStore (or call it from gameStore's init), ensuring the same await-on-mount pattern is preserved. The persistence store provides the load/save primitives; gameStore orchestrates the load sequence.
**Warning signs:** Flicker of default values on app startup; high score showing 0 briefly then updating.

### Pitfall 5: Store Directory Rename Breaking Imports
**What goes wrong:** Renaming `src/store/` to `src/stores/` breaks every import path across all components.
**Why it happens:** 11 files import from `./store/gameStore` or `../store/gameStore`.
**How to avoid:** Use find-and-replace across all `.vue` and `.js` files in a single commit. Verify with `npm run build` (Vite will error on broken imports).
**Warning signs:** Build fails with "Module not found" errors.

### Pitfall 6: Composable Lifecycle Misuse
**What goes wrong:** `useManagedTimeout()` calls `onUnmounted()` internally. If used inside a Pinia store instead of a component, `onUnmounted` has no effect (stores don't unmount).
**Why it happens:** Vue lifecycle hooks only work within component setup context.
**How to avoid:** Use `useManagedTimeout` only in composables and components, never in stores. Store timers (like the game interval) should continue to manage their own cleanup via `clearInterval` in store actions.
**Warning signs:** Memory leaks from timeouts that never get cleaned up.

## Code Examples

### Current Concern Mapping (What Lives Where Today)

```
gameStore.js (485 lines):
├── Audio concern (lines 9-72):     audioManager object + init() + loadSound() + unlock() + play()
├── Persistence concern (lines 121-181): loadPreference() + savePreference() + migrateFromLocalStorage() + loadPersistedState()
├── Game logic (remainder):          stimulus generation, response evaluation, scoring, turn management
└── UI state (scattered):           flashBorder, lastFeedback, showGameOverModal, isNewHighScore

App.vue setup() (190 lines of logic):
├── Animation concern (lines 298-321): score/strike animation watchers + timeouts
├── Feedback concern (lines 367-384):  feedbackVisible ref + watcher + showFeedbackToast computed
├── Lifecycle concern (lines 331-429): startGame, handlePause/Resume/Quit, handleGameOver/PlayAgain/MainMenu
└── Remaining UI wiring (~30 lines):  nBackInput/timeLeftInput watchers, buttonClass, responseButtons
```

### Target Concern Mapping (After Extraction)

```
stores/audioStore.js (~70 lines):
└── AudioContext singleton, buffer loading, iOS unlock, play()

stores/persistenceStore.js (~60 lines):
└── loadPreference(), savePreference(), migrateFromLocalStorage()

stores/gameStore.js (~250 lines):
└── Pure game logic: stimulus generation, response evaluation, scoring, turn management
    Delegates: audioStore.play(), persistenceStore.loadPreference/savePreference()

composables/useAnimations.js (~30 lines):
└── scoreAnimating, strikeAnimating watchers + managed timeouts

composables/useFeedback.js (~30 lines):
└── feedbackVisible, showFeedbackToast, feedbackClass helper

composables/useGameLifecycle.js (~60 lines):
└── startGame, handlePause/Resume/Quit, handleGameOver/PlayAgain/MainMenu

composables/useManagedTimeout.js (~30 lines, already exists):
└── managedSetTimeout, clearManagedTimeout, clearAll
```

### Component Import Surface After Extraction

```javascript
// App.vue setup() -- target: ~40 lines of wiring
import { useGameStore } from './stores/gameStore';
import { useAnimations } from './composables/useAnimations';
import { useFeedback } from './composables/useFeedback';
import { useGameLifecycle } from './composables/useGameLifecycle';

const gameStore = useGameStore();
const { scoreAnimating, strikeAnimating } = useAnimations(gameStore);
const { showFeedbackToast, feedbackClass } = useFeedback(gameStore);
const { startGame, handlePause, handleResume, handleQuit, /* ... */ } = useGameLifecycle(gameStore);
```

### Cross-Store Call Pattern in gameStore

```javascript
// Before (current): direct audioManager access
function playSound(soundName) {
  if (isAudioEnabled.value) {
    audioManager.play(soundName);  // Plain object call
  }
}

// After: delegate to audioStore
function playSound(soundName) {
  if (isAudioEnabled.value) {
    audioStore.play(soundName);  // Pinia store action
  }
}
```

### Persistence Delegation Pattern

```javascript
// Before (current): direct Preferences access in gameStore
async function loadPersistedState() {
  await migrateFromLocalStorage();
  highScoreData.value = await loadPreference('highScoreData', { score: 0, ... });
  isAudioEnabled.value = await loadPreference('isAudioEnabled', true);
}

// After: gameStore delegates to persistenceStore
async function loadPersistedState() {
  await persistenceStore.migrateFromLocalStorage();
  highScoreData.value = await persistenceStore.loadPreference('highScoreData', { score: 0, ... });
  isAudioEnabled.value = await persistenceStore.loadPreference('isAudioEnabled', true);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Options stores with `this` | Setup stores with Composition API | Pinia 2.x (mainstream), Pinia 3 (enforced) | Project already uses setup syntax; cross-store composition is cleaner |
| Single monolith store | Domain-separated stores | Community consensus ~2023-2024 | This phase implements the standard pattern |
| Mixins for shared logic | Composables | Vue 3.0 (2020) | Composables are the standard extraction mechanism |
| localStorage for persistence | Capacitor Preferences | Project decision (Phase 4) | Already migrated; this phase wraps it in a store |

**Deprecated/outdated:**
- Options API stores: Still supported but setup syntax is preferred for composition
- Vuex: Fully replaced by Pinia as of Vue 3

## Open Questions

1. **audioStore: reactive refs vs markRaw for AudioContext/AudioBuffer**
   - What we know: AudioContext and AudioBuffer are non-serializable browser objects. Wrapping them in `ref()` works but triggers Pinia DevTools serialization warnings. Using `markRaw()` prevents Vue from making them reactive (which is fine since we don't watch their internal state).
   - What's unclear: Whether Pinia 3 DevTools handle non-serializable refs better than Pinia 2 did.
   - Recommendation: Use plain `let` variables (not refs) for `context` and `buffers` inside the store closure. Only expose `ready` and `unlocked` as reactive refs. This avoids the issue entirely and matches the current audioManager pattern where context/buffers are plain object properties.

2. **AchievementToast and TutorialOverlay direct Preferences access**
   - What we know: AchievementToast.vue (lines 96-127) and TutorialOverlay.vue (lines 171-176) import `@capacitor/preferences` directly, bypassing the current gameStore persistence helpers.
   - What's unclear: Whether ARCH-06 scope requires migrating ALL Preferences access to persistenceStore or just what's currently in gameStore.
   - Recommendation: Migrate all Preferences access to persistenceStore for consistency. This is a small scope increase (3 additional call sites) but eliminates scattered direct Preferences imports.

3. **App.vue `showModal` and `showTutorial` state ownership**
   - What we know: `showModal` (menu vs game screen) and `showTutorial` are local refs in App.vue. The `useGameLifecycle` composable will need to manage `showModal` since it controls start/quit transitions.
   - What's unclear: Whether `showTutorial` should also be managed by the lifecycle composable or remain local to App.vue.
   - Recommendation: Move `showModal` into `useGameLifecycle` since lifecycle handlers toggle it. Keep `showTutorial` in App.vue since it's tutorial-specific and only used in one place.

## Sources

### Primary (HIGH confidence)
- [Pinia: Composing Stores](https://pinia.vuejs.org/cookbook/composing-stores.html) - Cross-store composition rules, setup store patterns, circular dependency avoidance
- [Pinia: Dealing with Composables](https://pinia.vuejs.org/cookbook/composables.html) - Using composables inside Pinia stores, non-serializable ref handling, SSR considerations
- [Capacitor Preferences API docs](https://capacitorjs.com/docs/apis/preferences) - Full API reference, platform storage backends, string-only constraint

### Secondary (MEDIUM confidence)
- [Vue Composable Design Patterns (DEV Community)](https://dev.to/jacobandrewsky/good-practices-and-design-patterns-for-vue-composables-24lk) - Naming conventions, return value patterns, anti-patterns for composable extraction
- [Michael Thiessen: Composable Design Patterns in Vue](https://michaelnthiessen.com/composable-patterns-in-vue) - Single-responsibility composable principle

### Tertiary (LOW confidence)
- [alexop.dev: TEA/Elm Pattern for Pinia](https://alexop.dev/posts/tea-architecture-pinia-private-store-pattern/) - Advanced store architecture; interesting but overkill for this project's scale

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries; all tools already installed and verified working
- Architecture: HIGH - Pinia cross-store composition and Vue composable extraction are well-documented, stable patterns
- Pitfalls: HIGH - Identified from direct codebase analysis and verified against official Pinia docs
- Composable boundaries: MEDIUM - The exact line counts and method splits for useAnimations/useFeedback/useGameLifecycle are estimates based on reading App.vue; actual extraction may reveal tighter or looser coupling

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable patterns; no fast-moving dependencies)
