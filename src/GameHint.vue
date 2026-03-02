<template>
  <Transition name="hint">
    <div
      v-if="currentHint"
      class="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none"
    >
      <div
        class="bg-slate-800/95 backdrop-blur-xs text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 max-w-xs"
      >
        <span class="text-lg">{{ currentHint.icon }}</span>
        <span class="text-gray-200">{{ currentHint.text }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useGameStore } from './stores/gameStore';
import { useManagedTimeout } from './composables/useManagedTimeout';
import type { GameHintDef } from '@/types/game';

const gameStore = useGameStore();
const { managedSetTimeout, clearManagedTimeout } = useManagedTimeout();
const currentHint = ref<GameHintDef | null>(null);
const hintTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const shownHints = ref(new Set<string>());

const hints: Record<string, GameHintDef> = {
  firstMatch: {
    icon: '👀',
    text: 'Now watch for matches!',
    priority: 2,
  },
  twoStrikes: {
    icon: '⚠️',
    text: 'One strike left — be careful!',
    priority: 3,
  },
  goodStreak: {
    icon: '🔥',
    text: "You're on fire! Keep it up!",
    priority: 2,
  },
  lowTime: {
    icon: '⚡',
    text: 'Decide quickly!',
    priority: 2,
  },
};

function showHint(hintKey: string, force = false): void {
  const hint = hints[hintKey];
  if (!hint) return;

  // Don't repeat hints unless forced
  if (!force && shownHints.value.has(hintKey)) return;

  // Clear any existing hint
  if (hintTimeout.value) {
    clearManagedTimeout(hintTimeout.value);
  }

  currentHint.value = hint;
  shownHints.value.add(hintKey);

  // Auto-hide after 2.5 seconds
  hintTimeout.value = managedSetTimeout(() => {
    currentHint.value = null;
  }, 2500);
}

// Watch for when game becomes "ready" (no longer early)
watch(
  () => gameStore.isEarlyInGame,
  (isEarly, wasEarly) => {
    if (wasEarly && !isEarly && !gameStore.isStopped) {
      showHint('firstMatch');
    }
  },
);

// Watch for two strikes
watch(
  () => gameStore.incorrectResponses,
  (strikes) => {
    if (strikes === 2 && !gameStore.isStopped) {
      showHint('twoStrikes');
    }
  },
);

// Watch for good scoring streaks (3+ in a row without strike)
const lastStrikeCount = ref(0);
watch(
  () => gameStore.score,
  (newScore, oldScore) => {
    if (newScore > oldScore) {
      const scoreSinceLastStrike = newScore - lastStrikeCount.value;
      if (scoreSinceLastStrike >= 3 && scoreSinceLastStrike % 3 === 0) {
        showHint('goodStreak', true);
      }
    }
  },
);

watch(
  () => gameStore.incorrectResponses,
  () => {
    lastStrikeCount.value = gameStore.score;
  },
);

// Watch for low time
watch(
  () => gameStore.timeLeft,
  (time) => {
    if (
      time === 1 &&
      !gameStore.isEarlyInGame &&
      !gameStore.isPaused &&
      !shownHints.value.has('lowTime')
    ) {
      showHint('lowTime');
    }
  },
);

// Reset hints when game restarts
watch(
  () => gameStore.isStopped,
  (stopped, wasStopped) => {
    if (wasStopped && !stopped) {
      // Game restarted - reset shown hints
      shownHints.value.clear();
      lastStrikeCount.value = 0;
    }
  },
);
</script>

<style scoped>
.hint-enter-active,
.hint-leave-active {
  transition: all 0.3s ease;
}

.hint-enter-from {
  opacity: 0;
  transform: translate(-50%, 10px);
}

.hint-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
