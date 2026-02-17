import { describe, it, expect, beforeEach } from 'vitest';
import { PoisonArrow } from '../../src/simulation/PoisonArrow';

describe('PoisonArrow', () => {
  let sim: PoisonArrow;

  beforeEach(() => {
    sim = new PoisonArrow('anxiety about the future');
  });

  describe('construction', () => {
    it('should throw if suffering description is empty', () => {
      expect(() => new PoisonArrow('')).toThrow();
      expect(() => new PoisonArrow('   ')).toThrow();
    });
  });

  describe('initial state', () => {
    it('should not be complete initially', () => {
      expect(sim.isComplete()).toBe(false);
    });

    it('should have no current stage before first step', () => {
      expect(sim.getCurrentStage()).toBeNull();
    });

    it('should have empty steps history', () => {
      expect(sim.getSteps()).toEqual([]);
    });
  });

  describe('step() — four stages', () => {
    it('should return recognize stage on first step', () => {
      const result = sim.step();
      expect(result.stage).toBe('recognize');
      expect(result.truth).toBe('dukkha');
      expect(result.insight).toBeTruthy();
      expect(result.guidance).toBeTruthy();
    });

    it('should return investigate stage on second step', () => {
      sim.step();
      const result = sim.step();
      expect(result.stage).toBe('investigate');
      expect(result.truth).toBe('samudaya');
    });

    it('should return release stage on third step', () => {
      sim.step();
      sim.step();
      const result = sim.step();
      expect(result.stage).toBe('release');
      expect(result.truth).toBe('nirodha');
    });

    it('should return practice stage on fourth step', () => {
      sim.step();
      sim.step();
      sim.step();
      const result = sim.step();
      expect(result.stage).toBe('practice');
      expect(result.truth).toBe('magga');
    });

    it('should include the suffering description in the recognize insight', () => {
      const result = sim.step();
      expect(result.insight).toContain('anxiety about the future');
    });
  });

  describe('completion', () => {
    it('should be complete after 4 steps', () => {
      sim.step();
      sim.step();
      sim.step();
      sim.step();
      expect(sim.isComplete()).toBe(true);
    });

    it('should throw when stepping past completion', () => {
      sim.step();
      sim.step();
      sim.step();
      sim.step();
      expect(() => sim.step()).toThrow();
    });
  });

  describe('getCurrentStage()', () => {
    it('should track the current stage after each step', () => {
      sim.step();
      expect(sim.getCurrentStage()).toBe('recognize');
      sim.step();
      expect(sim.getCurrentStage()).toBe('investigate');
      sim.step();
      expect(sim.getCurrentStage()).toBe('release');
      sim.step();
      expect(sim.getCurrentStage()).toBe('practice');
    });
  });

  describe('getSteps()', () => {
    it('should accumulate steps history', () => {
      sim.step();
      sim.step();
      const steps = sim.getSteps();
      expect(steps).toHaveLength(2);
      expect(steps[0].stage).toBe('recognize');
      expect(steps[1].stage).toBe('investigate');
    });

    it('should return a read-only copy', () => {
      sim.step();
      const steps = sim.getSteps();
      expect(steps).toHaveLength(1);
      // Original should not be affected by future steps
      sim.step();
      expect(steps).toHaveLength(1);
    });
  });

  describe('getSummary()', () => {
    it('should include suffering description', () => {
      sim.step();
      const summary = sim.getSummary();
      expect(summary).toContain('anxiety about the future');
    });

    it('should include all completed stages', () => {
      sim.step();
      sim.step();
      sim.step();
      sim.step();
      const summary = sim.getSummary();
      expect(summary).toContain('recognize');
      expect(summary).toContain('investigate');
      expect(summary).toContain('release');
      expect(summary).toContain('practice');
    });
  });
});
