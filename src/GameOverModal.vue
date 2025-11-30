<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/80 backdrop-blur-sm"
        @click="$emit('close')"
      ></div>

      <!-- Modal Content -->
      <div class="relative z-10 w-full max-w-sm mx-4 p-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
        <!-- Game Over Header -->
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-red-400 mb-1 animate-pulse-once">
            Game Over
          </h2>
          <p class="text-sm text-gray-400">3 strikes reached</p>
        </div>

        <!-- New High Score Celebration -->
        <div v-if="isNewHighScore" class="mb-6 text-center">
          <div class="inline-block px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/50">
            <span class="text-yellow-400 font-bold animate-bounce-subtle">
              🏆 New High Score! 🏆
            </span>
          </div>
        </div>

        <!-- Score Display -->
        <div class="text-center mb-6">
          <div class="text-sm text-gray-400 uppercase tracking-wider mb-2">Final Score</div>
          <div class="flex items-baseline justify-center gap-2">
            <span class="text-5xl font-bold text-green-400 animate-score-pop">
              {{ score }}
            </span>
            <span class="text-gray-500">/</span>
            <span class="text-2xl text-gray-400">{{ possiblePoints }}</span>
          </div>
          <div class="mt-2 text-lg">
            <span
              class="font-semibold"
              :class="accuracyColorClass"
            >
              {{ accuracy }}% Accuracy
            </span>
          </div>
        </div>

        <!-- Game Stats -->
        <div class="grid grid-cols-2 gap-3 mb-6 text-center text-sm">
          <div class="bg-slate-900/50 rounded-lg p-3">
            <div class="text-gray-400">N-Back Level</div>
            <div class="text-xl font-bold text-blue-400">{{ nBack }}</div>
          </div>
          <div class="bg-slate-900/50 rounded-lg p-3">
            <div class="text-gray-400">Timer</div>
            <div class="text-xl font-bold text-blue-400">{{ timer }}s</div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <button
            @click="$emit('playAgain')"
            class="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/25"
          >
            Play Again
          </button>
          <button
            @click="$emit('mainMenu')"
            class="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 text-gray-300 font-medium rounded-xl transition-all duration-200"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'GameOverModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    possiblePoints: {
      type: Number,
      required: true
    },
    accuracy: {
      type: Number,
      required: true
    },
    nBack: {
      type: Number,
      required: true
    },
    timer: {
      type: Number,
      required: true
    },
    isNewHighScore: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'playAgain', 'mainMenu'],
  setup(props) {
    const accuracyColorClass = computed(() => {
      if (props.accuracy >= 80) return 'text-green-400';
      if (props.accuracy >= 60) return 'text-yellow-400';
      if (props.accuracy >= 40) return 'text-orange-400';
      return 'text-red-400';
    });

    return {
      accuracyColorClass
    };
  }
};
</script>

<style scoped>
/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9) translateY(20px);
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

/* Score pop animation */
@keyframes score-pop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-score-pop {
  animation: score-pop 0.5s ease-out 0.2s both;
}

/* Pulse once animation */
@keyframes pulse-once {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse-once {
  animation: pulse-once 0.6s ease-in-out;
}

/* Subtle bounce for high score */
@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.animate-bounce-subtle {
  animation: bounce-subtle 1s ease-in-out infinite;
}
</style>

