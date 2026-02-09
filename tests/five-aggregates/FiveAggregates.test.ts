import { describe, it, expect, beforeEach } from 'vitest';
import { FiveAggregates } from '../../src/five-aggregates/FiveAggregates';

describe('FiveAggregates', () => {
  let aggregates: FiveAggregates;

  beforeEach(() => {
    aggregates = new FiveAggregates();
  });

  describe('Structure', () => {
    it('should have all five aggregates', () => {
      expect(aggregates.form).toBeDefined();
      expect(aggregates.feeling).toBeDefined();
      expect(aggregates.perception).toBeDefined();
      expect(aggregates.mentalFormations).toBeDefined();
      expect(aggregates.consciousness).toBeDefined();
    });

    it('should have aggregates in correct order', () => {
      const all = aggregates.getAllAggregates();
      expect(all).toHaveLength(5);
      expect(all[0].position).toBe(1);
      expect(all[4].position).toBe(5);
    });
  });

  describe('Experience Processing', () => {
    it('should process sensory input', () => {
      const experience = aggregates.processExperience({
        senseBase: 'eye',
        object: 'flower',
        intensity: 7
      });

      expect(experience.label).toBeDefined();
      expect(experience.feelingTone).toBeDefined();
      expect(experience.reactions).toBeInstanceOf(Array);
    });

    it('should determine feeling tone based on intensity', () => {
      const pleasant = aggregates.processExperience({
        senseBase: 'eye',
        object: 'beautiful',
        intensity: 8
      });
      expect(pleasant.feelingTone).toBe('pleasant');

      const unpleasant = aggregates.processExperience({
        senseBase: 'eye',
        object: 'ugly',
        intensity: 2
      });
      expect(unpleasant.feelingTone).toBe('unpleasant');
    });
  });

  describe('Self Inquiry', () => {
    it('should not find self in any aggregate', () => {
      const result = aggregates.searchForSelf();

      expect(result.selfFound).toBe(false);
      expect(result.aggregatesExamined).toHaveLength(5);

      result.aggregatesExamined.forEach(exam => {
        expect(exam.isSelf).toBe(false);
      });
    });

    it('should provide conclusion', () => {
      const result = aggregates.searchForSelf();
      expect(result.conclusion).toContain('No unchanging');
    });
  });

  describe('Three Marks', () => {
    it('all aggregates should bear three marks', () => {
      const all = aggregates.getAllAggregates();

      all.forEach(agg => {
        expect(agg.impermanence).toBe(true);
        expect(agg.unsatisfactoriness).toBe(true);
        expect(agg.notSelf).toBe(true);
      });
    });
  });

  describe('Snapshot', () => {
    it('should provide state snapshot', () => {
      const snapshot = aggregates.getSnapshot();

      expect(snapshot.form).toBeDefined();
      expect(snapshot.feeling).toBeDefined();
      expect(snapshot.perception).toBeDefined();
      expect(snapshot.mentalFormations).toBeDefined();
      expect(snapshot.consciousness).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();
    });
  });

  describe('Summary', () => {
    it('should provide summary', () => {
      const summary = aggregates.getSummary();

      expect(summary).toContain('RUPA');
      expect(summary).toContain('VEDANA');
      expect(summary).toContain('SAMJNA');
      expect(summary).toContain('SAMSKARA');
      expect(summary).toContain('VIJNANA');
    });
  });
});
