import { describe, it, expect, vi } from 'vitest';
import { Being } from '../../src/simulation/Being';

describe('Being Persistence', () => {
  describe('toJSON', () => {
    it('should serialize a fresh being', () => {
      const being = new Being();
      const data = being.toJSON();

      expect(data.mindfulnessLevel).toBe(0);
      expect(data.karmicStream).toEqual([]);
      expect(data.experienceHistory).toEqual([]);
      expect(data.path).toBeDefined();
      expect(data.path.factors).toHaveLength(8);
      expect(data.mind).toBeDefined();
      expect(data.dependentOrigination).toBeDefined();
      expect(data.dependentOrigination.links).toHaveLength(12);
    });

    it('should serialize after meditation', () => {
      const being = new Being();
      being.meditate(10, 7);

      const data = being.toJSON();
      expect(data.mindfulnessLevel).toBeGreaterThan(0);
      const effortFactor = data.path.factors.find(f => f.name === 'Right Effort');
      expect(effortFactor!.developmentLevel).toBeGreaterThan(0);
    });

    it('should serialize after acting', () => {
      const being = new Being();
      being.act('helping', 5, 'non-greed');

      const data = being.toJSON();
      expect(data.karmicStream).toHaveLength(1);
      expect(data.karmicStream[0].quality).toBe('wholesome');
      expect(data.karmicStream[0].isCompleted).toBe(true);
    });

    it('should serialize after experiencing', () => {
      const being = new Being();
      being.experience({ senseBase: 'eye', object: 'sunset', intensity: 8 });

      const data = being.toJSON();
      expect(data.experienceHistory).toHaveLength(1);
      expect(data.experienceHistory[0].input.object).toBe('sunset');
    });

    it('should be JSON.stringify compatible', () => {
      const being = new Being();
      being.meditate(10, 7);
      const str = JSON.stringify(being);
      const parsed = JSON.parse(str);
      expect(parsed.mindfulnessLevel).toBeGreaterThan(0);
    });
  });

  describe('fromJSON', () => {
    it('should restore a fresh being', () => {
      const being = new Being();
      const data = being.toJSON();
      const restored = Being.fromJSON(data);

      expect(restored.mindfulnessLevel).toBe(0);
      expect(restored.getKarmicStream()).toHaveLength(0);
      expect(restored.getExperienceHistory()).toHaveLength(0);
    });

    it('should restore mindfulness level after meditation', () => {
      const being = new Being();
      being.meditate(10, 8);
      const originalLevel = being.mindfulnessLevel;

      const data = being.toJSON();
      const restored = Being.fromJSON(data);

      expect(restored.mindfulnessLevel).toBe(originalLevel);
    });

    it('should restore path factor development', () => {
      const being = new Being();
      being.meditate(10, 7);
      const originalProgress = being.path.getOverallDevelopment();

      const data = being.toJSON();
      const restored = Being.fromJSON(data);

      expect(restored.path.getOverallDevelopment()).toBeCloseTo(originalProgress, 1);
    });

    it('should restore mind state', () => {
      const being = new Being();
      being.mind.activateFactor('mindfulness', 8);
      being.mind.setClarity(9);

      const data = being.toJSON();
      const restored = Being.fromJSON(data);
      const state = restored.mind.getState();

      expect(state.clarity).toBe(9);
      expect(restored.mind.getFactor('mindfulness')?.isActive).toBe(true);
    });

    it('should restore karmic stream', () => {
      const being = new Being();
      being.act('donate', 7, 'non-greed');
      being.act('insult', 3, 'aversion');

      const data = being.toJSON();
      const restored = Being.fromJSON(data);

      expect(restored.getKarmicStream()).toHaveLength(2);
    });

    it('should survive full round-trip via JSON.stringify', () => {
      const being = new Being();
      being.meditate(10, 6);
      being.act('help', 5, 'non-greed');
      being.experience({ senseBase: 'ear', object: 'birdsong', intensity: 6 });

      const str = JSON.stringify(being);
      const parsed = JSON.parse(str);
      const restored = Being.fromJSON(parsed);

      expect(restored.mindfulnessLevel).toBe(being.mindfulnessLevel);
      expect(restored.getKarmicStream()).toHaveLength(1);
      expect(restored.getExperienceHistory(100)).toHaveLength(being.getExperienceHistory(100).length);
    });

    it('rebinds habitual-accumulation per-slug so unrelated actions do not cross-pollute after restore', () => {
      // countDistinctPlantings counts distinct createdAt timestamps per slug,
      // so fake time keeps the three "walk the dog" acts at distinct instants
      // deterministically, matching the pattern used for cognize() above.
      vi.useFakeTimers();
      let being: Being;
      let data;
      try {
        being = new Being();
        vi.setSystemTime(1000);
        being.act('walk the dog', 5, 'non-greed');
        vi.setSystemTime(2000);
        being.act('walk the dog', 5, 'non-greed');
        vi.setSystemTime(3000);
        being.act('walk the dog', 5, 'non-greed');
        vi.setSystemTime(4000);
        being.act('write code', 5, 'non-greed');
        data = being.toJSON();
      } finally {
        vi.useRealTimers();
      }

      const restored = Being.fromJSON(data);

      const walkSeeds = restored.karmicStore.getSeedsByTag('walk-the-dog');
      const writeSeeds = restored.karmicStore.getSeedsByTag('write-code');
      expect(walkSeeds.length).toBeGreaterThan(0);
      expect(writeSeeds.length).toBeGreaterThan(0);

      const walkHabitual = walkSeeds[0].ripeningConditions.find(c =>
        c.name?.startsWith('habitual-accumulation')
      );
      const writeHabitual = writeSeeds[0].ripeningConditions.find(c =>
        c.name?.startsWith('habitual-accumulation')
      );

      expect(walkHabitual?.check()).toBe(true);
      expect(writeHabitual?.check()).toBe(false);
    });

    it('should allow continued practice after restore', () => {
      const being = new Being();
      being.meditate(10, 5);

      const data = being.toJSON();
      const restored = Being.fromJSON(data);

      const result = restored.meditate(10, 7);
      expect(result.mindfulnessLevel).toBeGreaterThanOrEqual(being.mindfulnessLevel);
    });
  });

  describe('getSeedStats', () => {
    it('returns the balance/byState/byTiming/incarnation shape shared with the MCP status handler', () => {
      const being = new Being();
      being.act('donate', 7, 'non-greed');

      const stats = being.getSeedStats();
      expect(stats).toHaveProperty('balance');
      expect(stats.balance).toHaveProperty('wholesome');
      expect(stats).toHaveProperty('byState');
      expect(stats).toHaveProperty('byTiming');
      expect(stats).toHaveProperty('incarnation', 1);
    });
  });
});
