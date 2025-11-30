<template>
  <div class="flex justify-center space-x-2">
    <div v-for="cellPosition in ['left', 'center', 'right']" :key="cellPosition"
         :class="[cellClass, 'flex-1 h-32 bg-slate-950 rounded-md flex items-center justify-center relative']">
      <template v-if="position === cellPosition">
        <div v-if="shape !== 'triangle'" :class="[colorClass, shapeClass]"></div>
        <div v-if="shape === 'triangle'" :class="['triangle', colorClass]"></div>
        <span v-if="gameStore.currentStimulus.emoji === 'fire'" class="emoji">🔥</span>
        <span v-if="gameStore.currentStimulus.emoji === 'ice'" class="emoji">🧊</span>
        <span v-if="gameStore.currentStimulus.emoji === 'flower'" class="emoji">🌸</span>
      </template>
    </div>
  </div>
</template>

<script>
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
    return { gameStore };
  },
  computed: {
    colorClass() {
      switch (this.color) {
        case 'purple': return 'text-purple-600';
        case 'green': return 'text-green-600';
        case 'blue': return 'text-blue-600';
        default: return '';
      }
    },
    shapeClass() {
      switch (this.shape) {
        case 'circle': return 'w-20 h-20 rounded-full bg-current';
        case 'square': return 'w-20 h-20 bg-current';
        default: return '';
      }
    },
    cellClass() {
      return this.gameStore.flashBorder ? 'border border-slate-700' : '';
    },
  },
};
</script>

<style>
.emoji {
  font-size: 3rem;
  position: absolute;
  line-height: 1;
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
}
</style>
