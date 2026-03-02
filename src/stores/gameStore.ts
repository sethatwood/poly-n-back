import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type {
  Stimulus,
  HighScoreData,
  RespondedThisTurn,
  FeedbackState,
  StimulusAttribute,
  StimulusColor,
  StimulusEmoji,
  StimulusPosition,
  StimulusShape,
  SoundName,
} from '@/types/game';
import { useAudioStore } from './audioStore';
import { usePersistenceStore } from './persistenceStore';
import { hapticsCorrect, hapticsIncorrect, hapticsGameOver } from '@/utils/haptics';

export const useGameStore = defineStore('game', () => {
  // Cross-store references -- MUST come before any await (Pinia composition rule)
  const audioStore = useAudioStore();
  const persistenceStore = usePersistenceStore();
  // ---- State (refs) ----
  const currentStimulus = ref<Stimulus>({
    color: 'purple',
    emoji: 'fire',
    position: 'left',
    shape: 'circle',
  });
  const deterministicIndex = ref(0);
  const deterministicStimuli = ref<Stimulus[]>([
    { color: 'blue', emoji: 'flower', position: 'center', shape: 'square' },
    { color: 'green', emoji: 'ice', position: 'left', shape: 'triangle' },
    { color: 'blue', emoji: 'fire', position: 'right', shape: 'circle' },
    { color: 'green', emoji: 'flower', position: 'center', shape: 'square' },
    { color: 'blue', emoji: 'ice', position: 'left', shape: 'triangle' },
    { color: 'green', emoji: 'flower', position: 'right', shape: 'circle' },
  ]);
  const flashBorder = ref(false);
  const highScoreData = ref<HighScoreData>({
    score: 0,
    potentialCorrectAnswers: 0,
    nBack: null,
  });
  const incorrectResponses = ref(0);
  const isNewHighScore = ref(false);
  const showGameOverModal = ref(false);
  const isAudioEnabled = ref(true);
  const isHapticsEnabled = ref(false);
  const isDeterministic = ref(false);
  const isPaused = ref(false);
  const isStopped = ref(false);
  const level = ref(1);
  const timerInterval = ref(5);
  const nBack = ref(2);
  const potentialCorrectAnswers = ref(0);
  const previousPotentialCorrectAnswers = ref(0);
  const respondedThisTurn = ref<RespondedThisTurn>({
    color: false,
    emoji: false,
    position: false,
    shape: false,
  });
  const lastFeedback = ref<FeedbackState>({
    type: null,
    button: null,
    timestamp: null,
  });
  const score = ref(0);
  const stimulusHistory = ref<Stimulus[]>([]);
  const timeLeft = ref(5);
  const timer = ref<ReturnType<typeof setInterval> | null>(null);

  // ---- Persistence ----
  async function loadPersistedState(): Promise<void> {
    await persistenceStore.migrateFromLocalStorage();
    highScoreData.value = await persistenceStore.loadPreference(
      'highScoreData',
      {
        score: 0,
        potentialCorrectAnswers: 0,
        nBack: null,
      },
    );
    isAudioEnabled.value = await persistenceStore.loadPreference(
      'isAudioEnabled',
      true,
    );
    isHapticsEnabled.value = await persistenceStore.loadPreference(
      'isHapticsEnabled',
      false,
    );
  }

  // ---- Getters (computed) ----
  const isEarlyInGame = computed(() => {
    const nBackIndex = stimulusHistory.value.length - nBack.value - 1;
    return nBackIndex < 0;
  });

  const finalScoreAccuracy = computed(() => {
    if (previousPotentialCorrectAnswers.value === 0) return 0;
    return Math.round(
      (score.value / previousPotentialCorrectAnswers.value) * 100,
    );
  });

  const highScoreAccuracy = computed(() => {
    const highScorePotential = highScoreData.value.potentialCorrectAnswers;
    if (highScorePotential === 0) return 0;
    return Math.round((highScoreData.value.score / highScorePotential) * 100);
  });

  // ---- Actions (functions) ----
  function generateRandomStimulus(): Stimulus {
    const colors: StimulusColor[] = ['purple', 'green', 'blue'];
    const emojis: StimulusEmoji[] = ['fire', 'ice', 'flower'];
    const positions: StimulusPosition[] = ['left', 'center', 'right'];
    const shapes: StimulusShape[] = ['circle', 'square', 'triangle'];

    return {
      color: colors[Math.floor(Math.random() * colors.length)]!,
      emoji: emojis[Math.floor(Math.random() * emojis.length)]!,
      position: positions[Math.floor(Math.random() * positions.length)]!,
      shape: shapes[Math.floor(Math.random() * shapes.length)]!,
    };
  }

  function setNewStimulus(): void {
    if (isStopped.value || isPaused.value) {
      return;
    }

    respondedThisTurn.value = {
      color: false,
      emoji: false,
      position: false,
      shape: false,
    };

    // Reset feedback state for new turn
    lastFeedback.value = {
      type: null,
      button: null,
      timestamp: null,
    };

    potentialCorrectAnswers.value = previousPotentialCorrectAnswers.value;

    if (isDeterministic.value) {
      currentStimulus.value =
        deterministicStimuli.value[deterministicIndex.value]!;
      deterministicIndex.value =
        (deterministicIndex.value + 1) % deterministicStimuli.value.length;
    } else {
      currentStimulus.value = generateRandomStimulus();
    }

    // Increase potential correct answers after enough history is available
    if (stimulusHistory.value.length >= nBack.value) {
      const nBackStimulus =
        stimulusHistory.value[stimulusHistory.value.length - nBack.value]!;
      let potentialMatches = 0;

      if (nBackStimulus.color === currentStimulus.value.color)
        potentialMatches++;
      if (nBackStimulus.emoji === currentStimulus.value.emoji)
        potentialMatches++;
      if (nBackStimulus.position === currentStimulus.value.position)
        potentialMatches++;
      if (nBackStimulus.shape === currentStimulus.value.shape)
        potentialMatches++;

      previousPotentialCorrectAnswers.value += potentialMatches;
    }

    stimulusHistory.value.push({ ...currentStimulus.value });

    // FIX-04: Cap stimulus history to prevent unbounded memory growth
    const maxHistory = nBack.value + 50;
    if (stimulusHistory.value.length > maxHistory) {
      stimulusHistory.value = stimulusHistory.value.slice(-maxHistory);
    }

    flashBorder.value = true;
    playSound('stimulus');
    setTimeout(() => {
      flashBorder.value = false;
    }, 300);
  }

  function toggleAudio(): void {
    isAudioEnabled.value = !isAudioEnabled.value;
    persistenceStore.savePreference('isAudioEnabled', isAudioEnabled.value);
  }

  function toggleHaptics(): void {
    isHapticsEnabled.value = !isHapticsEnabled.value;
    persistenceStore.savePreference('isHapticsEnabled', isHapticsEnabled.value);
  }

  // Unlock audio on iOS - call this on first user interaction
  function unlockAudio(): void {
    audioStore.unlock();
  }

  function playSound(soundName: SoundName): void {
    if (isAudioEnabled.value) {
      audioStore.play(soundName);
    }
  }

  function toggleDeterministicMode(): void {
    isDeterministic.value = !isDeterministic.value;
    startGame();
  }

  function resetGameState(): void {
    clearInterval(timer.value!);
    score.value = 0;
    incorrectResponses.value = 0;
    timeLeft.value = 5;
    isPaused.value = false;
    isStopped.value = false;
    showGameOverModal.value = false;
    isNewHighScore.value = false;
    stimulusHistory.value = [];
    potentialCorrectAnswers.value = 0;
    previousPotentialCorrectAnswers.value = 0;
    respondedThisTurn.value = {
      color: false,
      emoji: false,
      position: false,
      shape: false,
    };
    deterministicIndex.value = 0;
    setNewStimulus();
  }

  function dismissGameOverModal(): void {
    showGameOverModal.value = false;
    isNewHighScore.value = false;
  }

  function resetHighScore(): void {
    highScoreData.value = { score: 0, potentialCorrectAnswers: 0, nBack: null };
    persistenceStore.savePreference('highScoreData', highScoreData.value);
  }

  function startGame(timeLeftParam: number = 5): void {
    // Unlock audio on iOS when user starts game
    unlockAudio();
    resetGameState();
    timerInterval.value = timeLeftParam;
    timeLeft.value = timeLeftParam;
    timer.value = setInterval(() => {
      if (isPaused.value) return;
      if (timeLeft.value > 1) {
        timeLeft.value -= 1;
      } else {
        setNewStimulus();
        timeLeft.value = timerInterval.value;
      }
    }, 1000);
  }

  function pauseGame(): void {
    isPaused.value = true;
  }

  function resumeGame(): void {
    isPaused.value = false;
  }

  function stopGame(): void {
    clearInterval(timer.value!);
    isStopped.value = true;
  }

  function respondToStimulus(stimulusType: StimulusAttribute): void {
    // FIX-03: Debounce guard -- block rapid taps on the same button per turn
    if (respondedThisTurn.value[stimulusType]) return;
    respondedThisTurn.value[stimulusType] = true;

    const nBackIndex = stimulusHistory.value.length - nBack.value - 1;

    if (nBackIndex >= 0) {
      const nBackStimulus = stimulusHistory.value[nBackIndex]!;

      const isCorrect =
        (stimulusType === 'color' &&
          currentStimulus.value.color === nBackStimulus.color) ||
        (stimulusType === 'emoji' &&
          currentStimulus.value.emoji === nBackStimulus.emoji) ||
        (stimulusType === 'position' &&
          currentStimulus.value.position === nBackStimulus.position) ||
        (stimulusType === 'shape' &&
          currentStimulus.value.shape === nBackStimulus.shape);

      // Set feedback state for visual effects
      lastFeedback.value = {
        type: isCorrect ? 'correct' : 'incorrect',
        button: stimulusType,
        timestamp: Date.now(),
      };

      if (isCorrect) {
        score.value += 1;
        playSound('increment');
        if (isHapticsEnabled.value) hapticsCorrect();
      } else {
        playSound('strike');
        if (isHapticsEnabled.value) hapticsIncorrect();
        incorrectResponses.value += 1;

        if (incorrectResponses.value >= 3) {
          const currentAccuracy =
            previousPotentialCorrectAnswers.value === 0
              ? 0
              : Math.round(
                  (score.value / previousPotentialCorrectAnswers.value) * 100,
                );
          const hsAccuracy =
            highScoreData.value.potentialCorrectAnswers === 0
              ? 0
              : Math.round(
                  (highScoreData.value.score /
                    highScoreData.value.potentialCorrectAnswers) *
                    100,
                );

          const isNewHS = score.value > highScoreData.value.score;
          const isSameScoreButBetterAccuracy =
            score.value === highScoreData.value.score &&
            currentAccuracy > hsAccuracy;
          const isHigherNBack = nBack.value > highScoreData.value.nBack!;

          // Track if this is a new high score before updating
          isNewHighScore.value =
            isNewHS || isSameScoreButBetterAccuracy || isHigherNBack;

          if (isNewHighScore.value) {
            highScoreData.value = {
              score: score.value,
              potentialCorrectAnswers: previousPotentialCorrectAnswers.value,
              nBack: nBack.value,
            };
            persistenceStore.savePreference(
              'highScoreData',
              highScoreData.value,
            );
          }

          stopGame();
          if (isHapticsEnabled.value) hapticsGameOver();
          showGameOverModal.value = true;
        }
      }
    }
  }

  return {
    // state (refs)
    currentStimulus,
    deterministicIndex,
    deterministicStimuli,
    flashBorder,
    highScoreData,
    incorrectResponses,
    isNewHighScore,
    showGameOverModal,
    isAudioEnabled,
    isHapticsEnabled,
    isDeterministic,
    isPaused,
    isStopped,
    level,
    timerInterval,
    nBack,
    potentialCorrectAnswers,
    previousPotentialCorrectAnswers,
    respondedThisTurn,
    lastFeedback,
    score,
    stimulusHistory,
    timeLeft,
    timer,
    // getters (computed)
    isEarlyInGame,
    finalScoreAccuracy,
    highScoreAccuracy,
    // actions (functions)
    loadPersistedState,
    generateRandomStimulus,
    setNewStimulus,
    toggleAudio,
    toggleHaptics,
    unlockAudio,
    playSound,
    toggleDeterministicMode,
    resetGameState,
    dismissGameOverModal,
    resetHighScore,
    startGame,
    pauseGame,
    resumeGame,
    stopGame,
    respondToStimulus,
  };
});
