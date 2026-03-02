<template>
  <div class="w-screen max-w-md mx-auto px-4 text-center uppercase text-white relative">
    <GameTimer
      :time-left="gameStore.timeLeft"
      :is-paused="gameStore.isPaused"
      :show-feedback-toast="showFeedbackToast"
      :feedback-type="gameStore.lastFeedback.type"
    />
    <Stimulus
      class="mb-3"
      :color="gameStore.currentStimulus.color"
      :emoji="gameStore.currentStimulus.emoji"
      :position="gameStore.currentStimulus.position"
      :shape="gameStore.currentStimulus.shape"
      :flash-border="gameStore.flashBorder"
    />
    <ResponseButtons
      :buttons="responseButtons"
      :responded-this-turn="gameStore.respondedThisTurn"
      :is-early-in-game="gameStore.isEarlyInGame"
      :is-paused="gameStore.isPaused"
      :feedback-class="feedbackClass"
      @respond="$emit('respond', $event)"
    />
    <div class="text-center">
      <ScoreDisplay
        v-if="!gameStore.isStopped"
        :score="gameStore.score"
        :incorrect-responses="gameStore.incorrectResponses"
        :score-animating="scoreAnimating"
        :strike-animating="strikeAnimating"
      />
      <GameOverDisplay
        v-else
        :score="gameStore.score"
        :previous-potential-correct-answers="gameStore.previousPotentialCorrectAnswers"
        :final-score-accuracy="gameStore.finalScoreAccuracy"
        :high-score-data="gameStore.highScoreData"
        :high-score-accuracy="gameStore.highScoreAccuracy"
        @reset-high-score="$emit('reset-high-score')"
      />
      <!-- High score line visible during ACTIVE play (game-over has its own in GameOverDisplay) -->
      <p v-if="!gameStore.isStopped" class="mt-2 text-sm uppercase text-gray-500">
        High Score: {{ gameStore.highScoreData.score }}/{{ gameStore.highScoreData.potentialCorrectAnswers }}
        ({{ gameStore.highScoreAccuracy }}%)
        <span v-if="gameStore.highScoreData.nBack">N={{ gameStore.highScoreData.nBack }}</span>
        <span class="p-1 cursor-pointer" @click="$emit('reset-high-score')">&#x24E7;</span>
      </p>
    </div>
    <div v-if="gameStore.isStopped || gameStore.incorrectResponses >= 3">
      <ConfigStart
        :n-back="nBackInput"
        :time-left="timeLeftInput"
        @update:n-back="$emit('update:nBackInput', $event)"
        @update:time-left="$emit('update:timeLeftInput', $event)"
        @start-game="$emit('start-game')"
      />
    </div>
    <div class="mt-3">
      <button
        class="text-xs text-gray-600 bg-gray-600 hover:bg-gray-500 p-1 rounded-full focus:outline-hidden"
        @click="$emit('toggle-audio')"
      >
        <img
          v-if="gameStore.isAudioEnabled"
          class="h-5 w-5"
          :src="volumeUpIcon"
          alt="Volume Up"
        />
        <img
          v-else
          class="h-5 w-5"
          :src="volumeMuteIcon"
          alt="Volume Mute"
        />
      </button>
    </div>
    <Footer />
  </div>
</template>

<script>
import GameTimer from './GameTimer.vue';
import ResponseButtons from './ResponseButtons.vue';
import ScoreDisplay from './ScoreDisplay.vue';
import GameOverDisplay from './GameOverDisplay.vue';
import Stimulus from '../Stimulus.vue';
import ConfigStart from '../ConfigStart.vue';
import Footer from '../Footer.vue';
import volumeUpIcon from '../assets/volume-up-solid.svg';
import volumeMuteIcon from '../assets/volume-mute-solid.svg';

export default {
  name: 'GameScreen',
  components: {
    GameTimer,
    ResponseButtons,
    ScoreDisplay,
    GameOverDisplay,
    Stimulus,
    ConfigStart,
    Footer,
  },
  props: {
    gameStore: { type: Object, required: true },
    nBackInput: { type: Number, required: true },
    timeLeftInput: { type: Number, required: true },
    scoreAnimating: { type: Boolean, required: true },
    strikeAnimating: { type: Boolean, required: true },
    showFeedbackToast: { type: Boolean, required: true },
    feedbackClass: { type: Function, required: true },
  },
  emits: ['respond', 'update:nBackInput', 'update:timeLeftInput', 'start-game', 'toggle-audio', 'reset-high-score'],
  setup() {
    const responseButtons = [
      { type: 'color', label: 'Color' },
      { type: 'emoji', label: 'Emoji' },
      { type: 'position', label: 'Position' },
      { type: 'shape', label: 'Shape' },
    ];

    return {
      responseButtons,
      volumeUpIcon,
      volumeMuteIcon,
    };
  },
};
</script>
