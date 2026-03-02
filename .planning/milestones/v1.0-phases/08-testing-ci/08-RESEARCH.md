# Phase 8: Testing & CI - Research

**Researched:** 2026-03-02
**Domain:** Unit testing, integration testing, E2E testing, CI/CD pipelines for a Vue 3 + Pinia + Capacitor app
**Confidence:** HIGH

## Summary

Phase 8 introduces the project's entire testing infrastructure from scratch -- there are zero existing tests, no test runner configured, and no CI pipeline beyond the GitHub Pages deploy workflow. The standard stack for this project is Vitest 4 (unit/integration), @vue/test-utils 2 (component mounting), @pinia/testing 1 (store mocking), and Playwright 1.58 (E2E). All are verified compatible with the project's Vite 7.3, Vue 3.5, Pinia 3, and Node 22.

The primary challenge is mocking two external dependencies that don't work in Node.js: `@capacitor/preferences` (Capacitor plugins are JS proxies that can't be proxied again) and `AudioContext` (Web Audio API doesn't exist in Node). Both require manual mocks via `__mocks__/` directories or `vi.mock()`. The gameStore has rich testable logic (stimulus generation, response evaluation, score calculation, high score persistence, game-over logic) that makes up the bulk of the unit test surface area. Integration tests should exercise full game flows using real store instances (not mocked actions). Playwright E2E tests run against the Vite dev server in WebKit + Chromium, matching the Capacitor iOS/Android runtime targets.

**Primary recommendation:** Use Vitest 4 with `happy-dom` for unit/integration tests (faster than jsdom, sufficient for this DOM-light store-centric codebase), Playwright 1.58 for E2E tests against WebKit + Chromium, and a GitHub Actions CI workflow that runs type-check, unit tests, and build on every push.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-01 | Vitest + @vue/test-utils configured and running | Standard Stack section: Vitest 4.0.18, @vue/test-utils 2.4.6, happy-dom 20.7.0. Configuration patterns in Architecture Patterns section. |
| TEST-02 | gameStore unit tests covering stimulus generation, response evaluation, score calculation, turn management, and high score logic | Architecture Pattern 1 (isolated store testing with `setActivePinia`). Code Examples for gameStore testing patterns. Pitfall section on timer mocking with `vi.useFakeTimers()`. |
| TEST-03 | persistenceStore unit tests covering error handling paths, schema validation, and default fallbacks | Architecture Pattern 2 (Capacitor mock via `__mocks__/@capacitor/preferences.ts`). Code Examples for persistence mock setup. |
| TEST-04 | audioStore unit tests covering initialization failure and graceful degradation | Architecture Pattern 3 (AudioContext mock via `vi.stubGlobal`). Code example for mocking AudioContext and fetch. |
| TEST-05 | Integration tests for full game flow (start -> gameplay -> game over) | Architecture Pattern 4 (multi-store integration tests with `stubActions: false`). Uses real stores but mocked external deps. |
| TEST-06 | Integration tests for state transitions (menu -> game -> pause -> resume -> game over) | Same as TEST-05, tests lifecycle composable functions against real store. |
| TEST-07 | Playwright E2E configured with WebKit + Chromium test targets | Standard Stack section: Playwright 1.58.2 config with `webServer` pointing at `vite preview`. Architecture Pattern 5 (Playwright config). |
| TEST-08 | CI pipeline runs type-check, unit tests, and build on every push | Architecture Pattern 6 (GitHub Actions workflow). Existing `deploy.yml` only runs on main push; new `ci.yml` runs on all pushes and PRs. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^4.0.18 | Unit + integration test runner | First-party Vite integration, compatible with Vite 7 (`^6.0.0 \|\| ^7.0.0`), 2-10x faster than Jest |
| @vue/test-utils | ^2.4.6 | Vue component mounting and interaction | Official Vue.js testing utility library for Vue 3 |
| @pinia/testing | ^1.0.3 | Testing Pinia stores in components | Official Pinia testing plugin, peer dep `pinia >=3.0.4` matches project |
| @playwright/test | ^1.58.2 | E2E browser testing | Microsoft-maintained, supports WebKit (iOS proxy) + Chromium, single API for all browsers |
| happy-dom | ^20.7.0 | DOM environment for Vitest | Faster than jsdom, sufficient for this store-heavy codebase with minimal DOM testing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/coverage-v8 | ^4.0.18 | Code coverage reporting | When coverage thresholds are desired (optional for this phase) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| happy-dom | jsdom | jsdom is more standards-complete but 2-5x slower; this project's tests are store-centric with minimal DOM interaction |
| Playwright | Cypress | Cypress lacks WebKit support, which is needed for iOS/Capacitor target validation |
| Vitest | Jest | Jest requires separate Vite transforms, heavier config; Vitest reads vite.config.js directly |

**Installation:**
```bash
# Unit/integration testing
npm install -D vitest @vue/test-utils @pinia/testing happy-dom @vitest/coverage-v8

# E2E testing
npm install -D @playwright/test
npx playwright install --with-deps webkit chromium
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── stores/
│   ├── __tests__/
│   │   ├── gameStore.test.ts          # TEST-02
│   │   ├── persistenceStore.test.ts   # TEST-03
│   │   └── audioStore.test.ts         # TEST-04
│   ├── gameStore.ts
│   ├── persistenceStore.ts
│   └── audioStore.ts
├── composables/
│   └── __tests__/
│       └── useGameLifecycle.test.ts   # (supporting TEST-05/06)
├── components/
│   └── __tests__/                     # (optional for this phase)
└── ...
__mocks__/
└── @capacitor/
    └── preferences.ts                 # Manual mock for Capacitor Preferences
e2e/
├── game-flow.spec.ts                  # TEST-05 (E2E variant)
├── state-transitions.spec.ts          # TEST-06 (E2E variant)
└── ...
vitest.config.ts
playwright.config.ts
```

### Pattern 1: Isolated Pinia Store Testing (gameStore)
**What:** Test store actions, getters, and state mutations directly without mounting components
**When to use:** For stores with complex business logic (gameStore is the primary target)
**Example:**
```typescript
// Source: https://pinia.vuejs.org/cookbook/testing.html
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from '@/stores/gameStore';

// Must mock cross-store deps before store imports resolve
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

describe('gameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with score 0', () => {
    const store = useGameStore();
    expect(store.score).toBe(0);
  });
});
```

### Pattern 2: Capacitor Preferences Mock
**What:** Manual mock file that replaces `@capacitor/preferences` with an in-memory implementation
**When to use:** Any test that imports persistenceStore (directly or transitively)
**Example:**
```typescript
// __mocks__/@capacitor/preferences.ts
// Source: https://capacitorjs.com/docs/guides/mocking-plugins
const store = new Map<string, string>();

export const Preferences = {
  async get(opts: { key: string }): Promise<{ value: string | null }> {
    return { value: store.get(opts.key) ?? null };
  },
  async set(opts: { key: string; value: string }): Promise<void> {
    store.set(opts.key, opts.value);
  },
  async remove(opts: { key: string }): Promise<void> {
    store.delete(opts.key);
  },
  async clear(): Promise<void> {
    store.clear();
  },
  // Test helper to reset between tests
  _reset(): void {
    store.clear();
  },
};
```

### Pattern 3: AudioContext Mock
**What:** Stub `window.AudioContext` and `fetch` for audioStore tests
**When to use:** Testing audioStore init, play, and graceful degradation
**Example:**
```typescript
// In audioStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

function createMockAudioContext() {
  return {
    state: 'running',
    resume: vi.fn().mockResolvedValue(undefined),
    decodeAudioData: vi.fn().mockResolvedValue({} as AudioBuffer),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
    })),
    destination: {},
  };
}

beforeEach(() => {
  vi.stubGlobal('AudioContext', vi.fn(() => createMockAudioContext()));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  }));
});
```

### Pattern 4: Integration Tests with Real Stores
**What:** Use real Pinia stores (not stubbed actions) to test full game flows
**When to use:** TEST-05 and TEST-06 (verifying multiple stores work together)
**Example:**
```typescript
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from '@/stores/gameStore';

// Mock only EXTERNAL deps (Capacitor, AudioContext), NOT store actions
vi.mock('@capacitor/preferences');  // uses __mocks__

describe('full game flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    // Stub AudioContext globally
    vi.stubGlobal('AudioContext', vi.fn(() => createMockAudioContext()));
  });

  it('start -> play -> 3 strikes -> game over', () => {
    const store = useGameStore();
    store.startGame(5);
    // Advance timer to trigger stimulus changes
    vi.advanceTimersByTime(5000);
    // ... test real response evaluation logic
  });
});
```

### Pattern 5: Playwright Configuration
**What:** Playwright config pointing at Vite dev server with WebKit + Chromium
**When to use:** E2E tests (TEST-07)
**Example:**
```typescript
// playwright.config.ts
// Source: https://playwright.dev/docs/test-webserver
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Pattern 6: GitHub Actions CI Workflow
**What:** CI workflow running type-check, unit tests, and build on every push
**When to use:** TEST-08
**Example:**
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: ['*']
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run type-check
      - run: npm run test:unit
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps webkit chromium
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Anti-Patterns to Avoid
- **Testing implementation details:** Don't assert on private ref internals; test through public actions and getters
- **Shared mutable state between tests:** Always create a fresh Pinia in `beforeEach` with `setActivePinia(createPinia())`
- **Testing with stubbed actions when you want integration:** Use `stubActions: false` (or don't use `createTestingPinia`) for integration tests that need real store behavior
- **Using real timers in tests:** The gameStore uses `setInterval`; always use `vi.useFakeTimers()` to control time progression deterministically
- **Mounting full App.vue for store tests:** Store logic can be tested in isolation; only use component mounting for component-specific behavior

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Capacitor plugin mocking | Custom proxy intercepts | `__mocks__/@capacitor/preferences.ts` manual mock | Capacitor plugins are JS proxies; proxying a proxy fails at runtime |
| AudioContext simulation | Full Web Audio polyfill | Lightweight stub with `vi.stubGlobal('AudioContext', ...)` | Only need to verify init/play/degrade paths, not real audio processing |
| Pinia store test setup | Custom store factory | `setActivePinia(createPinia())` per test | Pinia's built-in pattern handles cleanup and isolation |
| CI pipeline from scratch | Shell scripts + cron | GitHub Actions with `actions/setup-node` | Project already uses GitHub + Actions for Pages deploy |
| Timer control in tests | Custom clock implementations | `vi.useFakeTimers()` / `vi.advanceTimersByTime()` | Vitest's built-in fake timer is battle-tested and handles setInterval/setTimeout/Date |

**Key insight:** This project's testing complexity is concentrated in mocking two platform-specific APIs (Capacitor Preferences and AudioContext). Once those mocks are in place, the actual test logic is straightforward store state-machine verification.

## Common Pitfalls

### Pitfall 1: Capacitor Plugin Proxy-of-Proxy Failure
**What goes wrong:** Importing `@capacitor/preferences` in a test environment throws cryptic proxy errors because Capacitor plugins are JS Proxy objects, and test frameworks try to create proxies of proxies.
**Why it happens:** Capacitor's web runtime wraps plugin calls in Proxy objects for the native bridge. Vitest's module system (or spy wrappers) creates another proxy layer, which JS doesn't allow.
**How to avoid:** Use a manual mock file at `__mocks__/@capacitor/preferences.ts` that provides plain objects. Configure Vitest's `resolve.alias` or `vi.mock()` to use it.
**Warning signs:** `TypeError: Cannot create proxy with a non-object as target or handler` in test output.

### Pitfall 2: audioStore Eager Init at Import Time
**What goes wrong:** `audioStore.ts` calls `init()` eagerly at module scope (line 74). When tests import the store, `init()` fires immediately, hitting the real AudioContext and fetch before any mocks are set up.
**Why it happens:** The store pattern uses eager initialization to preserve module-load-time behavior.
**How to avoid:** Set up `vi.stubGlobal('AudioContext', ...)` and `vi.stubGlobal('fetch', ...)` BEFORE importing the store, or use `vi.mock()` at the top of the test file (which runs before imports). Alternatively, mock the entire audioStore module when testing gameStore.
**Warning signs:** `ReferenceError: AudioContext is not defined` during test setup.

### Pitfall 3: setInterval Leaks Between Tests
**What goes wrong:** `gameStore.startGame()` creates a `setInterval`. If a test doesn't clean up (call `stopGame()` or restore real timers), the interval leaks and causes flaky failures in subsequent tests.
**Why it happens:** `vi.useFakeTimers()` queues timers but `vi.useRealTimers()` in afterEach doesn't auto-clear pending fakes.
**How to avoid:** Call `vi.clearAllTimers()` in `afterEach` before `vi.useRealTimers()`. Or ensure every test that calls `startGame()` also calls `stopGame()`.
**Warning signs:** Tests pass individually but fail when run together; "too many recursive timers" warnings.

### Pitfall 4: Vitest createSpy Configuration
**What goes wrong:** `createTestingPinia()` stubs actions but the spy functions don't work as expected (e.g., `toHaveBeenCalledTimes` always returns 0).
**Why it happens:** Without `globals: true` in vitest.config.ts, `@pinia/testing` doesn't know which spy framework to use.
**How to avoid:** Either set `globals: true` in vitest.config.ts, or pass `createSpy: vi.fn` to `createTestingPinia({ createSpy: vi.fn })`.
**Warning signs:** Stubbed actions return undefined but `toHaveBeenCalled()` assertions fail.

### Pitfall 5: Cross-Store Dependencies in gameStore
**What goes wrong:** `gameStore` calls `useAudioStore()` and `usePersistenceStore()` at setup time. If those stores aren't properly mocked or a Pinia instance isn't active, the test crashes.
**Why it happens:** Pinia's composition rule requires cross-store refs before any `await`. The stores are resolved immediately during `useGameStore()`.
**How to avoid:** For isolated gameStore tests, mock the entire audioStore and persistenceStore modules. For integration tests, ensure all three stores are created within the same Pinia instance.
**Warning signs:** `getActivePinia was called with no active Pinia` error.

### Pitfall 6: Playwright WebKit on Linux CI
**What goes wrong:** WebKit tests fail on CI with missing system library errors.
**Why it happens:** Playwright's WebKit binary requires specific Linux system libraries (gstreamer, libenchant, etc.) that aren't in the default GitHub Actions Ubuntu image.
**How to avoid:** Use `npx playwright install --with-deps webkit chromium` which auto-installs system dependencies. The `--with-deps` flag is critical for CI.
**Warning signs:** `browserType.launch: Executable doesn't exist` or `error while loading shared libraries` on CI.

### Pitfall 7: Vite Asset Imports in Test Environment
**What goes wrong:** `audioStore.ts` imports `.wav` and `.mp3` files via Vite's asset system (`import stimulusSoundUrl from '../assets/stimulus.wav'`). In the test environment, these resolve to empty strings or cause import errors.
**Why it happens:** Vitest handles asset transforms differently from Vite's dev server. Without proper configuration, binary assets aren't processed.
**How to avoid:** Vitest inherits Vite's config which handles `.wav`/`.mp3` as asset URLs. If testing audioStore, the `fetch()` mock should handle any URL string. No additional config needed beyond what Vitest provides by default.
**Warning signs:** Import errors on `.wav` or `.mp3` files during test execution.

## Code Examples

Verified patterns from official sources:

### Vitest Configuration (vitest.config.ts)
```typescript
// Source: https://vitest.dev/guide/ + project-specific paths
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/stores/**', 'src/composables/**'],
    },
  },
});
```

### Test Setup File (src/test-setup.ts)
```typescript
// Global test setup -- runs before each test file
// Provide AudioContext stub globally so audioStore's eager init() doesn't crash
const mockAudioContext = {
  state: 'running' as AudioContextState,
  resume: () => Promise.resolve(),
  decodeAudioData: () => Promise.resolve({} as AudioBuffer),
  createBufferSource: () => ({
    buffer: null,
    connect: () => {},
    start: () => {},
  }),
  destination: {},
};

globalThis.AudioContext = class MockAudioContext {
  state = mockAudioContext.state;
  resume = mockAudioContext.resume;
  decodeAudioData = mockAudioContext.decodeAudioData;
  createBufferSource = mockAudioContext.createBufferSource;
  destination = mockAudioContext.destination;
} as unknown as typeof AudioContext;

// Stub fetch for audio asset loading
globalThis.fetch = (() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  })) as unknown as typeof fetch;
```

### gameStore Response Evaluation Test
```typescript
// Source: Project-specific pattern based on gameStore.respondToStimulus logic
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from '@/stores/gameStore';

describe('respondToStimulus', () => {
  let store: ReturnType<typeof useGameStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    store = useGameStore();
    // Use deterministic mode to control stimuli
    store.isDeterministic = true;
    store.startGame(5);
  });

  afterEach(() => {
    store.stopGame();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('increments score on correct match', () => {
    // Advance enough turns to have nBack history
    for (let i = 0; i < store.nBack; i++) {
      vi.advanceTimersByTime(5000); // each interval triggers setNewStimulus
    }
    // Now compare current with nBack-ago stimulus
    // ... assert based on deterministic sequence
  });

  it('increments strikes on incorrect response', () => {
    // Advance past nBack threshold
    for (let i = 0; i < store.nBack; i++) {
      vi.advanceTimersByTime(5000);
    }
    // Respond with a non-matching attribute
    const initialStrikes = store.incorrectResponses;
    store.respondToStimulus('color'); // may or may not match
    // Test logic depends on deterministic stimuli sequence
  });

  it('triggers game over after 3 strikes', () => {
    // Need to build up history, then make 3 wrong responses
    expect(store.isStopped).toBe(false);
    // ... drive 3 incorrect responses
    // expect(store.isStopped).toBe(true);
    // expect(store.showGameOverModal).toBe(true);
  });
});
```

### persistenceStore Schema Validation Test
```typescript
// Source: Project-specific pattern based on persistenceStore.loadPreference
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePersistenceStore } from '@/stores/persistenceStore';

// Uses __mocks__/@capacitor/preferences.ts automatically
vi.mock('@capacitor/preferences');

describe('persistenceStore', () => {
  let store: ReturnType<typeof usePersistenceStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = usePersistenceStore();
  });

  it('returns defaults when stored value is null', async () => {
    const result = await store.loadPreference('nonexistent', { score: 0 });
    expect(result).toEqual({ score: 0 });
  });

  it('returns defaults when stored value has wrong type', async () => {
    // Manually set a string where an object is expected
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key: 'test', value: '"not-an-object"' });
    const result = await store.loadPreference('test', { score: 0 });
    expect(result).toEqual({ score: 0 });
  });

  it('returns defaults when stored object is missing keys', async () => {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key: 'test', value: '{"wrong": 1}' });
    const result = await store.loadPreference('test', { score: 0, nBack: 2 });
    expect(result).toEqual({ score: 0, nBack: 2 });
  });
});
```

### Package.json Scripts
```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test": "vitest run && playwright test"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest + ts-jest transforms | Vitest 4 (native Vite pipeline) | Vitest 4.0, Dec 2025 | Zero config for Vite projects, shared config |
| @pinia/testing for Pinia 2 | @pinia/testing 1.0 for Pinia 3 | Feb 2025 | Must use `@pinia/testing` ^1.0.3 with Pinia 3 |
| jsdom as default test env | happy-dom gaining adoption | 2024-2025 | 2-5x faster for non-browser-standard tests |
| Vitest 3 + Vite 6 | Vitest 4 + Vite 7 | Dec 2025-Jan 2026 | Vitest 4 required for Vite 7 compatibility |
| @vue/test-utils 2.4 with Options API | Same lib, script setup support | Stable since 2023 | Works with `<script setup lang="ts">` via `mount()` |

**Deprecated/outdated:**
- `@pinia/testing` pre-1.0: Pinia 2 era, doesn't work with Pinia 3
- Vitest 3.x: Not compatible with Vite 7 (`^6.0.0 || ^7.0.0` peer dep only in Vitest 4)
- Jest for Vite projects: Requires babel/ts-jest transforms that duplicate Vite's pipeline

## Open Questions

1. **Coverage thresholds**
   - What we know: `@vitest/coverage-v8` is available and works with Vitest 4
   - What's unclear: Whether the project wants to enforce minimum coverage percentages now or defer to later
   - Recommendation: Install the coverage provider but don't set thresholds in this phase. The requirements only ask for specific test coverage areas, not percentage gates.

2. **Playwright test scope for this phase**
   - What we know: TEST-07 requires "WebKit + Chromium test targets configured." TEST-05/TEST-06 describe game flow and state transition tests.
   - What's unclear: Whether TEST-05 and TEST-06 are pure Vitest integration tests (store-level), Playwright E2E tests, or both.
   - Recommendation: Implement TEST-05/TEST-06 as Vitest integration tests (faster, more reliable). Add a small set of Playwright E2E smoke tests to verify the app loads and basic click-through works. This satisfies all requirements without creating a brittle E2E suite.

3. **Vitest 4 TypeScript config conflict**
   - What we know: Some users report TypeScript errors when `vitest.config.ts` is included in the TS project context alongside Vite 7.1.x (missing `createImportMeta` property).
   - What's unclear: Whether this affects the project's specific `@vue/tsconfig` extends setup.
   - Recommendation: Create a separate `vitest.config.ts` (not merged into `vite.config.js`). If TS errors occur, exclude `vitest.config.ts` from `tsconfig.json` includes and create a `tsconfig.vitest.json` that extends it.

## Sources

### Primary (HIGH confidence)
- [Pinia testing cookbook](https://pinia.vuejs.org/cookbook/testing.html) - `setActivePinia`, `createTestingPinia`, action stubbing, getter overrides, Vitest `createSpy` gotcha
- [Capacitor plugin mocking guide](https://capacitorjs.com/docs/guides/mocking-plugins) - `__mocks__/` directory pattern, proxy-of-proxy problem explanation
- [Vitest guide](https://vitest.dev/guide/) - Installation, config with Vite, environment setup, globals option
- [Vitest timer mocking](https://vitest.dev/guide/mocking/timers) - `vi.useFakeTimers()`, `vi.advanceTimersByTime()`, timer control
- [Playwright CI setup](https://playwright.dev/docs/ci-intro) - GitHub Actions workflow YAML, `--with-deps` flag
- [Playwright webServer config](https://playwright.dev/docs/test-webserver) - Dev server integration, `reuseExistingServer`, `baseURL`
- npm registry (verified via `npm view`) - vitest 4.0.18, @pinia/testing 1.0.3, @playwright/test 1.58.2, @vue/test-utils 2.4.6, happy-dom 20.7.0, @vitest/coverage-v8 4.0.18

### Secondary (MEDIUM confidence)
- [Vitest 4.0 release / InfoQ](https://www.infoq.com/news/2025/12/vitest-4-browser-mode/) - Vitest 4 stable browser mode, Vite 7 compatibility confirmed
- [Vitest browser mode docs](https://vitest.dev/guide/browser/) - Browser mode vs Node mode distinction, Playwright as browser provider

### Tertiary (LOW confidence)
- Various WebSearch results on Vitest 4 + Vite 7 TypeScript config conflict (single-source reports, not reproduced) - flagged in Open Questions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified via `npm view`, peer deps confirmed compatible with project's Vite 7.3, Vue 3.5, Pinia 3.0
- Architecture: HIGH - Patterns sourced from official Pinia testing cookbook and Capacitor mocking guide, verified against actual project store structure
- Pitfalls: HIGH - Proxy-of-proxy issue is documented by Capacitor team; eager init, timer leaks, and cross-store deps verified by reading actual source code

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (30 days -- stable ecosystem, no major releases imminent)
