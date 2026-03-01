# Architecture

**Analysis Date:** 2026-02-28

## Pattern Overview

**Overall:** Single Page Application (SPA) with State Management

**Key Characteristics:**
- Vue 3 Composition API + Pinia store for centralized state
- Mobile-first design (iOS/Android via Capacitor)
- Event-driven game loop using interval timers
- Stimulus-response architecture with visual/audio feedback
- Web Audio API for cross-platform sound management

## Layers

**Presentation Layer:**
- Purpose: Render game UI and handle user interactions
- Location: `src/*.vue` (component files)
- Contains: Vue Single File Components (templates, scripts, scoped styles)
- Depends on: Pinia store, Vue 3 reactive system, TailwindCSS
- Used by: Vue app renderer

**State Management Layer:**
- Purpose: Centralize game logic, score tracking, stimulus generation
- Location: `src/store/gameStore.js`
- Contains: Pinia store with state, actions, getters
- Depends on: Web Audio API, localStorage browser API
- Used by: All Vue components via `useGameStore()`

**Audio Layer:**
- Purpose: Manage Web Audio API context and sound playback
- Location: `src/store/gameStore.js` (audioManager object, lines 6-63)
- Contains: Audio context initialization, sound buffer loading, playback controls
- Depends on: Web Audio API, sound asset URLs
- Used by: Game store actions for audio feedback

**Bootstrap/Entry Layer:**
- Purpose: Initialize Vue app and connect dependencies
- Location: `src/main.js`
- Contains: Vue app creation, Pinia plugin registration, DOM mounting
- Depends on: Vue, Pinia, App.vue, gameStore
- Used by: Browser's HTML entry point

## Data Flow

**Game State Initialization:**

1. `main.js` mounts Vue app with Pinia store
2. `App.vue` setup() calls `useGameStore()` - initializes game state
3. audioManager initializes async (loads sound buffers)
4. Components subscribe to reactive store properties
5. localStorage hydrates previous high scores and audio preference

**Turn-by-turn Game Flow:**

1. Timer interval triggers every 1000ms in `gameStore.startGame()` (line 221)
2. When timer reaches 0, `setNewStimulus()` called:
   - Resets response tracking for current turn
   - Generates random or deterministic stimulus
   - Compares with n-back history entry
   - Updates potential correct answers
   - Plays stimulus sound and shows flash animation
3. User clicks response button → `respond()` in App.vue (line 254)
4. App calls `gameStore.respondToStimulus(stimulusType)` (line 256)
5. Store evaluates if response matches n-back stimulus:
   - If correct: increment score, play positive sound
   - If incorrect: increment strikes, play negative sound
   - If 3+ strikes: trigger game over
6. Feedback state updated (`lastFeedback` object, line 97-101)
7. Components watch feedback and animate corresponding button
8. FeedbackToast auto-hides after 2 seconds (line 289)

**Game Over Flow:**

1. When `incorrectResponses >= 3`, `gameStore.stopGame()` called (line 288)
2. High score comparison (lines 269-277):
   - Compare score
   - Compare accuracy if same score
   - Compare n-back level if same accuracy
3. If new high score, update `highScoreData` in localStorage (line 285)
4. Set `showGameOverModal = true` (line 289)
5. User dismisses modal, returns to main menu or plays again

**Audio Playback:**

1. iOS requires user gesture before audio can play
2. `unlockAudio()` called on tutorial completion or game start (lines 174-175, 217)
3. audioManager.unlock() resumes suspended AudioContext (lines 35-43)
4. Subsequent `playSound('soundName')` calls work for iOS/Android (lines 46-59)

**State Management:**

- Reactive state: `currentStimulus`, `score`, `timeLeft`, `incorrectResponses`, `isPaused`, `isStopped`
- Computed getters: `isEarlyInGame`, `finalScoreAccuracy`, `highScoreAccuracy`
- Persistent state: `highScoreData` and `isAudioEnabled` in localStorage
- Animation state: `flashBorder`, `lastFeedback` - trigger CSS animations via class binding

## Key Abstractions

**Game Stimulus:**
- Purpose: Represents a single visual element with 4 independent attributes
- Examples: `{ color: 'blue', emoji: 'fire', position: 'center', shape: 'square' }`
- Pattern: Object with immutable properties, no methods
- Generated: `generateRandomStimulus()` or `deterministicStimuli[]` array

**Stimulus History:**
- Purpose: Maintains array of past stimuli for n-back comparisons
- Examples: `stimulusHistory[0]`, `stimulusHistory[n-1]` for lookback
- Pattern: FIFO circular buffer (push each turn, never reset mid-game)
- Used: Line 151 `stimulusHistory[length - nBack]` for n-back lookup

**Feedback Indicator:**
- Purpose: Track last user response for animation feedback
- Structure: `{ type: 'correct'|'incorrect'|null, button: 'color'|'emoji'|'position'|'shape'|null, timestamp: number|null }`
- Pattern: Timestamp-based (auto-clear after timeout)
- Used: App.vue watches for changes to trigger button flash animations

**High Score Record:**
- Purpose: Persist best performance with metadata
- Structure: `{ score: number, potentialCorrectAnswers: number, nBack: number }`
- Pattern: Single object in localStorage, full replacement on new high score
- Used: Display comparison stats, determine if current game is new high score

## Entry Points

**Application Entry:**
- Location: `index.html`
- Triggers: Browser loads page
- Responsibilities: DOM root div, script module loading

**App Root Component:**
- Location: `src/App.vue`
- Triggers: Vue mounts after main.js
- Responsibilities:
  - Route between main menu and game screens
  - Manage game lifecycle (start/pause/resume/stop)
  - Render all game UI including modals
  - Bind store state to template

**Game Store Initialization:**
- Location: `src/store/gameStore.js`
- Triggers: `useGameStore()` first call
- Responsibilities:
  - Hydrate state from localStorage
  - Initialize audioManager
  - Set initial game state
  - Expose actions and getters to components

**Game Loop:**
- Location: `gameStore.startGame()` line 221-229
- Triggers: User clicks "Start Game" button
- Responsibilities:
  - Unlock audio on iOS
  - Reset game state
  - Start 1-second interval timer
  - Call `setNewStimulus()` on each interval

## Error Handling

**Strategy:** Defensive with graceful degradation

**Patterns:**

- Audio Loading Failures: `loadSound()` catches errors and logs warnings (line 29-30), game continues without sound
- Audio Context Suspension: Checked before playback and resumed as needed (lines 49-51)
- Missing localStorage: Fallback values in state initialization (line 78)
- Invalid user input: `enforceMinNBack()` and `enforceMinTimeLeft()` in ConfigStart.vue clamp values to minimum 1
- Component unmount cleanup: `onUnmounted()` in App.vue calls `stopGame()` to clear timers (line 250-252)

## Cross-Cutting Concerns

**Logging:**
- Browser console only
- Warning level for audio failures
- Development mode: window.gameStore binding (line 17)

**Validation:**
- Input fields enforce min=1 on number inputs
- ConfigStart component validates on blur and before emit
- Store enforces nBack >= 1, timeLeft >= 1

**Authentication:**
- Not applicable - no user accounts
- localStorage used for persistent local player data only

**Mobile Considerations:**
- Safe area insets applied to #app (style.css lines 21-26)
- Capacitor for iOS/Android app wrapper
- Audio context unlock on user gesture (tutorial completion or game start)
- Viewport fit=cover for notched devices (index.html line 12)
- Fixed positioning respects safe-area-inset for pause button (App.vue line 129)

---

*Architecture analysis: 2026-02-28*
