import { describe, it, expect } from 'vitest';
import { Nirodha } from '../../src/four-noble-truths/Nirodha';

describe('Nirodha', () => {
  it('is unconditioned: not impermanent, not unsatisfactory, still not-self', () => {
    const nirodha = new Nirodha();
    expect(nirodha.impermanence).toBe(false);
    expect(nirodha.unsatisfactoriness).toBe(false);
    expect(nirodha.notSelf).toBe(true);
    expect('arise' in nirodha).toBe(false);
  });

  it('reports zero progress for an empty analysis instead of near-liberation', () => {
    const nirodha = new Nirodha();
    const assessment = nirodha.isPossible({
      cravingsPresent: [], rootCauses: [], intensity: 0, primaryDriver: null,
    });
    expect(assessment.progressLevel).toBe(0);
  });
});
