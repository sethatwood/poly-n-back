# Testing Patterns

**Analysis Date:** 2026-04-25

## Test Framework

**Unit Tests:**
- Runner: Vitest 4.0.18
- Config: `vitest.config.ts`
- Environment: happy-dom 20.7.0 (lightweight DOM simulation)
- Globals: enabled (no `import { describe, it, expect }` needed)
- Setup: `src/test-setup.ts` (runs before each test file)

**E2E Tests:**
- Framework: Playwright 1.58.2
- Config: `playwright.config.ts`
- Browsers: Chromium, WebKit (Safari equivalent)
- Server: Auto-built and previewed via `vite build && vite preview`
- Base URL: `http://localhost:4173`

**Assertion Library:**
- Vitest: built-in expect (Chai-compatible)
- Playwright: expect from `@playwright/test`

**Run Commands:**
```bash
npm run test:unit              # Run all unit tests (vitest run)
npm run test:unit:watch       # Watch mode for unit tests
npm run test:e2e              # Run all e2e tests (playwright test)
npm run test:e2e:ui           # E2E tests with UI dashboard
npm run lint                  # ESLint --fix
npm run type-check            # TypeScript type checking (vue-tsc)
```

## Test File Organization

**Location:**
- Unit tests: co-located with code in `__tests__/` subdirectory
  - `src/stores/__tests__/gameStore.test.ts` → tests for `src/stores/gameStore.ts`
  - `src/stores/__tests__/audioStore.test.ts` → tests for `src/stores/audioStore.ts`
  - `src/stores/__tests__/persistenceStore.test.ts` → tests for `src/stores/persistenceStore.ts`
  - Integration tests: `src/stores/__tests__/stateTransitions.integration.test.ts`, `src/stores/__tests__/gameFlow.integration.test.ts`
- E2E tests: separate directory in `e2e/`
  - `e2e/app-smoke.spec.ts` → smoke tests for app behavior

**Naming:**
- Unit tests: `{module}.test.ts` (e.g., `gameStore.test.ts`)
- Integration tests: `{name}.integration.test.ts` (e.g., `stateTransitions.integration.test.ts`)
- E2E tests: `{scenario}.spec.ts` (e.g., `app-smoke.spec.ts`)

**Vitest Configuration (from `vitest.config.ts`):**
```typescript
test: {
  globals: true,
  environment: 'happy-dom',
  include: ['src/**/*.test.ts'],
  setupFiles: ['./src/test-setup.ts'],
  coverage: {
    provider: 'v8',
    include: ['src/stores/**', 'src/composables/**'],  // Coverage tracked for stores & composables only
  },
}
```

## Test Structure

**Describe Blocks:**
```typescript
describe('gameStore', () => {
  describe('stimulus generation', () => {
    it('generateRandomStimulus returns valid Stimulus', () => {
      // test body
    });
  });
});
```

**Setup and Teardown:**
```typescript
beforeEach(() => {
  setActivePinia(createPinia());  // Fresh Pinia instance
  vi.useFakeTimers();              // Mock timers for deterministic tests
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
```

**Integration Test Setup (from `stateTransitions.integration.test.ts`):**
```typescript
// Helper: Mount minimal Vue app so composables with onUnmounted work correctly
function withSetup(gameStore: ReturnType<typeof useGameStore>) {
  let result!: ReturnType<typeof useGameLifecycle>;
  const app = createApp({
    setup() {
      result = useGameLifecycle(gameStore);
      return () => {};
    },
  });
  app.use(createPinia());
  app.mount(document.createElement('div'));
  return { result, app };
}
```

**Assertion Pattern:**
```typescript
it('should update score', () => {
  const store = useGameStore();
  expect(store.score).toBe(0);
  store.respondToStimulus('color');
  expect(store.score).toBe(1);
});
```

## Mocking

**Framework:** Vitest mocking via `vi.mock()`

**Setup File Stubs (`src/test-setup.ts`):**
Mocks global APIs before any test file imports stores. This is CRITICAL because `audioStore` initializes at module scope.

```typescript
// Mock AudioContext (used by audioStore)
globalThis.AudioContext = class MockAudioContext {
  state = 'running';
  resume(): Promise<void> { return Promise.resolve(); }
  decodeAudioData(): Promise<AudioBuffer> { return Promise.resolve({} as AudioBuffer); }
  createBufferSource() {
    return {
      buffer: null as AudioBuffer | null,
      connect: vi.fn(),
      start: vi.fn(),
    };
  }
  destination = {};
} as unknown as typeof AudioContext;

// Mock fetch (used by audioStore to load sound files)
globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  }),
) as unknown as typeof fetch;

// Mock localStorage (used by persistenceStore)
globalThis.localStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
} as unknown as Storage;
```

**Module-Level Mocks (in test files):**
```typescript
// Mock dependent stores while testing gameStore
vi.mock('@/stores/audioStore', () => ({
  useAudioStore: () => ({
    ready: false,
    unlocked: false,
    init: vi.fn(),
    unlock: vi.fn(),
    play: vi.fn(),
  }),
}));

vi.mock('@/stores/persistenceStore', () => ({
  usePersistenceStore: () => ({
    migrated: false,
    loadPreference: vi.fn().mockResolvedValue(undefined),
    savePreference: vi.fn().mockResolvedValue(undefined),
    migrateFromLocalStorage: vi.fn().mockResolvedValue(undefined),
  }),
}));
```

**Real Stores in Integration Tests:**
```typescript
// From stateTransitions.integration.test.ts
vi.mock('@capacitor/preferences');  // Only mock external APIs

// Stores are REAL -- tests verify interactions between composables and stores
const gameStore = useGameStore();
const lifecycle = useGameLifecycle(gameStore);
```

**Fake Timer Pattern:**
```typescript
beforeEach(() => {
  vi.useFakeTimers();  // Control time progression
});

it('timer decrements timeLeft each second', () => {
  const store = useGameStore();
  store.startGame(5);
  expect(store.timeLeft).toBe(5);
  
  vi.advanceTimersByTime(1000);
  expect(store.timeLeft).toBe(4);
});
```

**What to Mock:**
- Global APIs (AudioContext, fetch, localStorage) — mocked in setup file
- External platform APIs (@capacitor/*) — mocked in test file or via setup
- Dependent stores when testing in isolation — mocked via `vi.mock()`
- Event timers — use `vi.useFakeTimers()` for deterministic tests

**What NOT to Mock:**
- Store logic under test — use real store instances
- Vue composables that interact with stores — use real instances
- Game state calculations — test with real refs and computed properties

## Fixtures and Factories

**Test Data:**
Deterministic stimulus data hard-coded in store:
```typescript
// From gameStore.ts
const deterministicStimuli = ref<Stimulus[]>([
  { color: 'blue', emoji: 'flower', position: 'center', shape: 'square' },
  { color: 'green', emoji: 'ice', position: 'left', shape: 'triangle' },
  { color: 'blue', emoji: 'fire', position: 'right', shape: 'circle' },
  // ... 3 more
]);
```

**Usage in Tests:**
```typescript
it('deterministic mode cycles through deterministicStimuli', () => {
  const store = useGameStore();
  store.isDeterministic = true;
  store.startGame(5);
  
  // Access fixture data directly
  expect(store.currentStimulus).toEqual(store.deterministicStimuli[0]);
  
  vi.advanceTimersByTime(5000);
  expect(store.currentStimulus).toEqual(store.deterministicStimuli[1]);
});
```

**Helper Functions (in test files):**
```typescript
// From stateTransitions.integration.test.ts
function driveToGameOver(gameStore: ReturnType<typeof useGameStore>) {
  vi.advanceTimersByTime(6000);  // Get 3 stimuli
  gameStore.respondToStimulus('emoji');  // Strike 1
  vi.advanceTimersByTime(3000);
  gameStore.respondToStimulus('emoji');  // Strike 2
  vi.advanceTimersByTime(3000);
  gameStore.respondToStimulus('emoji');  // Strike 3 → game over
}
```

**Location:**
- Fixtures and factories stay in test files (no separate fixture modules)
- Deterministic test data uses `isDeterministic: true` flag on store

## Coverage

**Requirements:** None explicitly enforced

**Coverage Tracked:** Stores and composables only
```typescript
coverage: {
  provider: 'v8',
  include: ['src/stores/**', 'src/composables/**'],
}
```

**View Coverage:**
```bash
npm run test:unit -- --coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual store methods and computed properties
- Approach: Isolated Pinia store with mocked dependencies
- Example: `src/stores/__tests__/gameStore.test.ts`
  - Tests stimulus generation, response evaluation, score calculation, turn management
  - Uses fake timers to control game flow
  - Mocks audioStore and persistenceStore

**Integration Tests:**
- Scope: Store + composable interactions with real game lifecycle
- Approach: Real store instances, real composables, Vue app mounted for lifecycle hooks
- Example: `src/stores/__tests__/stateTransitions.integration.test.ts`
  - Tests menu → game → pause → resume → game over → menu state flow
  - Mocks only external APIs (@capacitor/preferences)
  - Validates composable cleanup via `onUnmounted()`

**E2E Tests:**
- Framework: Playwright (not Cypress or other)
- Scope: User workflows from browser perspective
- Approach: Full build, real server, browser automation
- Example: `e2e/app-smoke.spec.ts`
  - App loads and shows menu
  - Tutorial can be dismissed
  - Game can be started and paused
  - Uses page locators and accessibility queries

## Common Patterns

**Async Testing (Vitest):**
```typescript
it('loads persisted state', async () => {
  const store = useGameStore();
  await store.loadPersistedState();
  expect(store.highScoreData).toBeDefined();
});
```

**Mocking Async Functions:**
```typescript
vi.mock('@/stores/persistenceStore', () => ({
  usePersistenceStore: () => ({
    loadPreference: vi.fn().mockResolvedValue(defaultValue),
  }),
}));
```

**Error Testing (try-catch patterns):**
No explicit error testing in codebase. Errors in non-critical paths (haptics, audio) are silently caught.

**E2E Waiting Pattern (Playwright):**
```typescript
test('can dismiss tutorial and see menu', async ({ page }) => {
  await page.goto('/');
  
  const skipButton = page.getByText('Skip Tutorial');
  const tutorialVisible = await skipButton
    .isVisible({ timeout: 5000 })
    .catch(() => false);  // Gracefully handle missing tutorial
  
  if (tutorialVisible) {
    await skipButton.click();
  }
  
  await expect(
    page.getByRole('button', { name: /start game/i }),
  ).toBeVisible({ timeout: 5000 });
});
```

**Playwright Locator Strategies:**
```typescript
page.getByRole('button', { name: /start game/i })     // Accessibility
page.getByText('Color')                                // Text match
page.locator('button[title="Pause"]')                 // CSS selector
```

**Test Helpers (Custom):**
```typescript
// From integration test setup
function withSetup(gameStore: ReturnType<typeof useGameStore>) {
  let result!: ReturnType<typeof useGameLifecycle>;
  const app = createApp({ setup() { /* ... */ } });
  app.use(createPinia());
  app.mount(document.createElement('div'));
  return { result, app };
}
```

## Playwright Configuration

**From `playwright.config.ts`:**
```typescript
testDir: './e2e',
fullyParallel: true,
forbidOnly: !!process.env.CI,          // Fail if .only left in CI
retries: process.env.CI ? 2 : 0,      // 2 retries in CI, 0 locally
workers: process.env.CI ? 1 : undefined, // Serial in CI, parallel locally
reporter: 'html',
use: {
  baseURL: 'http://localhost:4173',
  trace: 'on-first-retry',             // Trace failures
},
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
],
webServer: {
  command: 'npm run build && npm run preview',
  url: 'http://localhost:4173',
  reuseExistingServer: !process.env.CI, // Reuse in dev, fresh in CI
},
```

## Test Coverage Assessment

**Well-Tested Areas:**
- `src/stores/gameStore.ts` — Stimulus generation, response evaluation, score calculation, turn management, high score logic
- `src/stores/audioStore.ts` — Initialization, sound loading
- `src/stores/persistenceStore.ts` — Preference save/load, localStorage migration
- Integration flows — Menu to game to pause to resume to game over

**Under-Tested Areas:**
- Vue components (no component tests; only e2e tests exercise components)
- Composables (only `useGameLifecycle` tested via integration; others untested)
- Utility functions (haptics never tested)
- Error paths (silent catches never triggered)
- UI interactions (covered only by e2e smoke tests)

**Gaps to Address:**
- Add component snapshot or render tests if components change frequently
- Add unit tests for `useFeedback` and `useAnimations` composables
- Add utility tests for haptics behavior under different device conditions
- Expand e2e tests for error scenarios (network failure, permission denied)

---

*Testing analysis: 2026-04-25*
