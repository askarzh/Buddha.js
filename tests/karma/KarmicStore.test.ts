import { describe, it, expect } from 'vitest';
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
});
