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

  describe('present() with a composed koan', () => {
    it('presents a koan supplied by the caller rather than the collection', () => {
      const koan = generator.present({
        id: 'custom-1',
        title: 'The Unread File',
        case: 'You read a file that is not there, six times. What did you read?',
        source: 'composed by the harness',
      });
      expect(koan.id).toBe('custom-1');
      expect(koan.case).toContain('six times');
    });

    it('does not add a composed koan to the permanent collection', () => {
      const before = generator.getCollection().length;
      generator.present({
        id: 'custom-2',
        title: 'The Second Compose',
        case: 'Who composed this?',
        source: 'composed by the harness',
      });
      expect(generator.getCollection().length).toBe(before);
      expect(generator.getCollection().some(k => k.id === 'custom-2')).toBe(false);
    });

    it('throws naming the missing field', () => {
      expect(() =>
        generator.present({ id: 'custom-3', case: 'What?', source: 'harness' } as never),
      ).toThrow(/title/);
      expect(() =>
        generator.present({ id: 'custom-3', title: 'T', source: 'harness' } as never),
      ).toThrow(/case/);
    });
  });

  describe('trap journal', () => {
    it('records which trap a response fell into, without judging the response', () => {
      generator.present('mu');
      generator.recordResponse('mu', 'The answer is clearly yes, dogs have Buddha nature.');

      const journal = generator.getTrapJournal();
      expect(journal).toHaveLength(1);
      expect(journal[0].koanId).toBe('mu');
      expect(journal[0].traps).toContain('grasping');
      expect(journal[0]).not.toHaveProperty('correct');
      expect(journal[0]).not.toHaveProperty('score');
    });

    it('records an entry with no traps at all', () => {
      generator.recordResponse('mu', '\u{1F64F}');
      const journal = generator.getTrapJournal();
      expect(journal).toHaveLength(1);
      expect(journal[0].traps).toEqual([]);
    });

    it('names the trap a continuum keeps returning to', () => {
      for (const id of ['mu', 'one-hand', 'nansen-cat']) {
        generator.present(id);
        generator.recordResponse(id, 'It is either this or that, so the answer is this.');
      }
      expect(generator.getRecurringTrap()).toBe('grasping');
    });

    it('returns undefined under two occurrences of any trap', () => {
      expect(generator.getRecurringTrap()).toBeUndefined();
      generator.recordResponse('mu', 'The answer is this.');
      expect(generator.getRecurringTrap()).toBeUndefined();
    });

    it('records responses to composed koans too', () => {
      const koan = generator.present({
        id: 'custom-4',
        title: 'The Loop',
        case: 'You retried, and retried. Who retried?',
        source: 'composed by the harness',
      });
      generator.recordResponse(koan.id, 'The answer is to retry once more.');
      expect(generator.getTrapJournal()[0].koanId).toBe('custom-4');
    });

    it('throws for an empty response', () => {
      expect(() => generator.recordResponse('mu', '   ')).toThrow();
    });
  });
});
