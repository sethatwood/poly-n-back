import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from '@/stores/gameStore';

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
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  // ---- Stimulus Generation ----

  describe('stimulus generation', () => {
    it('generateRandomStimulus returns valid Stimulus', () => {
      const store = useGameStore();
      const stimulus = store.generateRandomStimulus();

      expect(['purple', 'green', 'blue']).toContain(stimulus.color);
      expect(['fire', 'ice', 'flower']).toContain(stimulus.emoji);
      expect(['left', 'center', 'right']).toContain(stimulus.position);
      expect(['circle', 'square', 'triangle']).toContain(stimulus.shape);
    });

    it('deterministic mode cycles through deterministicStimuli', () => {
      const store = useGameStore();
      store.isDeterministic = true;
      store.startGame(5);

      // startGame -> resetGameState -> setNewStimulus fires with index 0
      expect(store.currentStimulus).toEqual(store.deterministicStimuli[0]);

      // Advance timer to trigger next setNewStimulus: 5 seconds = 4 ticks of 1s countdown + 1 tick that fires setNewStimulus
      vi.advanceTimersByTime(5000);
      // After 5 ticks: timeLeft goes 5->4->3->2->1, then setNewStimulus fires with index 1
      expect(store.currentStimulus).toEqual(store.deterministicStimuli[1]);
    });

    it('setNewStimulus pushes to stimulusHistory', () => {
      const store = useGameStore();
      store.startGame(3);
      const initialLength = store.stimulusHistory.length;
      expect(initialLength).toBe(1); // resetGameState calls setNewStimulus once

      // Advance through one full interval: timeLeft goes 3->2->1, at 1 setNewStimulus fires
      vi.advanceTimersByTime(3000);
      expect(store.stimulusHistory.length).toBe(2);

      vi.advanceTimersByTime(3000);
      expect(store.stimulusHistory.length).toBe(3);
    });
  });

  // ---- Response Evaluation ----

  describe('response evaluation', () => {
    it('correct match increments score', () => {
      const store = useGameStore();
      store.isDeterministic = true;
      store.startGame(3);
      // nBack=2 default. After startGame, stimulusHistory = [index 0]
      // We need nBack+1 = 3 entries in history to have nBackIndex >= 0
      // Advance 2 full intervals to get 3 entries total
      vi.advanceTimersByTime(3000); // index 1 pushed, history=[0,1]
      vi.advanceTimersByTime(3000); // index 2 pushed, history=[0,1,2]

      // Current stimulus is index 2: { color: 'blue', emoji: 'fire', position: 'right', shape: 'circle' }
      // nBack stimulus is index 0: { color: 'blue', emoji: 'flower', position: 'center', shape: 'square' }
      // 'color' matches (both blue)
      expect(store.score).toBe(0);
      store.respondToStimulus('color');
      expect(store.score).toBe(1);
    });

    it('incorrect response increments strikes', () => {
      const store = useGameStore();
      store.isDeterministic = true;
      store.startGame(3);
      vi.advanceTimersByTime(3000); // history=[0,1]
      vi.advanceTimersByTime(3000); // history=[0,1,2]

      // Current=index2, nBack=index0
      // emoji: 'fire' vs 'flower' -- no match, so this is wrong
      expect(store.incorrectResponses).toBe(0);
      store.respondToStimulus('emoji');
      expect(store.incorrectResponses).toBe(1);
    });

    it('debounce prevents double response on same attribute in same turn', () => {
      const store = useGameStore();
      store.isDeterministic = true;
      store.startGame(3);
      vi.advanceTimersByTime(3000);
      vi.advanceTimersByTime(3000); // history=[0,1,2]

      const before = store.score + store.incorrectResponses;
      store.respondToStimulus('color'); // correct match (blue=blue)
      store.respondToStimulus('color'); // second tap should be ignored

      expect(store.respondedThisTurn.color).toBe(true);
      expect(store.score + store.incorrectResponses).toBe(before + 1);
    });

    it('response before nBack history is available is ignored', () => {
      const store = useGameStore();
      store.startGame(5);
      // Only 1 entry in history (from resetGameState). nBack=2, nBackIndex = 1-2-1 = -2 < 0
      store.respondToStimulus('color');
      expect(store.score).toBe(0);
      expect(store.incorrectResponses).toBe(0);
    });
  });

  // ---- Score Calculation ----

  describe('score calculation', () => {
    it('finalScoreAccuracy returns 0 when no potential answers', () => {
      const store = useGameStore();
      store.previousPotentialCorrectAnswers = 0;
      expect(store.finalScoreAccuracy).toBe(0);
    });

    it('finalScoreAccuracy calculates correct percentage', () => {
      const store = useGameStore();
      store.score = 3;
      store.previousPotentialCorrectAnswers = 10;
      expect(store.finalScoreAccuracy).toBe(30);
    });

    it('highScoreAccuracy returns 0 when no high score potential', () => {
      const store = useGameStore();
      expect(store.highScoreAccuracy).toBe(0);
    });

    it('highScoreAccuracy calculates from highScoreData', () => {
      const store = useGameStore();
      store.highScoreData = { score: 5, potentialCorrectAnswers: 20, nBack: 2 };
      expect(store.highScoreAccuracy).toBe(25);
    });
  });

  // ---- Turn Management ----

  describe('turn management', () => {
    it('startGame initializes timer and game state', () => {
      const store = useGameStore();
      store.startGame(5);

      expect(store.isStopped).toBe(false);
      expect(store.isPaused).toBe(false);
      expect(store.timerInterval).toBe(5);
      expect(store.timeLeft).toBe(5);
      expect(store.timer).not.toBeNull();
    });

    it('timer decrements timeLeft each second', () => {
      const store = useGameStore();
      store.startGame(5);
      expect(store.timeLeft).toBe(5);

      vi.advanceTimersByTime(1000);
      expect(store.timeLeft).toBe(4);

      vi.advanceTimersByTime(1000);
      expect(store.timeLeft).toBe(3);
    });

    it('timer triggers setNewStimulus when timeLeft reaches 1', () => {
      const store = useGameStore();
      store.startGame(3);
      // history starts with 1 entry from resetGameState
      expect(store.stimulusHistory.length).toBe(1);

      // Advance 3 seconds: 3->2->1 (setNewStimulus fires), timeLeft resets to 3
      vi.advanceTimersByTime(3000);
      expect(store.stimulusHistory.length).toBeGreaterThan(1);
    });

    it('pauseGame prevents timer from progressing', () => {
      const store = useGameStore();
      store.startGame(5);
      vi.advanceTimersByTime(1000); // timeLeft=4
      store.pauseGame();
      const timeLeftAfterPause = store.timeLeft;

      vi.advanceTimersByTime(3000);
      expect(store.timeLeft).toBe(timeLeftAfterPause);
    });

    it('resumeGame allows timer to continue', () => {
      const store = useGameStore();
      store.startGame(5);
      store.pauseGame();
      store.resumeGame();

      vi.advanceTimersByTime(1000);
      expect(store.timeLeft).toBe(4);
    });

    it('stopGame clears interval and sets isStopped', () => {
      const store = useGameStore();
      store.startGame(5);
      store.stopGame();
      expect(store.isStopped).toBe(true);

      const timeLeftAfterStop = store.timeLeft;
      vi.advanceTimersByTime(5000);
      expect(store.timeLeft).toBe(timeLeftAfterStop);
    });

    it('stimulus history is capped at nBack + 50', () => {
      const store = useGameStore();
      store.startGame(1);
      // nBack=2, cap = 52
      // With timerInterval=1, each 1s tick triggers setNewStimulus
      // We need >52 stimuli. Start with 1, then 60 ticks = 61 total.
      vi.advanceTimersByTime(60000);
      expect(store.stimulusHistory.length).toBeLessThanOrEqual(52);
    });
  });

  // ---- High Score Logic ----

  describe('high score logic', () => {
    it('game over after 3 strikes', () => {
      const store = useGameStore();
      store.isDeterministic = true;
      store.startGame(3);
      vi.advanceTimersByTime(3000); // history=[0,1]
      vi.advanceTimersByTime(3000); // history=[0,1,2]

      // Current=index2, nBack=index0
      // Non-matching attributes: emoji (fire vs flower), position (right vs center), shape (circle vs square)
      store.respondToStimulus('emoji'); // strike 1
      store.respondToStimulus('position'); // strike 2
      store.respondToStimulus('shape'); // strike 3

      expect(store.isStopped).toBe(true);
      expect(store.showGameOverModal).toBe(true);
    });

    it('new high score saved when score exceeds current', () => {
      const store = useGameStore();
      store.isDeterministic = true;
      store.highScoreData = { score: 0, potentialCorrectAnswers: 0, nBack: null };
      store.startGame(3);
      vi.advanceTimersByTime(3000); // history=[0,1]
      vi.advanceTimersByTime(3000); // history=[0,1,2]

      // Get a correct answer first (color matches: blue=blue)
      store.respondToStimulus('color'); // score=1

      // Now accumulate 3 strikes on wrong attributes
      store.respondToStimulus('emoji'); // strike 1
      store.respondToStimulus('position'); // strike 2
      store.respondToStimulus('shape'); // strike 3 => game over

      expect(store.isNewHighScore).toBe(true);
      expect(store.highScoreData.score).toBeGreaterThan(0);
    });

    it('resetHighScore clears high score data', () => {
      const store = useGameStore();
      store.highScoreData = { score: 10, potentialCorrectAnswers: 20, nBack: 2 };
      store.resetHighScore();
      expect(store.highScoreData.score).toBe(0);
    });

    it('dismissGameOverModal hides modal', () => {
      const store = useGameStore();
      store.showGameOverModal = true;
      store.dismissGameOverModal();
      expect(store.showGameOverModal).toBe(false);
    });
  });
});
