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

<script>
export default {
  name: 'ConfigStart',
  props: {
    nBack: {
      type: Number,
      required: true,
    },
    timeLeft: {
      type: Number,
      required: true,
    },
  },
  emits: ['update:nBack', 'update:timeLeft', 'startGame'],
  data() {
    return {
      localNBack: this.nBack,
      localTimeLeft: this.timeLeft,
    };
  },
  watch: {
    nBack(val) {
      this.localNBack = val;
    },
    timeLeft(val) {
      this.localTimeLeft = val;
    },
  },
  methods: {
    enforceMinNBack() {
      const value = Math.max(1, parseInt(this.localNBack) || 1);
      this.localNBack = value;
      this.$emit('update:nBack', value);
    },
    enforceMinTimeLeft() {
      const value = Math.max(1, parseInt(this.localTimeLeft) || 1);
      this.localTimeLeft = value;
      this.$emit('update:timeLeft', value);
    },
    handleStartGame() {
      // Ensure valid values before starting
      const nBack = Math.max(1, parseInt(this.localNBack) || 1);
      const timeLeft = Math.max(1, parseInt(this.localTimeLeft) || 1);
      this.localNBack = nBack;
      this.localTimeLeft = timeLeft;
      this.$emit('update:nBack', nBack);
      this.$emit('update:timeLeft', timeLeft);
      this.$emit('startGame');
    },
  },
};
</script>
