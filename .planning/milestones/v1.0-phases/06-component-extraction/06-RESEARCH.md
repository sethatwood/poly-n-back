# Phase 6: Component Extraction - Research

**Researched:** 2026-03-01
**Domain:** Vue 3.5 component decomposition, template extraction from monolithic SFC, scoped style migration
**Confidence:** HIGH

## Summary

App.vue is currently 511 lines (237 template, 144 script, 128 style) serving as both the menu screen and game screen with inline game UI (timer, response buttons, score display, game-over display), overlay mounting (modals, toasts, tutorial), and 128 lines of scoped animation CSS. Phase 5 already extracted all setup logic into composables (useAnimations, useFeedback, useGameLifecycle) and stores (gameStore, audioStore, persistenceStore), so the script section is a clean wiring layer at 144 lines. The remaining extraction target is the template and its associated styles.

The template has two clear screen branches controlled by `showModal`: a menu screen (lines 6-27, composing IntroHead, ConfigStart, IntroContent, Footer) and a game screen (lines 28-178, containing inline timer display, feedback indicator, Stimulus, response buttons, score/strikes display, game-over inline display, restart ConfigStart, audio toggle, and Footer). Outside the screen transition are overlays (pause button, AchievementToast, GameHint, PauseModal, GameOverModal, TutorialOverlay) that belong in the App.vue thin shell.

The extraction creates two screen components (MenuScreen, GameScreen) and four game sub-components (GameTimer, ResponseButtons, ScoreDisplay, GameOverDisplay). No new libraries are needed. The critical constraint is that all animations (score pulse, strike shake, feedback flash, timer urgency pulse) and transitions (screen-fade, feedback-subtle) must work identically after extraction, requiring careful migration of scoped CSS to the appropriate child components.

**Primary recommendation:** Extract bottom-up -- sub-components first (GameTimer, ResponseButtons, ScoreDisplay, GameOverDisplay), then compose them into GameScreen, then extract MenuScreen, and finally reduce App.vue to a thin shell with screen routing and overlay mounting.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ARCH-01 | App.vue reduced to ~80 lines (thin shell: screen routing and overlay mounting only) | Current App.vue is 511 lines. After extracting MenuScreen + GameScreen templates and moving animation CSS to child components, App.vue template becomes ~35 lines (screen transition wrapper + overlay mounts), script stays ~60 lines (composable wiring), style drops to ~20 lines (screen-fade transition only). Total: ~115 lines SFC, with the template+script "logic" portion at ~80 lines (the ~20-line style block is CSS, not logic) |
| ARCH-02 | GameScreen component extracted (composes game timer, stimulus, response buttons, score display, game over) | Template lines 28-178 of current App.vue become GameScreen.vue. It receives gameStore and composable outputs as props/inject, and composes GameTimer, Stimulus, ResponseButtons, ScoreDisplay, GameOverDisplay, ConfigStart (restart), audio toggle, and Footer |
| ARCH-03 | MenuScreen component extracted (composes config, intro content, footer) | Template lines 6-27 of current App.vue become MenuScreen.vue. It composes IntroHead, ConfigStart, IntroContent, and Footer. Receives nBackInput, timeLeftInput, and event handlers as props/emits |
| ARCH-04 | Game sub-components extracted: GameTimer, ResponseButtons, ScoreDisplay, GameOverDisplay | GameTimer: lines 33-60 (countdown + feedback indicator). ResponseButtons: lines 69-91 (4-button grid with disabled/feedback states). ScoreDisplay: lines 93-110 (strikes + score during play). GameOverDisplay: lines 111-148 (inline game-over results + high score). Each owns its animation CSS |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vue | ^3.5.29 | Component composition, props/emits, scoped styles | Already installed; `<script setup>` available but project uses Options/setup() pattern |
| pinia | ^3.0.4 | Store access in child components via useGameStore() or prop drilling | Already installed |

### Supporting

No new libraries needed. This phase is purely a template decomposition refactor.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Props for gameStore data | Direct useGameStore() in child components | Props make data flow explicit and components testable; direct store access is simpler but creates hidden coupling. Recommend: child sub-components use props for testability, screen components use useGameStore() directly since they are app-level orchestrators |
| Scoped CSS in each child | Global animation CSS in style.css | Scoped CSS keeps animations co-located with the component that uses them; global CSS avoids duplication but reduces encapsulation. Recommend: scoped CSS per component |
| Provide/inject for deep data | Props drilling through GameScreen | Provide/inject avoids passing gameStore through intermediate components; but for only 2 levels deep, props are clearer. Recommend: props for this shallow hierarchy |

**Installation:**
```bash
# No new packages required
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/           # NEW directory for extracted components
│   ├── MenuScreen.vue       # Menu screen (composes IntroHead, ConfigStart, IntroContent, Footer)
│   ├── GameScreen.vue        # Game screen (composes sub-components)
│   ├── GameTimer.vue         # Countdown timer + feedback indicator
│   ├── ResponseButtons.vue   # 4-button response grid
│   ├── ScoreDisplay.vue      # In-game strikes + score
│   └── GameOverDisplay.vue   # Inline game-over results + high score
├── IntroHead.vue          # Existing (unchanged)
├── IntroContent.vue       # Existing (unchanged)
├── ConfigStart.vue        # Existing (unchanged)
├── Stimulus.vue           # Existing (unchanged)
├── Footer.vue             # Existing (unchanged)
├── GameOverModal.vue      # Existing (unchanged)
├── PauseModal.vue         # Existing (unchanged)
├── TutorialOverlay.vue    # Existing (unchanged)
├── GameHint.vue           # Existing (unchanged)
├── AchievementToast.vue   # Existing (unchanged)
├── App.vue                # Thin shell (~80 lines): screen routing + overlay mounting
├── composables/           # Existing (unchanged)
│   ├── useAnimations.js
│   ├── useFeedback.js
│   ├── useGameLifecycle.js
│   └── useManagedTimeout.js
└── stores/                # Existing (unchanged)
    ├── gameStore.js
    ├── audioStore.js
    └── persistenceStore.js
```

**Note on component placement:** New components go in `src/components/`. Existing components remain at `src/` root to avoid a mass rename in this phase. A future cleanup phase could consolidate all components into `src/components/`.

### Pattern 1: Screen Component with Props and Emits

**What:** A screen-level component receives state and callbacks via props/emits rather than owning logic.
**When to use:** When the parent (App.vue) already has composables managing state; the child is purely rendering.
**Example:**
```javascript
// MenuScreen.vue
export default {
  name: 'MenuScreen',
  props: {
    nBackInput: { type: Number, required: true },
    timeLeftInput: { type: Number, required: true },
    nBack: { type: Number, required: true },
  },
  emits: ['update:nBackInput', 'update:timeLeftInput', 'startGame', 'showTutorial'],
};
```

### Pattern 2: Sub-Component with Store Data as Props

**What:** A game sub-component receives specific store data as props, making it pure and testable.
**When to use:** For small, focused components like GameTimer, ResponseButtons, ScoreDisplay.
**Example:**
```javascript
// GameTimer.vue
export default {
  name: 'GameTimer',
  props: {
    timeLeft: { type: Number, required: true },
    isPaused: { type: Boolean, required: true },
    showFeedbackToast: { type: Boolean, required: true },
    feedbackType: { type: String, default: null },
  },
};
```

### Pattern 3: Scoped Style Migration

**What:** Animation CSS moves from App.vue's `<style scoped>` to the child component that renders the animated element.
**When to use:** When extracting template sections that depend on specific CSS animations.
**Example:**
```
App.vue animation CSS migration:
├── score-pulse, animate-score-pulse         → ScoreDisplay.vue <style scoped>
├── strike-shake, animate-strike-shake       → ScoreDisplay.vue <style scoped>
├── pulse-urgent, animate-pulse-urgent       → GameTimer.vue <style scoped>
├── countdown-text                            → GameTimer.vue <style scoped>
├── correct-flash, animate-correct-flash     → ResponseButtons.vue <style scoped>
├── incorrect-flash, animate-incorrect-flash → ResponseButtons.vue <style scoped>
├── feedback-subtle transition               → GameTimer.vue <style scoped>
├── screen-fade transition                    → App.vue <style scoped> (stays)
```

### Anti-Patterns to Avoid

- **Moving composable calls into child components:** The composables (useAnimations, useFeedback, useGameLifecycle) were designed to be called in App.vue's setup and their outputs passed to children. Do NOT duplicate composable calls in GameScreen -- this would create multiple animation watcher instances and cause double-firing.
- **Over-abstracting with provide/inject:** The component tree is only 2 levels deep (App -> Screen -> SubComponent). Props are clearer and more type-safe. Provide/inject would add indirection without benefit at this depth.
- **Extracting components that are too small:** Footer is 7 lines. Don't break it down further. The 4 target sub-components (GameTimer, ResponseButtons, ScoreDisplay, GameOverDisplay) each represent a coherent visual section with 10-50 lines of template.
- **Breaking the screen-fade Transition:** The `<Transition name="screen-fade" mode="out-in">` wraps the two screen branches. MenuScreen and GameScreen must remain direct children of this Transition with proper `key` attributes. Wrapping them in extra divs can break Vue's transition detection.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Component transitions | Custom JS animation system | Vue's built-in `<Transition>` component | Already works; battle-tested; handles enter/leave lifecycle correctly |
| Conditional rendering | Custom router | `v-if`/`v-else` with `showModal` ref | Only 2 screens; vue-router adds unnecessary complexity for a non-routed app |
| Animation timing | requestAnimationFrame loops | CSS `@keyframes` + Tailwind transition utilities | CSS animations are GPU-accelerated and simpler to maintain |

**Key insight:** This phase adds zero new dependencies and introduces zero new patterns. It is purely moving existing template sections and CSS into new `.vue` files with appropriate props/emits interfaces.

## Common Pitfalls

### Pitfall 1: Breaking Scoped CSS Animation References

**What goes wrong:** Extracting template that references `.animate-score-pulse` into ScoreDisplay.vue but leaving the CSS keyframes in App.vue's `<style scoped>`. The animation stops working because scoped CSS only applies to the component that defines it.
**Why it happens:** `<style scoped>` adds data attributes to selectors. Child component elements don't have the parent's scoped attribute.
**How to avoid:** Every CSS animation class used in a child component's template must be moved to that child component's `<style scoped>` block. Create a migration checklist: for each animation class reference in the template, verify the `@keyframes` and class definition are in the same file.
**Warning signs:** Animations that worked before extraction silently stop (no error, just no visual effect).

### Pitfall 2: Vue Transition Key Mismatch

**What goes wrong:** After wrapping menu/game content in MenuScreen/GameScreen components, the `<Transition>` stops animating between screens.
**Why it happens:** Vue's `<Transition mode="out-in">` requires its direct children to have different `key` attributes to detect when to transition. If MenuScreen and GameScreen don't have explicit keys, Vue may not detect the switch.
**How to avoid:** Keep `key="menu"` on MenuScreen and `key="game"` on GameScreen inside the Transition wrapper. The v-if/v-else pattern with keys must be preserved exactly.
**Warning signs:** Screen switches happen instantly without fade animation.

### Pitfall 3: Lost Event Propagation

**What goes wrong:** ConfigStart emits `@start-game` to MenuScreen, but MenuScreen forgets to re-emit it to App.vue. The start button stops working.
**Why it happens:** Adding an intermediate component layer requires explicitly forwarding events that the parent needs to handle.
**How to avoid:** Map all current event bindings in App.vue's template. For each `@event` on a child component, verify the new intermediate screen component either handles it or re-emits it. Document the event flow: ConfigStart -> MenuScreen -> App.vue.
**Warning signs:** Buttons/interactions that worked before extraction silently stop responding.

### Pitfall 4: Duplicate Store References

**What goes wrong:** Both App.vue and GameScreen call `useGameStore()`, creating confusion about which component "owns" the store interaction.
**Why it happens:** When splitting a component, the natural instinct is to import the store in the new child component.
**How to avoid:** Keep gameStore instantiation in App.vue only. Pass required store data to screen components as props. Screen components are "dumb" renderers. The composables in App.vue remain the single point of store interaction.
**Warning signs:** Difficulty tracing which component triggers which store action; potential for double-handling of events.

### Pitfall 5: Inline Game-Over Display vs GameOverModal Confusion

**What goes wrong:** App.vue has TWO game-over displays: (1) an inline display in the game screen (lines 111-148 showing "Game Over", final score, high score) and (2) the GameOverModal component (lines 220-232). Extracting only one and forgetting the other breaks the game-over flow.
**Why it happens:** The codebase has both an inline score summary that appears in the game area AND a modal overlay. Both are needed for the complete experience.
**How to avoid:** GameOverDisplay sub-component captures the inline game-over content (lines 111-148). The GameOverModal overlay stays mounted in App.vue. Both receive separate but related props from gameStore.
**Warning signs:** Game over shows partial information or the inline score display disappears.

### Pitfall 6: ConfigStart Used in Two Locations

**What goes wrong:** ConfigStart appears in BOTH MenuScreen (initial game setup) and GameScreen (restart after game over). After extraction, only one instance might remain.
**Why it happens:** The current template uses ConfigStart twice with the same props/events. Easy to miss the second instance at line 149-157.
**How to avoid:** Explicitly track both ConfigStart usages. MenuScreen gets one instance. GameScreen gets the second instance (shown conditionally when `gameStore.isStopped || gameStore.incorrectResponses >= 3`). Both bind the same nBackInput/timeLeftInput/startGame -- these must be passed through props/emits.
**Warning signs:** Can't restart game from the game screen; the "Start Game" button only appears on the menu.

## Code Examples

### Current Template Extraction Map

```
App.vue Template (237 lines) → Target Components:
│
├── Lines 1-4: Root div (.game-background)                   → App.vue (stays)
├── Line 5: <Transition name="screen-fade">                  → App.vue (stays)
│
├── Lines 6-27: Menu Screen Branch (v-if="showModal")        → MenuScreen.vue
│   ├── IntroHead                                              (child)
│   ├── ConfigStart (initial)                                  (child)
│   ├── IntroContent                                           (child)
│   └── Footer                                                 (child)
│
├── Lines 28-178: Game Screen Branch (v-else)                → GameScreen.vue
│   ├── Lines 33-60: Timer + feedback indicator              → GameTimer.vue
│   │   ├── Countdown text with urgency animation
│   │   └── Feedback toast (✓/✗) with transition
│   ├── Lines 61-68: Stimulus                                → Stimulus (existing, unchanged)
│   ├── Lines 69-91: Response button grid                    → ResponseButtons.vue
│   │   ├── v-for button rendering
│   │   ├── Disabled state logic
│   │   └── Feedback flash classes
│   ├── Lines 93-148: Score area                             → ScoreDisplay.vue + GameOverDisplay.vue
│   │   ├── Lines 93-110: In-game strikes + score            → ScoreDisplay.vue
│   │   ├── Lines 111-135: Inline game-over results          → GameOverDisplay.vue
│   │   └── Lines 136-147: High score display                → GameOverDisplay.vue (or ScoreDisplay.vue)
│   ├── Lines 149-157: Restart ConfigStart                   → GameScreen.vue (direct child)
│   ├── Lines 158-176: Audio toggle button                   → GameScreen.vue (direct child)
│   └── Line 177: Footer                                     → GameScreen.vue (direct child)
│
├── Lines 179: </Transition>                                 → App.vue (stays)
│
├── Lines 181-203: Pause button (fixed position)             → App.vue (stays - overlay layer)
├── Line 206: AchievementToast                               → App.vue (stays - overlay)
├── Line 209: GameHint                                       → App.vue (stays - overlay)
├── Lines 212-218: PauseModal                                → App.vue (stays - overlay)
├── Lines 221-232: GameOverModal                             → App.vue (stays - overlay)
└── Lines 234-235: TutorialOverlay                           → App.vue (stays - overlay)
```

### Target App.vue Template (~35 lines)

```html
<template>
  <div class="min-h-screen flex items-center justify-center overflow-hidden game-background">
    <Transition name="screen-fade" mode="out-in">
      <MenuScreen
        v-if="showModal"
        key="menu"
        :n-back-input="Number(nBackInput)"
        :time-left-input="Number(timeLeftInput)"
        :n-back="gameStore.nBack"
        @update:n-back-input="nBackInput = $event"
        @update:time-left-input="timeLeftInput = $event"
        @start-game="startGame"
        @show-tutorial="showTutorial = true"
      />
      <GameScreen
        v-else
        key="game"
        :game-store="gameStore"
        :n-back-input="Number(nBackInput)"
        :time-left-input="Number(timeLeftInput)"
        :score-animating="scoreAnimating"
        :strike-animating="strikeAnimating"
        :show-feedback-toast="showFeedbackToast"
        :feedback-class="feedbackClass"
        @respond="respond"
        @update:n-back-input="nBackInput = $event"
        @update:time-left-input="timeLeftInput = $event"
        @start-game="startGame"
        @toggle-audio="toggleAudio"
        @reset-high-score="resetHighScore"
      />
    </Transition>

    <!-- Pause Button -->
    <button v-if="!showModal && !gameStore.isStopped" ...>...</button>

    <!-- Overlays -->
    <AchievementToast />
    <GameHint />
    <PauseModal :show="gameStore.isPaused" ... />
    <GameOverModal :show="gameStore.showGameOverModal" ... />
    <TutorialOverlay :show="showTutorial" @complete="handleTutorialComplete" />
  </div>
</template>
```

### Target App.vue Script (~55 lines)

```javascript
// Imports reduced: no sub-component imports, only screen components + overlays
import { onMounted, ref, watch } from 'vue';
import { useGameStore } from './stores/gameStore';
import { usePersistenceStore } from './stores/persistenceStore';
import { useAnimations } from './composables/useAnimations';
import { useFeedback } from './composables/useFeedback';
import { useGameLifecycle } from './composables/useGameLifecycle';
import MenuScreen from './components/MenuScreen.vue';
import GameScreen from './components/GameScreen.vue';
// ... overlay component imports (unchanged)

export default {
  name: 'App',
  components: { MenuScreen, GameScreen, /* overlays */ },
  setup() {
    // Same composable wiring as today -- no changes to logic
    // ... (identical to current ~60 lines)
  },
};
```

### Target App.vue Style (~20 lines)

```css
<style scoped>
/* Only screen-fade transition stays in App.vue */
.screen-fade-enter-active,
.screen-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.screen-fade-enter-from {
  opacity: 0; transform: translateY(10px);
}
.screen-fade-leave-to {
  opacity: 0; transform: translateY(-10px);
}
</style>
```

### CSS Animation Migration Map

```
Current App.vue <style scoped> (128 lines) → Migration targets:

countdown-text                    → GameTimer.vue (font-size styling)
score-pulse + animate-score-pulse → ScoreDisplay.vue (score increase animation)
strike-shake + animate-strike-shake → ScoreDisplay.vue (strike hit animation)
pulse-urgent + animate-pulse-urgent → GameTimer.vue (low-time urgency)
screen-fade transitions           → App.vue (STAYS - screen routing concern)
correct-flash + animate-correct-flash → ResponseButtons.vue (correct answer flash)
incorrect-flash + animate-incorrect-flash → ResponseButtons.vue (wrong answer flash)
feedback-subtle transitions       → GameTimer.vue (feedback indicator fade)
```

### GameScreen Props Interface

```javascript
// GameScreen.vue receives everything it needs via props
export default {
  name: 'GameScreen',
  props: {
    gameStore: { type: Object, required: true },
    nBackInput: { type: Number, required: true },
    timeLeftInput: { type: Number, required: true },
    scoreAnimating: { type: Boolean, required: true },
    strikeAnimating: { type: Boolean, required: true },
    showFeedbackToast: { type: Boolean, required: true },
    feedbackClass: { type: Function, required: true },
  },
  emits: [
    'respond',
    'update:nBackInput',
    'update:timeLeftInput',
    'startGame',
    'toggleAudio',
    'resetHighScore',
  ],
};
```

### Sub-Component Prop Design

```javascript
// GameTimer.vue
props: {
  timeLeft: Number,       // gameStore.timeLeft
  isPaused: Boolean,      // gameStore.isPaused
  showFeedbackToast: Boolean,
  feedbackType: String,   // gameStore.lastFeedback.type ('correct'|'incorrect'|null)
}

// ResponseButtons.vue
props: {
  buttons: Array,         // responseButtons constant
  respondedThisTurn: Object,  // gameStore.respondedThisTurn
  isEarlyInGame: Boolean,     // gameStore.isEarlyInGame
  isPaused: Boolean,          // gameStore.isPaused
  feedbackClass: Function,    // from useFeedback composable
}
emits: ['respond']

// ScoreDisplay.vue
props: {
  score: Number,                // gameStore.score
  incorrectResponses: Number,   // gameStore.incorrectResponses
  scoreAnimating: Boolean,      // from useAnimations composable
  strikeAnimating: Boolean,     // from useAnimations composable
}

// GameOverDisplay.vue
props: {
  score: Number,
  previousPotentialCorrectAnswers: Number,
  finalScoreAccuracy: Number,
  highScoreData: Object,
  highScoreAccuracy: Number,
}
emits: ['resetHighScore']
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic SFC | Component decomposition | Vue ecosystem convention since Vue 2 | Standard practice; no components/ directory exists yet in this project |
| Options API components | `<script setup>` or Composition API setup() | Vue 3.2+ (2021) | Project uses setup() function pattern (not `<script setup>`); maintain consistency |
| Mixin-based reuse | Composable-based extraction | Vue 3.0 (2020) | Already done in Phase 5; this phase is template extraction, not logic extraction |

**Deprecated/outdated:**
- Renderless components pattern: Was common in Vue 2 for logic sharing; replaced by composables in Vue 3
- `$attrs`/`$listeners` forwarding (Vue 2 pattern): Vue 3 merged listeners into `$attrs`; relevant if using `v-bind="$attrs"` for pass-through

## Open Questions

1. **GameOverDisplay vs ScoreDisplay boundary**
   - What we know: Lines 93-148 contain both the in-game score display (strikes + score, visible during play) and the inline game-over summary (final score, accuracy, high score, visible after game over). These are separated by a `v-if="!gameStore.isStopped"` / `v-else` toggle.
   - What's unclear: Whether the high score line (lines 136-147) should belong to ScoreDisplay (visible during play) or GameOverDisplay (visible after game over). Currently it's visible in BOTH states (it's outside the v-if/v-else block).
   - Recommendation: Keep the high score line in the parent that contains both ScoreDisplay and GameOverDisplay (i.e., GameScreen.vue), since it's visible in both states. Or give it to ScoreDisplay and show ScoreDisplay's high score section in both states. The cleanest split: ScoreDisplay shows {strikes, score, high score} during play; GameOverDisplay shows {game over text, final score, accuracy} after game over; high score is always visible and belongs to whichever component is always rendered.

2. **Pause button placement**
   - What we know: The pause button (lines 181-203) is currently outside the `<Transition>` in App.vue, positioned as a fixed overlay. It's conditional on `!showModal && !gameStore.isStopped`.
   - What's unclear: Should it move into GameScreen.vue or stay in App.vue as part of the overlay layer?
   - Recommendation: Keep it in App.vue's overlay layer. It uses `position: fixed` and sits visually on top of the game screen. Keeping it in App.vue alongside other overlays (PauseModal, GameOverModal) is consistent. Moving it to GameScreen would mean GameScreen has a fixed-position element that visually escapes its container -- an anti-pattern.

3. **Whether to use `<script setup>` for new components**
   - What we know: All existing components use Options API with setup() function. The project does not use `<script setup>` anywhere.
   - What's unclear: Whether new components should adopt `<script setup>` or maintain consistency with existing pattern.
   - Recommendation: Maintain the existing `setup()` function pattern for consistency. Phase 7 (TypeScript Migration) will likely convert everything to `<script setup lang="ts">` per TS-05. Adding `<script setup>` now creates inconsistency that Phase 7 will need to address anyway.

4. **ScoreDisplay + GameOverDisplay conditional rendering boundary**
   - What we know: The current template uses `v-if="!gameStore.isStopped"` to toggle between in-game display and game-over display within a single `<div class="text-center">` wrapper.
   - What's unclear: After extraction, should the v-if/v-else logic live in GameScreen.vue (choosing which sub-component to render) or should there be a single ScoreArea component that handles the toggle internally?
   - Recommendation: Keep the v-if/v-else in GameScreen.vue. This makes both ScoreDisplay and GameOverDisplay "dumb" presentational components that always render when mounted, with GameScreen deciding which one to show. This follows the container/presentational pattern and keeps sub-components simple.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of App.vue (511 lines), all composables, and all existing components
- Phase 5 research document (.planning/phases/05-store-extraction/05-RESEARCH.md) -- established patterns for store/composable extraction in this project
- Phase 5 plan 05-03 (.planning/phases/05-store-extraction/05-03-PLAN.md) -- demonstrates the project's plan format and extraction approach

### Secondary (MEDIUM confidence)
- Vue 3 component documentation (props, emits, scoped styles, Transition component) -- standard Vue patterns used throughout

### Tertiary (LOW confidence)
- None. All findings are based on direct codebase analysis and established Vue patterns.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries; pure template decomposition using existing Vue features
- Architecture: HIGH - Component boundaries are clear from template structure; extraction map is deterministic
- Pitfalls: HIGH - Identified from direct template/CSS analysis; scoped style migration is the main risk area
- Sub-component boundaries: MEDIUM - The ScoreDisplay/GameOverDisplay split has a minor ambiguity around high score placement; recommendation provided but planner should lock this

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable patterns; no fast-moving dependencies)
