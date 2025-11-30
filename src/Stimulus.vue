<template>
  <div class="flex justify-center space-x-2">
    <div v-for="cellPosition in ['left', 'center', 'right']" :key="cellPosition"
         :class="[cellClass, 'flex-1 h-32 bg-slate-950 rounded-md flex items-center justify-center relative overflow-hidden']">
      <template v-if="position === cellPosition">
        <!-- Shape with animation -->
        <div
          v-if="shape !== 'triangle'"
          :class="[colorClass, shapeClass, animationClass]"
        ></div>
        <div
          v-if="shape === 'triangle'"
          :class="['triangle', colorClass, animationClass]"
        ></div>
        <!-- Emoji with animation -->
        <span
          v-if="gameStore.currentStimulus.emoji === 'fire'"
          :class="['emoji', animationClass]"
        >🔥</span>
        <span
          v-if="gameStore.currentStimulus.emoji === 'ice'"
          :class="['emoji', animationClass]"
        >🧊</span>
        <span
          v-if="gameStore.currentStimulus.emoji === 'flower'"
          :class="['emoji', animationClass]"
        >🌸</span>
      </template>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useGameStore } from './store/gameStore';

export default {
  name: "Stimulus",
  props: {
    color: String,
    emoji: String,
    position: String,
    shape: String,
  },
  setup() {
    const gameStore = useGameStore();

    const animationClass = computed(() => {
      return gameStore.flashBorder ? 'animate-stimulus-appear' : '';
    });

    return { gameStore, animationClass };
  },
  computed: {
    colorClass() {
      switch (this.color) {
        case 'purple': return 'text-purple-500';
        case 'green': return 'text-emerald-500';
        case 'blue': return 'text-blue-500';
        default: return '';
      }
    },
    shapeClass() {
      switch (this.shape) {
        case 'circle': return 'w-20 h-20 rounded-full bg-current shadow-lg shadow-current/30';
        case 'square': return 'w-20 h-20 bg-current shadow-lg shadow-current/30';
        default: return '';
      }
    },
    cellClass() {
      return this.gameStore.flashBorder ? 'ring-2 ring-slate-600 ring-opacity-50' : '';
    },
  },
};
</script>

<style>
.emoji {
  font-size: 3rem;
  position: absolute;
  line-height: 1;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
}

.triangle {
  width: 0;
  height: 0;
  border-left: 2.5rem solid transparent;
  border-right: 2.5rem solid transparent;
  border-bottom: 5rem solid currentColor;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 4px 8px currentColor);
}

/* Stimulus appearance animation */
@keyframes stimulus-appear {
  0% {
    opacity: 0;
    transform: scale(0.8) translate(-50%, -50%);
  }
  50% {
    opacity: 1;
    transform: scale(1.05) translate(-50%, -50%);
  }
  100% {
    opacity: 1;
    transform: scale(1) translate(-50%, -50%);
  }
}

@keyframes stimulus-appear-centered {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-stimulus-appear {
  animation: stimulus-appear-centered 0.3s ease-out forwards;
}

.triangle.animate-stimulus-appear {
  animation: stimulus-appear 0.3s ease-out forwards;
}
</style>
