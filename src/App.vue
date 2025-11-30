<template>
  <div class="h-screen flex items-center justify-center">
    <div v-if="showModal" class="max-w-xl mx-auto flex items-center text-white" id="howToPlayModal">
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
    <div v-else class="w-screen max-w-md mx-auto px-4 text-center uppercase text-white bg-slate-900">
      <div v-if="showInstructionMessage" class="my-6 text-center text-gray-400 text-sm cursor-pointer" @click="dismissInstructionMessage">
        &#x24E7; Match attributes from {{ gameStore.nBack }} steps back
      </div>
      <div class="mt-8 mb-3">
        <p class="countdown-text">{{ gameStore.timeLeft }}</p>
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
        <button v-for="button in responseButtons" :key="button.type" class="w-full"
          :disabled="gameStore.respondedThisTurn[button.type] || gameStore.isEarlyInGame"
          :class="buttonClass(gameStore.respondedThisTurn[button.type], gameStore.isEarlyInGame)"
          @click="respond(button.type)">
          {{ button.label }}
        </button>
      </div>
      <div class="text-center">
        <div v-if="!gameStore.isStopped" class="strikes-score">
          <div class="mt-4 text-sm uppercase text-red-500 flex items-center justify-center">
            <span class="text-2xl font-bold">{{ gameStore.incorrectResponses }}</span>&nbsp;Strikes
          </div>
          <div class="text-sm uppercase text-green-500 flex items-center justify-center">
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
      <!-- <button @click="toggleGame" class="mx-1 mt-3 bg-gray-800 hover:bg-gray-950 text-gray-400 py-1 px-2 rounded">
        {{ gameStore.isStopped ? 'Start' : 'Stop' }} Game
      </button>
      <button
        @click="toggleDeterministicMode"
        class="mx-1 my-1 bg-gray-800 hover:bg-gray-950 text-gray-400 py-1 px-2 rounded"
      >
        {{ gameStore.isDeterministic ? 'Disable' : 'Enable' }} Deterministic
      </button> -->
      <div class="mt-3">
        <button class="text-xs text-gray-600 bg-gray-600 hover:bg-gray-500 p-1 rounded-full focus:outline-none" @click="toggleAudio">
          <img v-if="gameStore.isAudioEnabled" class="h-5 w-5" :src="volumeUpIcon" alt="Volume Up" />
          <img v-else class="h-5 w-5" :src="volumeMuteIcon" alt="Volume Mute" />
        </button>
      </div>
      <div
        v-if="gameStore.isDeterministic"
        class="mt-4 text-center text-sm"
      >
        <div v-for="stimulus, index in gameStore.deterministicStimuli" :key="index" class="mt-1">
            {{ gameStore.deterministicIndex - 1 === index ? '->' : '' }}
            <span :class="colorClass(stimulus.color)">{{ stimulus.color }}</span>
            •
            {{ stimulus.emoji }}
            •
            {{ stimulus.position }}
            •
            {{ stimulus.shape }}
            {{ gameStore.deterministicIndex - 1 === index ? '<-' : '' }}
        </div>
      </div>
      <Footer />
    </div>

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

export default {
  name: 'App',
  components: {
    IntroHead,
    IntroContent,
    ConfigStart,
    Stimulus,
    Footer,
    GameOverModal,
  },
  setup() {
    const gameStore = useGameStore();
    const nBackInput = ref(gameStore.nBack);
    const timeLeftInput = ref(gameStore.timeLeft);
    const showModal = ref(true);
    const showInstructionMessage = ref(true);

    const dismissInstructionMessage = () => {
      console.log("Instruction message dismissed");
      showInstructionMessage.value = false;
    }

    watch(nBackInput, (newNBack, oldNBack) => {
      console.log(`N-Back changed from ${oldNBack} to ${newNBack}`);
      gameStore.nBack = newNBack;
    });

    watch(timeLeftInput, (newTimeLeft, oldTimeLeft) => {
      console.log(`Time left changed from ${oldTimeLeft} to ${newTimeLeft}`);
      gameStore.timeLeft = newTimeLeft;
    });

    const startGame = () => {
      console.log("Start game button clicked");

      showModal.value = false;
      gameStore.startGame(timeLeftInput.value);
    };

    const toggleDeterministicMode = () => {
      console.log("Toggle deterministic mode");
      gameStore.toggleDeterministicMode();
    };

    const toggleGame = () => {
      console.log(gameStore.isStopped ? "Resuming game" : "Stopping game");
      gameStore.isStopped ? gameStore.startGame(timeLeftInput.value) : gameStore.stopGame();
    };

    onUnmounted(() => {
      gameStore.stopGame();
    });

    const respond = (stimulusType) => {
      console.log(`Responding to stimulus type: ${stimulusType}`);
      gameStore.respondToStimulus(stimulusType);
    };

    const buttonClass = (isResponded, isEarlyInGame) => {
      if (isResponded || isEarlyInGame) {
        return 'p-4 rounded text-lg bg-gray-950';
      } else {
        return 'p-4 rounded text-lg bg-blue-900 hover:bg-blue-800';
      }
    };

    const previousScore = ref(gameStore.score);

    watch(() => gameStore.score, (newScore, oldScore) => {
      console.log(`Score changed from ${oldScore} to ${newScore}`);
      previousScore.value = oldScore;
    });

    const scoreClass = computed(() => {
      return gameStore.score > previousScore.value
        ? 'text-green-500'
        : gameStore.score < previousScore.value
        ? 'text-red-500'
        : 'text-xl font-medium';
    });

    const colorClass = (color) => {
      switch (color) {
        case 'purple': return 'text-purple-500';
        case 'green': return 'text-green-500';
        case 'blue': return 'text-blue-500';
        default: return '';
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
      colorClass,
      dismissInstructionMessage,
      gameStore,
      handleGameOverClose,
      handleMainMenu,
      handlePlayAgain,
      nBackInput,
      resetHighScore,
      respond,
      responseButtons,
      scoreClass,
      showInstructionMessage,
      showModal,
      startGame,
      timeLeftInput,
      toggleAudio,
      toggleDeterministicMode,
      toggleGame,
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
</style>