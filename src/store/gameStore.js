import { defineStore } from 'pinia';
import stimulusSound from '../assets/stimulus.wav';
import incrementSound from '../assets/ting.mp3';
import strikeSound from '../assets/whip.mp3';

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
    incrementSound: new Audio(incrementSound),
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
    score: 0,
    strikeSound: new Audio(strikeSound),
    stimulusHistory: [],
    stimulusSound: new Audio(stimulusSound),
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
      this.playSound(this.stimulusSound);
      setTimeout(() => {
        this.flashBorder = false;
      }, 300);
    },
    toggleAudio() {
      this.isAudioEnabled = !this.isAudioEnabled;
      localStorage.setItem('isAudioEnabled', JSON.stringify(this.isAudioEnabled));
    },
    playSound(sound) {
      if (this.isAudioEnabled) {
        sound.play();
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

        if (isCorrect) {
          this.score += 1;
          this.incrementSound.pause();
          this.incrementSound.currentTime = 0;
          this.playSound(this.incrementSound);
        } else {
          this.strikeSound.pause();
          this.strikeSound.currentTime = 0;
          this.playSound(this.strikeSound);
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
