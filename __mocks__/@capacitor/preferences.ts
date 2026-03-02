const store = new Map<string, string>();

export const Preferences = {
  async get(opts: { key: string }): Promise<{ value: string | null }> {
    return { value: store.get(opts.key) ?? null };
  },
  async set(opts: { key: string; value: string }): Promise<void> {
    store.set(opts.key, opts.value);
  },
  async remove(opts: { key: string }): Promise<void> {
    store.delete(opts.key);
  },
  async clear(): Promise<void> {
    store.clear();
  },
  _reset(): void {
    store.clear();
  },
};
