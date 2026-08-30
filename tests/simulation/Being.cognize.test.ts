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
      const habitualCondition = seed.ripeningConditions.find(c => c.name?.startsWith('habitual-accumulation'));
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
      const habitualCondition = seeds[0].ripeningConditions.find(c => c.name?.startsWith('habitual-accumulation'));
      expect(habitualCondition?.check()).toBe(true);

      expect(being.rebirth().shapingSeed?.reason).toBe('habitual');
    } finally {
      vi.useRealTimers();
    }
  });

  it('an act described exactly as a structural tag name does not crash rebirth grouping', () => {
    // description "act" slugifies to 'act', which is filtered out of tags by
    // slugOf's own exclusion list (structural tag), leaving no
    // description-derived tag — slugOf must fall back to the seed's id
    // rather than returning undefined, so rebirth() (which calls slugOf
    // while picking the shaping seed) completes without error either way.
    vi.useFakeTimers();
    try {
      const being = new Being();
      vi.setSystemTime(1000);
      being.act('act', 5, 'non-greed');
      vi.setSystemTime(2000);
      being.act('act', 5, 'non-greed');
      vi.setSystemTime(3000);
      being.act('act', 5, 'non-greed');

      // rebirth() transmigrates into a NEW being and detaches `being` from
      // the continuum, so a single call is asserted here rather than the
      // original double-call (a second call on the now-dead `being` would
      // see an empty store and report a null shapingSeed, not exercising
      // the slug-fallback path this test targets).
      let result: ReturnType<typeof being.rebirth> | undefined;
      expect(() => { result = being.rebirth(); }).not.toThrow();
      expect(result?.shapingSeed).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('trims leading/trailing dashes from action slugs so surrounding punctuation does not fragment habitual grouping', () => {
    // "!!walk the dog!!" and "walk the dog" both slugify to the same
    // dash-trimmed 'walk-the-dog' tag — without trimming, the punctuated
    // description would slugify to a leading/trailing-dash variant and
    // never accumulate together with the plain one under the same tag.
    vi.useFakeTimers();
    try {
      const being = new Being();
      vi.setSystemTime(1000);
      being.act('walk the dog', 5, 'non-greed');
      vi.setSystemTime(2000);
      being.act('!!walk the dog!!', 5, 'non-greed');
      vi.setSystemTime(3000);
      being.act('walk the dog', 5, 'non-greed');

      const seeds = being.karmicStore.getSeedsByTag('walk-the-dog');
      expect(seeds).toHaveLength(3);
      const habitual = seeds[0].ripeningConditions.find(c => c.name?.startsWith('habitual-accumulation'));
      expect(habitual?.check()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('kusala cognize seeds derive their root from the dominant active wholesome cetasika instead of hardcoding non-delusion', () => {
    const being = new Being();
    being.citta.activateCetasika('alobha', 9);
    const result = being.cognize('an act of generosity');
    expect(result.quality).toBe('kusala');
    for (const planted of result.seedsPlanted) {
      const seed = being.karmicStore.getSeed(planted.id)!;
      expect(seed.root).toBe('non-greed');
    }
  });
});
