import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from '@/stores/gameStore';

// Mock only external platform API -- stores are REAL
vi.mock('@capacitor/preferences');

describe('full game flow: start -> play -> game over', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.clearAllTimers();
    vi.useRealTimers();
    const { Preferences } = await import('@capacitor/preferences');
    (Preferences as any)._reset();
  });

  it('complete game from start to game over via 3 strikes', () => {
    const gameStore = useGameStore();
    gameStore.isDeterministic = true;
    gameStore.nBack = 2;

    // Start game with 3-second interval
    gameStore.startGame(3);

    // After startGame: resetGameState calls setNewStimulus -> stimulus[0] loaded
    expect(gameStore.isStopped).toBe(false);
    expect(gameStore.score).toBe(0);
    expect(gameStore.incorrectResponses).toBe(0);
    expect(gameStore.stimulusHistory.length).toBe(1);

    // Advance timer to build nBack history
    // At 3000ms: timer ticks 3->2->1->setNewStimulus (stimulus[1])
    vi.advanceTimersByTime(3000);
    expect(gameStore.stimulusHistory.length).toBe(2);

    // At 6000ms: stimulus[2] loaded
    vi.advanceTimersByTime(3000);
    expect(gameStore.stimulusHistory.length).toBe(3);

    // Deterministic stimuli:
    // [0] blue/flower/center/square
    // [1] green/ice/left/triangle
    // [2] blue/fire/right/circle
    // nBack=2, so compare current (idx 2) vs nBack-ago (idx 0)
    // emoji differs (fire vs flower) -> incorrect
    gameStore.respondToStimulus('emoji');
    expect(gameStore.incorrectResponses).toBe(1);

    // Advance to next stimulus[3]: green/flower/center/square
    vi.advanceTimersByTime(3000);
    expect(gameStore.stimulusHistory.length).toBe(4);

    // Compare current (idx 3) vs nBack-ago (idx 1): emoji differs (flower vs ice) -> incorrect
    gameStore.respondToStimulus('emoji');
    expect(gameStore.incorrectResponses).toBe(2);

    // Advance to next stimulus[4]: blue/ice/left/triangle
    vi.advanceTimersByTime(3000);
    expect(gameStore.stimulusHistory.length).toBe(5);

    // Compare current (idx 4) vs nBack-ago (idx 2): emoji differs (ice vs fire) -> incorrect
    gameStore.respondToStimulus('emoji');
    expect(gameStore.incorrectResponses).toBe(3);

    // 3 strikes -> game over
    expect(gameStore.isStopped).toBe(true);
    expect(gameStore.showGameOverModal).toBe(true);
  });

  it('score increments on correct matches across real stores', () => {
    const gameStore = useGameStore();
    gameStore.isDeterministic = true;
    gameStore.nBack = 2;

    gameStore.startGame(3);

    // Build nBack history: 2 timer cycles to get 3 stimuli
    vi.advanceTimersByTime(6000);
    expect(gameStore.stimulusHistory.length).toBe(3);

    // Deterministic: stimulus[0].color = blue, stimulus[2].color = blue -> match!
    gameStore.respondToStimulus('color');
    expect(gameStore.score).toBe(1);
  });

  it('high score persists to Preferences on game over', async () => {
    const gameStore = useGameStore();
    gameStore.isDeterministic = true;
    gameStore.nBack = 2;

    gameStore.startGame(3);

    // Build history and get a correct answer first for score > 0
    vi.advanceTimersByTime(6000);
    gameStore.respondToStimulus('color'); // correct: blue=blue
    expect(gameStore.score).toBe(1);

    // Now drive 3 strikes for game over
    // stimulus[2] -> respond emoji (incorrect), strike 1
    gameStore.respondToStimulus('emoji');
    expect(gameStore.incorrectResponses).toBe(1);

    vi.advanceTimersByTime(3000); // stimulus[3]
    gameStore.respondToStimulus('emoji'); // incorrect, strike 2
    expect(gameStore.incorrectResponses).toBe(2);

    vi.advanceTimersByTime(3000); // stimulus[4]
    gameStore.respondToStimulus('emoji'); // incorrect, strike 3 -> game over
    expect(gameStore.incorrectResponses).toBe(3);
    expect(gameStore.isStopped).toBe(true);

    // Verify high score was persisted to Preferences
    const { Preferences } = await import('@capacitor/preferences');
    const result = await Preferences.get({ key: 'highScoreData' });
    expect(result.value).not.toBeNull();

    const saved = JSON.parse(result.value!);
    expect(saved.score).toBe(1);
    expect(saved.nBack).toBe(2);
  });

  it('loadPersistedState restores high score from Preferences', async () => {
    // Pre-populate Preferences with a high score
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({
      key: 'highScoreData',
      value: JSON.stringify({
        score: 10,
        potentialCorrectAnswers: 20,
        nBack: 2,
      }),
    });

    const gameStore = useGameStore();
    await gameStore.loadPersistedState();

    expect(gameStore.highScoreData.score).toBe(10);
    expect(gameStore.highScoreData.potentialCorrectAnswers).toBe(20);
    expect(gameStore.highScoreData.nBack).toBe(2);
  });

  it('audio toggle persists across stores', async () => {
    const gameStore = useGameStore();

    // Initially audio is enabled
    expect(gameStore.isAudioEnabled).toBe(true);

    // Toggle audio off
    gameStore.toggleAudio();
    expect(gameStore.isAudioEnabled).toBe(false);

    // Verify persisted to Preferences (via persistenceStore)
    const { Preferences } = await import('@capacitor/preferences');
    const result = await Preferences.get({ key: 'isAudioEnabled' });
    expect(result.value).toBe('false');
  });
});
