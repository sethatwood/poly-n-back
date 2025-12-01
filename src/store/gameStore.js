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
  }
};

// Initialize audio manager
audioManager.init();

export const useGameStore = defineStore('game', {
  state: () => ({
    currentStimulus: {},
    deterministicIndex: 0,
    deterministicStimuli: [
      { color: 'blue', emoji: 'flower', position: 'center', shape: 'square' },
      { color: 'green', emoji: 'ice', position: 'left', shape: 'triangle' },
      { color: 'blue', emoji: 'fire', position: 'right', shape: 'circle' },
      { color: 'green', emoji: 'flower', position: 'center', shape: 'square' },
      { color: 'blue', emoji: 'ice', position: 'left', shape: 'triangle' },
      { color: 'green', emoji: 'flower', position: 'right', shape: 'circle' },
    ],
    flashBorder: false,
    highScoreData: JSON.parse(localStorage.getItem('highScoreData')) || { score: 0, potentialCorrectAnswers: 0, nBack: null },
    incorrectResponses: 0,
    isNewHighScore: false,
    showGameOverModal: false,
    isAudioEnabled: JSON.parse(localStorage.getItem('isAudioEnabled')) ?? true,
    isDeterministic: false,
    isPaused: false,
    isStopped: false,
    level: 1,
    timerInterval: 5,
    nBack: 2,
    potentialCorrectAnswers: 0,
    previousPotentialCorrectAnswers: 0,
    respondedThisTurn: {
      color: false,
      emoji: false,
      position: false,
      shape: false,
    },
    lastFeedback: {
      type: null,      // 'correct' or 'incorrect'
      button: null,    // which button was pressed
      timestamp: null, // for animation timing
    },
    score: 0,
    stimulusHistory: [],
    timeLeft: 5,
    timer: null,
  }),
  actions: {
    generateRandomStimulus() {
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
    },
    setNewStimulus() {
      if (this.isStopped || this.isPaused) {
        return;
      }

      this.respondedThisTurn = {
        color: false,
        emoji: false,
        position: false,
        shape: false,
      };

      // Reset feedback state for new turn
      this.lastFeedback = {
        type: null,
        button: null,
        timestamp: null,
      };

      this.potentialCorrectAnswers = this.previousPotentialCorrectAnswers;

      if (this.isDeterministic) {
        this.currentStimulus = this.deterministicStimuli[this.deterministicIndex];
        this.deterministicIndex = (this.deterministicIndex + 1) % this.deterministicStimuli.length;
      } else {
        this.currentStimulus = this.generateRandomStimulus();
      }

      // Increase potential correct answers after enough history is available
      if (this.stimulusHistory.length >= this.nBack) {
        const nBackStimulus = this.stimulusHistory[this.stimulusHistory.length - this.nBack];
        let potentialMatches = 0;

        if (nBackStimulus.color === this.currentStimulus.color) potentialMatches++;
        if (nBackStimulus.emoji === this.currentStimulus.emoji) potentialMatches++;
        if (nBackStimulus.position === this.currentStimulus.position) potentialMatches++;
        if (nBackStimulus.shape === this.currentStimulus.shape) potentialMatches++;

        this.previousPotentialCorrectAnswers += potentialMatches;
      }

      this.stimulusHistory.push({ ...this.currentStimulus });
      this.flashBorder = true;
      this.playSound('stimulus');
      setTimeout(() => {
        this.flashBorder = false;
      }, 300);
    },
    toggleAudio() {
      this.isAudioEnabled = !this.isAudioEnabled;
      localStorage.setItem('isAudioEnabled', JSON.stringify(this.isAudioEnabled));
    },
    // Unlock audio on iOS - call this on first user interaction
    unlockAudio() {
      audioManager.unlock();
    },
    playSound(soundName) {
      if (this.isAudioEnabled) {
        audioManager.play(soundName);
      }
    },
    toggleDeterministicMode() {
      this.isDeterministic = !this.isDeterministic;
      this.startGame();
    },
    resetGameState() {
      clearInterval(this.timer);
      this.score = 0;
      this.incorrectResponses = 0;
      this.timeLeft = 5;
      this.isPaused = false;
      this.isStopped = false;
      this.showGameOverModal = false;
      this.isNewHighScore = false;
      this.stimulusHistory = [];
      this.potentialCorrectAnswers = 0;
      this.previousPotentialCorrectAnswers = 0;
      this.respondedThisTurn = {
        color: false,
        emoji: false,
        position: false,
        shape: false,
      };
      this.deterministicIndex = 0;
      this.setNewStimulus();
    },
    dismissGameOverModal() {
      this.showGameOverModal = false;
      this.isNewHighScore = false;
    },
    resetHighScore() {
      this.highScoreData = { score: 0, potentialCorrectAnswers: 0 };
      localStorage.setItem('highScoreData', JSON.stringify(this.highScoreData));
    },
    startGame(timeLeft = 5) {
      // Unlock audio on iOS when user starts game
      this.unlockAudio();
      this.resetGameState();
      this.timerInterval = timeLeft;
      this.timeLeft = timeLeft;
      this.timer = setInterval(() => {
        if (this.isPaused) return;
        if (this.timeLeft > 1) {
          this.timeLeft -= 1;
        } else {
          this.setNewStimulus();
          this.timeLeft = this.timerInterval;
        }
      }, 1000);
    },
    pauseGame() {
      this.isPaused = true;
    },
    resumeGame() {
      this.isPaused = false;
    },
    stopGame() {
      clearInterval(this.timer);
      this.isStopped = true;
    },
    respondToStimulus(stimulusType) {
      const nBackIndex = this.stimulusHistory.length - this.nBack - 1;

      if (nBackIndex >= 0) {
        const nBackStimulus = this.stimulusHistory[nBackIndex];

        const isCorrect = (
          stimulusType === 'color' && this.currentStimulus.color === nBackStimulus.color ||
          stimulusType === 'emoji' && this.currentStimulus.emoji === nBackStimulus.emoji ||
          stimulusType === 'position' && this.currentStimulus.position === nBackStimulus.position ||
          stimulusType === 'shape' && this.currentStimulus.shape === nBackStimulus.shape
        );

        // Set feedback state for visual effects
        this.lastFeedback = {
          type: isCorrect ? 'correct' : 'incorrect',
          button: stimulusType,
          timestamp: Date.now(),
        };

        if (isCorrect) {
          this.score += 1;
          this.playSound('increment');
        } else {
          this.playSound('strike');
          this.incorrectResponses += 1;

          if (this.incorrectResponses >= 3) {
            const currentAccuracy = Math.round((this.score / this.previousPotentialCorrectAnswers) * 100);
            const highScoreAccuracy = Math.round((this.highScoreData.score / this.highScoreData.potentialCorrectAnswers) * 100);

            const isNewHighScore = this.score > this.highScoreData.score;
            const isSameScoreButBetterAccuracy = this.score === this.highScoreData.score && currentAccuracy > highScoreAccuracy;
            const isHigherNBack = this.nBack > this.highScoreData.nBack;

            // Track if this is a new high score before updating
            this.isNewHighScore = isNewHighScore || isSameScoreButBetterAccuracy || isHigherNBack;

            if (this.isNewHighScore) {
              this.highScoreData = {
                score: this.score,
                potentialCorrectAnswers: this.previousPotentialCorrectAnswers,
                nBack: this.nBack
              };
              localStorage.setItem('highScoreData', JSON.stringify(this.highScoreData));
            }

            this.stopGame();
            this.showGameOverModal = true;
          }
        }
      }
      this.respondedThisTurn[stimulusType] = true;
    },
  },
  getters: {
    isEarlyInGame: (state) => {
      const nBackIndex = state.stimulusHistory.length - state.nBack - 1;
      return nBackIndex < 0;
    },
    finalScoreAccuracy: (state) => {
      if (state.potentialCorrectAnswers === 0) return 0;
      return Math.round((state.score / state.previousPotentialCorrectAnswers) * 100);
    },
    highScoreAccuracy: (state) => {
      const highScorePotential = state.highScoreData.potentialCorrectAnswers;
      if (highScorePotential === 0) return 0;
      return Math.round((state.highScoreData.score / highScorePotential) * 100);
    },
  },
});
