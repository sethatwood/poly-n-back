# Codebase Concerns

**Analysis Date:** 2026-04-25

## Tech Debt

### Timer Lifecycle Management (Medium Priority)

**Issue:** Game timer (`setInterval`) in `gameStore.startGame()` is stored in a ref but cleanup is not guaranteed in edge cases.

**Files:** `src/stores/gameStore.ts:256`, `src/App.vue:153-154`

**Impact:** If a game is started, paused, then the parent component unmounts before `resetGameState()` is called, the interval may persist in memory. This is mitigated by `useGameLifecycle` calling `stopGame()` on unmount, but the pattern is fragile.

**Fix approach:**
- Wrap `setInterval` usage with a managed timer utility similar to `useManagedTimeout`
- Or enforce that `resetGameState()` is always called before state teardown
- Or use Vue's `onBeforeUnmount` hook at the store level (if Pinia permits)

### Manual setTimeout Without Cleanup (Low Priority, Distributed)

**Issue:** Multiple components use raw `setTimeout` without guaranteed cleanup:
- `GameHint.vue:26` — `hintTimeout` cleared on component unmount, but pattern is manual
- `AchievementToast.vue:89` — `toastTimeout` manual cleanup
- `useFeedback.ts:22` — `feedbackTimeoutId` cleared in watcher, but relies on watcher being unsubscribed

**Files:** `src/GameHint.vue`, `src/AchievementToast.vue`, `src/composables/useFeedback.ts`

**Impact:** Low risk — timeouts are short (2-3 seconds) and components are short-lived. But pattern is inconsistent.

**Fix approach:**
- Migrate these components to use `useManagedTimeout` from `src/composables/useManagedTimeout.ts` (which already exists and properly cleans up on unmount)
- Creates consistency across codebase

### Stimulus History Unbounded Memory Growth (FIX-04 Addressed, But Worth Monitoring)

**Issue:** While `gameStore.ts:179-182` now caps stimulus history to `nBack + 50`, this is a band-aid fix. The history grows indefinitely during long play sessions.

**Files:** `src/stores/gameStore.ts:179-182`

**Impact:** Long sessions (30+ min of continuous play) could accumulate 100+ stimulus records. In a production mobile app, this could contribute to memory pressure. Low individual impact but multiplies across long sessions.

**Fix approach:**
- Consider a circular buffer implementation (fixed-size array, overwrite oldest on push)
- Or periodically trim history if `stimulusHistory.length > (nBack + 50)` per-turn

### Direct setTimeout Without Return Type Safety (Inherited from Legacy)

**Issue:** `useFeedback.ts:14` stores `feedbackTimeoutId` as a plain variable, not in the managed timeout system.

**Files:** `src/composables/useFeedback.ts:14-24`

**Impact:** If the watcher is cleaned up out-of-order with the timeout, the timeout ID could be lost and timeout not cleared. Current implementation is safe (the watcher is tied to the ref's lifecycle), but pattern is not defensive.

**Fix approach:**
- Migrate to `useManagedTimeout` to align with `useGameLifecycle` pattern

## Known Bugs

### AudioContext Unlock Not Guaranteed on iOS in All Paths

**Issue:** iOS requires user interaction to start audio playback. The code calls `unlockAudio()` in `startGame()` and `handleTutorialComplete()`, but if a user taps a response button before starting the game, audio will not unlock.

**Files:** `src/stores/gameStore.ts:203-205`, `src/App.vue:140`, `src/composables/useGameLifecycle.ts:30-31`

**Symptoms:** On iOS, audio may fail to play on first game if user interaction happened before `startGame()` was called.

**Trigger:** Tap a response button on menu screen, then start game.

**Workaround:** Current implementation unlocks audio in `startGame()`, so audio will work once a game is actually started. The issue is only if audio is expected to play during menu interactions (currently it doesn't).

**Fix approach:**
- Call `unlockAudio()` on first user interaction anywhere (response button tap, audio toggle, etc.) rather than only in `startGame()` and `handleTutorialComplete()`

### AudioContext Initialization Fire-and-Forget Pattern

**Issue:** `useAudioStore` calls `init()` at module load time without awaiting. If the module is imported but never used, `init()` still runs.

**Files:** `src/stores/audioStore.ts:75`

**Impact:** Low risk — `init()` is cheap (just creates an AudioContext and fetches sound files). But it uses network bandwidth unnecessarily if audio is disabled on first app load.

**Fix approach:**
- Defer `init()` until the first time audio is actually needed, or at least until `startGame()` is called
- Use a lazy initialization pattern with a "first call" guard

### No Error Recovery for Sound File Load Failures

**Issue:** If a sound file (e.g., `stimulus.wav`) 404s or fails to fetch, `audioStore` silently logs a warning and continues. Subsequent calls to `play()` will silently fail if the buffer wasn't loaded.

**Files:** `src/stores/audioStore.ts:24`, `src/stores/audioStore.ts:60`

**Symptoms:** Users won't hear audio feedback, and no indication that audio is broken.

**Trigger:** CDN latency/failure, incorrect asset URL in Vite build config.

**Workaround:** Fallback to silent mode (game is fully playable without audio).

**Fix approach:**
- Track which buffers failed to load and report to Sentry
- Provide user feedback if audio is expected but unavailable (e.g., "Audio unavailable, turn off audio toggle")

### Persistence Layer Has No Conflict Detection

**Issue:** `persistenceStore` uses `@capacitor/preferences` without any conflict resolution. If the app is open on two devices and both make changes to high-score data, the last write wins.

**Files:** `src/stores/persistenceStore.ts:33-39`

**Impact:** Not a concern in Milestone 1 (single-device gameplay). Will be critical in Milestone 2 when cross-device sync is implemented.

**Fix approach:**
- Defer to Milestone 2 when implementing backend-driven sync
- For now, document that data is device-local only

### Rapid-Fire Button Presses Can Be Debounced but Not Fully Prevented

**Issue:** `respondToStimulus()` checks `respondedThisTurn[stimulusType]` to prevent duplicate responses per turn, but if a user taps multiple different buttons in quick succession, each will register.

**Files:** `src/stores/gameStore.ts:280-283`

**Current behavior:** Correct. User can tap "color" then "emoji" in the same turn and both will be checked.

**Edge case:** If user taps "color" twice in rapid succession (within same turn), the second tap is ignored. But if user taps "color", waits 1ms, taps "emoji", both count. This is actually correct n-back behavior (user can respond to multiple attributes matching).

**Verdict:** No bug. The implementation is correct.

## Security Considerations

### No Secrets Exposed in Code

**Status:** PASS

**Files:** Checked `.env.production` existence; content not inspected per security policy. Sentry DSN referenced via `import.meta.env.VITE_SENTRY_DSN`, which is Vite's environment variable system (safe).

**Current mitigation:** Secrets are external, never hardcoded.

### Local Data Storage (Device-Only, No Backend)

**Issue:** High score data is stored in `@capacitor/preferences` without encryption. In Milestone 1, this is acceptable (offline game, local-only data).

**Files:** `src/stores/persistenceStore.ts`, `src/stores/gameStore.ts:77-84`

**Risk:** Low in Milestone 1 (single user, no sync). Will be critical in Milestone 2 when implementing progress sync + subscriptions.

**Recommendation for Milestone 2:**
- Encrypt high-score data before persisting
- Validate receipt signatures when syncing high scores via backend (prevent cheating via local data tampering)
- Use Capacitor's secure storage (iOS Keychain, Android SharedPreferences encrypted) if available

### No Validation of Data Shape on Load

**Issue:** While `persistenceStore.loadPreference()` checks object keys exist, it does not deeply validate data types.

**Files:** `src/stores/persistenceStore.ts:14-26`

**Example:** If `highScoreData` is loaded and `score` property is a string instead of number, it passes validation but causes bugs downstream (e.g., `score.value > highScoreData.value.score` will fail comparison).

**Fix approach:**
- Use a type guard or validation library (e.g., Zod, Yup) before returning loaded preferences
- Or add strict type checking: `typeof parsed.score === 'number'`

## Performance Bottlenecks

### Long Game Sessions Degrade Gracefully but Not Optimally

**Issue:** During a 30+ minute play session, `stimulusHistory` grows to ~120+ records. While capped at `nBack + 50`, the array continues to be sliced and re-assigned per turn.

**Files:** `src/stores/gameStore.ts:181-182`

**Cause:** `stimulusHistory.slice(-maxHistory)` creates a new array every turn once history exceeds the cap. For most sessions this is fine, but over long periods (100+ turns after hitting cap) this is inefficient.

**Impact:** Negligible on modern devices. Noticeable on low-end Android devices or with concurrent heavy processes.

**Improvement path:**
- Implement a circular buffer: fixed-size array with a pointer (no allocations after initialization)
- Trade off: more complex logic, but allocations drop to zero after init

### Stimulus Attributes Checked Sequentially in respondToStimulus()

**Issue:** `respondToStimulus()` uses a chain of `||` operators to check stimulus type match (lines 290-298).

**Files:** `src/stores/gameStore.ts:290-298`

**Impact:** Trivial. Four comparison operations are negligible. No performance concern.

### Audio Context Kept in Memory After Init

**Issue:** `audioStore` holds a live `AudioContext` instance in memory for the entire app lifetime, even if audio is disabled.

**Files:** `src/stores/audioStore.ts:11, 37`

**Impact:** Low. AudioContext is lightweight (~1-2 MB) on most devices. On constrained devices, this could be a minor memory consumer.

**Improvement path:**
- Lazy-initialize AudioContext only when `isAudioEnabled` is true
- Destroy and recreate on toggle (slightly higher latency on toggle, but lower baseline memory)

## Fragile Areas

### Game Timing Precision (High Risk of Fragility)

**Issue:** Game timer relies on `setInterval(..., 1000)` which is not guaranteed to fire exactly every 1000ms. Browser can defer execution if main thread is busy, or OS scheduler delays it.

**Files:** `src/stores/gameStore.ts:256-264`

**Why fragile:** On low-end devices or when other threads/tabs are active, timer drifts. Stimulus appear off-schedule, affecting gameplay feel and score fairness.

**Safe modification:**
- Add a simple drift-correction check: if `timeLeft` drops below 0, clamp to 0 and advance to next stimulus immediately
- Or use a more precise timing library (e.g., `performance.now()` for elapsed time rather than countdown)
- Test on low-end devices before releasing

**Test coverage:** Game timer has unit tests (`gameStore.test.ts` uses `vi.useFakeTimers()`), but no integration tests with real timer behavior

### Audio Playback Timing vs Game Timer (Medium Risk)

**Issue:** Stimulus sound is played when `setNewStimulus()` is called, but the sound may take time to start (AudioContext scheduling). If the sound is long (e.g., 500ms) and timer interval is short (2 sec), sounds may overlap or cut off.

**Files:** `src/stores/gameStore.ts:186`, `src/stores/audioStore.ts:59-72`

**Why fragile:** Overlapping sounds can be disorienting and reduce audio feedback quality.

**Safe modification:**
- Add a sound duration / timing test: verify that stimulus sound is ≤ 300ms
- Or use short clips and test on actual devices
- Test with 2-second timer (most aggressive) and verify audio doesn't overlap

### Component Size and Prop Drilling (Medium Risk)

**Issue:** Several components are 150+ lines, making them fragile to modifications:
- `AchievementToast.vue` — 229 lines
- `TutorialOverlay.vue` — 207 lines
- `GameScreen.vue` — 204 lines
- `GameOverModal.vue` — 185 lines

**Files:** Listed above

**Why fragile:** Large components are harder to test, easier to introduce regressions, and harder to reason about state flow.

**Safe modification:**
- Break down into smaller components (e.g., `AchievementToast` → `AchievementList`, `AchievementCard`)
- Extract shared logic into composables
- This is already in progress (e.g., `GameHint`, `ResponseButtons` are smaller, focused components)

### Stimulus Component Styling Complexity (Low Risk)

**Issue:** `Stimulus.vue` uses complex Tailwind classes and CSS Grid to position elements. Small CSS changes could break layout on small screens or unusual aspect ratios.

**Files:** `src/Stimulus.vue`

**Why fragile:** Responsive design is brittle. Easy to break on new device sizes.

**Safe modification:**
- Test on actual device sizes: iPhone SE (small), iPhone 14 (standard), iPhone 14 Max (large), Android equivalents
- Use Tailwind's responsive breakpoints explicitly rather than relying on max-w-md containers

### GameStore State Interdependencies (Medium Risk)

**Issue:** Multiple state properties have implicit interdependencies:
- `isStopped` and `isPaused` should be mutually exclusive, but no invariant enforces it
- `incorrectResponses >= 3` triggers game over, but `isStopped` is set separately
- `showGameOverModal` is set alongside `isStopped`

**Files:** `src/stores/gameStore.ts` (lines 46-72 state definitions, 218-278 mutation functions)

**Why fragile:** If one developer adds a code path that sets `isStopped = true` but forgets to set `showGameOverModal = true`, the UI will show an inconsistent state (game frozen but no modal).

**Safe modification:**
- Consider a state machine library (e.g., XState) to enforce valid state transitions
- Or add TypeScript discriminated unions: `type GameState = {type: 'paused'} | {type: 'stopped'} | {type: 'running'}`
- For now, document invariants clearly:
  - "isStopped and isPaused are mutually exclusive"
  - "When incorrectResponses >= 3, set isStopped + showGameOverModal together"

**Test coverage:** Integration tests in `stateTransitions.integration.test.ts` already cover major state flows. Additional edge case tests would help.

### Stimulus Determinism Mode Used in Tests but Not Productionized

**Issue:** `isDeterministic` mode is for testing (deterministic stimulus sequence), but it's exposed to users (can be toggled). This is intended for manual testing but not documented.

**Files:** `src/stores/gameStore.ts:50, 213-216`

**Why fragile:** If a developer adds a feature and doesn't realize `isDeterministic` affects stimulus generation, they could introduce bugs that only manifest in random mode.

**Safe modification:**
- Document the mode: "Deterministic mode is for testing. In production, it should never be exposed to users."
- OR move it behind a debug-only flag (only enable if `localStorage.debug === true`)

## Scaling Limits

### No Limit on Simultaneous Active Components

**Issue:** The app spawns several overlays at once (`AchievementToast`, `GameHint`, `PauseModal`, `GameOverModal`, `TutorialOverlay`) without a depth limit. If all are triggered simultaneously, rendering could stutter.

**Files:** `src/App.vue:62-83` (overlay rendering), various component emit patterns

**Current capacity:** 5-6 overlays is fine on modern devices.

**Limit:** Likely 20+ overlays would cause noticeable jank on low-end devices.

**Scaling path:**
- Use a toast/notification queue instead of unbounded overlay spawning
- Prioritize which overlays are shown (e.g., game-over modal takes precedence over achievement toast)

### Audio Context Resource Limits

**Issue:** Each `play()` call creates a new `BufferSource` node and connects it. If called in rapid succession (e.g., many stimulus in 2 sec), nodes accumulate.

**Files:** `src/stores/audioStore.ts:59-72`

**Current capacity:** 1 sound per ~1 second is fine. At 2-second timer intervals with 4 response buttons, each can fire 4 sounds = 4-8 sounds queued. This is safe.

**Limit:** If timer is ≤500ms and all buttons tap, 8-16 sounds could queue. At extremely low intervals (≤100ms) and spamming, hundreds of sources could accumulate and cause audio glitches.

**Scaling path:**
- Add a simple node cleanup: after `source.start(0)`, set a timer to disconnect the node after the sound duration (~1 second)
- Or use a fixed audio node pool and reuse nodes

### Event Listener Cleanup in useGameLifecycle

**Issue:** `useGameLifecycle` registers an app state change listener but stores the handle in a local variable, not in a cleanup guard.

**Files:** `src/composables/useGameLifecycle.ts:19, 66-68`

**Current capacity:** Single app lifecycle listener is fine. If the composable is instantiated multiple times (should be once), multiple listeners would accumulate.

**Limit:** Expected usage is one `useGameLifecycle` per app. If accidentally used in multiple places, listeners multiply.

**Scaling path:**
- Document that `useGameLifecycle` should only be instantiated once per app (already true in this design, via `App.vue`)
- Or add a guard: `if (appStateListener) return;` to prevent double-registration

## Dependencies at Risk

### No Direct Dependencies at Risk

**Status:** PASS

**Dependencies checked:**
- `vue@^3.5.29` — Latest major version, well-maintained
- `pinia@^3.0.4` — Latest version, stable
- `@capacitor/*@^8.1.0` — Latest Capacitor v8, actively maintained
- `tailwindcss@^4.2.1` — Recently upgraded (v4), stable
- `vite@^7.3.1` — Latest Vite, stable
- `typescript@^5.9.3` — Latest TypeScript, stable

**Deprecation risk:** None in the next 12 months.

**Migration risk:** None immediate. Main risk is during future Capacitor 9 upgrade (when released).

## Missing Critical Features

### No Payment System Scaffolding in Milestone 1

**Issue:** Monetization (IAP, RevenueCat) is deferred to Milestone 2. No placeholder or architecture in Milestone 1.

**Impact:** Medium. Milestone 2 will need to integrate RevenueCat alongside existing game logic, which could be fragile if the architecture isn't designed to accommodate it.

**Blocking:** Not blocking M1. M2 planning should account for this upfront.

**Fix approach:** In M2 planning, design IAP integration as a separate store/layer that can be plugged in without affecting game logic.

### No Statistics/Analytics Collection

**Issue:** Game-over modal shows score/accuracy, but no session history is collected. In Milestone 2, users will expect progress tracking and charts.

**Files:** Currently, only `highScoreData` is persisted (best single game).

**Impact:** Medium. Session history data structure will need to be added to persistence layer in M2, which could require schema migration.

**Fix approach:**
- In M1, add a placeholder for session history (empty array, tests only)
- In M2, implement session logging and retrieval

## Test Coverage Gaps

### No Component Integration Tests

**Issue:** Unit tests exist for stores (`gameStore.test.ts`, `audioStore.test.ts`, `persistenceStore.test.ts`), but Vue components are not tested in isolation or with mocked stores.

**Files:** `src/components/`, `src/*.vue` (no corresponding `.test.ts` files)

**What's not tested:**
- Button click handlers and emit chains
- Responsive layout (no visual regression tests)
- Accessibility (no a11y tests)

**Risk:** Medium. A refactoring could break component behavior without warning.

**Priority:** Medium-high for M1 hardening. Low for M2 (feature velocity matters more).

### No E2E Tests Beyond Smoke Test

**Issue:** `e2e/app-smoke.spec.ts` exists but likely only checks app loads. No full game flow testing.

**Files:** `e2e/app-smoke.spec.ts` (1 file)

**What's not tested:**
- Full game flow: start → respond → game over → play again
- State transitions (pause/resume/quit)
- Audio/haptics toggle
- High score persistence across app restart

**Risk:** High for regression. A store bug could break the entire game flow and not be caught.

**Priority:** High for M1. Should test at least one full game session per mode.

### Audio Behavior Not Tested on Real Devices

**Issue:** Audio tests are all mocked (`audioStore.test.ts` mocks AudioContext). No testing on real iOS/Android devices to verify:
- Sound latency
- iOS audio unlock timing
- Android audio on/off with device mute switch

**Files:** `src/stores/__tests__/audioStore.test.ts`

**Risk:** High. Audio behaves differently on real devices due to OS scheduler, hardware, and Capacitor bridging.

**Priority:** High for M1. Critical before app store submission in M2.

**Recommendation:**
- Manual test on at least one iOS device (iPhone 12/13+) and one Android device (Pixel or Samsung 2023+)
- Create a checklist:
  - [ ] Stimulus sound plays immediately
  - [ ] Correct/incorrect feedback sounds are distinct
  - [ ] Muting device silences game audio (iOS behavior)
  - [ ] Audio toggle works and persists

### No Memory Leak Testing

**Issue:** No tests for cleanup of timers, event listeners, or component memory retention.

**Files:** `src/stores/gameStore.ts` (setInterval cleanup), `src/composables/useGameLifecycle.ts` (app state listener cleanup)

**Risk:** Medium. Long-term usage (hours of play) could reveal leaks.

**Priority:** Low for M1. Medium for M2 if analytics show long session times.

---

*Concerns audit: 2026-04-25*
