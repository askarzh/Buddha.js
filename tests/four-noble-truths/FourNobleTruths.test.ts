import { describe, it, expect, beforeEach } from 'vitest';
import { FourNobleTruths } from '../../src/four-noble-truths/FourNobleTruths';
import { Dukkha } from '../../src/four-noble-truths/Dukkha';

describe('FourNobleTruths', () => {
  let truths: FourNobleTruths;

  beforeEach(() => {
    truths = new FourNobleTruths();
  });

  describe('Structure', () => {
    it('should have all four truths', () => {
      expect(truths.firstTruth).toBeInstanceOf(Dukkha);
      expect(truths.secondTruth).toBeDefined();
      expect(truths.thirdTruth).toBeDefined();
      expect(truths.fourthTruth).toBeDefined();
    });

    it('should provide convenient accessors', () => {
      expect(truths.dukkha).toBe(truths.firstTruth);
      expect(truths.samudaya).toBe(truths.secondTruth);
      expect(truths.nirodha).toBe(truths.thirdTruth);
      expect(truths.magga).toBe(truths.fourthTruth);
    });
  });

  describe('Tasks', () => {
    it('should provide the four tasks', () => {
      const tasks = truths.getTasks();
      expect(tasks.dukkha).toContain('understood');
      expect(tasks.samudaya).toContain('abandoned');
      expect(tasks.nirodha).toContain('realized');
      expect(tasks.magga).toContain('developed');
    });
  });

  describe('Diagnosis', () => {
    it('should diagnose a situation', () => {
      const diagnosis = truths.diagnose({
        suffering: ['dukkha-dukkha'],
        cravings: ['sensory']
      });

      expect(diagnosis.suffering).toBeDefined();
      expect(diagnosis.cause).toBeDefined();
      expect(diagnosis.cessationPossible).toBeDefined();
      expect(diagnosis.path).toBeDefined();
    });

    it('should identify suffering types', () => {
      const diagnosis = truths.diagnose({
        suffering: ['dukkha-dukkha', 'viparinama-dukkha'],
        cravings: ['sensory']
      });

      expect(diagnosis.suffering.obviousSuffering).toBe(true);
      expect(diagnosis.suffering.sufferingOfChange).toBe(true);
    });

    it('should identify craving types', () => {
      const diagnosis = truths.diagnose({
        suffering: ['dukkha-dukkha'],
        cravings: ['sensory', 'becoming']
      });

      expect(diagnosis.cause.cravingsPresent).toContain('sensory');
      expect(diagnosis.cause.cravingsPresent).toContain('becoming');
    });

    it('should always indicate cessation is possible', () => {
      const diagnosis = truths.diagnose({
        suffering: ['sankhara-dukkha'],
        cravings: ['sensory', 'becoming', 'non-becoming']
      });

      expect(diagnosis.cessationPossible.isPossible).toBe(true);
    });

    it('should provide path prescription', () => {
      const diagnosis = truths.diagnose({
        suffering: ['dukkha-dukkha'],
        cravings: ['sensory'],
        intensity: 8
      });

      expect(diagnosis.path.focusArea).toBeDefined();
      expect(diagnosis.path.practices).toBeInstanceOf(Array);
      expect(diagnosis.path.practices.length).toBeGreaterThan(0);
    });
  });

  describe('Summary', () => {
    it('should provide a summary', () => {
      const summary = truths.getSummary();
      expect(summary).toContain('DUKKHA');
      expect(summary).toContain('SAMUDAYA');
      expect(summary).toContain('NIRODHA');
      expect(summary).toContain('MAGGA');
    });
  });
});
