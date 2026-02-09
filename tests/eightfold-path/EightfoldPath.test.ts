import { describe, it, expect, beforeEach } from 'vitest';
import { EightfoldPath } from '../../src/eightfold-path/EightfoldPath';

describe('EightfoldPath', () => {
  let path: EightfoldPath;

  beforeEach(() => {
    path = new EightfoldPath();
  });

  describe('Structure', () => {
    it('should have all eight factors', () => {
      const factors = path.getAllFactors();
      expect(factors).toHaveLength(8);
    });

    it('should have wisdom factors', () => {
      expect(path.rightView).toBeDefined();
      expect(path.rightIntention).toBeDefined();
      expect(path.rightView.category).toBe('wisdom');
      expect(path.rightIntention.category).toBe('wisdom');
    });

    it('should have ethics factors', () => {
      expect(path.rightSpeech).toBeDefined();
      expect(path.rightAction).toBeDefined();
      expect(path.rightLivelihood).toBeDefined();
      expect(path.rightSpeech.category).toBe('ethics');
    });

    it('should have meditation factors', () => {
      expect(path.rightEffort).toBeDefined();
      expect(path.rightMindfulness).toBeDefined();
      expect(path.rightConcentration).toBeDefined();
      expect(path.rightMindfulness.category).toBe('meditation');
    });
  });

  describe('Categories', () => {
    it('should get factors by category', () => {
      const wisdomFactors = path.getCategory('wisdom');
      expect(wisdomFactors).toHaveLength(2);

      const ethicsFactors = path.getCategory('ethics');
      expect(ethicsFactors).toHaveLength(3);

      const meditationFactors = path.getCategory('meditation');
      expect(meditationFactors).toHaveLength(3);
    });
  });

  describe('Development', () => {
    it('should start with zero development', () => {
      expect(path.getOverallDevelopment()).toBe(0);
    });

    it('should develop through practice', () => {
      path.rightMindfulness.practice(5);
      expect(path.rightMindfulness.developmentLevel).toBeGreaterThan(0);
    });

    it('should track overall development', () => {
      path.rightView.practice(5);
      path.rightIntention.practice(5);
      expect(path.getOverallDevelopment()).toBeGreaterThan(0);
    });

    it('should practice category', () => {
      path.practiceCategory('meditation', 5);
      expect(path.rightEffort.developmentLevel).toBeGreaterThan(0);
      expect(path.rightMindfulness.developmentLevel).toBeGreaterThan(0);
      expect(path.rightConcentration.developmentLevel).toBeGreaterThan(0);
    });
  });

  describe('Balance', () => {
    it('should be balanced initially', () => {
      expect(path.isBalanced()).toBe(true);
    });

    it('should detect imbalance', () => {
      // Practice only one factor heavily
      for (let i = 0; i < 20; i++) {
        path.rightMindfulness.practice(10);
      }
      expect(path.isBalanced(2)).toBe(false);
    });

    it('should identify weakest factor', () => {
      path.rightView.practice(5);
      const weakest = path.getWeakestFactor();
      expect(weakest.developmentLevel).toBe(0);
    });

    it('should identify strongest factor', () => {
      path.rightView.practice(5);
      const strongest = path.getStrongestFactor();
      expect(strongest).toBe(path.rightView);
    });
  });

  describe('Recommendation', () => {
    it('should provide recommendation', () => {
      const recommendation = path.getRecommendation();
      expect(recommendation.focusFactor).toBeDefined();
      expect(recommendation.practices).toBeInstanceOf(Array);
      expect(recommendation.reason).toBeDefined();
    });
  });

  describe('Summary', () => {
    it('should provide summary', () => {
      const summary = path.getSummary();
      expect(summary).toContain('WISDOM');
      expect(summary).toContain('ETHICS');
      expect(summary).toContain('MEDITATION');
    });
  });
});
