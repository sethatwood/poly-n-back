import { onUnmounted } from 'vue';

export function useManagedTimeout() {
  const timeouts = new Set();

  function managedSetTimeout(fn, delay) {
    const id = setTimeout(() => {
      timeouts.delete(id);
      fn();
    }, delay);
    timeouts.add(id);
    return id;
  }

  function clearManagedTimeout(id) {
    clearTimeout(id);
    timeouts.delete(id);
  }

  function clearAll() {
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
