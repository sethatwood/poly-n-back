<template>
  <div class="grid grid-cols-2 gap-3">
    <button
      v-for="button in buttons"
      :key="button.type"
      class="w-full transform transition-all duration-150"
      :disabled="
        respondedThisTurn[button.type] ||
        isEarlyInGame ||
        isPaused
      "
      :class="[
        buttonClass(
          respondedThisTurn[button.type],
          isEarlyInGame,
          isPaused,
        ),
        feedbackClass(button.type),
      ]"
      @click="$emit('respond', button.type)"
    >
      {{ button.label }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'ResponseButtons',
  props: {
    buttons: { type: Array, required: true },
    respondedThisTurn: { type: Object, required: true },
    isEarlyInGame: { type: Boolean, required: true },
    isPaused: { type: Boolean, required: true },
    feedbackClass: { type: Function, required: true },
  },
  emits: ['respond'],
  setup() {
    const buttonClass = (isResponded, isEarlyInGame, isPaused) => {
      const base = 'p-4 rounded-lg text-lg font-medium shadow-lg';
      if (isResponded || isEarlyInGame || isPaused) {
        return `${base} bg-slate-700/40 text-slate-500 cursor-not-allowed`;
      } else {
        return `${base} bg-blue-600 hover:bg-blue-500 active:scale-95 active:bg-blue-700 shadow-blue-600/25 hover:shadow-blue-500/40`;
      }
    };

    return {
      buttonClass,
    };
  },
};
</script>

<style scoped>
/* Subtle correct answer button indicator */
@keyframes correct-flash {
  0% {
    border-color: rgb(34 197 94);
  }
  100% {
    border-color: transparent;
  }
}

.animate-correct-flash {
  animation: correct-flash 0.4s ease-out forwards;
  border: 2px solid rgb(34 197 94);
}

/* Subtle incorrect answer button indicator */
@keyframes incorrect-flash {
  0% {
    border-color: rgb(239 68 68);
  }
  100% {
    border-color: transparent;
  }
}

.animate-incorrect-flash {
  animation: incorrect-flash 0.4s ease-out forwards;
  border: 2px solid rgb(239 68 68);
}
</style>
