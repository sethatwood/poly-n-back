<template>
  <div
    class="w-screen max-w-md mx-auto px-4 text-center uppercase text-white relative"
  >
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
        :previous-potential-correct-answers="
          gameStore.previousPotentialCorrectAnswers
        "
        :final-score-accuracy="gameStore.finalScoreAccuracy"
        :high-score-data="gameStore.highScoreData"
        :high-score-accuracy="gameStore.highScoreAccuracy"
        @reset-high-score="$emit('reset-high-score')"
      />
      <!-- High score line visible during ACTIVE play (game-over has its own in GameOverDisplay) -->
      <p
        v-if="!gameStore.isStopped"
        class="mt-2 text-sm uppercase text-gray-500"
      >
        High Score: {{ gameStore.highScoreData.score }}/{{
          gameStore.highScoreData.potentialCorrectAnswers
        }}
        ({{ gameStore.highScoreAccuracy }}%)
        <span v-if="gameStore.highScoreData.nBack"
          >N={{ gameStore.highScoreData.nBack }}</span
        >
        <span class="p-1 cursor-pointer" @click="$emit('reset-high-score')"
          >&#x24E7;</span
        >
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
    <div class="mt-3 relative flex items-center justify-center gap-2">
      <button
        class="text-xs text-gray-600 bg-gray-600 hover:bg-gray-500 p-1 rounded-full focus:outline-hidden"
        @click="handleToggleAudio"
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
      <button
        class="text-xs text-gray-600 bg-gray-600 hover:bg-gray-500 p-1 rounded-full focus:outline-hidden"
        @click="handleToggleHaptics"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          :class="
            gameStore.isHapticsEnabled ? 'text-white' : 'text-gray-400'
          "
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 18h.01M8 21h8a1 1 0 001-1v-1a1 1 0 00-1-1H8a1 1 0 00-1 1v1a1 1 0 001 1zM10 3h4a5 5 0 015 5v3a5 5 0 01-5 5h-4a5 5 0 01-5-5V8a5 5 0 015-5z"
          />
        </svg>
      </button>
      <Transition name="toggle-toast">
        <p
          v-if="toastMessage"
          :key="toastMessage"
          class="absolute top-full left-0 right-0 mt-1 text-xs text-gray-400 normal-case text-center"
        >
          {{ toastMessage }}
        </p>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { useGameStore } from '@/stores/gameStore';
import type { StimulusAttribute, ResponseButton } from '@/types/game';
import { useManagedTimeout } from '@/composables/useManagedTimeout';
import GameTimer from './GameTimer.vue';
import ResponseButtons from './ResponseButtons.vue';
import ScoreDisplay from './ScoreDisplay.vue';
import GameOverDisplay from './GameOverDisplay.vue';
import Stimulus from '../Stimulus.vue';
import ConfigStart from '../ConfigStart.vue';
import volumeUpIcon from '../assets/volume-up-solid.svg';
import volumeMuteIcon from '../assets/volume-mute-solid.svg';

type GameStore = ReturnType<typeof useGameStore>;

interface Props {
  gameStore: GameStore;
  nBackInput: number;
  timeLeftInput: number;
  scoreAnimating: boolean;
  strikeAnimating: boolean;
  showFeedbackToast: boolean;
  feedbackClass: (buttonType: StimulusAttribute) => string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  respond: [type: StimulusAttribute];
  'update:nBackInput': [value: number];
  'update:timeLeftInput': [value: number];
  'start-game': [];
  'toggle-audio': [];
  'toggle-haptics': [];
  'reset-high-score': [];
}>();

const toastMessage = ref('');
let toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
const { managedSetTimeout, clearManagedTimeout } = useManagedTimeout();

function showToast(message: string) {
  if (toastTimeoutId) clearManagedTimeout(toastTimeoutId);
  toastMessage.value = message;
  toastTimeoutId = managedSetTimeout(() => {
    toastMessage.value = '';
    toastTimeoutId = null;
  }, 1500);
}

function handleToggleAudio() {
  emit('toggle-audio');
  showToast(props.gameStore.isAudioEnabled ? 'Audio On' : 'Audio Off');
}

function handleToggleHaptics() {
  emit('toggle-haptics');
  showToast(props.gameStore.isHapticsEnabled ? 'Haptics On' : 'Haptics Off');
}

const responseButtons: ResponseButton[] = [
  { type: 'color', label: 'Color' },
  { type: 'emoji', label: 'Emoji' },
  { type: 'position', label: 'Position' },
  { type: 'shape', label: 'Shape' },
];
</script>

<style scoped>
.toggle-toast-enter-active {
  transition: opacity 0.2s ease;
}
.toggle-toast-leave-active {
  transition: opacity 0.4s ease;
}
.toggle-toast-enter-from,
.toggle-toast-leave-to {
  opacity: 0;
}
</style>
