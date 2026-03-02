import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '@/stores/gameStore';
import { useGameLifecycle } from '@/composables/useGameLifecycle';

// Mock only external platform API -- stores are REAL
vi.mock('@capacitor/preferences');

/**
 * Mounts a minimal Vue app so composables that use onUnmounted
 * have a real component lifecycle to hook into.
 */
function withSetup(gameStore: ReturnType<typeof useGameStore>) {
  let result!: ReturnType<typeof useGameLifecycle>;
  const app = createApp({
    setup() {
      result = useGameLifecycle(gameStore);
      return () => {};
    },
  });
  // Pinia is already active on the global scope, but we also install it on the
  // child app so any store access inside the composable resolves correctly.
  app.use(createPinia());
  app.mount(document.createElement('div'));
  return { result, app };
}

/**
 * Helper: drive the game to game over via 3 incorrect responses.
 * Assumes deterministic mode with nBack=2 and timerInterval=3.
 */
function driveToGameOver(gameStore: ReturnType<typeof useGameStore>) {
  // Need 3 stimuli before first response (nBack=2 means compare idx 2 vs idx 0)
  vi.advanceTimersByTime(6000); // stimulus[1] at 3s, stimulus[2] at 6s

  // Strike 1: emoji differs between stimulus[2] and stimulus[0]
  gameStore.respondToStimulus('emoji');

  // stimulus[3]
  vi.advanceTimersByTime(3000);
  // Strike 2: emoji differs between stimulus[3] and stimulus[1]
  gameStore.respondToStimulus('emoji');

  // stimulus[4]
  vi.advanceTimersByTime(3000);
  // Strike 3: emoji differs between stimulus[4] and stimulus[2] -> game over
  gameStore.respondToStimulus('emoji');
}

describe('state transitions: menu -> game -> pause -> resume -> game over -> menu', () => {
  let gameStore: ReturnType<typeof useGameStore>;
  let lifecycle: ReturnType<typeof useGameLifecycle>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    gameStore = useGameStore();
    gameStore.isDeterministic = true;
    gameStore.nBack = 2;

    const setup = withSetup(gameStore);
    lifecycle = setup.result;
  });

  afterEach(async () => {
    // Stop any running game timer before cleanup
    if (!gameStore.isStopped) {
      gameStore.stopGame();
    }
    vi.clearAllTimers();
    vi.useRealTimers();
    const { Preferences } = await import('@capacitor/preferences');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: _reset is a test-only method on the Preferences mock
    (Preferences as any)._reset();
  });

  it('startGame transitions from menu to active gameplay', () => {
    // Initial state: menu screen
    expect(lifecycle.showModal.value).toBe(true);

    // Start game
    lifecycle.startGame(5);

    // Should be on game screen, game running
    expect(lifecycle.showModal.value).toBe(false);
    expect(gameStore.isStopped).toBe(false);
    expect(gameStore.isPaused).toBe(false);
  });

  it('handlePause transitions to paused state', () => {
    lifecycle.startGame(3);
    const initialTimeLeft = gameStore.timeLeft;

    lifecycle.handlePause();
    expect(gameStore.isPaused).toBe(true);

    // Advance timer -- timeLeft should NOT decrement while paused
    vi.advanceTimersByTime(2000);
    expect(gameStore.timeLeft).toBe(initialTimeLeft);
  });

  it('handleResume returns to active gameplay', () => {
    lifecycle.startGame(3);

    lifecycle.handlePause();
    expect(gameStore.isPaused).toBe(true);

    lifecycle.handleResume();
    expect(gameStore.isPaused).toBe(false);

    // Advance timer -- timeLeft should decrement normally
    vi.advanceTimersByTime(1000);
    expect(gameStore.timeLeft).toBe(2);
  });

  it('handleQuit returns to menu from paused state', () => {
    lifecycle.startGame(5);

    lifecycle.handlePause();
    lifecycle.handleQuit();

    // Should be back on menu with game stopped
    expect(lifecycle.showModal.value).toBe(true);
    expect(gameStore.isStopped).toBe(true);
  });

  it('game over triggers modal, handleMainMenu returns to menu', () => {
    lifecycle.startGame(3);

    driveToGameOver(gameStore);

    // Game over state
    expect(gameStore.showGameOverModal).toBe(true);
    expect(gameStore.isStopped).toBe(true);

    // Return to main menu
    lifecycle.handleMainMenu();

    expect(gameStore.showGameOverModal).toBe(false);
    expect(lifecycle.showModal.value).toBe(true);
  });

  it('handlePlayAgain starts new game from game over', () => {
    lifecycle.startGame(3);
    driveToGameOver(gameStore);

    expect(gameStore.showGameOverModal).toBe(true);
    expect(gameStore.isStopped).toBe(true);

    // Play again
    lifecycle.handlePlayAgain(5);

    expect(gameStore.showGameOverModal).toBe(false);
    expect(lifecycle.showModal.value).toBe(false);
    expect(gameStore.isStopped).toBe(false);
    expect(gameStore.score).toBe(0);
  });

  it('handleGameOverClose dismisses modal without navigation', () => {
    lifecycle.startGame(3);
    driveToGameOver(gameStore);

    expect(gameStore.showGameOverModal).toBe(true);

    lifecycle.handleGameOverClose();

    expect(gameStore.showGameOverModal).toBe(false);
    // Still on game screen (not navigated to menu)
    expect(lifecycle.showModal.value).toBe(false);
  });

  it('full cycle: menu -> start -> pause -> resume -> game over -> play again -> game over -> main menu', () => {
    // 1. Menu
    expect(lifecycle.showModal.value).toBe(true);

    // 2. Start game
    lifecycle.startGame(3);
    expect(lifecycle.showModal.value).toBe(false);
    expect(gameStore.isStopped).toBe(false);

    // 3. Pause
    lifecycle.handlePause();
    expect(gameStore.isPaused).toBe(true);

    // 4. Resume
    lifecycle.handleResume();
    expect(gameStore.isPaused).toBe(false);

    // 5. Drive to game over
    driveToGameOver(gameStore);
    expect(gameStore.showGameOverModal).toBe(true);
    expect(gameStore.isStopped).toBe(true);

    // 6. Play again
    lifecycle.handlePlayAgain(3);
    expect(gameStore.showGameOverModal).toBe(false);
    expect(lifecycle.showModal.value).toBe(false);
    expect(gameStore.isStopped).toBe(false);
    expect(gameStore.score).toBe(0);
    expect(gameStore.incorrectResponses).toBe(0);

    // 7. Drive to game over again
    driveToGameOver(gameStore);
    expect(gameStore.showGameOverModal).toBe(true);
    expect(gameStore.isStopped).toBe(true);

    // 8. Return to main menu
    lifecycle.handleMainMenu();
    expect(gameStore.showGameOverModal).toBe(false);
    expect(lifecycle.showModal.value).toBe(true);
  });
});

describe('cleanup', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.clearAllTimers();
    vi.useRealTimers();
    const { Preferences } = await import('@capacitor/preferences');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: _reset is a test-only method on the Preferences mock
    (Preferences as any)._reset();
  });

  it('unmounting stops the game timer', () => {
    const gameStore = useGameStore();
    gameStore.isDeterministic = true;
    gameStore.nBack = 2;

    const { result: lifecycle, app } = withSetup(gameStore);

    // Start game -- timer is running
    lifecycle.startGame(5);
    expect(gameStore.isStopped).toBe(false);

    const timeLeftAfterStart = gameStore.timeLeft;

    // Unmount the app -- onUnmounted should call stopGame
    app.unmount();

    expect(gameStore.isStopped).toBe(true);

    // Advance time -- timeLeft should NOT change since timer was cleared
    vi.advanceTimersByTime(5000);
    expect(gameStore.timeLeft).toBe(timeLeftAfterStart);
  });
});
