import { describe, it, expect } from 'vitest';
import { Citta } from '../../src/mind/Citta';

describe('Citta vīthi pins', () => {
  it('runs a 17-moment sense-door process', () => {
    const citta = new Citta();
    const result = citta.processSenseObject(
      { type: 'sense-object', content: 'a red flower', senseBase: 'eye' },
      'cakkhu-dvāra'
    );
    expect(result.moments).toHaveLength(17);
    expect(result.moments[0].stage).toBe('bhavaṅga');
    expect(citta.isInBhavanga()).toBe(true); // returns to rest
  });

  it('runs a 13-moment mind-door process', () => {
    const citta = new Citta();
    const result = citta.processMentalObject({ type: 'mental-object', content: 'a memory' });
    expect(result.moments).toHaveLength(13);
  });

  it('rejects mind-door objects on the sense-door path', () => {
    const citta = new Citta();
    expect(() =>
      citta.processSenseObject({ type: 'mental-object', content: 'x' }, 'mano-dvāra')
    ).toThrow();
  });

  it('assigns javana potencies 1,2,2,2,2,2,1', () => {
    const citta = new Citta();
    const result = citta.processMentalObject({ type: 'mental-object', content: 'intent' });
    const javanas = result.moments.filter(m => m.stage === 'javana');
    expect(javanas).toHaveLength(7);
    expect(javanas.map(j => j.karmicPotency)).toEqual([1, 2, 2, 2, 2, 2, 1]);
  });

  it('treats alias keys as the same cetasika object', () => {
    const citta = new Citta();
    citta.activateCetasika('greed', 8);
    const map = citta.getCetasikas();
    expect(map.get('greed')).toBe(map.get('lobha')); // same reference
  });

  it('mindfulness forces kusala javana quality even with greed active', () => {
    const citta = new Citta();
    citta.activateCetasika('greed', 8);
    citta.activateCetasika('mindfulness', 8);
    const result = citta.processMentalObject({ type: 'mental-object', content: 'craving observed' });
    expect(result.quality).toBe('kusala');
  });

  it('greed without mindfulness yields akusala', () => {
    const citta = new Citta();
    citta.activateCetasika('greed', 8);
    const result = citta.processMentalObject({ type: 'mental-object', content: 'craving' });
    expect(result.quality).toBe('akusala');
  });

  it('does not list an active cetasika twice under alias and canonical keys', () => {
    const citta = new Citta();
    citta.activateCetasika('greed', 8);
    const result = citta.processMentalObject({ type: 'mental-object', content: 'craving' });
    const javana = result.moments.find(m => m.stage === 'javana')!;
    const matches = javana.cetasikas.filter(name => name === 'greed' || name === 'lobha');
    expect(matches).toHaveLength(1);
  });

  it('marks unwholesome karma as strong when a root cetasika is active at high intensity', () => {
    const citta = new Citta();
    citta.activateCetasika('greed', 8);
    const result = citta.processMentalObject({ type: 'mental-object', content: 'strong craving' });
    expect(result.karmicImpact).toBe('strong');
  });

  it('marks unwholesome karma as weak when the root cetasika intensity is below the threshold', () => {
    const citta = new Citta();
    citta.activateCetasika('greed', 5);
    const result = citta.processMentalObject({ type: 'mental-object', content: 'mild craving' });
    expect(result.karmicImpact).toBe('weak');
  });
});
