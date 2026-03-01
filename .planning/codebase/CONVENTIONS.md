# Coding Conventions

**Analysis Date:** 2026-02-28

## Naming Patterns

**Files:**
- Vue components: PascalCase (e.g., `App.vue`, `GameOverModal.vue`, `Stimulus.vue`)
- JavaScript modules: camelCase (e.g., `gameStore.js`, `registerServiceWorker.js`)
- Asset files: kebab-case (e.g., `volume-up-solid.svg`, `stimulus.wav`)

**Functions & Methods:**
- camelCase throughout (e.g., `startGame`, `respondToStimulus`, `enforceMinNBack`)
- Action methods in Pinia store prefixed with verb: `generateRandomStimulus`, `setNewStimulus`, `toggleAudio`
- Handler functions prefixed with `handle` in component setups (e.g., `handlePause`, `handleResume`, `handleGameOverClose`)
- Getter functions use descriptive names (e.g., `isEarlyInGame`, `finalScoreAccuracy`)

**Variables:**
- camelCase for all variables and state properties
- Private/internal variables use camelCase prefix with underscore discouraged
- Reactive refs: simple names matching purpose (e.g., `showModal`, `scoreAnimating`, `strikeAnimating`)
- Constants in uppercase with underscores (e.g., `ACHIEVEMENTS` object with keys like `firstGame`, `firstPoint`)

**Types/Props:**
- No explicit type annotations in JavaScript (project uses Vue 3 without TypeScript)
- Props definitions use camelCase keys with type validation in object form
- Emitted event names: camelCase with `:` prefix for v-model updates (e.g., `@update:nBack`, `@update:timeLeft`)

**CSS Classes:**
- Primarily Tailwind utility classes (e.g., `bg-blue-600`, `hover:bg-blue-500`, `rounded-xl`)
- Scoped component styles for animations and complex rules
- Animation class names: kebab-case (e.g., `.animate-correct-flash`, `.animate-strike-shake`, `.animate-score-pulse`)
- BEM-style naming for custom scoped classes (e.g., `.countdown-text`, `.strikes-score`)

## Code Style

**Formatting:**
- No explicit formatter configured (no .prettierrc file)
- Consistent indentation: 2 spaces
- Line length: practical limit appears to be ~100 characters, but no hard enforced limit
- Semicolons: consistently used in JavaScript, omitted in Vue templates

**Linting:**
- No eslint or linting configuration detected
- Code follows Vue 3 best practices implicitly

**Vue Component Structure:**
- Single-file components with `<template>`, `<script>`, `<style>` blocks
- Use `<script setup>` not fully adopted; components mix setup() and Options API
- `name` property included in export for component identification
- Props with type validation and defaults
- Emits declared explicitly with `emits: [...]`

**Vue 3 Composition API Usage:**
- Inline setup() functions returning reactive state
- `ref()` for reactive local state
- `computed()` for derived/cached values
- `watch()` for reactive side effects
- Imports at top of script section: `import { onUnmounted, ref, watch, computed } from 'vue'`

## Import Organization

**Order:**
1. Vue core imports (`import { ... } from 'vue'`)
2. Third-party packages (`pinia`, etc.)
3. Local store imports (`from './store/...'`)
4. Component imports (`from './...'`)
5. Asset imports (`from './assets/...'`)
6. Style imports (implicit in Vue SFCs)

**Path Aliases:**
- No path aliases configured
- Relative imports only (e.g., `./store/gameStore`, `./assets/...`)

**Asset Imports:**
- Audio files imported as URLs: `import stimulus from '../assets/stimulus.wav'`
- SVG images imported as URLs: `import volumeUpIcon from './assets/volume-up-solid.svg'`
- Used directly in template binding: `:src="volumeUpIcon"`

## Error Handling

**Patterns:**
- Try-catch blocks for localStorage operations: parse errors gracefully, return empty array as fallback
  ```javascript
  try {
    return JSON.parse(localStorage.getItem('achievements') || '[]');
  } catch {
    return [];
  }
  ```
- Console warnings for non-critical failures: `console.warn('Failed to load sound:', name, error)`
- Silent failures for audio loading (catch error, continue without that sound)
- Async fetch errors caught and logged: used in audio initialization and service worker setup

**No Throwing:**
- Errors are logged or handled silently, not thrown up the call stack
- Graceful degradation on missing resources (e.g., sound files)

**Guard Clauses:**
- Early returns to prevent invalid state: `if (this.isStopped || this.isPaused) return;`
- Null/undefined checks before operations: `if (!this.context || !this.buffers[soundName]) return;`

## Logging

**Framework:** Vanilla `console` object (no logging library)

**Patterns:**
- `console.error()` for service worker registration failures
- `console.warn()` for recoverable issues like missing sound files
- Development-only window debugging: `if (process.env.NODE_ENV === 'development')`
  - Binds gameStore to `window.gameStore` for Chrome DevTools inspection

**When to Log:**
- Errors during resource loading (failures that don't break functionality)
- Service worker lifecycle events (debug info only, commented out in current code)
- No logging for normal game flow (keeps console clean)

## Comments

**When to Comment:**
- Block comments for major sections or disabled code:
  ```javascript
  // Service worker registration disabled - no service worker is being generated
  // Uncomment below when vite-plugin-pwa is configured
  ```
- Inline comments for non-obvious logic: `// Unlock audio on iOS when user gesture`
- JSDoc-style comments for file-level documentation (used in registerServiceWorker.js)

**JSDoc/TSDoc:**
- Not systematically used
- When present, follows standard format with `/**` blocks
- Describes purpose, parameters, and requirements (e.g., audioManager unlock() method)

## Function Design

**Size:**
- Most functions 5-30 lines
- Large functions in store for game logic (respondToStimulus ~50 lines, but readable with clear flow)
- Prefer breaking logic into helper methods when > 40 lines

**Parameters:**
- Functions accept 0-3 parameters; more complex state is accessed from store
- Props for components follow same pattern: required props are declared, optional have defaults
- Destructuring used minimally (prefer direct access)

**Return Values:**
- Explicit return statements
- Computed properties return single value (no complex objects)
- Action methods return nothing (mutate state) or return result for chaining
- Getter methods return calculated values

**Composition Pattern:**
- Store actions mutate state directly
- Components access store state via `const gameStore = useGameStore()`
- Components compute derived values with `computed()` for UI logic

## Module Design

**Exports:**
- Default exports for Vue components
- Named exports for store: `export const useGameStore = defineStore(...)`
- Inline constants (ACHIEVEMENTS object) not exported, kept internal to component

**Barrel Files:**
- No barrel files detected
- Imports are direct: `from './store/gameStore'` not `from './store'`

**Pinia Store Organization:**
- Single store file: `src/store/gameStore.js`
- Flat structure: `state`, `actions`, `getters` all in one file
- State properties grouped logically (game status, scoring, history, settings)
- Actions grouped by feature (game lifecycle, responses, audio, scoring)
- Getters computed from state for derived values

## Component Lifecycle

**Mounted/Unmounted:**
- Use `onMounted()` for initializing listeners
- Use `onUnmounted()` for cleanup (clearing timeouts, intervals)
- Window debugging binding in main.js app setup (development only)

**Reactivity Strategy:**
- Store state is primary source of truth
- Component local refs for UI state only (showModal, animating flags)
- Watch store state changes to trigger local animations
- Computed properties derive from props or store state

---

*Convention analysis: 2026-02-28*
