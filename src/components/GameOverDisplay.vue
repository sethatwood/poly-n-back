<template>
  <div class="text-sm uppercase">
    <p
      class="mt-4 text-sm uppercase text-red-500 flex items-center justify-center"
    >
      Game Over
    </p>
    <p
      class="mt-1 text-sm uppercase text-gray-500 flex items-center justify-center"
    >
      Final Score:
    </p>
    <div
      class="text-xs uppercase text-green-500 flex items-center justify-center"
    >
      <span class="text-3xl font-bold">{{ score }}</span>
      &nbsp;of&nbsp;
      <span class="text-xl font-bold">{{
        previousPotentialCorrectAnswers
      }}</span>
      &nbsp;Possible Points
      <span class="ml-1 text-lg font-bold">({{ finalScoreAccuracy }}%)</span>
    </div>
  </div>
  <p class="mt-2 text-sm uppercase text-gray-500">
    High Score: {{ highScoreData.score }}/{{
      highScoreData.potentialCorrectAnswers
    }}
    ({{ highScoreAccuracy }}%)
    <span v-if="highScoreData.nBack">N={{ highScoreData.nBack }}</span>
    <span class="p-1 cursor-pointer" @click="$emit('reset-high-score')">
      &#x24E7;</span
    >
  </p>
</template>

<script setup lang="ts">
import type { HighScoreData } from '@/types/game';

interface Props {
  score: number;
  previousPotentialCorrectAnswers: number;
  finalScoreAccuracy: number;
  highScoreData: HighScoreData;
  highScoreAccuracy: number;
}

defineProps<Props>();
defineEmits<{
  'reset-high-score': [];
}>();
</script>
