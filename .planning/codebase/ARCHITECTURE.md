<!-- refreshed: 2026-04-25 -->
# Architecture

**Analysis Date:** 2026-04-25

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Vue 3 + TypeScript UI Layer                │
├──────────────────────┬──────────────────┬──────────────────┤
│  Game Screen         │  Menu Screen     │  Modals & Overlays  │
│  `components/`       │  `MenuScreen.vue`│ (`GameOverModal`,   │
│  `Stimulus.vue`      │                  │ `PauseModal`, etc)  │
└──────────────────────┴──────────────────┴──────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│             Composables (Reactive Logic Layer)              │
│  `useGameLifecycle` • `useFeedback` • `useAnimations`       │
│            `useManagedTimeout` • View orchestration         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          Pinia Stores (Game State & Persistence)            │
│  `gameStore` — game logic, stimulus gen, scoring            │
│  `audioStore` — AudioContext, sound loading & playback      │
│  `persistenceStore` — Capacitor Preferences, localStorage   │
└──────────────────────────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌──────────────────────────────────────────────────────────────┐
│                 Capacitor Plugin Layer                        │
│  App (lifecycle) • Preferences (storage) • Haptics • Audio  │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│         Native Wrapper Layer (iOS/Android Bridge)            │
│  `ios/App/AppDelegate.swift`                                 │
│  `android/app/src/main/java/com/polynback/MainActivity.java` │
│  `dist/` (built web app served by Capacitor WebView)         │
└──────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App | Root component, screen transitions, modal orchestration | `src/App.vue` |
| GameScreen | Active gameplay UI (stimulus, timer, response buttons, score) | `src/components/GameScreen.vue` |
| MenuScreen | Game configuration (N-Back selection, duration, start button) | `src/components/MenuScreen.vue` |
| Stimulus | Visual stimulus display (shape, color, emoji, position) | `src/Stimulus.vue` |
| ResponseButtons | Four action buttons (color, emoji, position, shape) | `src/components/ResponseButtons.vue` |
| GameTimer | Countdown timer display, feedback toast | `src/components/GameTimer.vue` |
| ScoreDisplay | Current game score and strike counter | `src/components/ScoreDisplay.vue` |
| GameOverModal | End-of-game summary, high score display, restart options | `src/GameOverModal.vue` |
| PauseModal | Pause state UI (resume, quit buttons) | `src/PauseModal.vue` |
| TutorialOverlay | First-run tutorial walkthrough | `src/TutorialOverlay.vue` |
| AchievementToast | Toast notification for achievements | `src/AchievementToast.vue` |
| GameHint | Contextual hint UI | `src/GameHint.vue` |

## Pattern Overview

**Overall:** Vue 3 Composition API + Pinia store + Capacitor bridge

**Key Characteristics:**
- Single-page application (SPA) rendering into `#app` DOM element
- Client-side state management only (no backend in M2)
- Reactive composables orchestrate component-to-store communication
- Capacitor WebView wraps the built Vue app for native features (haptics, preferences, lifecycle)
- Audio context lazy-initialized on store instantiation; sounds are decoded at init time
- Game loop driven by `setInterval()` in gameStore; timers paused when app backgrounded

## Layers

**Presentation Layer (Components):**
- Purpose: Render UI, handle user input, display game state
- Location: `src/` (root .vue files) and `src/components/`
- Contains: Vue Single-File Components (.vue)
- Depends on: Composables, stores (via injection), types
- Used by: App root, other components

**Composable Logic Layer:**
- Purpose: Bridge components and stores; manage complex side effects (animation timing, lifecycle events)
- Location: `src/composables/`
- Contains: Vue composition functions (useGameLifecycle, useFeedback, useAnimations)
- Depends on: Stores, Capacitor plugins
- Used by: Components, App root

**Store Layer (State Management):**
- Purpose: Hold all application state, game logic, persistence, audio management
- Location: `src/stores/`
- Contains: Pinia stores (gameStore, audioStore, persistenceStore)
- Depends on: Capacitor Preferences, Haptics, App plugins; types
- Used by: Composables, components

**Type Layer:**
- Purpose: Define TypeScript types for stimulus, game state, responses
- Location: `src/types/game.ts`
- Contains: Stimulus interface, HighScoreData, RespondedThisTurn, feedback types, etc.
- Depends on: Nothing
- Used by: Stores, components, composables

**Utility Layer:**
- Purpose: Thin wrappers around Capacitor plugins (haptics, sentry)
- Location: `src/utils/haptics.ts`, `src/sentry.ts`
- Contains: No-throw helper functions for haptics, error tracking init
- Depends on: Capacitor plugins
- Used by: gameStore, stores

**Native Bridge:**
- Purpose: Capacitor configuration, native app entry points, WebView setup
- Location: `capacitor.config.ts`, `ios/`, `android/`
- Contains: Config (app ID, web dir), native platform code (Swift, Kotlin)
- Depends on: Vite build output (`dist/`)
- Used by: System boot (iOS/Android runtime)

## Data Flow

### Primary Request Path: Player Response to Stimulus

1. **User taps response button** (`src/components/ResponseButtons.vue` — @click event)
2. **Component emits 'respond' event** with `StimulusAttribute` type (color, emoji, position, shape)
3. **App.vue receives event, calls `gameStore.respondToStimulus()`** (`src/App.vue` line 156-160)
4. **gameStore validates & scores response**:
   - Fetches nBack stimulus from history (`gameStore.stimulusHistory`)
   - Compares current stimulus attribute to nBack attribute
   - Updates score or increctResponses (`src/stores/gameStore.ts` lines 280-360)
5. **gameStore updates lastFeedback state** with correct/incorrect + button type
6. **Composable useFeedback watches timestamp, triggers toast** (`src/composables/useFeedback.ts`)
7. **Components reactively re-render** (GameTimer shows toast, ResponseButtons highlight)

### Secondary Flow: Game Loop & Stimulus Generation

1. **gameStore.startGame(timeLeft)** resets state and starts `setInterval` (`src/stores/gameStore.ts` lines 250-265)
2. **Timer fires every 1000ms**:
   - Decrements `timeLeft`
   - When `timeLeft === 0`, calls `setNewStimulus()`
3. **setNewStimulus() generates or cycles stimulus** (`src/stores/gameStore.ts` lines 129-190)
   - In deterministic mode: cycles through preset stimuli
   - In random mode: generates random color, emoji, position, shape
   - Pushes to `stimulusHistory` (capped to `nBack + 50`)
   - Calculates potential correct answers
   - Plays "stimulus" sound via audioStore
   - Flashes border for 300ms
4. **Components read currentStimulus and reactively display** (`src/components/GameScreen.vue`)

### Persistence Flow: Save & Load State

1. **On app mount**, App.vue calls `gameStore.loadPersistedState()` (`src/App.vue` line 128)
2. **gameStore.loadPersistedState()** calls `persistenceStore.migrateFromLocalStorage()` then loads preferences (`src/stores/gameStore.ts` lines 75-93)
3. **persistenceStore.loadPreference(key)** reads from Capacitor Preferences (or fallback localStorage for first run) (`src/stores/persistenceStore.ts` lines 8-31)
4. **State restored**: highScoreData, isAudioEnabled, isHapticsEnabled, tutorialCompleted
5. **On state changes**, gameStore calls `persistenceStore.savePreference()` via toggleAudio, toggleHaptics, respondToStimulus (when new high score)

### Capacitor Lifecycle: App Backgrounding

1. **useGameLifecycle registers Capacitor App.addListener** for 'appStateChange' (`src/composables/useGameLifecycle.ts` lines 21-28)
2. **When app loses focus** (`isActive === false`):
   - If game is not stopped/paused: `gameStore.pauseGame()`
   - User must manually resume (no auto-resume)
3. **When app regains focus** (`isActive === true`):
   - No automatic action (app stays paused or menu-visible)

**State Management:**
- Game state is entirely reactive (Vue refs in Pinia stores)
- Persistence is explicit: calls to `persistenceStore.savePreference()` trigger writes
- No middleware or async saga layer
- Audio buffers stored in non-serializable variables (plain JS objects, not refs)

## Key Abstractions

**Stimulus:**
- Purpose: Represents a single visual puzzle (4 attributes: color, emoji, position, shape)
- Examples: `src/stores/gameStore.ts` (currentStimulus), `src/Stimulus.vue` (renderer)
- Pattern: Immutable records pushed to stimulusHistory; comparison logic in respondToStimulus

**Feedback:**
- Purpose: Track the result of a player response (correct/incorrect, which button, timestamp)
- Examples: `src/stores/gameStore.ts` (lastFeedback), `src/composables/useFeedback.ts`
- Pattern: Timestamp-driven watchers; visual effects auto-clear after 2s timeout

**Game Loop:**
- Purpose: Advance turns at fixed intervals; generate stimuli, count down timer
- Examples: `src/stores/gameStore.ts` (startGame, setInterval, setNewStimulus)
- Pattern: setInterval-based; paused when game is paused or app backgrounded

**Persistence Adapter:**
- Purpose: Unified interface to local storage (Capacitor Preferences on native, fallback to localStorage on web)
- Examples: `src/stores/persistenceStore.ts`
- Pattern: Load/save with JSON serialization; migration from localStorage for backwards compatibility

## Entry Points

**Web Entry (Vite + Vue):**
- Location: `index.html` line 25 → `src/main.ts`
- Triggers: Browser load or Capacitor WebView initialization
- Responsibilities:
  - Creates Vue app instance
  - Installs Pinia store plugin
  - Initializes Sentry error tracking (production only)
  - Mounts App.vue to `#app` div
  - Exposes gameStore on window.gameStore for dev console debugging

**Native Entry (Capacitor iOS):**
- Location: `ios/App/App/AppDelegate.swift`
- Triggers: iOS app launch
- Responsibilities:
  - Standard UIKit app lifecycle
  - Delegates to Capacitor's ApplicationDelegateProxy for URL handling
  - Serves Capacitor WebView (built from `dist/`)

**Native Entry (Capacitor Android):**
- Location: `android/app/src/main/java/com/polynback/MainActivity.java`
- Triggers: Android app launch
- Responsibilities:
  - Extends BridgeActivity (Capacitor base)
  - Serves Capacitor WebView (built from `dist/`)

## Architectural Constraints

- **Threading:** Single-threaded event loop (JavaScript). Audio processing runs in AudioContext thread but does not block main thread. Haptics calls are async but non-blocking.
- **Global state:** gameStore (Pinia singleton), audioStore, persistenceStore. No module-level mutable singletons besides these stores and audioStore's internal context buffer.
- **Circular imports:** None detected. Stores import types; composables import stores; components import composables.
- **Browser/Native hybrid:** Web app runs identically in browser and Capacitor WebView. Capacitor plugins gracefully degrade on web (haptics no-throw, preferences fall back to localStorage).
- **No networking:** Backend-free by design (M2). All data local to device.
- **Fixed game loop:** Timer-driven stimulus generation; no frame-based rendering (Vue reactivity, not requestAnimationFrame).

## Anti-Patterns

### Missing Error Boundary for Store Initialization

**What happens:** If `useGameStore()` or audio init throws an error, it crashes the app with no recovery.

**Why it's wrong:** No try-catch in main.ts or App.vue for store setup; unhandled promise in audioStore.init().

**Do this instead:** Wrap store initialization in try-catch; use async init pattern in App.vue onMounted with fallback state.

### Audio Context Blocking on Slow Devices

**What happens:** audioStore.init() fetches and decodes all 3 sounds on module load; if device is slow, playback may stutter.

**Why it's wrong:** Eager initialization without progress feedback; all-or-nothing (no partial loading).

**Do this instead:** Lazy load sounds on first play; show "loading audio" state during gameplay setup; use Promise.allSettled so one failure doesn't block game start.

## Error Handling

**Strategy:** Local error handling with fallback to Sentry in production.

**Patterns:**
- **Composables & stores:** Catch and log, continue (e.g., persistenceStore catches storage failures, logs warning, returns defaults)
- **Audio:** No-throw wrappers (haptics, audio playback fail silently with console.warn)
- **Vue errors:** Development-only handlers log to console; production routes through Sentry
- **Unhandled rejections:** Logged to console (dev) or Sentry (prod)

## Cross-Cutting Concerns

**Logging:** console.warn for non-fatal issues (storage, audio failures); console.error for Vue errors; Sentry for production exceptions.

**Validation:** Preference load validates type and schema (persistenceStore); stimulus generation ensures valid enums; respondToStimulus validates stimulusType.

**Authentication:** Not applicable (no backend). Preferences scoped to device (localStorage + Capacitor Preferences).

---

*Architecture analysis: 2026-04-25*
