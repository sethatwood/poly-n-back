# Architecture Patterns

**Domain:** Vue 3 + Pinia + Capacitor mobile game app refactoring
**Researched:** 2026-03-01

## Current State Analysis

The app is a monolithic SPA with two heavyweight files:
- **App.vue** (488 lines): UI layout, screen routing, animation lifecycle, modal orchestration, game event handlers, feedback timing, input management
- **gameStore.js** (311 lines): Game logic, audio management, timer lifecycle, persistence, stimulus generation, score/accuracy calculations, high score tracking

The remaining 10 components (ConfigStart, Stimulus, GameOverModal, PauseModal, TutorialOverlay, GameHint, AchievementToast, IntroHead, IntroContent, Footer) are already reasonably scoped. The problem is concentrated in App.vue and gameStore.js.

## Recommended Architecture

The target architecture splits concerns along three axes: **UI components** (render and handle user interaction), **composables** (encapsulate stateful UI logic like animations and timers), and **stores** (manage domain state and game rules).

```
src/
  composables/
    useAnimations.ts          # Score pulse, strike shake, feedback flash timing
    useFeedback.ts            # Feedback toast visibility and auto-hide
    useGameLifecycle.ts       # Start/pause/resume/quit orchestration
    useManagedTimeout.ts      # Safe timeout wrapper with auto-cleanup
  store/
    gameStore.ts              # Core game state, turn logic, score
    audioStore.ts             # Audio context, sound loading, playback
    persistenceStore.ts       # localStorage reads/writes with validation
  components/
    screens/
      MenuScreen.vue          # Main menu (IntroHead + ConfigStart + IntroContent)
      GameScreen.vue          # Active gameplay (timer, stimulus, buttons, scores)
    game/
      GameTimer.vue           # Countdown display with urgency animation
      ResponseButtons.vue     # 2x2 button grid with feedback classes
      ScoreDisplay.vue        # Score + strikes (active game)
      GameOverDisplay.vue     # Final score (game over, inline)
    modals/
      GameOverModal.vue       # (exists, keep as-is)
      PauseModal.vue          # (exists, keep as-is)
    overlays/
      TutorialOverlay.vue     # (exists, keep as-is)
      AchievementToast.vue    # (exists, keep as-is)
      GameHint.vue            # (exists, keep as-is)
    config/
      ConfigStart.vue         # (exists, keep as-is)
    layout/
      IntroHead.vue           # (exists, keep as-is)
      IntroContent.vue        # (exists, keep as-is)
      Footer.vue              # (exists, keep as-is)
    Stimulus.vue              # (exists, keep as-is)
  App.vue                     # Thin shell: screen routing + overlay mounting
  main.ts
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **App.vue** | Screen routing (menu vs game), mounts overlays/modals | MenuScreen, GameScreen, modals, overlays via props/events |
| **MenuScreen.vue** | Composes IntroHead + ConfigStart + IntroContent + Footer | App.vue via `@startGame` emit; gameStore for nBack display |
| **GameScreen.vue** | Composes GameTimer, Stimulus, ResponseButtons, ScoreDisplay, GameOverDisplay, audio toggle, ConfigStart (game-over), Footer | gameStore for state; composables for animations; App.vue via `@quit` |
| **GameTimer.vue** | Renders countdown with urgency animation classes | gameStore.timeLeft, gameStore.isPaused (read-only) |
| **ResponseButtons.vue** | Renders 2x2 button grid, applies feedback classes, emits responses | gameStore for disabled state; `@respond` emit to parent |
| **ScoreDisplay.vue** | Shows score + strikes with animation classes | gameStore.score, gameStore.incorrectResponses |
| **GameOverDisplay.vue** | Shows final score/accuracy inline (not modal) | gameStore for final stats |
| **audioStore** | Web Audio API context, buffer loading, playback, iOS unlock | gameStore calls audioStore.play(); standalone initialization |
| **persistenceStore** | Validated localStorage read/write for highScoreData, achievements, preferences | gameStore and AchievementToast read/write through it |
| **gameStore** | Game rules: stimulus generation, response evaluation, score tracking, turn management | Components read state; composables orchestrate lifecycle |

### Data Flow

```
User Interaction
      |
      v
  App.vue (screen router)
      |
      +---> MenuScreen ----@startGame----> useGameLifecycle.start()
      |                                         |
      +---> GameScreen                           v
              |                            gameStore.startGame()
              +---> ResponseButtons               |
              |       @respond                     v
              |         |                    gameStore.respondToStimulus()
              |         v                          |
              |    gameStore.respondToStimulus()    +---> audioStore.play()
              |         |                          +---> persistenceStore.saveHighScore()
              |         v
              +---> ScoreDisplay <--- gameStore.score (reactive)
              +---> GameTimer <--- gameStore.timeLeft (reactive)
              +---> Stimulus <--- gameStore.currentStimulus (reactive)

Overlays (mounted at App.vue level, read gameStore directly):
  AchievementToast <--- watches gameStore.score, .incorrectResponses, .isStopped
  GameHint <--- watches gameStore.isEarlyInGame, .timeLeft, .score
  PauseModal <--- gameStore.isPaused
  GameOverModal <--- gameStore.showGameOverModal
```

**Data flows down** via reactive store state and props. **Events flow up** via emits. Overlays are an exception: they watch the store directly because they are cross-cutting concerns that react to game state changes regardless of which screen is active.

## Component Extraction Strategy

The extraction must be incremental and behavior-preserving. The order matters because each step should produce a working app.

### Step 1: Extract Composables from App.vue (No Template Changes)

Before touching the template, extract the script logic into inline composables within App.vue's setup(). This is the "inline composables" pattern -- group related logic into functions that stay in the same file initially.

**Why first:** This is the lowest-risk refactoring step. The template stays identical. You are only moving code within the same file. If anything breaks, the diff is trivial to debug.

```typescript
// Step 1a: Group animation logic
function useAnimations(gameStore) {
  const scoreAnimating = ref(false)
  const strikeAnimating = ref(false)

  watch(() => gameStore.score, (newScore, oldScore) => {
    if (newScore > oldScore) {
      scoreAnimating.value = true
      setTimeout(() => { scoreAnimating.value = false }, 400)
    }
  })

  watch(() => gameStore.incorrectResponses, (newStrikes, oldStrikes) => {
    if (newStrikes > oldStrikes) {
      strikeAnimating.value = true
      setTimeout(() => { strikeAnimating.value = false }, 500)
    }
  })

  return { scoreAnimating, strikeAnimating }
}

// Step 1b: Group feedback logic
function useFeedback(gameStore) {
  const feedbackVisible = ref(false)
  let feedbackTimeout = null

  watch(() => gameStore.lastFeedback.timestamp, (newTimestamp) => {
    if (newTimestamp && gameStore.lastFeedback.type) {
      feedbackVisible.value = true
      if (feedbackTimeout) clearTimeout(feedbackTimeout)
      feedbackTimeout = setTimeout(() => {
        feedbackVisible.value = false
      }, 2000)
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (feedbackTimeout) clearTimeout(feedbackTimeout)
  })

  const feedbackClass = (buttonType) => { /* ... */ }
  const showFeedbackToast = computed(() => feedbackVisible.value)

  return { feedbackClass, showFeedbackToast }
}

// Step 1c: Group game lifecycle handlers
function useGameLifecycle(gameStore, showModal, timeLeftInput) {
  const startGame = () => { /* ... */ }
  const handlePause = () => { /* ... */ }
  const handleResume = () => { /* ... */ }
  const handleQuit = () => { /* ... */ }
  const handleGameOverClose = () => { /* ... */ }
  const handlePlayAgain = () => { /* ... */ }
  const handleMainMenu = () => { /* ... */ }

  onUnmounted(() => { gameStore.stopGame() })

  return { startGame, handlePause, handleResume, handleQuit,
           handleGameOverClose, handlePlayAgain, handleMainMenu }
}
```

### Step 2: Extract Composables to Separate Files

Move the inline composables from Step 1 into `src/composables/` as separate files. This is a mechanical move with zero behavioral change -- the functions already work, you are just changing where they live.

Create `useManagedTimeout.ts` at this stage as a utility composable that wraps setTimeout with automatic cleanup:

```typescript
// src/composables/useManagedTimeout.ts
import { onUnmounted } from 'vue'

export function useManagedTimeout() {
  const timeouts = new Set<ReturnType<typeof setTimeout>>()

  const set = (callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      timeouts.delete(id)
      callback()
    }, delay)
    timeouts.add(id)
    return id
  }

  const clear = (id: ReturnType<typeof setTimeout>) => {
    clearTimeout(id)
    timeouts.delete(id)
  }

  onUnmounted(() => {
    timeouts.forEach(clearTimeout)
    timeouts.clear()
  })

  return { set, clear }
}
```

### Step 3: Extract AudioManager from gameStore

The audioManager is a standalone concern embedded in gameStore.js. Extract it to its own Pinia store.

**Why a store and not a composable:** The audio context is a singleton. Multiple components should not create separate audio contexts. A Pinia store guarantees singleton behavior and provides devtools visibility.

```typescript
// src/store/audioStore.ts
export const useAudioStore = defineStore('audio', () => {
  const context = shallowRef<AudioContext | null>(null)
  const buffers = shallowRef<Record<string, AudioBuffer>>({})
  const isUnlocked = ref(false)
  const isEnabled = ref(true)
  const isReady = ref(false)

  async function init() { /* ... */ }
  function unlock() { /* ... */ }
  function play(soundName: string) { /* ... */ }
  function toggle() { /* ... */ }

  // Initialize on creation
  init()

  return { isEnabled, isReady, isUnlocked, unlock, play, toggle }
})
```

### Step 4: Extract Persistence Layer

Create a persistence store or utility that wraps all localStorage access with validation and error handling.

```typescript
// src/store/persistenceStore.ts
export const usePersistenceStore = defineStore('persistence', () => {
  function readJSON<T>(key: string, fallback: T, validate?: (v: unknown) => v is T): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return fallback
      const parsed = JSON.parse(raw)
      if (validate && !validate(parsed)) return fallback
      return parsed
    } catch {
      return fallback
    }
  }

  function writeJSON(key: string, value: unknown): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      console.warn(`Failed to write to localStorage: ${key}`)
      return false
    }
  }

  // Typed accessors for specific data
  const highScoreData = ref(readJSON('highScoreData', { score: 0, potentialCorrectAnswers: 0, nBack: null }))
  const isAudioEnabled = ref(readJSON('isAudioEnabled', true))
  const tutorialCompleted = ref(readJSON('tutorialCompleted', false))
  const achievements = ref(readJSON('achievements', []))

  // Save methods with error handling
  function saveHighScore(data: HighScoreData) { /* ... */ }
  function saveAudioPreference(enabled: boolean) { /* ... */ }

  return { highScoreData, isAudioEnabled, tutorialCompleted, achievements,
           saveHighScore, saveAudioPreference, readJSON, writeJSON }
})
```

### Step 5: Extract Template Sections into Components

Now extract template sections from App.vue. The template currently has two major branches (`v-if="showModal"` for menu, `v-else` for game). These become MenuScreen and GameScreen.

**Extraction order within the game screen (from leaf to root):**

1. **GameTimer.vue** -- The countdown display. Isolated: reads `gameStore.timeLeft` and `gameStore.isPaused`. No events emitted. Pure display.

2. **ResponseButtons.vue** -- The 2x2 button grid. Receives `feedbackClass` function and `respond` handler. Reads `gameStore.respondedThisTurn`, `gameStore.isEarlyInGame`, `gameStore.isPaused`.

3. **ScoreDisplay.vue** -- Score and strikes display during active game. Receives animation refs. Reads `gameStore.score`, `gameStore.incorrectResponses`.

4. **GameOverDisplay.vue** -- The inline game-over stats (not the modal). Reads `gameStore.score`, `gameStore.previousPotentialCorrectAnswers`, `gameStore.finalScoreAccuracy`, `gameStore.highScoreData`.

5. **GameScreen.vue** -- Composes the above four components plus Stimulus, audio toggle, Footer, and the game-over ConfigStart. All game-screen template moves here.

6. **MenuScreen.vue** -- Composes IntroHead, ConfigStart, IntroContent, Footer. Simple wrapper.

7. **App.vue** becomes a thin shell: screen transition, overlay mounting, screen routing.

**After extraction, App.vue should be under 80 lines.**

### Step 6: Refine gameStore

With audio and persistence extracted, gameStore shrinks to pure game logic:
- State: currentStimulus, stimulusHistory, score, incorrectResponses, nBack, timeLeft, timerInterval, isPaused, isStopped, respondedThisTurn, lastFeedback, potentialCorrectAnswers, previousPotentialCorrectAnswers
- Actions: startGame, stopGame, pauseGame, resumeGame, setNewStimulus, respondToStimulus, resetGameState, generateRandomStimulus
- Getters: isEarlyInGame, finalScoreAccuracy

Game store calls `audioStore.play()` for sounds and `persistenceStore.saveHighScore()` for persistence, keeping its own logic focused on game rules.

## Patterns to Follow

### Pattern 1: Composable for UI-Only Stateful Logic
**What:** Extract animation timing, feedback visibility, and other view-layer state into composables. These are not domain logic -- they are presentation concerns.
**When:** Logic involves `ref()`, `watch()`, `setTimeout()` and exists only to drive CSS classes or visibility toggles.
**Example:**
```typescript
// src/composables/useAnimations.ts
export function useAnimations(gameStore: ReturnType<typeof useGameStore>) {
  const { set } = useManagedTimeout()
  const scoreAnimating = ref(false)
  const strikeAnimating = ref(false)

  watch(() => gameStore.score, (n, o) => {
    if (n > o) {
      scoreAnimating.value = true
      set(() => { scoreAnimating.value = false }, 400)
    }
  })

  watch(() => gameStore.incorrectResponses, (n, o) => {
    if (n > o) {
      strikeAnimating.value = true
      set(() => { strikeAnimating.value = false }, 500)
    }
  })

  return { scoreAnimating, strikeAnimating }
}
```

### Pattern 2: Store per Domain, Not per Feature
**What:** Split stores by domain responsibility (game rules, audio, persistence), not by UI feature.
**When:** A store file exceeds ~150 lines or mixes unrelated concerns.
**Why:** Domain stores are stable -- they change when the domain changes. Feature-organized stores couple unrelated code.

### Pattern 3: Props Down, Events Up for Extracted Components
**What:** New components extracted from App.vue receive data via props and communicate via emits. They do NOT directly call `useGameStore()` unless they need to watch reactive state that changes frequently (like score).
**When:** Extracting template sections into child components.
**Why:** Keeps components testable in isolation. The parent controls what data flows where.
**Exception:** Overlay components (AchievementToast, GameHint) may watch the store directly because they are cross-cutting and mounted at the App level.

### Pattern 4: Managed Timeouts
**What:** All setTimeout/setInterval calls go through a composable that tracks IDs and clears them on unmount.
**When:** Any component or composable that uses timers.
**Why:** Prevents the memory leak pattern documented in CONCERNS.md where timeouts accumulate.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Big-Bang Refactor
**What:** Rewriting App.vue and gameStore.js from scratch in one commit.
**Why bad:** Introduces regressions across the entire app simultaneously. No working intermediate state. Impossible to bisect when bugs appear.
**Instead:** Follow the 6-step incremental extraction above. Each step produces a working app. Each step is a separate commit.

### Anti-Pattern 2: Over-Extraction into Tiny Components
**What:** Extracting every `<div>` into its own component file.
**Why bad:** Creates a deep component tree with excessive prop drilling. Makes the template harder to read, not easier. Performance cost from extra component instances.
**Instead:** Extract along natural UI boundaries (screen sections, interactive widgets). A component should represent a meaningful unit of UI, not a single HTML element.

### Anti-Pattern 3: Composable Store Hybrids
**What:** Creating composables that internally create Pinia stores, or stores that return composable-like reactive objects outside the store pattern.
**Why bad:** Confuses the mental model. Developers do not know whether to look in stores/ or composables/ for state. Breaks devtools inspection.
**Instead:** Stores own domain state. Composables own UI-only state. The boundary is: "Would this state exist if there were no UI?" If yes, it is a store. If no, it is a composable.

### Anti-Pattern 4: TypeScript Migration Before Extraction
**What:** Adding TypeScript annotations to the current monolithic files before extracting composables and splitting stores.
**Why bad:** You will annotate code that is about to move. Merge conflicts. Wasted effort on type signatures for functions that will be restructured.
**Instead:** Extract first (Steps 1-6 above), then add TypeScript to the new, smaller files. Migrate file-by-file. See TypeScript migration section below.

### Anti-Pattern 5: Direct Store Mutation from Deep Children
**What:** Every small component calling `useGameStore()` and mutating state directly.
**Why bad:** State changes become untraceable. Any component can modify any state from anywhere. Testing requires mocking the full store for every component.
**Instead:** Leaf components emit events. Parent components or composables orchestrate store mutations. Only screen-level components and overlay components should call store actions directly.

## TypeScript Migration Approach

**Strategy: Incremental, file-by-file, extraction-first.**

### Phase 1: Enable TypeScript Infrastructure
1. Install `typescript` and `vue-tsc`
2. Create `tsconfig.json` with `strict: false` initially (allows gradual migration)
3. Configure Vite with `vue-tsc` for type checking
4. Rename `main.js` to `main.ts` (minimal changes needed)

### Phase 2: Type New Files (Composables, Split Stores)
All new files created during extraction (Steps 1-6) are written as `.ts` from the start. This is the most natural point to introduce types -- you are writing new code, not retrofitting old code.

### Phase 3: Migrate Existing Files Bottom-Up
Order matters. Migrate files that have no downstream dependents first:
1. **Leaf components** (Footer, IntroHead) -- trivial, no props or state
2. **Simple prop-based components** (PauseModal, GameOverModal) -- add prop types
3. **Store-connected components** (Stimulus, ConfigStart) -- add store types
4. **Complex components** (AchievementToast, GameHint) -- add full typing
5. **gameStore.ts** -- the most important file to type, but depends on audioStore and persistenceStore types being defined first
6. **App.vue** -- last, as it imports everything

### Phase 4: Enable Strict Mode
Once all files are `.ts`/`.vue` with `lang="ts"`:
1. Enable `strict: true` in `tsconfig.json`
2. Fix remaining `any` types and implicit assertions
3. Add `vue-tsc --noEmit` to CI pipeline

### Key TypeScript Patterns for This Codebase

**Game stimulus types:**
```typescript
type StimulusAttribute = 'color' | 'emoji' | 'position' | 'shape'
type Color = 'purple' | 'green' | 'blue'
type Emoji = 'fire' | 'ice' | 'flower'
type Position = 'left' | 'center' | 'right'
type Shape = 'circle' | 'square' | 'triangle'

interface Stimulus {
  color: Color
  emoji: Emoji
  position: Position
  shape: Shape
}

interface HighScoreData {
  score: number
  potentialCorrectAnswers: number
  nBack: number | null
}

interface FeedbackState {
  type: 'correct' | 'incorrect' | null
  button: StimulusAttribute | null
  timestamp: number | null
}
```

**Pinia store with TypeScript (setup syntax):**
```typescript
export const useGameStore = defineStore('game', () => {
  const currentStimulus = ref<Stimulus>({} as Stimulus)
  const stimulusHistory = ref<Stimulus[]>([])
  const score = ref(0)
  // TypeScript infers number, no annotation needed for primitives

  function respondToStimulus(stimulusType: StimulusAttribute): void {
    // Full type safety on stimulusType
  }

  return { currentStimulus, stimulusHistory, score, respondToStimulus }
})
```

## Build Order and Dependencies

The refactoring steps have dependencies. This is the required order:

```
1. Inline composables in App.vue (no deps)
   |
2. Extract composables to files (depends on 1)
   |   |
   |   +-- useManagedTimeout.ts (no deps, enables safe timer patterns)
   |   +-- useAnimations.ts (depends on useManagedTimeout)
   |   +-- useFeedback.ts (depends on useManagedTimeout)
   |   +-- useGameLifecycle.ts (no deps beyond gameStore)
   |
3. Extract audioStore from gameStore (no deps on 1-2)
   |
4. Extract persistenceStore (no deps on 1-3)
   |
5. Refine gameStore to use audioStore + persistenceStore (depends on 3, 4)
   |
6. Extract template components (depends on 2 for composable imports)
   |   |
   |   +-- Leaf components first: GameTimer, ScoreDisplay, GameOverDisplay
   |   +-- Interactive components: ResponseButtons
   |   +-- Screen components: GameScreen, MenuScreen
   |   +-- Thin App.vue shell
   |
7. TypeScript migration (depends on 1-6 being stable)
   |   |
   |   +-- Types file (interfaces, shared types)
   |   +-- New files (.ts from creation)
   |   +-- Leaf components first
   |   +-- Stores
   |   +-- Complex components
   |   +-- Enable strict mode
```

Steps 3 and 4 can run in parallel with Steps 1 and 2, as they modify different files. Steps 1-2 modify App.vue; Steps 3-4 modify gameStore.js. This parallelism is safe because the two file groups do not overlap.

## Scalability Considerations

| Concern | Current (solo dev) | At M2 (backend + accounts) | At M3 (multiple game modes) |
|---------|-------------------|---------------------------|----------------------------|
| State management | Single gameStore is fine | Add userStore, syncStore | Consider gameStore factory per mode |
| Component count | ~15 components adequate | ~20-25 with account UI | ~30+ with mode-specific UIs |
| Store composition | Minimal cross-store | gameStore reads userStore | Mode stores compose base gameStore |
| Testing | Unit tests on stores + composables | Integration tests for sync flows | Parameterized tests per game mode |
| Code splitting | Not needed (small bundle) | Lazy-load account screens | Lazy-load game mode screens |

## Sources

- [Vue 3 Composables Official Guide](https://vuejs.org/guide/reusability/composables.html) -- HIGH confidence. Naming conventions, return patterns, lifecycle cleanup, usage restrictions.
- [Pinia Defining Stores](https://pinia.vuejs.org/core-concepts/) -- HIGH confidence. Option vs Setup stores, organization, TypeScript patterns.
- [Pinia Composing Stores](https://pinia.vuejs.org/cookbook/composing-stores.html) -- HIGH confidence. Cross-store composition, nested stores, SSR warnings.
- [Inline Vue Composables Refactoring Pattern](https://alexop.dev/posts/inline-vue-composables-refactoring/) -- MEDIUM confidence. Inline composable extraction as stepping stone to separate files.
- [Taming the Mega-Component (dev.to)](https://dev.to/rrd/taming-the-mega-component-my-vuejs-refactoring-adventure-5a3) -- MEDIUM confidence. Template-first extraction boundaries, test-as-you-go strategy.
- [Pinia Splitting Stores (Vue Mastery)](https://www.vuemastery.com/courses/5-elegant-ways-to-use-pinia/splitting-stores/) -- MEDIUM confidence. Domain-driven store splitting.
- [Vue 3 Best Practices (Medium)](https://medium.com/@ignatovich.dm/vue-3-best-practices-cb0a6e281ef4) -- LOW confidence. General patterns.
- [Modular Store Architecture with Pinia (Medium)](https://medium.com/@vasanthancomrads/building-modular-store-architecture-with-pinia-in-large-vue-apps-0131e3d05430) -- LOW confidence. Modular store patterns for larger apps.
