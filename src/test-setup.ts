/**
 * Global test setup -- runs before each test file.
 *
 * CRITICAL: These stubs MUST exist before any store module is imported.
 * audioStore calls init() eagerly at module scope, which uses
 * window.AudioContext and fetch() to load sound files.
 */
import { vi } from 'vitest';

// --- AudioContext stub ---
globalThis.AudioContext = class MockAudioContext {
  state = 'running';

  resume(): Promise<void> {
    return Promise.resolve();
  }

  decodeAudioData(): Promise<AudioBuffer> {
    return Promise.resolve({} as AudioBuffer);
  }

  createBufferSource() {
    return {
      buffer: null as AudioBuffer | null,
      connect: vi.fn(),
      start: vi.fn(),
    };
  }

  destination = {};
} as unknown as typeof AudioContext;

// --- fetch stub ---
globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  }),
) as unknown as typeof fetch;

// --- localStorage stub ---
// persistenceStore.migrateFromLocalStorage accesses localStorage
globalThis.localStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
} as unknown as Storage;
