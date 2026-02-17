import { describe, it, expect, beforeEach } from 'vitest';
import { TwoArrows } from '../../src/four-noble-truths/TwoArrows';

describe('TwoArrows', () => {
  let twoArrows: TwoArrows;

  beforeEach(() => {
    twoArrows = new TwoArrows();
  });

  describe('Identity', () => {
    it('should have correct name and sanskritName', () => {
      expect(twoArrows.name).toBe('TwoArrows');
      expect(twoArrows.sanskritName).toBe('Dvē Sallā');
    });
  });

  describe('analyze() — one arrow (no resistance)', () => {
    it('should identify only the first arrow when no mental reactions', () => {
      const result = twoArrows.analyze({
        pain: 'knee pain while sitting',
        mentalReactions: [],
      });

      expect(result.firstArrow.description).toBe('knee pain while sitting');
      expect(result.firstArrow.isUnavoidable).toBe(true);
      expect(result.secondArrow.count).toBe(0);
      expect(result.totalArrows).toBe('one');
      expect(result.isEightyFourthProblem).toBe(false);
    });

    it('should return insight pointing to first arrow only', () => {
      const result = twoArrows.analyze({
        pain: 'back pain',
        mentalReactions: [],
      });

      expect(result.insight).toBeTruthy();
      expect(typeof result.insight).toBe('string');
    });
  });

  describe('analyze() — two arrows (with resistance)', () => {
    it('should identify both arrows when mental reactions are present', () => {
      const result = twoArrows.analyze({
        pain: 'knee pain while sitting',
        mentalReactions: ['wishing it would stop', 'fear it will get worse'],
      });

      expect(result.firstArrow.description).toBe('knee pain while sitting');
      expect(result.secondArrow.reactions).toEqual(['wishing it would stop', 'fear it will get worse']);
      expect(result.secondArrow.count).toBe(2);
      expect(result.secondArrow.isOptional).toBe(true);
      expect(result.totalArrows).toBe('two');
      expect(result.isEightyFourthProblem).toBe(true);
    });

    it('should return a different insight when two arrows are present', () => {
      const one = twoArrows.analyze({ pain: 'pain', mentalReactions: [] });
      const two = twoArrows.analyze({ pain: 'pain', mentalReactions: ['resistance'] });
      expect(one.insight).not.toBe(two.insight);
    });
  });

  describe('hasRecognizedSecondArrow()', () => {
    it('should return false when no analyses have been done', () => {
      expect(twoArrows.hasRecognizedSecondArrow()).toBe(false);
    });

    it('should return false when only one-arrow analyses done', () => {
      twoArrows.analyze({ pain: 'pain', mentalReactions: [] });
      expect(twoArrows.hasRecognizedSecondArrow()).toBe(false);
    });

    it('should return true after any two-arrow analysis', () => {
      twoArrows.analyze({ pain: 'pain', mentalReactions: ['resistance'] });
      expect(twoArrows.hasRecognizedSecondArrow()).toBe(true);
    });

    it('should remain true even after subsequent one-arrow analyses', () => {
      twoArrows.analyze({ pain: 'pain', mentalReactions: ['resistance'] });
      twoArrows.analyze({ pain: 'pain', mentalReactions: [] });
      expect(twoArrows.hasRecognizedSecondArrow()).toBe(true);
    });
  });

  describe('getAnalysisCount()', () => {
    it('should return 0 initially', () => {
      expect(twoArrows.getAnalysisCount()).toBe(0);
    });

    it('should increment with each analysis', () => {
      twoArrows.analyze({ pain: 'p1', mentalReactions: [] });
      twoArrows.analyze({ pain: 'p2', mentalReactions: ['r'] });
      expect(twoArrows.getAnalysisCount()).toBe(2);
    });
  });

  describe('Two Truths', () => {
    it('should return conventional truth', () => {
      const truth = twoArrows.getConventionalTruth();
      expect(truth.level).toBe('conventional');
      expect(truth.description).toBeTruthy();
      expect(truth.usefulFor).toBeInstanceOf(Array);
      expect(truth.usefulFor.length).toBeGreaterThan(0);
    });

    it('should return ultimate truth', () => {
      const truth = twoArrows.getUltimateTruth();
      expect(truth.level).toBe('ultimate');
      expect(truth.description).toBeTruthy();
      expect(truth.transcends).toBeInstanceOf(Array);
      expect(truth.transcends.length).toBeGreaterThan(0);
    });
  });
});
