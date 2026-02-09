import { describe, it, expect, beforeEach } from 'vitest';
import { Karma } from '../../src/karma/Karma';
import { Intention } from '../../src/karma/Intention';

describe('Karma', () => {
  describe('Intention', () => {
    it('should create intention with quality', () => {
      const intention = new Intention('help someone', 7, 'non-greed');
      expect(intention.quality).toBe('wholesome');
      expect(intention.strength).toBe(7);
    });

    it('should identify unwholesome roots', () => {
      const intention = new Intention('take something', 5, 'greed');
      expect(intention.quality).toBe('unwholesome');
    });

    it('should handle neutral intentions', () => {
      const intention = new Intention('walk', 3);
      expect(intention.quality).toBe('neutral');
    });
  });

  describe('Karma Creation', () => {
    it('should create karma from intention', () => {
      const intention = new Intention('give a gift', 6, 'non-greed');
      const karma = new Karma(intention, 5);

      expect(karma.quality).toBe('wholesome');
      expect(karma.isCompleted).toBe(false);
    });

    it('should complete karma (plant seed)', () => {
      const intention = new Intention('help', 5, 'non-aversion');
      const karma = new Karma(intention, 5);

      const result = karma.complete();
      expect(result).toBe(true);
      expect(karma.isCompleted).toBe(true);
    });

    it('should not complete twice', () => {
      const intention = new Intention('help', 5, 'non-aversion');
      const karma = new Karma(intention, 5);

      karma.complete();
      const result = karma.complete();
      expect(result).toBe(false);
    });
  });

  describe('Karmic Results', () => {
    it('should generate potential results', () => {
      const intention = new Intention('give', 7, 'non-greed');
      const karma = new Karma(intention, 6);
      karma.complete();

      const results = karma.getPotentialResults();
      expect(results.length).toBeGreaterThan(0);
    });

    it('wholesome karma should have pleasant results', () => {
      const intention = new Intention('help', 5, 'non-greed');
      const karma = new Karma(intention, 5);
      karma.complete();

      const results = karma.getPotentialResults();
      expect(results[0].experienceQuality).toBe('pleasant');
    });

    it('unwholesome karma should have unpleasant results', () => {
      const intention = new Intention('harm', 5, 'aversion');
      const karma = new Karma(intention, 5);
      karma.complete();

      const results = karma.getPotentialResults();
      expect(results[0].experienceQuality).toBe('unpleasant');
    });

    it('should manifest results', () => {
      const intention = new Intention('give', 5, 'non-greed');
      const karma = new Karma(intention, 5);
      karma.complete();

      expect(karma.isPotential()).toBe(true);

      const result = karma.manifest();
      expect(result).toBeDefined();
      expect(karma.hasManifested).toBe(true);
      expect(karma.isPotential()).toBe(false);
    });

    it('should not manifest twice', () => {
      const intention = new Intention('give', 5, 'non-greed');
      const karma = new Karma(intention, 5);
      karma.complete();
      karma.manifest();

      const secondResult = karma.manifest();
      expect(secondResult).toBeNull();
    });
  });

  describe('Three Marks', () => {
    it('karma should bear three marks', () => {
      const intention = new Intention('act', 5);
      const karma = new Karma(intention, 5);

      expect(karma.impermanence).toBe(true);
      expect(karma.unsatisfactoriness).toBe(true);
      expect(karma.notSelf).toBe(true);
    });
  });
});
