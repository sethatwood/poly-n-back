import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import stimulusSoundUrl from '../assets/stimulus.wav';
import incrementSoundUrl from '../assets/ting.mp3';
import strikeSoundUrl from '../assets/whip.mp3';

// Web Audio API manager - much better iOS support for concurrent sounds
const audioManager = {
  context: null,
  buffers: {},
  unlocked: false,

  async init() {
    // Create audio context (will be suspended on iOS until user gesture)
    this.context = new (window.AudioContext || window.webkitAudioContext)();

    // Load all sound buffers
    await Promise.all([
      this.loadSound('stimulus', stimulusSoundUrl),
      this.loadSound('increment', incrementSoundUrl),
      this.loadSound('strike', strikeSoundUrl),
    ]);
  },

  async loadSound(name, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.buffers[name] = await this.context.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`, error);
    }
  },

  // Call this on first user interaction to unlock audio on iOS
  unlock() {
    if (this.unlocked || !this.context) return;

    // Resume the audio context (required on iOS after user gesture)
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    this.unlocked = true;
  },

  play(soundName) {
    if (!this.context || !this.buffers[soundName]) return;

    // Make sure context is running
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    // Create a new buffer source for each play (they're one-shot)
    const source = this.context.createBufferSource();
    source.buffer = this.buffers[soundName];
    source.connect(this.context.destination);
    source.start(0);
  },
};

// Initialize audio manager
audioManager.init();

export const useGameStore = defineStore('game', () => {
  // ---- State (refs) ----
  const currentStimulus = ref({});
  const deterministicIndex = ref(0);
  const deterministicStimuli = ref([
    { color: 'blue', emoji: 'flower', position: 'center', shape: 'square' },
    { color: 'green', emoji: 'ice', position: 'left', shape: 'triangle' },
    { color: 'blue', emoji: 'fire', position: 'right', shape: 'circle' },
    { color: 'green', emoji: 'flower', position: 'center', shape: 'square' },
    { color: 'blue', emoji: 'ice', position: 'left', shape: 'triangle' },
    { color: 'green', emoji: 'flower', position: 'right', shape: 'circle' },
  ]);
  const flashBorder = ref(false);
  const highScoreData = ref(
    JSON.parse(localStorage.getItem('highScoreData')) || {
      score: 0,
      potentialCorrectAnswers: 0,
      nBack: null,
    },
  );
  const incorrectResponses = ref(0);
  const isNewHighScore = ref(false);
  const showGameOverModal = ref(false);
  const isAudioEnabled = ref(
    JSON.parse(localStorage.getItem('isAudioEnabled')) ?? true,
  );
  const isDeterministic = ref(false);
  const isPaused = ref(false);
  const isStopped = ref(false);
  const level = ref(1);
  const timerInterval = ref(5);
  const nBack = ref(2);
  const potentialCorrectAnswers = ref(0);
  const previousPotentialCorrectAnswers = ref(0);
  const respondedThisTurn = ref({
    color: false,
    emoji: false,
    position: false,
    shape: false,
  });
  const lastFeedback = ref({
    type: null, // 'correct' or 'incorrect'
    button: null, // which button was pressed
    timestamp: null, // for animation timing
  });
  const score = ref(0);
  const stimulusHistory = ref([]);
  const timeLeft = ref(5);
  const timer = ref(null);

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
  function generateRandomStimulus() {
    const colors = ['purple', 'green', 'blue'];
    const emojis = ['fire', 'ice', 'flower'];
    const positions = ['left', 'center', 'right'];
    const shapes = ['circle', 'square', 'triangle'];

    return {
      color: colors[Math.floor(Math.random() * colors.length)],
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      position: positions[Math.floor(Math.random() * positions.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    };
  }

  function setNewStimulus() {
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
        deterministicStimuli.value[deterministicIndex.value];
      deterministicIndex.value =
        (deterministicIndex.value + 1) % deterministicStimuli.value.length;
    } else {
      currentStimulus.value = generateRandomStimulus();
    }

    // Increase potential correct answers after enough history is available
    if (stimulusHistory.value.length >= nBack.value) {
      const nBackStimulus =
        stimulusHistory.value[stimulusHistory.value.length - nBack.value];
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

  function toggleAudio() {
    isAudioEnabled.value = !isAudioEnabled.value;
    localStorage.setItem(
      'isAudioEnabled',
      JSON.stringify(isAudioEnabled.value),
    );
  }

  // Unlock audio on iOS - call this on first user interaction
  function unlockAudio() {
    audioManager.unlock();
  }

  function playSound(soundName) {
    if (isAudioEnabled.value) {
      audioManager.play(soundName);
    }
  }

  function toggleDeterministicMode() {
    isDeterministic.value = !isDeterministic.value;
    startGame();
  }

  function resetGameState() {
    clearInterval(timer.value);
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

  function dismissGameOverModal() {
    showGameOverModal.value = false;
    isNewHighScore.value = false;
  }

  function resetHighScore() {
    highScoreData.value = { score: 0, potentialCorrectAnswers: 0 };
    localStorage.setItem('highScoreData', JSON.stringify(highScoreData.value));
  }

  function startGame(timeLeftParam = 5) {
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

  function pauseGame() {
    isPaused.value = true;
  }

  function resumeGame() {
    isPaused.value = false;
  }

  function stopGame() {
    clearInterval(timer.value);
    isStopped.value = true;
  }

  function respondToStimulus(stimulusType) {
    // FIX-03: Debounce guard -- block rapid taps on the same button per turn
    if (respondedThisTurn.value[stimulusType]) return;
    respondedThisTurn.value[stimulusType] = true;

    const nBackIndex = stimulusHistory.value.length - nBack.value - 1;

    if (nBackIndex >= 0) {
      const nBackStimulus = stimulusHistory.value[nBackIndex];

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
      } else {
        playSound('strike');
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
          const isHigherNBack = nBack.value > highScoreData.value.nBack;

          // Track if this is a new high score before updating
          isNewHighScore.value =
            isNewHS || isSameScoreButBetterAccuracy || isHigherNBack;

          if (isNewHighScore.value) {
            highScoreData.value = {
              score: score.value,
              potentialCorrectAnswers: previousPotentialCorrectAnswers.value,
              nBack: nBack.value,
            };
            localStorage.setItem(
              'highScoreData',
              JSON.stringify(highScoreData.value),
            );
          }

          stopGame();
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
    generateRandomStimulus,
    setNewStimulus,
    toggleAudio,
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
