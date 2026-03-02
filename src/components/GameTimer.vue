<template>
  <div class="mt-4">
    <p
      class="countdown-text transition-all duration-200"
      :class="{
        'text-amber-500 animate-pulse-urgent': timeLeft <= 2 && !isPaused,
        'scale-110': timeLeft <= 1 && !isPaused,
      }"
    >
      {{ timeLeft }}
    </p>
  </div>
  <!-- Feedback Indicator (centered below timer) -->
  <div class="h-4 flex items-center justify-center mb-2">
    <Transition name="feedback-subtle">
      <div
        v-if="showFeedbackToast"
        :class="[
          'text-xs font-medium',
          feedbackType === 'correct' ? 'text-emerald-400' : 'text-red-400',
        ]"
      >
        {{ feedbackType === 'correct' ? '✓' : '✗' }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
interface Props {
  timeLeft: number;
  isPaused: boolean;
  showFeedbackToast: boolean;
  feedbackType?: string | null;
}

defineProps<Props>();
</script>

<style scoped>
.countdown-text {
  font-size: 3.33rem;
  font-weight: bold;
  line-height: 1;
}

/* Timer urgency pulse */
@keyframes pulse-urgent {
  0%,
  100% {
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

/* Subtle feedback indicator */
.feedback-subtle-enter-active,
.feedback-subtle-leave-active {
  transition: opacity 0.15s ease;
}

.feedback-subtle-enter-from,
.feedback-subtle-leave-to {
  opacity: 0;
}
</style>
