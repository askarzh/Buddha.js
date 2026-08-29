import { describe, it, expect, beforeEach } from 'vitest';
import { DependentOrigination } from '../../src/dependent-origination/DependentOrigination';

describe('DependentOrigination', () => {
  let chain: DependentOrigination;

  beforeEach(() => {
    chain = new DependentOrigination();
  });

  describe('Structure', () => {
    it('should have 12 links', () => {
      expect(chain.links).toHaveLength(12);
    });

    it('should start with ignorance', () => {
      expect(chain.links[0].name).toBe('Avidya');
    });

    it('should end with aging and death', () => {
      expect(chain.links[11].name).toBe('Jaramarana');
    });

    it('should have all links accessible', () => {
      expect(chain.ignorance).toBeDefined();
      expect(chain.formations).toBeDefined();
      expect(chain.consciousness).toBeDefined();
      expect(chain.mindBody).toBeDefined();
      expect(chain.sixSenses).toBeDefined();
      expect(chain.contact).toBeDefined();
      expect(chain.feeling).toBeDefined();
      expect(chain.craving).toBeDefined();
      expect(chain.clinging).toBeDefined();
      expect(chain.becoming).toBeDefined();
      expect(chain.birth).toBeDefined();
      expect(chain.agingDeath).toBeDefined();
    });
  });

  describe('Arising Sequence', () => {
    it('should simulate arising sequence', () => {
      const events = [...chain.simulateArisingSequence()];
      expect(events.length).toBeGreaterThan(0);
    });

    it('should arise starting from formations (ignorance already arisen)', () => {
      const events = chain.runFullSequence();
      // Avidya (ignorance) is already arisen by default as the root cause
      // So the sequence starts from Samskara (formations)
      expect(events.length).toBeGreaterThan(0);
      // First event should be Samskara
      expect(events[0].link.name).toBe('Samskara');
    });

    it('each link should have explanation', () => {
      const events = chain.runFullSequence();
      events.forEach(event => {
        expect(event.explanation).toBeDefined();
        expect(event.explanation.meaning).toBeDefined();
      });
    });
  });

  describe('Breaking the Chain', () => {
    it('should break at valid position', () => {
      const result = chain.breakChainAt(8); // At craving
      expect(result.success).toBe(true);
      expect(result.brokenAt).toBe('Tanha');
    });

    it('should fail at invalid position', () => {
      const result = chain.breakChainAt(15);
      expect(result.success).toBe(false);
    });
  });

  describe('Liberation Point', () => {
    it('should identify liberation point status', () => {
      chain.runFullSequence();
      const status = chain.practiceAtLiberationPoint();
      expect(status).toBeDefined();
    });
  });

  describe('Formulas', () => {
    it('should provide arising formula', () => {
      const formula = chain.getArisingFormula();
      expect(formula).toContain('Avidyā');
      expect(formula).toContain('→');
    });

    it('should provide cessation formula', () => {
      const formula = chain.getCessationFormula();
      expect(formula).toContain('cessation');
    });
  });

  describe('Reset', () => {
    it('should reset the chain', () => {
      chain.runFullSequence();
      chain.reset();
      // After reset, only ignorance should be arisen
      expect(chain.ignorance.hasArisen).toBe(true);
    });
  });

  describe('cessation (patiloma)', () => {
    it('a pre-broken link stops the arising sequence at that point', () => {
      chain.reset();
      chain.breakChainAt(8); // Tanha (craving)
      chain.runFullSequence();
      expect(chain.craving.hasArisen).toBe(false);
      expect(chain.clinging.hasArisen).toBe(false);
      expect(chain.agingDeath.hasArisen).toBe(false);
      expect(chain.feeling.hasArisen).toBe(true); // links before the break still arise
    });

    it('breaking an arisen link cascades cessation through all subsequent links', () => {
      chain.reset();
      chain.runFullSequence();
      expect(chain.agingDeath.hasArisen).toBe(true);
      chain.breakChainAt(8);
      expect(chain.craving.hasCeased).toBe(true);
      expect(chain.clinging.hasCeased).toBe(true);
      expect(chain.agingDeath.hasCeased).toBe(true);
      expect(chain.contact.hasCeased).toBe(false); // upstream links unaffected
    });
  });

  describe('Summary', () => {
    it('should provide summary', () => {
      const summary = chain.getSummary();
      expect(summary).toContain('DEPENDENT ORIGINATION');
      expect(summary).toContain('TWELVE LINKS');
    });
  });
});
