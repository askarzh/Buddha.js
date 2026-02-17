import { describe, it, expect, beforeEach } from 'vitest';
import { KoanGenerator } from '../../src/koan/KoanGenerator';

describe('KoanGenerator', () => {
  let generator: KoanGenerator;

  beforeEach(() => {
    generator = new KoanGenerator();
  });

  describe('getCollection()', () => {
    it('should return the built-in koan collection', () => {
      const koans = generator.getCollection();
      expect(koans.length).toBeGreaterThanOrEqual(8);
    });

    it('should return readonly array', () => {
      const koans = generator.getCollection();
      expect(Array.isArray(koans)).toBe(true);
    });

    it('should have required fields on each koan', () => {
      for (const koan of generator.getCollection()) {
        expect(koan.id).toBeTruthy();
        expect(koan.title).toBeTruthy();
        expect(koan.case).toBeTruthy();
        expect(koan.source).toBeTruthy();
      }
    });
  });

  describe('present()', () => {
    it('should return a koan from the collection', () => {
      const koan = generator.present();
      const ids = generator.getCollection().map(k => k.id);
      expect(ids).toContain(koan.id);
    });

    it('should return a specific koan by id', () => {
      const all = generator.getCollection();
      const target = all[0];
      const koan = generator.present(target.id);
      expect(koan.id).toBe(target.id);
      expect(koan.title).toBe(target.title);
    });

    it('should throw for unknown koan id', () => {
      expect(() => generator.present('nonexistent')).toThrow();
    });
  });

  describe('contemplate() — trap detection', () => {
    const koanId = () => generator.getCollection()[0].id;

    it('should detect binary trap for yes/no answers', () => {
      const result = generator.contemplate(koanId(), 'Yes');
      expect(result.trapsDetected).toContain('binary');
      expect(result.isNonDual).toBe(false);
    });

    it('should detect binary trap for both/neither answers', () => {
      const result = generator.contemplate(koanId(), 'Both and neither');
      expect(result.trapsDetected).toContain('binary');
    });

    it('should detect intellectual trap for analytical responses', () => {
      const result = generator.contemplate(
        koanId(),
        'This means that the Buddha was trying to express the idea that all sentient beings possess inherent awareness because of the universal nature of consciousness'
      );
      expect(result.trapsDetected).toContain('intellectual');
    });

    it('should detect seeking trap for hedging responses', () => {
      const result = generator.contemplate(koanId(), 'Is this the right answer?');
      expect(result.trapsDetected).toContain('seeking');
    });

    it('should detect nihilistic trap', () => {
      const result = generator.contemplate(koanId(), 'Nothing matters, it is all meaningless');
      expect(result.trapsDetected).toContain('nihilistic');
    });

    it('should detect grasping trap for definitive claims', () => {
      const result = generator.contemplate(koanId(), 'The answer is that Buddha-nature is universal');
      expect(result.trapsDetected).toContain('grasping');
    });

    it('should detect multiple traps in one response', () => {
      const result = generator.contemplate(
        koanId(),
        'The answer is yes because it means that everything is nothing'
      );
      expect(result.trapsDetected.length).toBeGreaterThan(1);
    });

    it('should return isNonDual true when no traps detected', () => {
      const result = generator.contemplate(koanId(), '\u{1F64F}');
      expect(result.trapsDetected).toEqual([]);
      expect(result.isNonDual).toBe(true);
    });

    it('should include the koan and response in the result', () => {
      const id = koanId();
      const result = generator.contemplate(id, 'Mu');
      expect(result.koan.id).toBe(id);
      expect(result.response).toBe('Mu');
    });

    it('should include a reflection string', () => {
      const result = generator.contemplate(koanId(), 'Yes');
      expect(result.reflection).toBeTruthy();
      expect(typeof result.reflection).toBe('string');
    });

    it('should throw for unknown koan id', () => {
      expect(() => generator.contemplate('nonexistent', 'answer')).toThrow();
    });

    it('should throw for empty response', () => {
      expect(() => generator.contemplate(koanId(), '')).toThrow();
      expect(() => generator.contemplate(koanId(), '   ')).toThrow();
    });
  });
});
