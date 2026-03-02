<template>
  <div class="flex justify-center items-center my-4 text-center">
    <div class="mr-4">
      <label for="nBack" class="block text-sm font-medium text-gray-400"
        >N-Back</label
      >
      <input
        id="nBack"
        v-model="localNBack"
        type="number"
        min="1"
        class="bg-white text-black mt-1 p-1 block w-20 rounded-md border border-gray-300 shadow-xs focus:border-indigo-300 focus:ring-3 focus:ring-indigo-200/50"
        @blur="enforceMinNBack"
      />
    </div>
    <div>
      <label for="timeLeft" class="block text-sm font-medium text-gray-400"
        >Timer (sec)</label
      >
      <input
        id="timeLeft"
        v-model="localTimeLeft"
        type="number"
        min="1"
        class="bg-white text-black mt-1 p-1 block w-20 rounded-md border border-gray-300 shadow-xs focus:border-indigo-300 focus:ring-3 focus:ring-indigo-200/50"
        @blur="enforceMinTimeLeft"
      />
    </div>
  </div>
  <button
    class="mb-2 p-4 text-lg bg-blue-900 text-white font-medium rounded-md w-full shadow-xs hover:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-blue-300"
    @click="handleStartGame"
  >
    Start Game
  </button>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  nBack: number;
  timeLeft: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:nBack': [value: number];
  'update:timeLeft': [value: number];
  startGame: [];
}>();

const localNBack = ref(props.nBack);
const localTimeLeft = ref(props.timeLeft);

watch(
  () => props.nBack,
  (val) => {
    localNBack.value = val;
  },
);
watch(
  () => props.timeLeft,
  (val) => {
    localTimeLeft.value = val;
  },
);

function enforceMinNBack(): void {
  const value = Math.max(1, parseInt(String(localNBack.value)) || 1);
  localNBack.value = value;
  emit('update:nBack', value);
}

function enforceMinTimeLeft(): void {
  const value = Math.max(1, parseInt(String(localTimeLeft.value)) || 1);
  localTimeLeft.value = value;
  emit('update:timeLeft', value);
}

function handleStartGame(): void {
  const nBack = Math.max(1, parseInt(String(localNBack.value)) || 1);
  const timeLeft = Math.max(1, parseInt(String(localTimeLeft.value)) || 1);
  localNBack.value = nBack;
  localTimeLeft.value = timeLeft;
  emit('update:nBack', nBack);
  emit('update:timeLeft', timeLeft);
  emit('startGame');
}
</script>
