import { describe, it, expect, vi } from 'vitest';
import { KarmicStore } from '../../src/karma/KarmicEventSystem';

describe('KarmicStore', () => {
  describe('Seed Ripening and Exhaustion', () => {
    it('leaves a fully-spent seed in exhausted state, excluded from balance', () => {
      const store = new KarmicStore({ enableAutoRipening: false });
      const seed = store.plantSeed({
        quality: 'wholesome',
        description: 'one-shot gift',
        intentionStrength: 5,
        root: 'non-greed',
        type: 'mental',
        minDelay: 0,
      });
      // maxRipenings defaults to 1 for non-weighty seeds — verify at createKarmicSeed
      // (src/karma/KarmicEventSystem.ts:149) and adjust the plant options if needed
      store.forceRipen(seed.id);
      expect(store.getSeed(seed.id)!.state).toBe('exhausted');
      expect(store.getKarmicBalance().wholesome).toBe(0);
    });
  });

  describe('Vipaka isPartial reflects post-ripening state', () => {
    it('marks isPartial true on a non-final ripening and false on the final one', () => {
      const store = new KarmicStore({ enableAutoRipening: false });
      const seed = store.plantSeed({
        quality: 'wholesome',
        description: 'twice-ripening gift',
        intentionStrength: 5,
        root: 'non-greed',
        type: 'mental',
        minDelay: 0,
        maxRipenings: 2,
      });

      const firstVipaka = store.forceRipen(seed.id);
      expect(firstVipaka!.isPartial).toBe(true);

      const secondVipaka = store.forceRipen(seed.id);
      expect(secondVipaka!.isPartial).toBe(false);
    });

    it('marks isPartial false for a default one-shot seed', () => {
      const store = new KarmicStore({ enableAutoRipening: false });
      const seed = store.plantSeed({
        quality: 'wholesome',
        description: 'one-shot gift',
        intentionStrength: 5,
        root: 'non-greed',
        type: 'mental',
        minDelay: 0,
      });

      const vipaka = store.forceRipen(seed.id);
      expect(vipaka!.isPartial).toBe(false);
    });
  });

  describe('Auto-Ripening Disabled', () => {
    it('does not schedule any ripening timer when planting a seed', () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
      try {
        const store = new KarmicStore({ enableAutoRipening: false });
        store.plantSeed({
          quality: 'wholesome',
          description: 'no timer please',
          intentionStrength: 5,
          root: 'non-greed',
          type: 'mental',
          minDelay: 0,
          maxDelay: Number.MAX_SAFE_INTEGER,
        });
        expect(setTimeoutSpy).not.toHaveBeenCalled();
      } finally {
        setTimeoutSpy.mockRestore();
      }
    });
  });
});
