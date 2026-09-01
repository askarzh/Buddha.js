import { describe, it, expect } from 'vitest';
import { Being } from '../../src/simulation/Being';
import { serializeBeing, deserializeBeing } from '../../src/simulation/BeingSerializer';

describe('BeingSerializer', () => {
  describe('serializeBeing()', () => {
    it('should serialize a fresh being', () => {
      const being = new Being();
      const data = serializeBeing(being);

      expect(data.mindfulnessLevel).toBe(0);
      expect(data.karmicStream).toBeUndefined(); // removed in 0.6.0, no longer written
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
      being.act('help', 5, 'non-greed');
      being.experience({ senseBase: 'ear', object: 'music', intensity: 6 });

      const fromMethod = being.toJSON();
      const fromSerializer = serializeBeing(being);

      // lastActiveAt is refreshed with Date.now() on every call, so the two
      // separate serializations legitimately differ on that one field.
      expect(fromSerializer).toEqual({ ...fromMethod, lastActiveAt: fromSerializer.lastActiveAt });
    });
  });

  describe('deserializeBeing()', () => {
    it('should restore a being from serialized data', () => {
      const being = new Being();
      being.meditate(10, 8);
      being.act('donate', 7, 'non-greed');

      const data = serializeBeing(being);
      const restored = deserializeBeing(data);

      expect(restored.mindfulnessLevel).toBe(being.mindfulnessLevel);
      expect(restored.karmicStore.getSeeds()).toHaveLength(1);
    });

    it('should produce same result as Being.fromJSON()', () => {
      const being = new Being();
      being.meditate(10, 6);
      being.experience({ senseBase: 'mind', object: 'thought', intensity: 3 });

      const data = serializeBeing(being);
      const fromMethod = Being.fromJSON(data);
      const fromSerializer = deserializeBeing(data);

      expect(fromSerializer.mindfulnessLevel).toBe(fromMethod.mindfulnessLevel);
      expect(fromSerializer.karmicStore.getSeeds()).toHaveLength(fromMethod.karmicStore.getSeeds().length);
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

    it('should round-trip valence on experience input', () => {
      const being = new Being();
      being.experience({ senseBase: 'body', object: 'pain', intensity: 8, valence: 'unpleasant' });

      const data = serializeBeing(being);
      expect(data.experienceHistory[0].input.valence).toBe('unpleasant');

      const restored = deserializeBeing(data);
      expect(restored.getExperienceHistory(1)[0].input.valence).toBe('unpleasant');
    });

    it('should tolerate legacy serialized data without a valence field', () => {
      const being = new Being();
      being.experience({ senseBase: 'body', object: 'pain', intensity: 8, valence: 'unpleasant' });

      const data = serializeBeing(being);
      delete (data.experienceHistory[0].input as { valence?: unknown }).valence;

      const restored = deserializeBeing(data);
      expect(restored.getExperienceHistory(1)[0].input.valence).toBeUndefined();
    });
  });

  describe('karmic store round-trip', () => {
    it('round-trips the karmic store', () => {
      const being = new Being();
      being.act('planted a garden', 6, 'non-greed');
      const restored = Being.fromJSON(being.toJSON());
      expect(restored.karmicStore.getSeeds()).toHaveLength(1);
      expect(restored.karmicStore.getSeeds()[0].quality).toBe('wholesome');
    });

    it('loads legacy saves without a karmicStore field', () => {
      const data = new Being().toJSON();
      delete (data as any).karmicStore;
      const restored = Being.fromJSON(data);
      expect(restored.karmicStore.getSeeds()).toHaveLength(0);
    });

    it('rebinds named ripening conditions after restore', () => {
      const being = new Being();
      being.act('planted a garden', 6, 'non-greed');
      const restored = Being.fromJSON(being.toJSON());

      const seed = restored.karmicStore.getSeeds()[0];

      // Conditions were rebound to live checks (not the () => false stub
      // fromJSON installs for unresolved conditions) — every condition still
      // carries its name, and a non-force ripen attempt evaluates them
      // rather than failing on a dead stub.
      expect(seed.ripeningConditions.every(c => c.name)).toBe(true);

      const report = restored.receiveKarmicResults();
      expect(report.whyNot.length).toBeGreaterThan(0);
      expect(report.whyNot[0].unmet.join(' ')).toMatch(/mindfulness/);

      // force bypasses conditions entirely, proving the store round-tripped
      // correctly regardless of condition state.
      const forced = restored.receiveKarmicResults(true);
      expect(forced.seedVipakas.length).toBeGreaterThan(0);
    });
  });
});
