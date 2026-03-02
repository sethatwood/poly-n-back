import { type ComputedRef, ref, computed, watch } from 'vue';
import type { StimulusAttribute } from '@/types/game';
import type { useGameStore } from '@/stores/gameStore';
import { useManagedTimeout } from './useManagedTimeout';

type GameStore = ReturnType<typeof useGameStore>;

export function useFeedback(gameStore: GameStore): {
  showFeedbackToast: ComputedRef<boolean>
  feedbackClass: (buttonType: StimulusAttribute) => string
} {
  const { managedSetTimeout, clearManagedTimeout } = useManagedTimeout();
  const feedbackVisible = ref(false);
  let feedbackTimeoutId: ReturnType<typeof setTimeout> | null = null;

  watch(
    () => gameStore.lastFeedback.timestamp,
    (newTimestamp) => {
      if (newTimestamp && gameStore.lastFeedback.type) {
        feedbackVisible.value = true;
        if (feedbackTimeoutId) clearManagedTimeout(feedbackTimeoutId);
        feedbackTimeoutId = managedSetTimeout(() => {
          feedbackVisible.value = false;
        }, 2000);
      }
    },
  );

  const showFeedbackToast = computed(() => feedbackVisible.value);

  const feedbackClass = (buttonType: StimulusAttribute): string => {
    const feedback = gameStore.lastFeedback;
    if (feedback.button === buttonType && feedback.type) {
      return feedback.type === 'correct'
        ? 'animate-correct-flash'
        : 'animate-incorrect-flash';
    }
    return '';
  };

  return { showFeedbackToast, feedbackClass };
}
