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
      <IntroContent
        :n-back="nBack"
        @show-tutorial="$emit('show-tutorial')"
      />
      <Footer />
    </div>
  </div>
</template>

<script>
import IntroHead from '../IntroHead.vue';
import IntroContent from '../IntroContent.vue';
import ConfigStart from '../ConfigStart.vue';
import Footer from '../Footer.vue';

export default {
  name: 'MenuScreen',
  components: {
    IntroHead,
    IntroContent,
    ConfigStart,
    Footer,
  },
  props: {
    nBackInput: { type: Number, required: true },
    timeLeftInput: { type: Number, required: true },
    nBack: { type: Number, required: true },
  },
  emits: ['update:nBackInput', 'update:timeLeftInput', 'start-game', 'show-tutorial'],
  setup() {
    return {};
  },
};
</script>
