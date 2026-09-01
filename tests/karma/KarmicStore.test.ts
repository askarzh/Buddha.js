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

  // Regression: `timeScale` is documented as "speed up/slow down time
  // (1 = realtime)", and every deferred timing divides by it. The immediate
  // branch multiplied instead, so raising timeScale to make a simulation run
  // faster made immediate seeds ripen LATER by the same factor.
  describe('timeScale direction', () => {
    it('makes immediate seeds ripen sooner as timeScale rises, not later', () => {
      vi.useFakeTimers();
      try {
        const delays: number[] = [];
        const spy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((
          _fn: () => void,
          ms?: number
        ) => {
          delays.push(ms ?? 0);
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }) as typeof setTimeout);

        for (const timeScale of [1, 10]) {
          const store = new KarmicStore({ enableAutoRipening: true, timeScale });
          store.plantSeed({
            description: 'immediate deed',
            quality: 'wholesome',
            intensity: 5,
            root: 'non-greed',
            ripeningTiming: 'immediate',
            minDelay: 1000,
          });
        }

        spy.mockRestore();

        const [atScale1, atScale10] = delays;
        expect(atScale10).toBeLessThan(atScale1);
      } finally {
        vi.useRealTimers();
      }
    });
  });

});
