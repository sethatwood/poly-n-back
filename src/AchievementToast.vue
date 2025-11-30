<template>
  <Transition name="achievement">
    <div
      v-if="achievement"
      class="fixed left-1/2 transform -translate-x-1/2 z-50"
      style="top: calc(env(safe-area-inset-top, 0px) + 2rem)"
    >
      <div class="bg-gradient-to-r from-amber-600 to-yellow-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-amber-500/30 flex items-center gap-4 min-w-[280px]">
        <!-- Trophy icon with animation -->
        <div class="text-4xl animate-bounce-gentle">
          {{ achievement.icon }}
        </div>

        <div class="flex-1">
          <div class="text-xs uppercase tracking-wider opacity-80 font-medium">
            Achievement Unlocked!
          </div>
          <div class="text-lg font-bold">
            {{ achievement.title }}
          </div>
          <div class="text-sm opacity-90">
            {{ achievement.description }}
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useGameStore } from './store/gameStore';

// Achievement definitions
const ACHIEVEMENTS = {
  firstGame: {
    id: 'firstGame',
    icon: '🎮',
    title: 'Getting Started',
    description: 'Play your first game'
  },
  firstPoint: {
    id: 'firstPoint',
    icon: '⭐',
    title: 'First Match',
    description: 'Score your first point'
  },
  perfectRound: {
    id: 'perfectRound',
    icon: '💎',
    title: 'Perfect Memory',
    description: 'Complete a game with 100% accuracy'
  },
  fiveStreak: {
    id: 'fiveStreak',
    icon: '🔥',
    title: 'On Fire',
    description: 'Get 5 correct answers in a row'
  },
  tenPoints: {
    id: 'tenPoints',
    icon: '🎯',
    title: 'Double Digits',
    description: 'Score 10 or more points in a single game'
  },
  nBack3: {
    id: 'nBack3',
    icon: '🧠',
    title: 'Brain Upgrade',
    description: 'Play a game at N-Back level 3'
  },
  speedDemon: {
    id: 'speedDemon',
    icon: '⚡',
    title: 'Speed Demon',
    description: 'Score a point with 2-second timer'
  }
};

export default {
  name: 'AchievementToast',
  setup() {
    const gameStore = useGameStore();
    const achievement = ref(null);
    const toastTimeout = ref(null);

    // Load unlocked achievements from localStorage
    const getUnlocked = () => {
      try {
        return JSON.parse(localStorage.getItem('achievements') || '[]');
      } catch {
        return [];
      }
    };

    const isUnlocked = (id) => getUnlocked().includes(id);

    const unlock = (achievementId) => {
      if (isUnlocked(achievementId)) return;

      const ach = ACHIEVEMENTS[achievementId];
      if (!ach) return;

      // Save to localStorage
      const unlocked = getUnlocked();
      unlocked.push(achievementId);
      localStorage.setItem('achievements', JSON.stringify(unlocked));

      // Show toast
      if (toastTimeout.value) clearTimeout(toastTimeout.value);
      achievement.value = ach;

      // Auto-hide after 4 seconds
      toastTimeout.value = setTimeout(() => {
        achievement.value = null;
      }, 4000);
    };

    // Track streaks
    let currentStreak = 0;

    // Watch for first game (when game starts)
    watch(() => gameStore.isStopped, (stopped, wasStopped) => {
      if (wasStopped && !stopped) {
        // Game just started
        unlock('firstGame');
        currentStreak = 0;

        // Check for N-Back 3
        if (gameStore.nBack >= 3) {
          unlock('nBack3');
        }
      }
    });

    // Watch for first point
    watch(() => gameStore.score, (newScore, oldScore) => {
      if (newScore === 1 && oldScore === 0) {
        unlock('firstPoint');
      }

      if (newScore > oldScore) {
        currentStreak++;

        // Check for 5 streak
        if (currentStreak >= 5) {
          unlock('fiveStreak');
        }

        // Check for speed demon (2 second timer)
        if (gameStore.timerInterval <= 2) {
          unlock('speedDemon');
        }
      }

      // Check for 10 points
      if (newScore >= 10) {
        unlock('tenPoints');
      }
    });

    // Reset streak on strike
    watch(() => gameStore.incorrectResponses, (strikes, oldStrikes) => {
      if (strikes > oldStrikes) {
        currentStreak = 0;
      }
    });

    // Watch for game over (check perfect round)
    watch(() => gameStore.showGameOverModal, (showing) => {
      if (showing) {
        const accuracy = gameStore.finalScoreAccuracy;
        if (accuracy === 100 && gameStore.score > 0) {
          unlock('perfectRound');
        }
      }
    });

    onUnmounted(() => {
      if (toastTimeout.value) clearTimeout(toastTimeout.value);
    });

    return {
      achievement
    };
  }
};
</script>

<style scoped>
.achievement-enter-active,
.achievement-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.achievement-enter-from {
  opacity: 0;
  transform: translate(-50%, -100%);
}

.achievement-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

@keyframes bounce-gentle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.animate-bounce-gentle {
  animation: bounce-gentle 0.6s ease-in-out infinite;
}
</style>

