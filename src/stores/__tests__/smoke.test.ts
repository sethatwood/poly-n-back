import { describe, it, expect } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

describe('test infrastructure', () => {
  it('creates a Pinia instance', () => {
    setActivePinia(createPinia());
    expect(true).toBe(true);
  });
});
