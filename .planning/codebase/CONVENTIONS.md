# Coding Conventions

**Analysis Date:** 2026-04-25

## Naming Patterns

**Files:**
- Vue components: PascalCase (e.g., `GameScreen.vue`, `ResponseButtons.vue`, `Stimulus.vue`)
- Composables: camelCase with `use` prefix (e.g., `useManagedTimeout.ts`, `useGameLifecycle.ts`)
- Stores: camelCase with `Store` suffix (e.g., `gameStore.ts`, `audioStore.ts`, `persistenceStore.ts`)
- Utility functions: camelCase (e.g., `haptics.ts` with functions like `hapticsCorrect()`, `hapticsIncorrect()`)
- Types/interfaces: PascalCase (e.g., `Stimulus`, `HighScoreData`, `ResponseButton` in `src/types/game.ts`)

**Functions:**
- Camel case starting with lowercase (e.g., `generateRandomStimulus()`, `respondToStimulus()`, `managedSetTimeout()`)
- Event handlers: camelCase with `handle` prefix (e.g., `handleToggleAudio()`, `handleToggleHaptics()`, `handlePause()`)
- Computed properties: camelCase (e.g., `isEarlyInGame`, `finalScoreAccuracy`)
- Utility functions: camelCase starting with action verb (e.g., `hapticsCorrect()`, `hapticsIncorrect()`)

**Variables:**
- Local state: camelCase (e.g., `currentStimulus`, `timeLeft`, `score`, `isPaused`)
- Refs: camelCase (e.g., `const currentStimulus = ref<Stimulus>(...)`)
- Const objects/arrays: camelCase (e.g., `responseButtons`, `deterministicStimuli`)
- Props: camelCase (e.g., `nBackInput`, `timeLeftInput`, `feedbackClass`)

**Types:**
- Type names: PascalCase (e.g., `Stimulus`, `HighScoreData`, `StimulusAttribute`)
- Union type values: camelCase (e.g., `'color' | 'emoji' | 'position' | 'shape'`)
- Event emits: camelCase with kebab-case in template (e.g., emit `respond`, emit `update:nBackInput`)
- Boolean flags: `is` or `has` prefix (e.g., `isStopped`, `isPaused`, `isEarlyInGame`, `isAudioEnabled`)

## Code Style

**Formatting:**
- Tool: Prettier 3.8.1
- Single quotes: enabled (`"singleQuote": true`)
- Trailing commas: all (`"trailingComma": "all"`)
- Indentation: 2 spaces (Prettier default)
- Line length: 80 characters (Prettier default)

**Linting:**
- Tool: ESLint 10.0.2
- Config: `eslint.config.js` (flat config)
- Plugins: `eslint-plugin-vue`, `@vue/eslint-config-typescript`
- Integration: `eslint-config-prettier` for formatting conflicts
- Special rules (intentional overrides):
  - `'vue/multi-word-component-names': 'off'` — Single-word components allowed (e.g., `Footer`, `Stimulus`)
  - `'vue/no-reserved-component-names': 'off'` — Reserved HTML names allowed as components (e.g., `Footer`)
  - `'vue/require-default-prop': 'off'` — Required props without defaults accepted (parent always provides)

**TypeScript:**
- Version: 5.9.3
- Config: `tsconfig.json` with `@vue/tsconfig/tsconfig.dom.json` base
- Path alias: `@/*` maps to `./src/*`
- Strict mode: enabled (inherited from Vue config)

## Import Organization

**Order (enforced by eslint-plugin-vue):**
1. Vue and framework imports (e.g., `import { ref, computed } from 'vue'`)
2. Third-party library imports (e.g., `import { defineStore } from 'pinia'`)
3. Type imports (e.g., `import type { Stimulus } from '@/types/game'`)
4. Local store/composable imports (e.g., `import { useAudioStore } from '@/stores/audioStore'`)
5. Utility function imports (e.g., `import { hapticsCorrect } from '@/utils/haptics'`)
6. Component imports (e.g., `import GameTimer from './GameTimer.vue'`)
7. Asset imports (e.g., `import volumeUpIcon from '../assets/volume-up-solid.svg'`)

**Path Aliases:**
- Use `@/` for src-rooted imports (e.g., `@/stores/gameStore`, `@/types/game`, `@/composables/useManagedTimeout`)
- Relative imports for same-directory or nearby components (e.g., `./GameTimer.vue`, `../Stimulus.vue`)

## Error Handling

**Patterns:**
- Silent catch blocks for optional features (e.g., haptics, audio) — document intent with comment
  ```typescript
  export async function hapticsCorrect(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics unavailable (web, unsupported device) -- silently ignore
    }
  }
  ```
- No error recovery — errors are logged via console or silently ignored for non-critical paths
- Store async operations: no explicit error handling in `loadPersistedState()` — assumes persistence layer won't throw

## Logging

**Framework:** `console` (no dedicated logging library)

**Patterns:**
- Debugging is inline via `console.log()` (not observed in production code)
- Comments document intent instead of logging (e.g., `// CRITICAL: These stubs MUST exist before any store module is imported`)
- Errors in optional features silently ignored (see haptics pattern above)

## Comments

**When to Comment:**
- Document gotchas and cross-component interactions (e.g., "Cross-store references -- MUST come before any await")
- Explain why a rule is disabled (e.g., ESLint `// Project uses single-word component names intentionally`)
- Mark non-obvious lifecycle hooks (e.g., "CRITICAL: module-level initialization in audioStore")
- Document state that needs manual cleanup (e.g., "Pinia is already active on the global scope, but we also install...")

**JSDoc/TSDoc:**
- Not used in this codebase
- Type hints preferred over inline documentation
- Comments stay minimal and focus on "why" not "what"

## Vue Component Design

**Script Setup:**
- Use `<script setup lang="ts">` syntax (all components analyzed use this)
- Props: define via `defineProps<Props>()` with explicit interface
  ```typescript
  interface Props {
    gameStore: GameStore;
    nBackInput: number;
    scoreAnimating: boolean;
  }
  const props = defineProps<Props>();
  ```
- Emits: define via `defineEmits<{ ... }>()` with explicit event types
  ```typescript
  const emit = defineEmits<{
    respond: [type: StimulusAttribute];
    'update:nBackInput': [value: number];
  }>();
  ```

**Template:**
- Reactive binding: v-model for two-way props (e.g., `@update:nBackInput="$emit('update:nBackInput', $event)"`)
- Event binding: use @event handlers (e.g., `@click="handleToggleAudio"`)
- Conditional rendering: v-if / v-else-if / v-else (e.g., `v-if="!gameStore.isStopped"`)
- List rendering: v-for with key (e.g., `v-for="button in responseButtons"`)
- Transitions: use `<Transition>` component with CSS classes (e.g., `name="toggle-toast"` with `.toggle-toast-enter-active`)

**Styling:**
- Scoped CSS: `<style scoped>` (all components use scoped styles)
- Tailwind CSS: classes from Tailwind v4.2.1 (migration from SCSS completed in M1)
- Responsive: use Tailwind responsive prefixes (e.g., `max-w-md`)
- Dark mode: not used; fixed dark background (`game-background` CSS class)

## Store Design (Pinia Composition API)

**Pattern:** Composition API stores with explicit state, actions, and getters

**Structure (`src/stores/gameStore.ts` pattern):**
1. Import statements (Vue, Pinia, types, other stores, utilities)
2. Define store with `defineStore('name', () => { ... })`
3. Cross-store references first (MUST come before await per Pinia rules)
4. State declarations as `ref()` and `ref<Type>(...)`
5. Async functions (e.g., `loadPersistedState()`)
6. Computed properties via `computed(() => ...)`
7. Action functions
8. Return object with all public state, getters, and actions

**Typing:**
- Use explicit type annotations for complex objects
- Type store return value: `type GameStore = ReturnType<typeof useGameStore>`
- Export store directly for injection into components

## Composable Design

**Pattern:** Wrapper functions that manage lifecycle and return state + actions

**Structure (`src/composables/useManagedTimeout.ts` pattern):**
1. Vue lifecycle hooks (e.g., `onUnmounted()`)
2. Local state (Sets, refs, etc.)
3. Helper functions
4. Return object with public methods
5. Cleanup on unmount

**Example:**
```typescript
export function useManagedTimeout(): {
  managedSetTimeout: (fn: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearManagedTimeout: (id: ReturnType<typeof setTimeout>) => void;
  clearAll: () => void;
} {
  const timeouts = new Set<ReturnType<typeof setTimeout>>();
  
  function managedSetTimeout(...) { ... }
  function clearManagedTimeout(...) { ... }
  function clearAll(): void { ... }
  
  onUnmounted(clearAll);
  
  return { managedSetTimeout, clearManagedTimeout, clearAll };
}
```

## Class Design

**Pattern:** Not used — codebase is functional with Vue 3 Composition API, Pinia stores, and utility functions

## Module Design

**Exports:**
- Named exports for composables and utilities (e.g., `export function useManagedTimeout()`)
- Named exports for stores (e.g., `export const useGameStore = defineStore(...)`)
- Default export only for Vue components (implicit via `<script setup>`)

**Barrel Files:**
- Not used in this codebase
- Each import explicitly specifies the file (e.g., `import { useManagedTimeout } from '@/composables/useManagedTimeout'`)

## Testing-Related Conventions

**Mock Setup:**
- Mocks stored in test setup file (`src/test-setup.ts`) for global stubs
- Module-level mocks via `vi.mock()` in test files for Pinia stores
- Real store instances preferred in integration tests; selective mocking of external APIs

**Type Guards in Tests:**
- Cast store returns with `ReturnType<typeof useGameStore>` for typing
- Use `as any` comment with ESLint disable for test-only assertions on mocks
  ```typescript
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: _reset is a test-only method
  (Preferences as any)._reset();
  ```

---

*Convention analysis: 2026-04-25*
