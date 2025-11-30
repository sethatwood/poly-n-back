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
    isStopped: false,
    level: 1,
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

      const stimulus = {
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        position: positions[Math.floor(Math.random() * positions.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      };
      // console.log("Generated random stimulus:", stimulus);
      return stimulus;
    },
    setNewStimulus() {
      if (this.isStopped) {
        console.log("Game is paused. Skipping setNewStimulus.");
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

        const colorMatch = nBackStimulus.color === this.currentStimulus.color;
        const emojiMatch = nBackStimulus.emoji === this.currentStimulus.emoji;
        const positionMatch = nBackStimulus.position === this.currentStimulus.position;
        const shapeMatch = nBackStimulus.shape === this.currentStimulus.shape;

        potentialMatches += colorMatch ? 1 : 0;
        potentialMatches += emojiMatch ? 1 : 0;
        potentialMatches += positionMatch ? 1 : 0;
        potentialMatches += shapeMatch ? 1 : 0;

        this.previousPotentialCorrectAnswers += potentialMatches;

        console.log("Updated `previousPotentialCorrectAnswers`:", this.previousPotentialCorrectAnswers);
        console.log("Potential match details:", { positionMatch, colorMatch, shapeMatch, emojiMatch });
      }

      this.stimulusHistory.push({ ...this.currentStimulus });
      console.log("Setting new stimulus:", { ...this.currentStimulus });
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
      console.log(`Deterministic mode toggled. Now: ${this.isDeterministic}`);
      this.startGame();
    },
    resetGameState() {
      console.log("Resetting game state");
      clearInterval(this.timer);
      this.score = 0;
      this.incorrectResponses = 0;
      this.timeLeft = 5;
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
      console.log("Resetting high score");
      this.highScoreData = { score: 0, potentialCorrectAnswers: 0 };
      localStorage.setItem('highScoreData', JSON.stringify(this.highScoreData));
    },
    startGame(timeLeft = 5) {
      console.log("Starting game");
      this.resetGameState();
      this.timeLeft = timeLeft;
      this.timer = setInterval(() => {
        if (this.timeLeft > 1) {
            this.timeLeft -= 1;
        } else {
            this.setNewStimulus();
            this.timeLeft = timeLeft;
        }
      }, 1000);
    },
    stopGame() {
      console.log("Stopping game");
      clearInterval(this.timer);
      this.isStopped = true;
    },
    respondToStimulus(stimulusType) {
      console.log(`Responding to stimulus: ${stimulusType}`);
      const nBackIndex = this.stimulusHistory.length - this.nBack - 1;
      console.log(`nBackIndex: ${nBackIndex}`);

      if (nBackIndex >= 0) {
        const nBackStimulus = this.stimulusHistory[nBackIndex];
        console.log("Comparing current stimulus and n-back stimulus", {current: this.currentStimulus, nBack: nBackStimulus});

        const isCorrect = (
          stimulusType === 'color' && this.currentStimulus.color === nBackStimulus.color ||
          stimulusType === 'emoji' && this.currentStimulus.emoji === nBackStimulus.emoji ||
          stimulusType === 'position' && this.currentStimulus.position === nBackStimulus.position ||
          stimulusType === 'shape' && this.currentStimulus.shape === nBackStimulus.shape
        );

        console.log("Is response correct:", isCorrect);

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
        console.log(`Response is ${isCorrect ? 'correct' : 'incorrect'}. Score: ${this.score}`);
      } else {
        console.log("Not enough turns have passed to respond.");
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
