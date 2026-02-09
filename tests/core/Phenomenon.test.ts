import { describe, it, expect, beforeEach } from 'vitest';
import { Phenomenon } from '../../src/core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../../src/core/TwoTruths';

// Concrete implementation for testing
class TestPhenomenon extends Phenomenon {
  readonly name = 'TestPhenomenon';
  readonly sanskritName = 'Pariksha';

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: 'A test phenomenon',
      usefulFor: ['testing']
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description: 'Empty of inherent existence',
      transcends: ['reification']
    };
  }
}

describe('Phenomenon', () => {
  let phenomenon: TestPhenomenon;

  beforeEach(() => {
    phenomenon = new TestPhenomenon();
  });

  describe('Three Marks of Existence', () => {
    it('should have impermanence as true', () => {
      expect(phenomenon.impermanence).toBe(true);
    });

    it('should have unsatisfactoriness as true', () => {
      expect(phenomenon.unsatisfactoriness).toBe(true);
    });

    it('should have notSelf as true', () => {
      expect(phenomenon.notSelf).toBe(true);
    });
  });

  describe('Arising and Ceasing', () => {
    it('should not be arisen initially', () => {
      expect(phenomenon.hasArisen).toBe(false);
      expect(phenomenon.isPresent).toBe(false);
    });

    it('should arise when conditions are met', () => {
      const result = phenomenon.arise();
      expect(result).toBe(true);
      expect(phenomenon.hasArisen).toBe(true);
      expect(phenomenon.isPresent).toBe(true);
    });

    it('should not arise twice', () => {
      phenomenon.arise();
      const result = phenomenon.arise();
      expect(result).toBe(false);
    });

    it('should cease after arising', () => {
      phenomenon.arise();
      const result = phenomenon.cease();
      expect(result).toBe(true);
      expect(phenomenon.hasCeased).toBe(true);
      expect(phenomenon.isPresent).toBe(false);
    });

    it('should not cease if not arisen', () => {
      const result = phenomenon.cease();
      expect(result).toBe(false);
    });
  });

  describe('Conditions', () => {
    it('should track conditions', () => {
      const condition = new TestPhenomenon();
      phenomenon.addCondition(condition);
      expect(phenomenon.getConditions()).toContain(condition);
    });

    it('should not arise if conditions not met', () => {
      const condition = new TestPhenomenon();
      phenomenon.addCondition(condition);
      // Condition has not arisen
      const result = phenomenon.arise();
      expect(result).toBe(false);
    });

    it('should arise when conditions are met', () => {
      const condition = new TestPhenomenon();
      condition.arise();
      phenomenon.addCondition(condition);
      const result = phenomenon.arise();
      expect(result).toBe(true);
    });
  });

  describe('ThreeMarksExaminable', () => {
    it('should examine impermanence', () => {
      const insight = phenomenon.examineImpermanence();
      expect(insight.arises).toBe(true);
      expect(insight.persists).toBe(false);
      expect(insight.ceases).toBe(true);
    });

    it('should examine unsatisfactoriness', () => {
      const insight = phenomenon.examineUnsatisfactoriness();
      expect(insight.providesLastingSatisfaction).toBe(false);
    });

    it('should examine not-self', () => {
      const insight = phenomenon.examineNotSelf();
      expect(insight.hasInherentExistence).toBe(false);
      expect(insight.controlledBy).toBe('none');
    });
  });

  describe('TwoTruthsExaminable', () => {
    it('should provide conventional truth', () => {
      const truth = phenomenon.getConventionalTruth();
      expect(truth.level).toBe('conventional');
    });

    it('should provide ultimate truth', () => {
      const truth = phenomenon.getUltimateTruth();
      expect(truth.level).toBe('ultimate');
    });
  });
});
