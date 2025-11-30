<template>
  <div class="flex justify-center items-center my-4 text-center">
    <div class="mr-4">
      <label for="nBack" class="block text-sm font-medium text-gray-400">N-Back</label>
      <input
        type="number"
        id="nBack"
        v-model="localNBack"
        @blur="enforceMinNBack"
        min="1"
        class="text-black mt-1 p-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      />
    </div>
    <div>
      <label for="timeLeft" class="block text-sm font-medium text-gray-400">Timer (sec)</label>
      <input
        type="number"
        id="timeLeft"
        v-model="localTimeLeft"
        @blur="enforceMinTimeLeft"
        min="1"
        class="text-black mt-1 p-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      />
    </div>
  </div>
  <button @click="handleStartGame" class="mb-2 p-4 text-lg bg-blue-900 text-white font-medium rounded-md w-full shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300">
    Start Game
  </button>
</template>

<script>
export default {
  name: 'ConfigStart',
  props: {
    nBack: {
      type: Number,
      required: true
    },
    timeLeft: {
      type: Number,
      required: true
    }
  },
  emits: ['update:nBack', 'update:timeLeft', 'startGame'],
  data() {
    return {
      localNBack: this.nBack,
      localTimeLeft: this.timeLeft
    };
  },
  watch: {
    nBack(val) {
      this.localNBack = val;
    },
    timeLeft(val) {
      this.localTimeLeft = val;
    }
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
    }
  }
}
</script>
