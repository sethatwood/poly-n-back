<template>
  <div class="instructions text-xs md:text-md lg:text-lg mt-2 px-4">
    <p class="text-md mt-4 font-semibold">
      Here's how you can play:
    </p>
    <p class="mt-2">
      • Tap attributes from <strong>{{ gameStore.nBack }}</strong> turns ago.<br>&nbsp;&nbsp;[Color, Emoji, Position, Shape]
    </p>
    <p class="mt-2">
      • Correct responses increase your score.
    </p>
    <p class="mt-2">
      • The game ends after 3 strikes.
    </p>
    <p class="mt-2">
      • High scores are saved.
    </p>
    <p class="mt-5 text-center">
      <button
        @click="$emit('showTutorial')"
        class="px-4 py-2 text-sm text-gray-300 border border-gray-600 rounded-lg hover:border-gray-400 hover:text-white active:scale-95 transition-all"
      >
        ? How to Play
      </button>
    </p>
  </div>
</template>

<script>
import { useGameStore } from './store/gameStore';

export default {
  name: "IntroContent",
  emits: ['showTutorial'],
  setup() {
    const gameStore = useGameStore();

    return {
      gameStore
    };
  }
}
</script>