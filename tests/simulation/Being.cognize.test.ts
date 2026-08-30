import { describe, it, expect, vi } from 'vitest';
import { Being } from '../../src/simulation/Being';

describe('Being.cognize()', () => {
  it('cognize returns the moment stream and plants three seeds', () => {
    const being = new Being();
    const result = being.cognize('a beautiful sunset', 'eye');
    expect(result.moments).toHaveLength(17);
    expect(result.seedsPlanted).toHaveLength(3);
    expect(result.seedsPlanted.map(s => s.timing).sort())
      .toEqual(['distant-future', 'immediate', 'next-life']);
  });

  it('meditation changes javana quality (Mind→Citta sync)', () => {
    const being = new Being();
    being.mind.activateFactor('greed', 8);
    expect(being.cognize('shiny object').quality).toBe('akusala');
    being.meditate(60, 8); // raises mindfulness in Mind
    expect(being.cognize('shiny object').quality).toBe('kusala');
  });

  it('mental cognition uses the 13-moment process', () => {
    const being = new Being();
    expect(being.cognize('a plan for tomorrow').moments).toHaveLength(13);
  });

  it('one cognize() does not count as habitual (āciṇṇa) — a single vīthi plants 3 seeds sharing one slug, not 3 repetitions', () => {
    const being = new Being();
    being.cognize('a single thought');

    const seeds = being.karmicStore.getSeeds();
    expect(seeds).toHaveLength(3);
    for (const seed of seeds) {
      const habitualCondition = seed.ripeningConditions.find(c => c.name === 'habitual-accumulation');
      expect(habitualCondition?.check()).toBe(false);
    }

    expect(being.rebirth().shapingSeed?.reason).not.toBe('habitual');
  });

  it('three separate cognize() calls of the same content accumulate to habitual (āciṇṇa)', () => {
    // Habitual-accumulation counts distinct planting events (by createdAt)
    // per slug; fake time keeps the three separate calls at distinct
    // timestamps deterministically rather than relying on synchronous calls
    // happening to cross a millisecond boundary.
    vi.useFakeTimers();
    try {
      const being = new Being();
      vi.setSystemTime(1000);
      being.cognize('the same thought');
      vi.setSystemTime(2000);
      being.cognize('the same thought');
      vi.setSystemTime(3000);
      being.cognize('the same thought');

      const seeds = being.karmicStore.getSeeds();
      const habitualCondition = seeds[0].ripeningConditions.find(c => c.name === 'habitual-accumulation');
      expect(habitualCondition?.check()).toBe(true);

      expect(being.rebirth().shapingSeed?.reason).toBe('habitual');
    } finally {
      vi.useRealTimers();
    }
  });
});
