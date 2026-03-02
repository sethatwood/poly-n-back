import { onUnmounted } from 'vue';

export function useManagedTimeout(): {
  managedSetTimeout: (
    fn: () => void,
    delay: number,
  ) => ReturnType<typeof setTimeout>;
  clearManagedTimeout: (id: ReturnType<typeof setTimeout>) => void;
  clearAll: () => void;
} {
  const timeouts = new Set<ReturnType<typeof setTimeout>>();

  function managedSetTimeout(
    fn: () => void,
    delay: number,
  ): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      timeouts.delete(id);
      fn();
    }, delay);
    timeouts.add(id);
    return id;
  }

  function clearManagedTimeout(id: ReturnType<typeof setTimeout>): void {
    clearTimeout(id);
    timeouts.delete(id);
  }

  function clearAll(): void {
    timeouts.forEach(clearTimeout);
    timeouts.clear();
  }

  onUnmounted(clearAll);

  return {
    managedSetTimeout,
    clearManagedTimeout,
    clearAll,
  };
}
