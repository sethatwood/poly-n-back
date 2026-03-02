import { ref } from 'vue';
import { defineStore } from 'pinia';
import stimulusSoundUrl from '../assets/stimulus.wav';
import incrementSoundUrl from '../assets/ting.mp3';
import strikeSoundUrl from '../assets/whip.mp3';

export const useAudioStore = defineStore('audio', () => {
  // Non-serializable browser objects -- plain variables, NOT refs.
  // Do NOT return these from the store.
  let context = null;
  let buffers = {};

  // Reactive state exposed to consumers
  const ready = ref(false);
  const unlocked = ref(false);

  async function loadSound(name, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      buffers[name] = await context.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`, error);
    }
  }

  async function init() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.warn('AudioContext not available. Game will run silently.');
        return;
      }
      context = new AudioCtx();
      await Promise.allSettled([
        loadSound('stimulus', stimulusSoundUrl),
        loadSound('increment', incrementSoundUrl),
        loadSound('strike', strikeSoundUrl),
      ]);
      ready.value = true;
    } catch (e) {
      console.warn('Audio initialization failed. Game will run silently.', e);
      context = null;
      ready.value = false;
    }
  }

  function unlock() {
    if (unlocked.value || !ready.value || !context) return;
    if (context.state === 'suspended') {
      context.resume();
    }
    unlocked.value = true;
  }

  function play(soundName) {
    if (!ready.value || !context || !buffers[soundName]) return;
    try {
      if (context.state === 'suspended') {
        context.resume();
      }
      const source = context.createBufferSource();
      source.buffer = buffers[soundName];
      source.connect(context.destination);
      source.start(0);
    } catch (e) {
      console.warn(`Audio playback failed for "${soundName}":`, e);
    }
  }

  // Eager initialization -- preserves current behavior (init at module load)
  init();

  return { ready, unlocked, init, unlock, play };
});
