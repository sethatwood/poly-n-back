# Testing Patterns

**Analysis Date:** 2026-02-28

## Test Framework

**Runner:**
- Not configured - no test framework installed
- No vitest, jest, or other test runner in package.json

**Assertion Library:**
- None installed

**Run Commands:**
- No test scripts in package.json
- Testing currently not part of development workflow

## Status

**Current State:**
- Zero tests in codebase
- No test file structure (no `.test.js`, `.spec.js` files in `src/`)
- Node modules contain test files from dependencies only

**Setup Required:**
To add testing, the project would need:
1. Install test framework: `npm install --save-dev vitest` or `npm install --save-dev jest`
2. Install Vue test utilities: `npm install --save-dev @vue/test-utils`
3. Create test configuration file (vitest.config.js or jest.config.js)
4. Add test script to package.json

## Test File Organization

**Recommended Location:**
- Co-located pattern: place tests alongside source files
  - `src/App.vue` → `src/App.test.js` or `src/App.spec.js`
  - `src/store/gameStore.js` → `src/store/gameStore.test.js`
  - `src/Stimulus.vue` → `src/Stimulus.test.js`

**Naming:**
- File extension: `.test.js` (preferred) or `.spec.js`
- Full path structure mirrors src/: `src/components/`, `src/store/`, `src/utils/`

## Test Structure

**Recommended Pattern:**

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Component from './Component.vue'

describe('Component Name', () => {
  let wrapper

  beforeEach(() => {
    // Setup before each test
    wrapper = mount(Component, {
      props: { /* test props */ },
      global: {
        plugins: [/* pinia store, etc */]
      }
    })
  })

  afterEach(() => {
    // Cleanup after each test
    wrapper?.unmount()
  })

  it('should render correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('should perform expected action', () => {
    // Test logic
    expect(result).toBe(expected)
  })
})
```

**Setup Pattern:**
- `beforeEach()` for test isolation, mounting components with fresh state
- `afterEach()` for cleanup (unmounting, clearing timers, resetting mocks)
- Global test utilities injected via `global.plugins` mount option

**Assertion Pattern:**
- `expect()` syntax (Vitest/Jest standard)
- Fluent assertions: `expect(value).toBe(expected)`, `expect(fn).toHaveBeenCalled()`

## Mocking

**Framework:** Vitest `vi` or Jest `jest` object for mocking

**Patterns for This Codebase:**

```javascript
// Mock localStorage
import { beforeEach, vi } from 'vitest'

beforeEach(() => {
  const store = {}
  global.localStorage = {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value }),
    removeItem: vi.fn(key => { delete store[key] }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) })
  }
})

// Mock Web Audio API
vi.stubGlobal('AudioContext', class MockAudioContext {
  state = 'running'
  createBufferSource() { /* ... */ }
  decodeAudioData() { /* ... */ }
})

// Mock timers for animation/timeout testing
vi.useFakeTimers()
// ... test code ...
vi.advanceTimersByTime(400) // simulate 400ms
vi.runAllTimers() // run pending timers
vi.useRealTimers() // restore
```

**What to Mock:**
- localStorage operations (save/load game state, achievements, settings)
- Web Audio API (audio context, buffer sources, sounds)
- setTimeout/setInterval (game timer, animation timeouts, toast auto-hide)
- fetch() for audio file loading
- Window events (resize, orientationchange for iOS)

**What NOT to Mock:**
- Vue core reactivity (ref, computed, watch)
- Pinia store (test real store actions, mutations)
- Component template rendering (test actual output)
- DOM APIs unless strictly testing isolation

## Fixtures and Factories

**Test Data:**

```javascript
// Stimulus fixture
const createStimulus = (overrides = {}) => ({
  color: 'blue',
  emoji: 'fire',
  position: 'center',
  shape: 'square',
  ...overrides
})

// Game state fixture
const createGameState = (overrides = {}) => ({
  score: 0,
  incorrectResponses: 0,
  timeLeft: 5,
  nBack: 2,
  isStopped: false,
  isPaused: false,
  stimulusHistory: [],
  ...overrides
})

// Achievement fixture
const mockAchievements = ['firstGame', 'firstPoint', 'tenPoints']
```

**Location:**
- Place in dedicated `src/__tests__/fixtures/` directory
- Or inline in test files for simple data
- Export reusable factories from `src/__tests__/factories.js`

## Coverage

**Requirements:** None enforced - no coverage configuration

**Recommended Targets:**
- Store actions: 100% (critical game logic)
- Components: 80%+ (template logic via rendered output)
- Utilities/helpers: 100% (if extracted)

**View Coverage:**
```bash
# With Vitest
npm run test -- --coverage

# With Jest
npm run test -- --coverage
```

## Test Types

**Unit Tests:**
- **Scope:** Individual functions, methods, computed properties
- **Approach:** Test store actions in isolation with mocked dependencies
  - `startGame()` sets initial state correctly
  - `respondToStimulus()` calculates correct/incorrect accurately
  - `generateRandomStimulus()` returns valid stimulus object
- **Example file:** `src/store/gameStore.test.js`

```javascript
it('respondToStimulus marks correct responses', () => {
  const store = useGameStore()
  store.stimulusHistory = [{ color: 'blue', emoji: 'fire', position: 'center', shape: 'square' }]
  store.nBack = 1
  store.currentStimulus = { color: 'blue', emoji: 'ice', position: 'left', shape: 'triangle' }

  store.respondToStimulus('color')

  expect(store.score).toBe(1)
  expect(store.lastFeedback.type).toBe('correct')
})
```

**Component Tests:**
- **Scope:** Mounted Vue components, user interactions, prop/event bindings
- **Approach:** Mount component, simulate user input, verify output/events
  - Props render correctly
  - Buttons emit expected events
  - Conditional rendering works (v-if, v-show)
  - CSS animations apply
- **Example file:** `src/ConfigStart.vue.test.js`

```javascript
it('emits startGame on button click', async () => {
  const wrapper = mount(ConfigStart, {
    props: { nBack: 2, timeLeft: 5 }
  })

  await wrapper.find('button').trigger('click')

  expect(wrapper.emitted('startGame')).toBeTruthy()
  expect(wrapper.emitted('update:nBack')).toBeTruthy()
})
```

**Integration Tests:**
- **Scope:** Multiple components working with store
- **Approach:** Mount App component with store, simulate game flow
  - Start game → stimulus appears → respond → score updates
  - Pause → resume → continue game
  - Game over → return to menu
- **Example file:** `src/App.integration.test.js` (or in same file with separate describe block)

```javascript
it('completes full game flow', async () => {
  const { gameStore } = setup() // custom setup helper
  const wrapper = mount(App)

  // Start game
  await wrapper.find('button[text="Start Game"]').trigger('click')
  expect(gameStore.isStopped).toBe(false)

  // Respond to stimulus
  await wrapper.find('button[text="Color"]').trigger('click')
  expect(wrapper.emitted('respond')).toBeTruthy()
})
```

**E2E Tests:**
- **Framework:** Not currently used
- **Recommendation:** Consider Playwright or Cypress if mobile testing needed
- Would test full user flows in real browser (especially iOS audio unlock, Capacitor integration)

## Common Patterns

**Async Testing:**

```javascript
it('loads game store on mount', async () => {
  const wrapper = mount(Component)

  // Wait for next tick (Vue update cycle)
  await wrapper.vm.$nextTick()

  // Or wait for specific condition
  await vi.waitFor(() => {
    expect(wrapper.vm.loaded).toBe(true)
  })
})

// Testing setTimeout
it('hides feedback after timeout', async () => {
  vi.useFakeTimers()
  const wrapper = mount(FeedbackComponent)

  await wrapper.vm.$nextTick()
  expect(wrapper.vm.visible).toBe(true)

  vi.advanceTimersByTime(2000)
  await wrapper.vm.$nextTick()

  expect(wrapper.vm.visible).toBe(false)
  vi.useRealTimers()
})
```

**Error Testing:**

```javascript
it('handles fetch errors gracefully', async () => {
  vi.global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
  const store = useGameStore()

  await store.initAudio()

  expect(store.audioReady).toBe(false)
  // Verify app continues without audio
})

it('handles invalid localStorage data', () => {
  localStorage.setItem('achievements', 'invalid json')

  const achievements = getUnlocked()

  expect(achievements).toEqual([]) // Fallback to empty
})
```

**Store Testing with Pinia:**

```javascript
import { createPinia, setActivePinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia()) // Fresh store for each test
})

it('mutates state through actions', () => {
  const store = useGameStore()

  store.startGame(5)

  expect(store.isStopped).toBe(false)
  expect(store.timeLeft).toBe(5)
})
```

**Component Event Testing:**

```javascript
it('emits event with correct payload', async () => {
  const wrapper = mount(ConfigStart, {
    props: { nBack: 2, timeLeft: 5 }
  })

  await wrapper.find('button').trigger('click')

  const events = wrapper.emitted('update:nBack')
  expect(events).toHaveLength(1)
  expect(events[0][0]).toBe(2) // First argument of first event
})
```

## Recommended Testing Priority

1. **High Priority:** Store actions (game logic is the core)
   - `startGame()`, `respondToStimulus()`, `setNewStimulus()`
   - All getters that calculate scores/accuracy
   - localStorage operations

2. **Medium Priority:** Modals and main components
   - `GameOverModal` - score display, event emissions
   - `App` - game flow state management
   - `ConfigStart` - input validation

3. **Low Priority:** Presentation components
   - `Stimulus` - rendering based on props
   - `Footer`, `IntroHead` - static content
   - Animation classes (harder to test)

---

*Testing analysis: 2026-02-28*
