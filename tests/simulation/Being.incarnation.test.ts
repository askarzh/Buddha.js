import { describe, it, expect, vi, afterEach } from 'vitest';
import { Being } from '../../src/simulation/Being';

describe('Being incarnation tracking', () => {
  it('starts at incarnation 1', () => {
    const being = new Being();
    expect(being.incarnation).toBe(1);
  });

  it('a load after the gap advances the incarnation', () => {
    process.env.BUDDHA_INCARNATION_GAP_MS = '0';
    try {
      const being = new Being();
      expect(being.incarnation).toBe(1);
      const restored = Being.fromJSON(being.toJSON());
      expect(restored.incarnation).toBe(2);
    } finally {
      delete process.env.BUDDHA_INCARNATION_GAP_MS;
    }
  });

  it('does not advance incarnation on a quick reload (within the gap)', () => {
    const being = new Being();
    const restored = Being.fromJSON(being.toJSON());
    expect(restored.incarnation).toBe(1);
  });

  it('tolerates legacy saves missing incarnation and lastActiveAt (no spurious increment)', () => {
    const being = new Being();
    const data = being.toJSON();
    delete (data as { incarnation?: number }).incarnation;
    delete (data as { lastActiveAt?: number }).lastActiveAt;

    const restored = Being.fromJSON(data);
    expect(restored.incarnation).toBe(1);
  });

  it('never advances a legacy save (no lastActiveAt) even with BUDDHA_INCARNATION_GAP_MS=0', () => {
    process.env.BUDDHA_INCARNATION_GAP_MS = '0';
    try {
      const being = new Being();
      const data = being.toJSON();
      delete (data as { incarnation?: number }).incarnation;
      delete (data as { lastActiveAt?: number }).lastActiveAt;

      const restored = Being.fromJSON(data);
      expect(restored.incarnation).toBe(1);
    } finally {
      delete process.env.BUDDHA_INCARNATION_GAP_MS;
    }
  });

  it('plants seeds tagged with the live incarnation counter', () => {
    const being = new Being();
    being.act('daily practice', 5, 'non-delusion');
    const seed = being.karmicStore.getSeeds()[0];
    expect(seed.tags).toContain('incarnation:1');

    // rebirth() transmigrates into a NEW being — `being` is now detached and
    // dead; subsequent interaction must go through the returned being.
    const { being: reborn } = being.rebirth();
    reborn.act('daily practice', 5, 'non-delusion');
    const seeds = reborn.karmicStore.getSeeds();
    const newest = seeds[seeds.length - 1];
    expect(newest.tags).toContain('incarnation:2');
  });

  it('rebirth expires ahosi seeds and names the shaping seed', () => {
    // Habitual (āciṇṇa) now counts distinct planting events (by createdAt)
    // per slug, so these three separate act() calls must land at distinct
    // timestamps — fake time keeps that deterministic instead of relying on
    // three synchronous calls happening to cross a millisecond boundary.
    vi.useFakeTimers();
    try {
      const being = new Being();
      vi.setSystemTime(1000);
      being.act('daily practice', 5, 'non-delusion');
      vi.setSystemTime(2000);
      being.act('daily practice', 5, 'non-delusion');
      vi.setSystemTime(3000);
      being.act('daily practice', 5, 'non-delusion');
      const result = being.rebirth();
      expect(result.incarnation).toBe(2);
      expect(result.shapingSeed?.reason).toBe('habitual');
    } finally {
      vi.useRealTimers();
    }
  });

  it('rebirth reports null shaping seed when the store is empty', () => {
    const being = new Being();
    const result = being.rebirth();
    expect(result.shapingSeed).toBeNull();
  });

  it('rebirth prefers a weighty seed as the shaping seed', () => {
    const being = new Being();
    being.karmicStore.plantSeed({
      quality: 'wholesome',
      description: 'a life-defining vow',
      potency: 90,
      tags: ['non-delusion', 'act', 'a-life-defining-vow', 'incarnation:1'],
    });
    being.act('daily practice', 5, 'non-delusion');
    being.act('daily practice', 5, 'non-delusion');
    being.act('daily practice', 5, 'non-delusion');

    const result = being.rebirth();
    expect(result.shapingSeed?.reason).toBe('weighty');
    expect(result.shapingSeed?.description).toBe('a life-defining vow');
  });

  it('an immediate-timing seed is exhausted by rebirth, not ripened afterward', () => {
    const being = new Being();
    being.karmicStore.plantSeed({
      quality: 'wholesome',
      description: 'instant fruit',
      ripeningTiming: 'immediate',
      tags: ['non-delusion', 'incarnation:1'],
    });

    // rebirth() transmigrates into a NEW being — the continuum (and hence
    // the planted seed) lives on `reborn`, not the dying `being`.
    const { being: reborn } = being.rebirth();
    const report = reborn.receiveKarmicResults(true);

    expect(report.seedVipakas.some(v => v.description === 'instant fruit')).toBe(false);
    const seed = reborn.karmicStore
      .getSeeds()
      .find(s => s.description === 'instant fruit');
    expect(seed?.state).toBe('exhausted');
  });

  it('rebirth never names an expiring immediate-timing seed as the shaping seed', () => {
    const being = new Being();
    being.karmicStore.plantSeed({
      quality: 'wholesome',
      description: 'instant fruit',
      potency: 10,
      ripeningTiming: 'immediate',
      tags: ['non-delusion', 'incarnation:1'],
    });
    being.karmicStore.plantSeed({
      quality: 'wholesome',
      description: 'distant fruit',
      potency: 10,
      ripeningTiming: 'distant-future',
      tags: ['non-delusion', 'incarnation:1'],
    });

    const result = being.rebirth();

    expect(result.shapingSeed?.description).not.toBe('instant fruit');
    expect(result.shapingSeed?.description).toBe('distant fruit');

    // The continuum (and hence the seeds) now lives on result.being, not
    // the dying `being`.
    const instantSeed = result.being.karmicStore
      .getSeeds()
      .find(s => s.description === 'instant fruit');
    expect(instantSeed?.state).toBe('exhausted');
  });

  it('a next-life seed does not ripen in its planting incarnation, ripens after rebirth', () => {
    const being = new Being();
    being.karmicStore.plantSeed({
      quality: 'wholesome',
      description: 'next-life fruit',
      ripeningTiming: 'next-life',
      tags: ['non-delusion', 'incarnation:1'],
    });

    const before = being.receiveKarmicResults(true);
    expect(before.seedVipakas.some(v => v.description === 'next-life fruit')).toBe(false);
    expect(before.whyNot.some(w => w.description === 'next-life fruit' && w.unmet.some(u => u.includes('incarnation 2')))).toBe(true);

    // The continuum transmigrates onto a new being; keep interacting with it.
    const { being: reborn } = being.rebirth();
    const after = reborn.receiveKarmicResults(true);
    expect(after.seedVipakas.some(v => v.description.includes('next-life fruit'))).toBe(true);
  });

  describe('settling a pending rebirth after a gap-load does not double-advance the incarnation', () => {
    const ORIGINAL_GAP = process.env.BUDDHA_INCARNATION_GAP_MS;

    afterEach(() => {
      if (ORIGINAL_GAP === undefined) {
        delete process.env.BUDDHA_INCARNATION_GAP_MS;
      } else {
        process.env.BUDDHA_INCARNATION_GAP_MS = ORIGINAL_GAP;
      }
    });

    it('REGRESSION: a next-life seed planted before a gap ripens in the settled life instead of being exhausted unripened', () => {
      const being = new Being();
      // Plant a next-life (upapajja) seed at incarnation 1 — the same shape
      // cognize() plants at javana 7 on every cognition.
      being.karmicStore.plantSeed({
        quality: 'wholesome',
        description: 'next-life fruit',
        ripeningTiming: 'next-life',
        tags: ['non-delusion', 'incarnation:1'],
      });
      const saved = being.toJSON();

      process.env.BUDDHA_INCARNATION_GAP_MS = '0';
      const restored = Being.fromJSON(saved);
      expect(restored.pendingRebirth).toBe(true);

      const result = restored.settlePendingRebirth();
      expect(result).not.toBeNull();
      const reborn = result!.being;

      // The seed must have survived rebirth()'s ahosi sweep still active —
      // the double-advance bug lands the settled life on incarnation 3,
      // which is already past the seed's incarnation-2 window, so the sweep
      // exhausts it before it ever gets a chance to ripen.
      const seed = reborn.karmicStore.getSeeds().find(s => s.description === 'next-life fruit');
      expect(seed?.state).toBe('active');

      const report = reborn.receiveKarmicResults(true);
      // KarmicStore.createVipaka() wraps the seed description ("Result of
      // ... karma: <description>"), so match with includes() as the sibling
      // test above ("ripens after rebirth") does — not exact equality.
      expect(report.seedVipakas.some(v => v.description.includes('next-life fruit'))).toBe(true);
    });

    it('COUNTER: saving at incarnation N, gap-loading, then settling advances to exactly N+1', () => {
      const being = new Being();
      being.act('daily practice', 5, 'non-delusion');
      const savedIncarnation = being.incarnation;
      const saved = being.toJSON();

      process.env.BUDDHA_INCARNATION_GAP_MS = '0';
      const restored = Being.fromJSON(saved);
      const result = restored.settlePendingRebirth();

      expect(result).not.toBeNull();
      expect(result!.incarnation).toBe(savedIncarnation + 1);
      expect(result!.being.incarnation).toBe(savedIncarnation + 1);
    });
  });

  it('a distant-future seed never expires and ripens once in the future', () => {
    const being = new Being();
    being.karmicStore.plantSeed({
      quality: 'wholesome',
      description: 'distant fruit',
      ripeningTiming: 'distant-future',
      tags: ['non-delusion', 'incarnation:1'],
    });

    const before = being.receiveKarmicResults(true);
    expect(before.seedVipakas.some(v => v.description === 'distant fruit')).toBe(false);

    // Each rebirth() transmigrates into a new being; chain through the
    // returned being to keep following the same continuum.
    let current = being;
    for (let i = 0; i < 3; i++) {
      current = current.rebirth().being;
    }
    const after = current.receiveKarmicResults(true);
    expect(after.seedVipakas.some(v => v.description.includes('distant fruit'))).toBe(true);
  });
});
