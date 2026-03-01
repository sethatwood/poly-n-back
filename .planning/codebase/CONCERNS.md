# Codebase Concerns

**Analysis Date:** 2026-02-28

## Fragile Areas

**App.vue Component:**
- Files: `src/App.vue` (488 lines)
- Why fragile: Single monolithic component handling UI layout, state management coordination, animation lifecycle, and modal control. Contains multiple watchers managing animation timeouts with unmanaged state (`feedbackTimeout`, `scoreAnimating`, `strikeAnimating`). Mixes template binding logic with complex conditional rendering across 370+ lines of template.
- Safe modification: Extract modal components into separate container. Consider breaking into smaller components for config UI and game display. Ensure all timeouts are cleared in onUnmounted (currently only feedbackVisible timeout is handled).
- Test coverage: No unit tests present for component logic (animation triggers, modal state transitions, feedback handling).

**gameStore.js - Game Logic:**
- Files: `src/store/gameStore.js` (311 lines)
- Why fragile: Core game mechanics tightly coupled in a single Pinia store with 300+ lines of game state and logic. Timer lifecycle management uses setInterval without explicit cleanup in some edge cases (though timer is cleared in stopGame). Critical accuracy calculation in line 269-270 uses `previousPotentialCorrectAnswers` which could be zero, causing division and inaccurate percentages. The `respondToStimulus` method (lines 241-294) contains nested conditional logic determining correct answers without explicit validation that stimulus history is populated.
- Safe modification: Add input validation for stimulus history length before respondToStimulus. Add guards for division by zero in accuracy calculations. Extract game rules logic into separate module. Document state machine transitions clearly.
- Test coverage: No unit tests for game logic, score calculation, high score logic, or stimulus generation.

**Audio Manager (gameStore.js lines 7-60):**
- Files: `src/store/gameStore.js` (audioManager object)
- Why fragile: Custom audio context manager initializes globally but doesn't handle errors gracefully if AudioContext is unavailable (older browsers, certain iOS versions). The loadSound method (line 24-32) silently fails with console.warn but continues execution. Multiple calls to play() create new buffer sources without volume control or gain management, potentially causing audio conflicts. No cleanup of audio context on app unmount.
- Safe modification: Add feature detection and fallback for AudioContext unavailability. Implement error boundaries. Add volume normalization. Consider implementing cleanup in store unmount lifecycle.
- Test coverage: No tests for audio playback, context state transitions, or error scenarios.

## Memory Leaks

**Timer Management:**
- Files: `src/store/gameStore.js` (line 221: setInterval), `src/App.vue` (lines 225, 233, 289), `src/AchievementToast.vue` (line 114), `src/GameHint.vue` (line 66)
- Issue: Multiple setTimeout calls for animation and UI updates lack comprehensive cleanup. While some components have onUnmounted hooks clearing timeouts (AchievementToast, GameHint), the App.vue feedbackTimeout can be overwritten without clearing previous instance (line 289).
- Impact: Accumulating timeouts if user rapidly triggers feedback or animations could cause memory buildup over extended gameplay sessions.
- Fix approach: Create utility function for managed timeouts that auto-cleanup. Ensure all setTimeout/setInterval calls store refs and clear in onUnmounted. Consider using Vue lifecycle to auto-cleanup.

**Stimulus History Growth:**
- Files: `src/store/gameStore.js` (line 162: stimulusHistory.push)
- Issue: `stimulusHistory` array grows unbounded throughout gameplay without size limit.
- Impact: Extended gameplay sessions (>1000 stimuli) could accumulate significant memory. No cleanup between games (happens in resetGameState but players can accumulate very long history in single game).
- Fix approach: Implement circular buffer or cap history to N+100 entries minimum needed for game logic.

## localStorage Data Integrity

**Unvalidated localStorage Reads:**
- Files: `src/store/gameStore.js` (lines 78, 82), `src/App.vue` (line 213), `src/AchievementToast.vue` (line 90)
- Issue: Multiple components parse localStorage directly without validation. While AchievementToast has try-catch (line 89-92), gameStore uses raw JSON.parse() without error handling (lines 78, 82). High score data structure could be corrupted or missing `nBack` field.
- Impact: Corrupted localStorage could crash app on startup or produce invalid game state. Line 213 in App.vue checks `!localStorage.getItem()` but line 78 assumes valid JSON structure.
- Fix approach: Create localStorage utility with validation and default fallbacks. Validate highScoreData has all required fields before use.

**Potential Accuracy Division by Zero:**
- Files: `src/store/gameStore.js` (lines 269-270, 303, 308)
- Issue: Accuracy calculations divide by `previousPotentialCorrectAnswers` which could be zero if player responds before N-Back history builds (though guarded by isEarlyInGame check). The getter at line 303 doesn't validate denominator.
- Impact: Could produce `Infinity` or `NaN` in accuracy calculations if state is corrupted or edge case occurs.
- Fix approach: Add explicit zero-check guard: `return potentialCorrectAnswers === 0 ? 0 : Math.round(...)`

## Type Safety Issues

**Implicit Type Coercion:**
- Files: `src/App.vue` (lines 8-9, 107-109, 159), `src/ConfigStart.vue` (lines 61-73)
- Issue: `nBackInput` and `timeLeftInput` are refs without explicit types. Number() conversions are scattered across template and methods. ConfigStart uses parseInt() for validation but stores as v-model strings initially.
- Impact: Potential string/number confusion if type coercion fails silently.
- Fix approach: Define explicit types for input refs: `const nBackInput = ref(2)` with proper typing in setup(). Use consistent parsing (either Number() or parseInt() but not both).

**Missing Type Annotations:**
- Files: All `.vue` files use script setup without TypeScript
- Issue: No prop validation or type checking. Component setup functions use untyped references.
- Impact: Silent failures if props passed with wrong types. IDE cannot provide autocomplete or detect errors.
- Fix approach: Migrate to `<script setup lang="ts">` or add PropTypes validation. Annotate component props explicitly.

## Known Edge Cases

**Response Validation During Early Game:**
- Files: `src/store/gameStore.js` (line 241-252)
- Issue: `respondToStimulus()` checks `nBackIndex >= 0` but continues processing even if stimulus history might not contain expected stimulus. Logic at line 245 accesses `stimulusHistory[nBackIndex]` without explicit bounds validation.
- Impact: If stimulus history is shorter than nBack value, could access wrong index or undefined.
- Fix approach: Add explicit guard: if nBackIndex < 0 || nBackIndex >= stimulusHistory.length, return early.

**Button Response Tracking Race Condition:**
- Files: `src/App.vue` (line 57), `src/store/gameStore.js` (lines 254-258, 293)
- Issue: `respondedThisTurn` is reset at start of each stimulus (line 126-130), but rapid clicks could trigger responses before stimulus change completes. The UI disables buttons based on `respondedThisTurn[button.type]` (line 57) but there's no debouncing on the respond handler.
- Impact: Theoretical possibility of multiple responses being recorded for single stimulus if timing is precise.
- Fix approach: Add response debounce/throttle in respond() method or prevent multiple calls via button disable logic.

## Performance Concerns

**Stimulus Generation Algorithm:**
- Files: `src/store/gameStore.js` (lines 108-120)
- Issue: Random stimulus generation calls Math.random() 4 times per stimulus (color, emoji, position, shape) without seeding. Deterministic mode exists but only used for testing.
- Impact: Predictable pattern recognition less challenging than truly random. No RNG seeding means same sequence across browsers/sessions.
- Fix approach: Consider better random stimulus distribution or more varied attribute combinations.

**Watcher Chain in AchievementToast:**
- Files: `src/AchievementToast.vue` (lines 123-177)
- Issue: Multiple overlapping watches on gameStore properties. Watch at line 163 and 96 both respond to `incorrectResponses` changes. Streak tracking uses local variable outside reactive system.
- Impact: Potential redundant computations on each game state change. `currentStreak` as non-reactive variable could become inconsistent.
- Fix approach: Consolidate watchers. Make streak tracking reactive ref if needed.

## Missing Error Handling

**Audio Loading Failures:**
- Files: `src/store/gameStore.js` (lines 24-32)
- Issue: Failed sound loads log warning but app continues silently. If all sounds fail to load, playing sounds fails silently without user feedback.
- Impact: Users won't know audio isn't working. No graceful degradation.
- Fix approach: Add flag to track audio readiness. Disable audio toggle if initialization fails. Show warning to user.

**Network Errors Not Handled:**
- Files: `src/store/gameStore.js` (line 26)
- Issue: Fetch for audio files could fail due to network issues. Only generic catch logs warning.
- Impact: PWA-like offline scenarios not explicitly handled for audio assets.
- Fix approach: Implement retry logic or offline asset bundling strategy.

**localStorage Quota Exceeded:**
- Files: `src/store/gameStore.js` (lines 171, 213, 285), `src/AchievementToast.vue` (line 107), `src/TutorialOverlay.vue` (line 152)
- Issue: Multiple setItem calls don't handle QuotaExceededError.
- Impact: If user clears browser cache frequently or storage quota exhausted, localStorage operations throw unhandled errors.
- Fix approach: Wrap all localStorage writes in try-catch blocks.

## Security Considerations

**Unescaped Dynamic Content:**
- Files: `src/AchievementToast.vue` (line 11), `src/GameHint.vue` (line 8)
- Issue: achievement.icon and currentHint.text are rendered as plain text (safe via Vue), but achievement data comes from hardcoded objects only. No XSS risk currently but pattern is vulnerable if extended.
- Impact: Low risk given static data source.
- Fix approach: Maintain strict data validation for any user-generated or external content.

**localStorage Data Exposure:**
- Files: All components storing game state in localStorage
- Issue: High scores and achievements stored unencrypted in localStorage, visible to any script or browser extension.
- Impact: High score data not sensitive, but could be spoofed locally. No PII risk.
- Fix approach: Consider hashing or signing high score data if submission to server planned.

## Test Coverage Gaps

**No Unit Tests:**
- Game logic: score calculation, accuracy, stimulus matching, high score detection
- Audio manager: initialization, playback, context state
- State management: all Pinia store actions and getters
- Achievement system: unlock conditions, localStorage persistence

**No Integration Tests:**
- Full game flow: start → gameplay → end
- State transitions: menu → game → pause → resume → game over
- Modal interactions and state coordination

**No E2E Tests:**
- User gameplay scenarios with various N-Back levels
- Mobile app (Capacitor) specific behaviors

**Risk:** Regressions in game logic (accuracy calculation, stimulus generation, high score logic) undetected until production.

---

*Concerns audit: 2026-02-28*
