<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      <!-- Modal Content -->
      <div class="relative z-10 w-full max-w-sm mx-4 p-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
        <!-- Paused Header -->
        <div class="text-center mb-6">
          <div class="text-4xl mb-3">⏸️</div>
          <h2 class="text-2xl font-bold text-white">
            Paused
          </h2>
        </div>

        <!-- Current Progress -->
        <div class="grid grid-cols-2 gap-3 mb-6 text-center text-sm">
          <div class="bg-slate-900/50 rounded-lg p-3">
            <div class="text-gray-400">Score</div>
            <div class="text-xl font-bold text-green-400">{{ score }}</div>
          </div>
          <div class="bg-slate-900/50 rounded-lg p-3">
            <div class="text-gray-400">Strikes</div>
            <div class="text-xl font-bold text-red-400">{{ strikes }}/3</div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <button
            @click="$emit('resume')"
            class="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/25"
          >
            Resume
          </button>
          <button
            @click="$emit('quit')"
            class="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 text-gray-300 font-medium rounded-xl transition-all duration-200"
          >
            Quit to Menu
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
export default {
  name: 'PauseModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    strikes: {
      type: Number,
      required: true
    }
  },
  emits: ['resume', 'quit']
};
</script>

<style scoped>
/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}
</style>

