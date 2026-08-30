import { describe, it, expect } from 'vitest';
import { Being } from '../../src/simulation/Being';

describe('Being.cognize()', () => {
  it('cognize returns the moment stream and plants three seeds', () => {
    const being = new Being();
    const result = being.cognize('a beautiful sunset', 'eye');
    expect(result.moments).toHaveLength(17);
    expect(result.seedsPlanted).toHaveLength(3);
    expect(result.seedsPlanted.map(s => s.timing).sort())
      .toEqual(['distant-future', 'immediate', 'next-life']);
  });

  it('meditation changes javana quality (Mind→Citta sync)', () => {
    const being = new Being();
    being.mind.activateFactor('greed', 8);
    expect(being.cognize('shiny object').quality).toBe('akusala');
    being.meditate(60, 8); // raises mindfulness in Mind
    expect(being.cognize('shiny object').quality).toBe('kusala');
  });

  it('mental cognition uses the 13-moment process', () => {
    const being = new Being();
    expect(being.cognize('a plan for tomorrow').moments).toHaveLength(13);
  });
});
