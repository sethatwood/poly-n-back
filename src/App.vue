<template>
  <div class="h-screen flex items-center justify-center overflow-hidden">
    <Transition name="screen-fade" mode="out-in">
      <div v-if="showModal" key="menu" class="max-w-xl mx-auto flex items-center text-white" id="howToPlayModal">
        <div class="relative mx-auto p-5 container bg-slate-900">
        <IntroHead />
        <ConfigStart
          :nBack="Number(nBackInput)"
          :timeLeft="Number(timeLeftInput)"
          @update:nBack="nBackInput = $event"
          @update:timeLeft="timeLeftInput = $event"
          @startGame="startGame"
        />
        <IntroContent :n-back="gameStore.nBack" />
        <Footer />
      </div>
    </div>
    <div v-else key="game" class="w-screen max-w-md mx-auto px-4 text-center uppercase text-white bg-slate-900 relative">
      <!-- Pause Button (top right) -->
      <button
        v-if="!gameStore.isStopped"
        @click="handlePause"
        class="absolute top-2 right-4 p-2 text-gray-400 hover:text-white transition-colors"
        title="Pause"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <div v-if="showInstructionMessage" class="my-6 text-center text-gray-400 text-sm cursor-pointer" @click="dismissInstructionMessage">
        &#x24E7; Match attributes from {{ gameStore.nBack }} steps back
      </div>
      <div class="mt-8 mb-3">
        <p
          class="countdown-text transition-all duration-200"
          :class="{
            'text-amber-500 animate-pulse-urgent': gameStore.timeLeft <= 2 && !gameStore.isPaused,
            'scale-110': gameStore.timeLeft <= 1 && !gameStore.isPaused
          }"
        >{{ gameStore.timeLeft }}</p>
      </div>
      <Stimulus
        class="mb-3"
        :color="gameStore.currentStimulus.color"
        :emoji="gameStore.currentStimulus.emoji"
        :position="gameStore.currentStimulus.position"
        :shape="gameStore.currentStimulus.shape"
        :flashBorder="gameStore.flashBorder"
      />
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="button in responseButtons"
          :key="button.type"
          class="w-full transform transition-all duration-150"
          :disabled="gameStore.respondedThisTurn[button.type] || gameStore.isEarlyInGame || gameStore.isPaused"
          :class="buttonClass(gameStore.respondedThisTurn[button.type], gameStore.isEarlyInGame, gameStore.isPaused)"
          @click="respond(button.type)"
        >
          {{ button.label }}
        </button>
      </div>
      <div class="text-center">
        <div v-if="!gameStore.isStopped" class="strikes-score">
          <div
            class="mt-4 text-sm uppercase text-red-500 flex items-center justify-center transition-transform"
            :class="{ 'animate-strike-shake': strikeAnimating }"
          >
            <span class="text-2xl font-bold">{{ gameStore.incorrectResponses }}</span>&nbsp;Strikes
          </div>
          <div
            class="text-sm uppercase text-emerald-400 flex items-center justify-center"
            :class="{ 'animate-score-pulse': scoreAnimating }"
          >
            <span class="text-3xl font-bold">{{ gameStore.score }}</span>
          </div>
        </div>
        <div v-else class="text-sm uppercase">
          <p class="mt-4 text-sm uppercase text-red-500 flex items-center justify-center">
            Game Over
          </p>
          <p class="mt-1 text-sm uppercase text-gray-500 flex items-center justify-center">
            Final Score:
          </p>
          <div class="text-xs uppercase text-green-500 flex items-center justify-center">
            <span class="text-3xl font-bold">{{ gameStore.score }}</span>
            &nbsp;of&nbsp;
            <span class="text-xl font-bold">{{ gameStore.previousPotentialCorrectAnswers }}</span>
            &nbsp;Possible Points
            <span class="ml-1 text-lg font-bold">({{ gameStore.finalScoreAccuracy }}%)</span>
          </div>
        </div>
        <p class="mt-2 text-sm uppercase text-gray-500">
          High Score: {{ gameStore.highScoreData.score }}/{{ gameStore.highScoreData.potentialCorrectAnswers }}
          ({{ gameStore.highScoreAccuracy }}%)
          <span v-if="gameStore.highScoreData.nBack">N={{ gameStore.highScoreData.nBack }}</span>
          <span class="p-1 cursor-pointer" @click="resetHighScore"> &#x24E7;</span>
        </p>
      </div>
      <div v-if="gameStore.isStopped || gameStore.incorrectResponses >= 3">
        <ConfigStart
          :nBack="Number(nBackInput)"
          :timeLeft="Number(timeLeftInput)"
          @update:nBack="nBackInput = $event"
          @update:timeLeft="timeLeftInput = $event"
          @startGame="startGame"
        />
      </div>
      <div class="mt-3">
        <button class="text-xs text-gray-600 bg-gray-600 hover:bg-gray-500 p-1 rounded-full focus:outline-none" @click="toggleAudio">
          <img v-if="gameStore.isAudioEnabled" class="h-5 w-5" :src="volumeUpIcon" alt="Volume Up" />
          <img v-else class="h-5 w-5" :src="volumeMuteIcon" alt="Volume Mute" />
        </button>
      </div>
      <Footer />
    </div>
    </Transition>

    <!-- Pause Modal -->
    <PauseModal
      :show="gameStore.isPaused"
      :score="gameStore.score"
      :strikes="gameStore.incorrectResponses"
      @resume="handleResume"
      @quit="handleQuit"
    />

    <!-- Game Over Modal -->
    <GameOverModal
      :show="gameStore.showGameOverModal"
      :score="gameStore.score"
      :possiblePoints="gameStore.previousPotentialCorrectAnswers"
      :accuracy="gameStore.finalScoreAccuracy"
      :nBack="gameStore.nBack"
      :timer="Number(timeLeftInput)"
      :isNewHighScore="gameStore.isNewHighScore"
      @close="handleGameOverClose"
      @playAgain="handlePlayAgain"
      @mainMenu="handleMainMenu"
    />
  </div>
</template>

<script>
import { onUnmounted, ref, watch, computed } from 'vue';
import { useGameStore } from './store/gameStore';
import volumeUpIcon from './assets/volume-up-solid.svg';
import volumeMuteIcon from './assets/volume-mute-solid.svg';
import IntroHead from './IntroHead.vue';
import IntroContent from './IntroContent.vue';
import ConfigStart from './ConfigStart.vue';
import Stimulus from './Stimulus.vue';
import Footer from './Footer.vue';
import GameOverModal from './GameOverModal.vue';
import PauseModal from './PauseModal.vue';

export default {
  name: 'App',
  components: {
    IntroHead,
    IntroContent,
    ConfigStart,
    Stimulus,
    Footer,
    GameOverModal,
    PauseModal,
  },
  setup() {
    const gameStore = useGameStore();
    const nBackInput = ref(gameStore.nBack);
    const timeLeftInput = ref(gameStore.timeLeft);
    const showModal = ref(true);
    const showInstructionMessage = ref(true);
    const scoreAnimating = ref(false);
    const strikeAnimating = ref(false);

    // Watch for score changes to trigger animation
    watch(() => gameStore.score, (newScore, oldScore) => {
      if (newScore > oldScore) {
        scoreAnimating.value = true;
        setTimeout(() => { scoreAnimating.value = false; }, 400);
      }
    });

    // Watch for strike changes to trigger animation
    watch(() => gameStore.incorrectResponses, (newStrikes, oldStrikes) => {
      if (newStrikes > oldStrikes) {
        strikeAnimating.value = true;
        setTimeout(() => { strikeAnimating.value = false; }, 500);
      }
    });

    const dismissInstructionMessage = () => {
      showInstructionMessage.value = false;
    };

    watch(nBackInput, (newNBack) => {
      gameStore.nBack = newNBack;
    });

    watch(timeLeftInput, (newTimeLeft) => {
      gameStore.timeLeft = newTimeLeft;
    });

    const startGame = () => {
      showModal.value = false;
      gameStore.startGame(timeLeftInput.value);
    };

    onUnmounted(() => {
      gameStore.stopGame();
    });

    const respond = (stimulusType) => {
      if (!gameStore.isPaused) {
        gameStore.respondToStimulus(stimulusType);
      }
    };

    const buttonClass = (isResponded, isEarlyInGame, isPaused) => {
      const base = 'p-4 rounded-lg text-lg font-medium shadow-lg';
      if (isResponded || isEarlyInGame || isPaused) {
        return `${base} bg-slate-800/50 text-slate-600 cursor-not-allowed`;
      } else {
        return `${base} bg-blue-600 hover:bg-blue-500 active:scale-95 active:bg-blue-700 shadow-blue-600/25 hover:shadow-blue-500/40`;
      }
    };

    const responseButtons = [
      { type: 'color', label: 'Color' },
      { type: 'emoji', label: 'Emoji' },
      { type: 'position', label: 'Position' },
      { type: 'shape', label: 'Shape' },
    ];

    const toggleAudio = () => {
      gameStore.toggleAudio();
    };

    const resetHighScore = () => {
      gameStore.resetHighScore();
    };

    // Pause handlers
    const handlePause = () => {
      gameStore.pauseGame();
    };

    const handleResume = () => {
      gameStore.resumeGame();
    };

    const handleQuit = () => {
      gameStore.resumeGame();
      gameStore.stopGame();
      showModal.value = true;
    };

    // Game Over handlers
    const handleGameOverClose = () => {
      gameStore.dismissGameOverModal();
    };

    const handlePlayAgain = () => {
      gameStore.dismissGameOverModal();
      gameStore.startGame(timeLeftInput.value);
    };

    const handleMainMenu = () => {
      gameStore.dismissGameOverModal();
      showModal.value = true;
    };

    return {
      buttonClass,
      dismissInstructionMessage,
      gameStore,
      handleGameOverClose,
      handleMainMenu,
      handlePause,
      handlePlayAgain,
      handleQuit,
      handleResume,
      nBackInput,
      resetHighScore,
      respond,
      responseButtons,
      scoreAnimating,
      showInstructionMessage,
      showModal,
      startGame,
      strikeAnimating,
      timeLeftInput,
      toggleAudio,
      volumeMuteIcon,
      volumeUpIcon,
    };
  },
};
</script>

<style scoped>
.countdown-text {
  font-size: 3.33rem;
  font-weight: bold;
}

/* Score pulse animation */
@keyframes score-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
    text-shadow: 0 0 20px rgba(52, 211, 153, 0.8);
  }
  100% {
    transform: scale(1);
  }
}

.animate-score-pulse {
  animation: score-pulse 0.4s ease-out;
}

/* Strike shake animation */
@keyframes strike-shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-4px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(4px);
  }
}

.animate-strike-shake {
  animation: strike-shake 0.5s ease-in-out;
  color: #ef4444;
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
}

/* Timer urgency pulse */
@keyframes pulse-urgent {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.animate-pulse-urgent {
  animation: pulse-urgent 0.5s ease-in-out infinite;
}

/* Screen transitions */
.screen-fade-enter-active,
.screen-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.screen-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.screen-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
