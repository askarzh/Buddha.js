import { describe, it, expect } from 'vitest';
import { KarmicStore } from '../../src/karma/KarmicEventSystem';

describe('KarmicStore Persistence', () => {
  it('should have toJSON method', () => {
    const store = new KarmicStore({ enableAutoRipening: false });
    expect(typeof store.toJSON).toBe('function');
  });

  describe('Condition Registry', () => {
    it('should register and retrieve named conditions', () => {
      const store = new KarmicStore({ enableAutoRipening: false });
      store.registerCondition('always-true', () => true);
      const check = store.getCondition('always-true');
      expect(check).toBeDefined();
      expect(check!()).toBe(true);
    });

    it('should return undefined for unregistered conditions', () => {
      const store = new KarmicStore({ enableAutoRipening: false });
      expect(store.getCondition('nonexistent')).toBeUndefined();
    });
  });
});
