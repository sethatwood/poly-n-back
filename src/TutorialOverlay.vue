<template>
  <Transition name="tutorial">
    <div v-if="show" class="fixed inset-0 z-50 bg-[#0c1222]">
      <!-- Backdrop (solid, matching game background) -->
      <div class="absolute inset-0 bg-[#0c1222]"></div>

      <!-- Tutorial Content -->
      <div class="relative h-full flex flex-col items-center justify-center text-white p-6">
        <!-- Progress dots -->
        <div class="absolute top-6 flex gap-2">
          <div
            v-for="(_, index) in steps"
            :key="index"
            class="w-2 h-2 rounded-full transition-all duration-300"
            :class="index === currentStep ? 'bg-blue-500 w-4' : 'bg-slate-600'"
          ></div>
        </div>

        <!-- Step content -->
        <Transition name="step" mode="out-in">
          <div :key="currentStep" class="text-center max-w-md">
            <!-- Icon/Illustration -->
            <div class="text-6xl mb-6">{{ steps[currentStep].icon }}</div>

            <!-- Title -->
            <h2 class="text-2xl font-bold mb-4">{{ steps[currentStep].title }}</h2>

            <!-- Description -->
            <p class="text-gray-300 text-lg mb-8 leading-relaxed">
              {{ steps[currentStep].description }}
            </p>

            <!-- Visual example if present -->
            <div v-if="steps[currentStep].example" class="mb-8">
              <div class="inline-flex items-center gap-4 bg-slate-800/50 px-6 py-4 rounded-xl">
                <div
                  v-for="(item, i) in steps[currentStep].example"
                  :key="i"
                  class="flex flex-col items-center gap-2"
                >
                  <div class="text-3xl">{{ item.emoji }}</div>
                  <div class="text-xs text-gray-400">{{ item.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Navigation -->
        <div class="absolute bottom-8 flex items-center gap-4">
          <button
            v-if="currentStep > 0"
            @click="prevStep"
            class="px-6 py-3 text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>

          <button
            @click="nextStep"
            class="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            {{ currentStep === steps.length - 1 ? "Let's Play!" : 'Next →' }}
          </button>
        </div>

        <!-- Skip button -->
        <button
          @click="skip"
          class="absolute top-6 right-6 text-gray-500 hover:text-white text-sm transition-colors"
        >
          Skip Tutorial
        </button>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'TutorialOverlay',
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  emits: ['complete'],
  setup(props, { emit }) {
    const currentStep = ref(0);

    const steps = [
      {
        icon: '🧠',
        title: 'Train Your Working Memory',
        description: 'Poly N-Back is a scientifically-backed brain training game that challenges your working memory — the mental workspace you use every day.',
      },
      {
        icon: '👀',
        title: 'Watch & Remember',
        description: 'Each round, you\'ll see a stimulus with 4 attributes: Color, Emoji, Position, and Shape. Your job is to remember what you saw N steps ago.',
        example: [
          { emoji: '🟣', label: 'Color' },
          { emoji: '🔥', label: 'Emoji' },
          { emoji: '📍', label: 'Position' },
          { emoji: '⬛', label: 'Shape' },
        ]
      },
      {
        icon: '🔙',
        title: 'N-Back Matching',
        description: 'If any attribute matches what appeared N turns ago (default is 2), tap that button! For example, if the color now matches the color from 2 turns back, tap "Color".',
      },
      {
        icon: '✅',
        title: 'Score Points, Avoid Strikes',
        description: 'Correct matches earn points. Wrong taps give you strikes. Three strikes and the game ends. Try to build the highest score!',
        example: [
          { emoji: '✓', label: '+1 Point' },
          { emoji: '✗', label: '+1 Strike' },
        ]
      },
      {
        icon: '🚀',
        title: 'Ready to Begin?',
        description: 'Start with the default settings and work your way up. The first few turns won\'t have matches — that\'s normal! The game needs to build history first.',
      },
    ];

    const nextStep = () => {
      if (currentStep.value < steps.length - 1) {
        currentStep.value++;
      } else {
        complete();
      }
    };

    const prevStep = () => {
      if (currentStep.value > 0) {
        currentStep.value--;
      }
    };

    const skip = () => {
      complete();
    };

    const complete = () => {
      localStorage.setItem('tutorialCompleted', 'true');
      emit('complete');
    };

    return {
      currentStep,
      steps,
      nextStep,
      prevStep,
      skip,
    };
  }
};
</script>

<style scoped>
/* Tutorial overlay transitions */
.tutorial-enter-active,
.tutorial-leave-active {
  transition: opacity 0.4s ease;
}

.tutorial-enter-from,
.tutorial-leave-to {
  opacity: 0;
}

/* Step content transitions */
.step-enter-active,
.step-leave-active {
  transition: all 0.3s ease;
}

.step-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.step-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>

