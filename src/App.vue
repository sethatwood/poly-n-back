<template>
  <div class="min-h-screen flex items-center justify-center overflow-hidden game-background">
    <Transition name="screen-fade" mode="out-in">
      <MenuScreen
        v-if="showModal"
        key="menu"
        :n-back-input="Number(nBackInput)"
        :time-left-input="Number(timeLeftInput)"
        :n-back="gameStore.nBack"
        @update:n-back-input="nBackInput = $event"
        @update:time-left-input="timeLeftInput = $event"
        @start-game="startGame"
        @show-tutorial="showTutorial = true"
      />
      <GameScreen
        v-else
        key="game"
        :game-store="gameStore"
        :n-back-input="Number(nBackInput)"
        :time-left-input="Number(timeLeftInput)"
        :score-animating="scoreAnimating"
        :strike-animating="strikeAnimating"
        :show-feedback-toast="showFeedbackToast"
        :feedback-class="feedbackClass"
        @respond="respond"
        @update:n-back-input="nBackInput = $event"
        @update:time-left-input="timeLeftInput = $event"
        @start-game="startGame"
        @toggle-audio="toggleAudio"
        @reset-high-score="resetHighScore"
      />
    </Transition>

    <!-- Pause Button (outside transition, viewport top right) -->
    <button
      v-if="!showModal && !gameStore.isStopped"
      class="fixed right-4 p-2 text-gray-500 hover:text-white transition-colors z-30"
      style="top: calc(env(safe-area-inset-top, 0px) + 1rem)"
      title="Pause"
      @click="handlePause"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </button>

    <!-- Overlays -->
    <AchievementToast />
    <GameHint />
    <PauseModal
      :show="gameStore.isPaused"
      :score="gameStore.score"
      :strikes="gameStore.incorrectResponses"
      @resume="handleResume"
      @quit="handleQuit"
    />
    <GameOverModal
      :show="gameStore.showGameOverModal"
      :score="gameStore.score"
      :possible-points="gameStore.previousPotentialCorrectAnswers"
      :accuracy="gameStore.finalScoreAccuracy"
      :n-back="gameStore.nBack"
      :timer="Number(timeLeftInput)"
      :is-new-high-score="gameStore.isNewHighScore"
      @close="handleGameOverClose"
      @play-again="handlePlayAgain"
      @main-menu="handleMainMenu"
    />
    <TutorialOverlay :show="showTutorial" @complete="handleTutorialComplete" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useGameStore } from './stores/gameStore'
import { usePersistenceStore } from './stores/persistenceStore'
import { useAnimations } from './composables/useAnimations'
import { useFeedback } from './composables/useFeedback'
import { useGameLifecycle } from './composables/useGameLifecycle'
import type { StimulusAttribute } from '@/types/game'
import MenuScreen from './components/MenuScreen.vue'
import GameScreen from './components/GameScreen.vue'
import GameOverModal from './GameOverModal.vue'
import PauseModal from './PauseModal.vue'
import TutorialOverlay from './TutorialOverlay.vue'
import GameHint from './GameHint.vue'
import AchievementToast from './AchievementToast.vue'

const gameStore = useGameStore()
const persistenceStore = usePersistenceStore()

// Composables
const { scoreAnimating, strikeAnimating } = useAnimations(gameStore)
const { showFeedbackToast, feedbackClass } = useFeedback(gameStore)
const {
  showModal,
  startGame: startGameLifecycle,
  handlePause,
  handleResume,
  handleQuit,
  handleGameOverClose,
  handlePlayAgain: playAgainLifecycle,
  handleMainMenu,
} = useGameLifecycle(gameStore)

// Local input state
const nBackInput = ref(gameStore.nBack)
const timeLeftInput = ref(gameStore.timeLeft)

// Tutorial state - safe default (don't show until we know)
const showTutorial = ref(false)

onMounted(async () => {
  await gameStore.loadPersistedState()
  const tutorialCompleted = await persistenceStore.loadPreference('tutorialCompleted', false)
  if (!tutorialCompleted) {
    showTutorial.value = true
  }
})

function handleTutorialComplete(): void {
  showTutorial.value = false
  gameStore.unlockAudio()
}

// Sync input refs to store
watch(nBackInput, (newNBack: number) => {
  gameStore.nBack = newNBack
})

watch(timeLeftInput, (newTimeLeft: number) => {
  gameStore.timeLeft = newTimeLeft
})

// Wrap lifecycle calls that need timeLeftInput
const startGame = (): void => startGameLifecycle(timeLeftInput.value)
const handlePlayAgain = (): void => playAgainLifecycle(timeLeftInput.value)

function respond(stimulusType: StimulusAttribute): void {
  if (!gameStore.isPaused) {
    gameStore.respondToStimulus(stimulusType)
  }
}

function toggleAudio(): void {
  gameStore.toggleAudio()
}

function resetHighScore(): void {
  gameStore.resetHighScore()
}
</script>

<style scoped>
/* Screen transitions */
.screen-fade-enter-active,
.screen-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
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
