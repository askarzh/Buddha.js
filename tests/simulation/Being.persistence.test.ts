import { describe, it, expect } from 'vitest';
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
      being.act('helping', 'wholesome', 5, 'non-greed');

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
});
