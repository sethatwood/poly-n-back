<template>
  <div class="strikes-score">
    <div
      class="mt-4 text-sm uppercase text-red-500 flex items-center justify-center transition-transform"
      :class="{ 'animate-strike-shake': strikeAnimating }"
    >
      <span class="text-2xl font-bold">{{
        incorrectResponses
      }}</span
      >&nbsp;Strikes
    </div>
    <div
      class="text-sm uppercase text-emerald-400 flex items-center justify-center"
      :class="{ 'animate-score-pulse': scoreAnimating }"
    >
      <span class="text-3xl font-bold">{{ score }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  score: number
  incorrectResponses: number
  scoreAnimating: boolean
  strikeAnimating: boolean
}

defineProps<Props>()
</script>

<style scoped>
/* Score pulse animation */
@keyframes score-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
    text-shadow: 0 0 20px rgba(52, 211, 153, 0.8);
  }
  100% {
    transform: scale(1);
  }
}

.animate-score-pulse {
  animation: score-pulse 0.4s ease-out;
}

/* Strike shake animation */
@keyframes strike-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-4px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(4px);
  }
}

.animate-strike-shake {
  animation: strike-shake 0.5s ease-in-out;
  color: #ef4444;
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
}
</style>
