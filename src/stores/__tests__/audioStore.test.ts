import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

describe('audioStore', () => {
  // ---- Successful Initialization ----

  describe('successful initialization', () => {
    beforeEach(() => {
      vi.resetModules();
      setActivePinia(createPinia());

      // Restore default AudioContext stub (same as test-setup.ts)
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

      globalThis.fetch = vi.fn(() =>
        Promise.resolve({
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        }),
      ) as unknown as typeof fetch;
    });

    it('sets ready=true when AudioContext and sounds load successfully', async () => {
      const { useAudioStore } = await import('@/stores/audioStore');
      setActivePinia(createPinia());
      const store = useAudioStore();

      // init() is async but fires eagerly -- give microtasks time to settle
      await vi.dynamicImportSettled();

      expect(store.ready).toBe(true);
    });

    it('loads all three sound buffers', async () => {
      const fetchSpy = globalThis.fetch as ReturnType<typeof vi.fn>;
      const { useAudioStore } = await import('@/stores/audioStore');
      setActivePinia(createPinia());
      useAudioStore();

      await vi.dynamicImportSettled();

      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
  });

  // ---- Initialization Failure ----

  describe('initialization failure', () => {
    beforeEach(() => {
      vi.resetModules();

      globalThis.fetch = vi.fn(() =>
        Promise.resolve({
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        }),
      ) as unknown as typeof fetch;
    });

    it('sets ready=false when AudioContext constructor throws', async () => {
      globalThis.AudioContext = class ThrowingContext {
        constructor() {
          throw new Error('AudioContext not supported');
        }
      } as unknown as typeof AudioContext;

      setActivePinia(createPinia());
      const { useAudioStore } = await import('@/stores/audioStore');
      const store = useAudioStore();

      await vi.dynamicImportSettled();

      expect(store.ready).toBe(false);
    });

    it('sets ready=false when AudioContext is not available', async () => {
      // Remove AudioContext and webkitAudioContext from window
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
      (globalThis as any).AudioContext = undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
      (window as any).AudioContext = undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
      (window as any).webkitAudioContext = undefined;

      setActivePinia(createPinia());
      const { useAudioStore } = await import('@/stores/audioStore');
      const store = useAudioStore();

      await vi.dynamicImportSettled();

      expect(store.ready).toBe(false);
    });

    it('remains ready=true even when individual sound fails to load', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('network error'));
        }
        return Promise.resolve({
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        });
      }) as unknown as typeof fetch;

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

      setActivePinia(createPinia());
      const { useAudioStore } = await import('@/stores/audioStore');
      const store = useAudioStore();

      await vi.dynamicImportSettled();

      // Promise.allSettled means partial failures are tolerated
      expect(store.ready).toBe(true);
    });
  });

  // ---- Graceful Degradation - play() ----

  describe('graceful degradation - play()', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('play is a no-op when ready is false', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
      (globalThis as any).AudioContext = undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
      (window as any).AudioContext = undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
      (window as any).webkitAudioContext = undefined;
      globalThis.fetch = vi.fn() as unknown as typeof fetch;

      setActivePinia(createPinia());
      const { useAudioStore } = await import('@/stores/audioStore');
      const store = useAudioStore();

      await vi.dynamicImportSettled();

      expect(store.ready).toBe(false);
      // Should not throw
      expect(() => store.play('stimulus')).not.toThrow();
    });

    it('play is a no-op when context is null', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
      (globalThis as any).AudioContext = undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
      (window as any).AudioContext = undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
      (window as any).webkitAudioContext = undefined;
      globalThis.fetch = vi.fn() as unknown as typeof fetch;

      setActivePinia(createPinia());
      const { useAudioStore } = await import('@/stores/audioStore');
      const store = useAudioStore();

      await vi.dynamicImportSettled();

      // ready=false, context=null -- play should silently return
      expect(() => store.play('increment')).not.toThrow();
      expect(() => store.play('strike')).not.toThrow();
    });
  });

  // ---- Unlock ----

  describe('unlock', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('unlock resumes suspended AudioContext', async () => {
      const resumeSpy = vi.fn().mockResolvedValue(undefined);

      globalThis.AudioContext = class SuspendedContext {
        state = 'suspended';
        resume = resumeSpy;
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

      globalThis.fetch = vi.fn(() =>
        Promise.resolve({
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        }),
      ) as unknown as typeof fetch;

      setActivePinia(createPinia());
      const { useAudioStore } = await import('@/stores/audioStore');
      const store = useAudioStore();

      await vi.dynamicImportSettled();

      expect(store.ready).toBe(true);
      store.unlock();
      expect(resumeSpy).toHaveBeenCalled();
      expect(store.unlocked).toBe(true);
    });

    it('unlock is a no-op when already unlocked', async () => {
      const resumeSpy = vi.fn().mockResolvedValue(undefined);

      globalThis.AudioContext = class SuspendedContext {
        state = 'suspended';
        resume = resumeSpy;
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

      globalThis.fetch = vi.fn(() =>
        Promise.resolve({
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        }),
      ) as unknown as typeof fetch;

      setActivePinia(createPinia());
      const { useAudioStore } = await import('@/stores/audioStore');
      const store = useAudioStore();

      await vi.dynamicImportSettled();

      store.unlock();
      const callCountAfterFirst = resumeSpy.mock.calls.length;
      store.unlock(); // second call
      // resume should not be called again
      expect(resumeSpy.mock.calls.length).toBe(callCountAfterFirst);
    });

    it('unlock is a no-op when not ready', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
      (globalThis as any).AudioContext = undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
      (window as any).AudioContext = undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: remove browser API to simulate unsupported environment
      (window as any).webkitAudioContext = undefined;
      globalThis.fetch = vi.fn() as unknown as typeof fetch;

      setActivePinia(createPinia());
      const { useAudioStore } = await import('@/stores/audioStore');
      const store = useAudioStore();

      await vi.dynamicImportSettled();

      expect(store.ready).toBe(false);
      store.unlock();
      expect(store.unlocked).toBe(false);
    });
  });
});
