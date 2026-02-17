import { describe, it, expect } from 'vitest';
import { KarmicStore } from '../../src/karma/KarmicEventSystem';

describe('KarmicStore Persistence', () => {
  it('should have toJSON method', () => {
    const store = new KarmicStore({ enableAutoRipening: false });
    expect(typeof store.toJSON).toBe('function');
  });
});
