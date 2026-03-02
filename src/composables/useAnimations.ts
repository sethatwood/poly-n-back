import { type Ref, ref, watch } from 'vue';
import type { useGameStore } from '@/stores/gameStore';
import { useManagedTimeout } from './useManagedTimeout';

type GameStore = ReturnType<typeof useGameStore>;

export function useAnimations(gameStore: GameStore): {
  scoreAnimating: Ref<boolean>;
  strikeAnimating: Ref<boolean>;
} {
  const { managedSetTimeout } = useManagedTimeout();
  const scoreAnimating = ref(false);
  const strikeAnimating = ref(false);

  watch(
    () => gameStore.score,
    (newScore: number, oldScore: number) => {
      if (newScore > oldScore) {
        scoreAnimating.value = true;
        managedSetTimeout(() => {
          scoreAnimating.value = false;
        }, 400);
      }
    },
  );

  watch(
    () => gameStore.incorrectResponses,
    (newStrikes: number, oldStrikes: number) => {
      if (newStrikes > oldStrikes) {
        strikeAnimating.value = true;
        managedSetTimeout(() => {
          strikeAnimating.value = false;
        }, 500);
      }
    },
  );

  return { scoreAnimating, strikeAnimating };
}
