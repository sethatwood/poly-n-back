import { ref, watch } from 'vue';
import { useManagedTimeout } from './useManagedTimeout';

export function useAnimations(gameStore) {
  const { managedSetTimeout } = useManagedTimeout();
  const scoreAnimating = ref(false);
  const strikeAnimating = ref(false);

  watch(
    () => gameStore.score,
    (newScore, oldScore) => {
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
    (newStrikes, oldStrikes) => {
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
