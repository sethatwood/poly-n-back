import { ref, computed, watch } from 'vue';
import { useManagedTimeout } from './useManagedTimeout';

export function useFeedback(gameStore) {
  const { managedSetTimeout, clearManagedTimeout } = useManagedTimeout();
  const feedbackVisible = ref(false);
  let feedbackTimeoutId = null;

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

  const feedbackClass = (buttonType) => {
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
