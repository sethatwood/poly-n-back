# Phase 7: TypeScript Migration - Research

**Researched:** 2026-03-01
**Domain:** TypeScript strict mode migration for Vue 3.5 + Pinia 3 + Vite 7
**Confidence:** HIGH

## Summary

The codebase is small (~2,600 lines across 15 Vue components, 3 Pinia stores, 4 composables, and 1 entry file) and already uses Composition API setup syntax in stores/composables. TypeScript 5.9 is already installed as a devDependency. The Capacitor config (`capacitor.config.ts`) is already TypeScript. No `tsconfig.json` exists yet, no `.ts` files in `src/`, and no type declaration file (`env.d.ts`).

The migration is straightforward because: (1) the codebase is small enough to migrate in a single pass rather than incremental file-by-file, (2) Vue 3.5's `defineProps<T>()` and `defineEmits<T>()` type-only syntax is clean and well-documented, (3) Pinia setup stores already look like typed code -- just add annotations, and (4) `@vue/tsconfig` provides battle-tested defaults including `strict: true`.

**Primary recommendation:** Use `@vue/tsconfig/tsconfig.dom.json` as the base config (it includes `strict: true`), install `vue-tsc` for type checking, create domain types in `src/types/`, convert all `.js` to `.ts` and all Vue components to `<script setup lang="ts">`, and add a `type-check` npm script. The codebase is small enough that "incremental" strict mode (TS-06) means: start with `strict: true` from the beginning and fix all errors in one pass, rather than toggling flags one by one.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TS-01 | TypeScript configured with tsconfig.json (allowJs: true for incremental migration) | Use `@vue/tsconfig/tsconfig.dom.json` as base. Set `allowJs: true` initially to permit `.js` files during migration, then remove once all files are `.ts`. See Architecture Patterns section. |
| TS-02 | Game domain types defined (Stimulus, HighScoreData, FeedbackState, StimulusAttribute, GameState) | Create `src/types/game.ts` barrel. Types extracted from gameStore.js data shapes. See Code Examples section for exact type definitions. |
| TS-03 | All Pinia stores fully typed with setup syntax | Stores already use setup syntax. Add type annotations to refs, computed, and function parameters/returns. See Pinia typing patterns in Code Examples. |
| TS-04 | All composables fully typed with explicit return types | Add parameter types (gameStore typed as return of `useGameStore`), explicit return type interfaces, and generic annotations to refs. See Code Examples. |
| TS-05 | All Vue components migrated to `<script setup lang="ts">` | Convert from `export default { setup() {} }` to `<script setup lang="ts">` with `defineProps<T>()` and `defineEmits<T>()`. Some components (ConfigStart, Stimulus) use Options API patterns (data/computed/methods/watch) that must be converted to Composition API first. |
| TS-06 | Strict mode enabled incrementally (noImplicitAny -> strictNullChecks -> strict: true) | `@vue/tsconfig` sets `strict: true` by default. With only ~2,600 lines, enable strict from the start and fix all errors in one pass rather than toggling flags. The "incremental" aspect is covered by `allowJs: true` during migration. |
| TS-07 | vue-tsc --noEmit type checking passing with zero errors | Install `vue-tsc`, add `"type-check": "vue-tsc --noEmit"` script. Run after all files migrated. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| typescript | ^5.9.3 | TypeScript compiler | Already installed in devDependencies |
| vue-tsc | ^3.2.5 | Vue-aware type checker (wraps tsc for .vue SFC support) | Official Vue team tool, required for TS-07 |
| @vue/tsconfig | ^0.8.1 | Base tsconfig presets for Vue 3 projects | Official Vue team package, sets correct moduleResolution/strict/jsx options |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vue/eslint-config-typescript | ^14.7.0 | ESLint rules for TypeScript in Vue | Integrates typescript-eslint with eslint-plugin-vue for .vue file linting |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @vue/tsconfig | Hand-written tsconfig.json | More control but must maintain moduleResolution, jsx, verbatimModuleSyntax manually -- not worth it for this project |
| vue-tsc | tsc alone | tsc cannot type-check .vue SFC files -- vue-tsc is mandatory |

**Installation:**
```bash
npm install -D vue-tsc @vue/tsconfig @vue/eslint-config-typescript
```

Note: `typescript` is already installed (`^5.9.3` in devDependencies).

## Architecture Patterns

### Recommended Project Structure
```
src/
├── types/
│   └── game.ts           # All game domain types (Stimulus, HighScoreData, etc.)
├── stores/
│   ├── audioStore.ts      # Renamed from .js, typed
│   ├── gameStore.ts       # Renamed from .js, typed
│   └── persistenceStore.ts # Renamed from .js, typed with generics
├── composables/
│   ├── useAnimations.ts   # Renamed from .js, typed
│   ├── useFeedback.ts     # Renamed from .js, typed
│   ├── useGameLifecycle.ts # Renamed from .js, typed
│   └── useManagedTimeout.ts # Renamed from .js, typed
├── components/
│   └── *.vue              # All <script setup lang="ts">
├── *.vue                  # Root-level components, all <script setup lang="ts">
├── main.ts                # Renamed from .js
└── env.d.ts               # Vite client types + asset module declarations
```

### Pattern 1: Type-Only Props with defineProps
**What:** Replace runtime prop declarations with TypeScript interface generics
**When to use:** Every Vue component with props
**Example:**
```typescript
// Source: https://vuejs.org/guide/typescript/composition-api
// BEFORE (Options API runtime declaration):
// props: { score: { type: Number, required: true } }

// AFTER (script setup with type-only declaration):
<script setup lang="ts">
interface Props {
  score: number
  isPaused: boolean
  feedbackType?: string | null
}

const props = defineProps<Props>()
</script>
```

### Pattern 2: Type-Only Emits with defineEmits
**What:** Replace runtime emit declarations with TypeScript tuple syntax (Vue 3.3+)
**When to use:** Every Vue component with emits
**Example:**
```typescript
// Source: https://vuejs.org/guide/typescript/composition-api
// BEFORE: emits: ['respond', 'update:nBackInput', 'start-game']

// AFTER:
const emit = defineEmits<{
  respond: [stimulusType: StimulusAttribute]
  'update:nBackInput': [value: number]
  'start-game': []
}>()
```

### Pattern 3: Pinia Setup Store Typing
**What:** Add type annotations to refs, computed, and functions in setup stores
**When to use:** All three stores (gameStore, audioStore, persistenceStore)
**Example:**
```typescript
// Source: https://pinia.vuejs.org/core-concepts/
import type { Stimulus, HighScoreData, FeedbackState, RespondedThisTurn } from '@/types/game'

export const useGameStore = defineStore('game', () => {
  const currentStimulus = ref<Stimulus>({} as Stimulus)
  const highScoreData = ref<HighScoreData>({
    score: 0,
    potentialCorrectAnswers: 0,
    nBack: null,
  })
  const lastFeedback = ref<FeedbackState>({
    type: null,
    button: null,
    timestamp: null,
  })
  const respondedThisTurn = ref<RespondedThisTurn>({
    color: false, emoji: false, position: false, shape: false,
  })
  const stimulusHistory = ref<Stimulus[]>([])
  const timer = ref<ReturnType<typeof setInterval> | null>(null)

  function respondToStimulus(stimulusType: StimulusAttribute): void {
    // ...
  }

  return { /* ... */ }
})
```

### Pattern 4: Composable Parameter Typing
**What:** Type composable parameters using store return types
**When to use:** All composables that accept gameStore as parameter
**Example:**
```typescript
// Source: project convention (composables accept store via dependency injection)
import type { useGameStore } from '@/stores/gameStore'

type GameStore = ReturnType<typeof useGameStore>

export function useAnimations(gameStore: GameStore): {
  scoreAnimating: Ref<boolean>
  strikeAnimating: Ref<boolean>
} {
  // ...
}
```

### Pattern 5: Options API to Script Setup Conversion
**What:** Convert components using Options API patterns to `<script setup lang="ts">`
**When to use:** ConfigStart.vue (uses data/methods/watch), Stimulus.vue (mixes setup + Options computed), IntroContent.vue, IntroHead.vue
**Example:**
```typescript
// ConfigStart.vue BEFORE: uses data(), methods, watch
// AFTER:
<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  nBack: number
  timeLeft: number
}>()

const emit = defineEmits<{
  'update:nBack': [value: number]
  'update:timeLeft': [value: number]
  startGame: []
}>()

const localNBack = ref(props.nBack)
const localTimeLeft = ref(props.timeLeft)

watch(() => props.nBack, (val) => { localNBack.value = val })
watch(() => props.timeLeft, (val) => { localTimeLeft.value = val })

function enforceMinNBack(): void {
  const value = Math.max(1, parseInt(String(localNBack.value)) || 1)
  localNBack.value = value
  emit('update:nBack', value)
}
// ...
</script>
```

### Anti-Patterns to Avoid
- **Mixing Options API and Composition API in same component:** Stimulus.vue currently uses `setup()` for some state and Options `computed` for others. Merge all logic into `<script setup lang="ts">`.
- **Using `as any` to suppress errors:** Fix the actual type issue instead. The codebase is small enough that every error should be resolved properly.
- **Typing store as `Object`:** GameScreen.vue passes gameStore as `type: Object`. Replace with the actual store type using `ReturnType<typeof useGameStore>`.
- **Non-null assertions (`!`) everywhere:** Use proper null checks or optional chaining instead. The only acceptable use is for template refs that are guaranteed to exist after mount.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vue-aware tsconfig | Custom compiler options | `@vue/tsconfig/tsconfig.dom.json` | Handles moduleResolution, jsx, verbatimModuleSyntax, lib correctly for Vue+Vite |
| Type checking .vue files | tsc with custom transformers | `vue-tsc --noEmit` | vue-tsc is the only tool that correctly type-checks Vue SFC template expressions |
| ESLint TypeScript rules | Manual typescript-eslint setup | `@vue/eslint-config-typescript` | Correctly applies TS rules to both .ts files AND `<script lang="ts">` blocks in .vue files |
| Asset import types | Individual module declarations | `/// <reference types="vite/client" />` in env.d.ts | Vite's client types already declare modules for .svg, .png, .mp3, .wav, etc. |

**Key insight:** The Vue ecosystem provides official packages for every TypeScript concern. Rolling custom configs risks subtle misconfigurations (wrong moduleResolution, missing jsx settings, broken template type checking).

## Common Pitfalls

### Pitfall 1: verbatimModuleSyntax Breaking Existing Imports
**What goes wrong:** `@vue/tsconfig` enables `verbatimModuleSyntax`, which requires using `import type` for type-only imports. Existing `import { X }` of types will cause errors.
**Why it happens:** TypeScript requires explicit `import type` syntax when verbatimModuleSyntax is enabled to ensure type-only imports are erased correctly.
**How to avoid:** When converting files, always use `import type { X }` for types and interfaces. For mixed imports: `import { someFunction, type SomeType } from './module'`.
**Warning signs:** Build error: "This import is type-only, but is not declared as type-only."

### Pitfall 2: Forgetting to Update index.html Entry Point
**What goes wrong:** Renaming `main.js` to `main.ts` without updating `index.html` causes the app to break with a 404.
**Why it happens:** `index.html` has `<script type="module" src="/src/main.js">` hardcoded.
**How to avoid:** Update `index.html` to reference `/src/main.ts` when renaming the entry point.
**Warning signs:** White screen, 404 in dev server console.

### Pitfall 3: Reactive Props Destructuring Without Awareness
**What goes wrong:** Vue 3.5+ makes destructured props reactive automatically, but TypeScript may complain about unused variables if destructured props are only used in the template.
**Why it happens:** TypeScript doesn't understand Vue's compiler transform that makes destructured defineProps reactive.
**How to avoid:** Use `const props = defineProps<T>()` and access via `props.x` in script, or destructure and accept the compiler handles reactivity. Vue's TS plugin (via vue-tsc) understands this pattern.
**Warning signs:** ESLint "unused variable" warnings on destructured props.

### Pitfall 4: Timer Types (setInterval/setTimeout)
**What goes wrong:** `ReturnType<typeof setInterval>` returns `NodeJS.Timeout` in Node types but `number` in browser. If `@types/node` leaks into the project, timer typing breaks.
**Why it happens:** `@vue/tsconfig/tsconfig.dom.json` sets `"types": []` to prevent this, but if `@types/node` is installed or inherited, it pollutes the global scope.
**How to avoid:** Use `ReturnType<typeof setInterval>` which works in both environments, or `number` explicitly for browser. Verify `@types/node` is not in dependencies.
**Warning signs:** Type error "Type 'Timeout' is not assignable to type 'number'".

### Pitfall 5: Options API Components Mixed With TypeScript
**What goes wrong:** Two components (ConfigStart.vue, Stimulus.vue) use Options API patterns (`data()`, `computed`, `methods`, `watch`). Adding `lang="ts"` without converting to Composition API causes `this` typing issues.
**Why it happens:** Options API `this` typing requires `defineComponent()` and works poorly with `<script setup>`. These components MUST be converted to Composition API first, then typed.
**How to avoid:** Convert Options API to Composition API (`<script setup>`) BEFORE adding TypeScript. This is a two-step process for these components.
**Warning signs:** "Property does not exist on type" errors referencing `this.localNBack`, `this.color`, etc.

### Pitfall 6: Pinia Store Type as Prop
**What goes wrong:** GameScreen.vue receives `gameStore` as a prop typed `Object`. TypeScript strict mode flags this as implicit `any`.
**Why it happens:** The store was passed as a generic object to avoid circular imports.
**How to avoid:** Use `ReturnType<typeof useGameStore>` as the prop type. No circular import issue because the type is derived, not the runtime value.
**Warning signs:** `Object is of type 'unknown'` or `Property 'score' does not exist on type '{}'`.

### Pitfall 7: AudioContext Browser API Types
**What goes wrong:** `window.webkitAudioContext` is not in standard TypeScript DOM types. `audioStore.ts` references it.
**Why it happens:** `webkitAudioContext` is a non-standard Safari prefix. Standard DOM types don't include it.
**How to avoid:** Declare it: `const AudioCtx = window.AudioContext || (window as any).webkitAudioContext` or add a type declaration for the Window interface extension.
**Warning signs:** "Property 'webkitAudioContext' does not exist on type 'Window & typeof globalThis'".

## Code Examples

### Game Domain Types (src/types/game.ts)
```typescript
// Source: Extracted from gameStore.js data shapes

/** The four stimulus attributes the player can match */
export type StimulusAttribute = 'color' | 'emoji' | 'position' | 'shape'

/** Possible stimulus colors */
export type StimulusColor = 'purple' | 'green' | 'blue'

/** Possible stimulus emojis */
export type StimulusEmoji = 'fire' | 'ice' | 'flower'

/** Possible stimulus positions */
export type StimulusPosition = 'left' | 'center' | 'right'

/** Possible stimulus shapes */
export type StimulusShape = 'circle' | 'square' | 'triangle'

/** A single stimulus shown to the player */
export interface Stimulus {
  color: StimulusColor
  emoji: StimulusEmoji
  position: StimulusPosition
  shape: StimulusShape
}

/** Persisted high score record */
export interface HighScoreData {
  score: number
  potentialCorrectAnswers: number
  nBack: number | null
}

/** Per-turn response tracking (which buttons have been pressed) */
export interface RespondedThisTurn {
  color: boolean
  emoji: boolean
  position: boolean
  shape: boolean
}

/** Feedback state for visual effects on response */
export interface FeedbackState {
  type: 'correct' | 'incorrect' | null
  button: StimulusAttribute | null
  timestamp: number | null
}

/** Sound names used by the audio system */
export type SoundName = 'stimulus' | 'increment' | 'strike'

/** A response button definition */
export interface ResponseButton {
  type: StimulusAttribute
  label: string
}

/** Achievement definition */
export interface Achievement {
  id: string
  icon: string
  title: string
  description: string
}

/** Tutorial step definition */
export interface TutorialStep {
  icon: string
  title: string
  description: string
  example?: TutorialExample[]
}

/** Tutorial step visual example */
export interface TutorialExample {
  emoji: string
  label: string
  color?: string
}

/** Hint definition */
export interface GameHint {
  icon: string
  text: string
  priority: number
}
```

### env.d.ts (Vite Client Types)
```typescript
/// <reference types="vite/client" />
```
Note: `vite/client` already declares modules for `.svg`, `.mp3`, `.wav`, `.png`, `.jpg`, etc. No custom asset declarations needed.

### tsconfig.json
```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "compilerOptions": {
    "allowJs": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "env.d.ts",
    "src/**/*",
    "src/**/*.vue"
  ]
}
```
After migration is complete, remove `"allowJs": true`.

### Typed persistenceStore (Generic loadPreference)
```typescript
// Source: project pattern
async function loadPreference<T>(key: string, defaults: T): Promise<T> {
  try {
    const { value } = await Preferences.get({ key })
    if (value === null) return defaults
    const parsed: unknown = JSON.parse(value)
    if (typeof parsed !== typeof defaults) return defaults
    if (
      typeof defaults === 'object' &&
      defaults !== null &&
      !Array.isArray(defaults)
    ) {
      for (const k of Object.keys(defaults as Record<string, unknown>)) {
        if (!(k in (parsed as Record<string, unknown>))) return defaults
      }
    }
    return parsed as T
  } catch {
    return defaults
  }
}

async function savePreference<T>(key: string, data: T): Promise<void> {
  try {
    await Preferences.set({ key, value: JSON.stringify(data) })
  } catch (e) {
    console.warn(`Storage write failed for key "${key}":`, e)
  }
}
```

### ESLint Config Update (eslint.config.js -> eslint.config.ts)
```typescript
// After adding @vue/eslint-config-typescript
import pluginVue from 'eslint-plugin-vue'
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default defineConfigWithVueTs(
  {
    ignores: ['dist/', 'ios/', 'android/', 'node_modules/'],
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': 'off',
      'vue/require-default-prop': 'off',
    },
  },
  eslintConfigPrettier,
)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `withDefaults(defineProps<T>(), {...})` | Destructured defaults: `const { x = 'default' } = defineProps<T>()` | Vue 3.5 (Sep 2024) | Simpler syntax, no withDefaults wrapper needed |
| Call signatures for emits: `(e: 'click', id: number): void` | Tuple syntax: `{ click: [id: number] }` | Vue 3.3 (May 2023) | More concise, better readability |
| `moduleResolution: "node"` | `moduleResolution: "bundler"` | TS 5.0 / @vue/tsconfig 0.5 | Correct for Vite-based projects |
| `isolatedModules: true` | `verbatimModuleSyntax: true` | TS 5.0 / @vue/tsconfig 0.5 | Superset of isolatedModules, enforces import type |
| Manual tsconfig options | `extends: "@vue/tsconfig/tsconfig.dom.json"` | @vue/tsconfig 0.5+ | Official defaults for Vue + Vite projects |

**Deprecated/outdated:**
- `defineComponent()` with Options API typing: Still works but `<script setup lang="ts">` is the recommended approach for new code and migrations
- `@vue/tsconfig/tsconfig.web.json`: Renamed to `tsconfig.dom.json` in v0.5+
- `PropType<T>` runtime type assertions: Replaced by `defineProps<T>()` type-only syntax

## Migration Scope Summary

### Files Requiring Conversion

**Stores (.js -> .ts): 3 files**
| File | Lines | Complexity | Notes |
|------|-------|------------|-------|
| gameStore.js | 368 | Medium | Largest file. Many refs need type annotations. Timer uses setInterval. |
| audioStore.js | 75 | Low | Non-reactive let variables for AudioContext/buffers. webkitAudioContext needs typing. |
| persistenceStore.js | 67 | Low | Generic loadPreference/savePreference pattern. |

**Composables (.js -> .ts): 4 files**
| File | Lines | Complexity | Notes |
|------|-------|------------|-------|
| useGameLifecycle.js | 53 | Low | gameStore parameter needs typing. |
| useFeedback.js | 35 | Low | gameStore parameter, feedbackClass returns string. |
| useAnimations.js | 34 | Low | gameStore parameter, simple boolean refs. |
| useManagedTimeout.js | 32 | Low | Set<number> for timeout IDs. |

**Entry (.js -> .ts): 1 file**
| File | Lines | Complexity | Notes |
|------|-------|------------|-------|
| main.js | 30 | Low | Update index.html reference too. |

**Vue Components (add lang="ts"): 15 files**
| File | Lines | Conversion Type | Notes |
|------|-------|-----------------|-------|
| ConfigStart.vue | 89 | Options API -> script setup | Uses data(), methods, watch -- full conversion needed |
| Stimulus.vue | 153 | Mixed API -> script setup | Mixes setup() + Options computed -- full conversion needed |
| IntroContent.vue | 37 | Setup -> script setup | Simple, already uses setup() |
| IntroHead.vue | 29 | Options API -> script setup | Minimal -- no script logic |
| GameScreen.vue | 130 | Setup -> script setup | Passes gameStore as Object prop -- needs store typing |
| MenuScreen.vue | 48 | Setup -> script setup | Simple passthrough props/emits |
| App.vue | 220 | Setup -> script setup | Largest component. Uses composables, stores, watchers. |
| GameOverModal.vue | 209 | Setup -> script setup | Has computed in setup, straightforward |
| PauseModal.vue | 95 | Options API -> script setup | Props/emits only, no setup function |
| TutorialOverlay.vue | 216 | Setup -> script setup | Complex steps array, persistence calls |
| GameHint.vue | 166 | Setup -> script setup | Watchers, hints object, managed timeouts |
| AchievementToast.vue | 235 | Setup -> script setup | Module-level const, watchers, persistence |
| ResponseButtons.vue | 86 | Setup -> script setup | feedbackClass is a Function prop |
| GameTimer.vue | 82 | Setup -> script setup | Simple props |
| ScoreDisplay.vue | 82 | Setup -> script setup | Simple props |
| GameOverDisplay.vue | 57 | Setup -> script setup | Simple props + emit |
| Footer.vue | 8 | None -> script setup | Template only, no script needed (or minimal) |

**Config files:**
| File | Change |
|------|--------|
| tsconfig.json | Create (new) |
| src/env.d.ts | Create (new) |
| index.html | Update main.js -> main.ts |
| package.json | Add type-check script, update format/lint globs |
| eslint.config.js | Add @vue/eslint-config-typescript integration |
| vite.config.js | Rename to vite.config.ts (optional, already works with TS) |

## Open Questions

1. **ESLint config file extension**
   - What we know: ESLint 10 supports `.js`, `.mjs`, `.ts` config files. The project currently uses `eslint.config.js`.
   - What's unclear: Whether renaming to `eslint.config.ts` requires additional setup with ESLint 10, or if it works out of the box.
   - Recommendation: Keep as `eslint.config.js` unless issues arise. The ESLint config itself doesn't need TypeScript -- only the source code does. Lower risk.

2. **vite.config rename**
   - What we know: Vite supports both `.js` and `.ts` config files. The current `vite.config.js` is simple.
   - What's unclear: Whether renaming adds value vs. unnecessary churn.
   - Recommendation: Rename to `vite.config.ts` for consistency since the project is going full TypeScript. Low risk, small file.

## Sources

### Primary (HIGH confidence)
- [Vue.js TypeScript with Composition API](https://vuejs.org/guide/typescript/composition-api) - defineProps, defineEmits, ref typing, computed typing patterns
- [Vue.js Using Vue with TypeScript](https://vuejs.org/guide/typescript/overview) - tsconfig setup, vue-tsc, Vite integration
- [Pinia Defining a Store](https://pinia.vuejs.org/core-concepts/) - Setup store patterns, TypeScript typing
- [@vue/tsconfig GitHub](https://github.com/vuejs/tsconfig) - Base tsconfig contents, version requirements

### Secondary (MEDIUM confidence)
- [@vue/eslint-config-typescript GitHub](https://github.com/vuejs/eslint-config-typescript) - v14.7.0 setup with flat config, defineConfigWithVueTs API
- [Vue.js script setup API](https://vuejs.org/api/sfc-script-setup.html) - defineProps/defineEmits compiler macros
- [vue-tsc npm](https://www.npmjs.com/package/vue-tsc) - v3.2.5, requires TypeScript >= 5.0

### Tertiary (LOW confidence)
- None -- all findings verified with official sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages are official Vue ecosystem tools with clear docs
- Architecture: HIGH - Patterns directly from Vue/Pinia official documentation, verified against codebase
- Pitfalls: HIGH - Identified from actual codebase analysis (Options API components, webkitAudioContext, timer types, gameStore-as-Object prop)

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable ecosystem, no breaking changes expected)
