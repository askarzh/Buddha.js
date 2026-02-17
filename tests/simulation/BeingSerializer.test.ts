import { describe, it, expect } from 'vitest';
import { Being } from '../../src/simulation/Being';
import { serializeBeing, deserializeBeing } from '../../src/simulation/BeingSerializer';

describe('BeingSerializer', () => {
  describe('serializeBeing()', () => {
    it('should serialize a fresh being', () => {
      const being = new Being();
      const data = serializeBeing(being);

      expect(data.mindfulnessLevel).toBe(0);
      expect(data.karmicStream).toEqual([]);
      expect(data.experienceHistory).toEqual([]);
      expect(data.path.factors).toHaveLength(8);
      expect(data.mind).toBeDefined();
      expect(data.dependentOrigination.links).toHaveLength(12);
    });

    it('should capture full experience history', () => {
      const being = new Being();
      for (let i = 0; i < 15; i++) {
        being.experience({ senseBase: 'eye', object: `item-${i}`, intensity: 5 });
      }

      const data = serializeBeing(being);
      expect(data.experienceHistory).toHaveLength(15);
    });

    it('should produce same output as Being.toJSON()', () => {
      const being = new Being();
      being.meditate(10, 7);
      being.act('help', 'wholesome', 5, 'non-greed');
      being.experience({ senseBase: 'ear', object: 'music', intensity: 6 });

      const fromMethod = being.toJSON();
      const fromSerializer = serializeBeing(being);

      expect(fromSerializer).toEqual(fromMethod);
    });
  });

  describe('deserializeBeing()', () => {
    it('should restore a being from serialized data', () => {
      const being = new Being();
      being.meditate(10, 8);
      being.act('donate', 'wholesome', 7, 'non-greed');

      const data = serializeBeing(being);
      const restored = deserializeBeing(data);

      expect(restored.mindfulnessLevel).toBe(being.mindfulnessLevel);
      expect(restored.getKarmicStream()).toHaveLength(1);
    });

    it('should produce same result as Being.fromJSON()', () => {
      const being = new Being();
      being.meditate(10, 6);
      being.experience({ senseBase: 'mind', object: 'thought', intensity: 3 });

      const data = serializeBeing(being);
      const fromMethod = Being.fromJSON(data);
      const fromSerializer = deserializeBeing(data);

      expect(fromSerializer.mindfulnessLevel).toBe(fromMethod.mindfulnessLevel);
      expect(fromSerializer.getKarmicStream()).toHaveLength(fromMethod.getKarmicStream().length);
      expect(fromSerializer.path.getOverallDevelopment()).toBeCloseTo(fromMethod.path.getOverallDevelopment(), 1);
    });

    it('should allow continued practice after restore', () => {
      const being = new Being();
      being.meditate(10, 5);

      const data = serializeBeing(being);
      const restored = deserializeBeing(data);

      const result = restored.meditate(10, 7);
      expect(result.mindfulnessLevel).toBeGreaterThanOrEqual(being.mindfulnessLevel);
    });
  });
});
