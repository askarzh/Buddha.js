import { describe, it, expect } from 'vitest';
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

  it('plants seeds tagged with the live incarnation counter', () => {
    const being = new Being();
    being.act('daily practice', 5, 'non-delusion');
    const seed = being.karmicStore.getSeeds()[0];
    expect(seed.tags).toContain('incarnation:1');

    being.rebirth();
    being.act('daily practice', 5, 'non-delusion');
    const seeds = being.karmicStore.getSeeds();
    const newest = seeds[seeds.length - 1];
    expect(newest.tags).toContain('incarnation:2');
  });

  it('rebirth expires ahosi seeds and names the shaping seed', () => {
    const being = new Being();
    being.act('daily practice', 5, 'non-delusion');
    being.act('daily practice', 5, 'non-delusion');
    being.act('daily practice', 5, 'non-delusion');
    const result = being.rebirth();
    expect(result.incarnation).toBe(2);
    expect(result.shapingSeed?.reason).toBe('habitual');
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

    being.rebirth();
    const report = being.receiveKarmicResults(true);

    expect(report.seedVipakas.some(v => v.description === 'instant fruit')).toBe(false);
    const seed = being.karmicStore
      .getSeeds()
      .find(s => s.description === 'instant fruit');
    expect(seed?.state).toBe('exhausted');
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

    being.rebirth();
    const after = being.receiveKarmicResults(true);
    expect(after.seedVipakas.some(v => v.description.includes('next-life fruit'))).toBe(true);
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

    being.rebirth();
    being.rebirth();
    being.rebirth();
    const after = being.receiveKarmicResults(true);
    expect(after.seedVipakas.some(v => v.description.includes('distant fruit'))).toBe(true);
  });
});
