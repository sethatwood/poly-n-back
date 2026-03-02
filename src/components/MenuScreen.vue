<template>
  <div
    id="howToPlayModal"
    class="max-w-xl mx-auto flex items-center text-white"
  >
    <div class="relative mx-auto p-5 container">
      <IntroHead />
      <ConfigStart
        :n-back="nBackInput"
        :time-left="timeLeftInput"
        @update:n-back="$emit('update:nBackInput', $event)"
        @update:time-left="$emit('update:timeLeftInput', $event)"
        @start-game="$emit('start-game')"
      />
      <IntroContent :n-back="nBack" @show-tutorial="$emit('show-tutorial')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import IntroHead from '../IntroHead.vue';
import IntroContent from '../IntroContent.vue';
import ConfigStart from '../ConfigStart.vue';
interface Props {
  nBackInput: number;
  timeLeftInput: number;
  nBack: number;
}

defineProps<Props>();
defineEmits<{
  'update:nBackInput': [value: number];
  'update:timeLeftInput': [value: number];
  'start-game': [];
  'show-tutorial': [];
}>();
</script>
