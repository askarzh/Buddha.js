import { describe, it, expect } from 'vitest';
import { Being } from '../../src/simulation/Being';
import {
  HumanBeing,
  DevaBeing,
  AsuraBeing,
  AnimalBeing,
  PretaBeing,
  NarakaBeing,
  REALM_CLASSES,
} from '../../src/simulation/realms';

describe('Realm classes', () => {
  it('REALM_CLASSES maps every realm to its class', () => {
    expect(new REALM_CLASSES.human().realm).toBe('human');
    expect(new REALM_CLASSES.deva().realm).toBe('deva');
    expect(new REALM_CLASSES.asura().realm).toBe('asura');
    expect(new REALM_CLASSES.animal().realm).toBe('animal');
    expect(new REALM_CLASSES.preta().realm).toBe('preta');
    expect(new REALM_CLASSES.naraka().realm).toBe('naraka');
  });

  it('deva meditation gains are halved vs human', () => {
    const human = new HumanBeing();
    const deva = new DevaBeing();
    human.meditate(600, 8);
    deva.meditate(600, 8);
    expect(deva.getState().pathProgress).toBeLessThan(human.getState().pathProgress);
  });

  it('deva starts with full vitality (10)', () => {
    const deva = new DevaBeing();
    expect(deva.getState().aggregatesSnapshot.form.vitality).toBe(10);
  });

  it('asura reactions run hotter and meditation gains are reduced', () => {
    const human = new HumanBeing();
    const asura = new AsuraBeing();
    human.meditate(600, 8);
    asura.meditate(600, 8);
    expect(asura.getState().pathProgress).toBeLessThan(human.getState().pathProgress);

    human.experience({ senseBase: 'eye', object: 'rival', intensity: 5, valence: 'unpleasant' });
    asura.experience({ senseBase: 'eye', object: 'rival', intensity: 5, valence: 'unpleasant' });
    const humanAversion = human.mind.getFactor('aversion');
    const asuraAversion = asura.mind.getFactor('aversion');
    expect(asuraAversion?.intensity ?? 0).toBeGreaterThan(humanAversion?.intensity ?? 0);
  });

  it('animal wisdom is capped at 4', () => {
    const animal = new AnimalBeing();
    for (let i = 0; i < 30; i++) animal.meditate(600, 10);
    expect(animal.path.rightView.developmentLevel).toBeLessThanOrEqual(4);
  });

  it('a single low-effort meditate() moves rightView by a step, not straight to the wisdom cap (regression pin)', () => {
    // Round 1 of task 7 replaced the effort-scaled growth with
    // rightView.practiceTo(cap), which jumped rightView to its cap on the
    // very first meditate() call regardless of effort. This pins the fix:
    // one low-effort call must produce gradual movement, well short of cap.
    const animal = new AnimalBeing();
    animal.meditate(30, 1);
    const level = animal.path.rightView.developmentLevel;
    expect(level).toBeGreaterThan(0);
    expect(level).toBeLessThan(4);
  });

  it('repeated meditation converges rightView to the wisdom cap and stops there', () => {
    const animal = new AnimalBeing();
    for (let i = 0; i < 30; i++) animal.meditate(600, 10);
    expect(animal.path.rightView.developmentLevel).toBe(4);
  });

  it('human wisdom is not capped at 4 under the same practice', () => {
    const human = new HumanBeing();
    for (let i = 0; i < 30; i++) human.meditate(600, 10);
    expect(human.path.rightView.developmentLevel).toBeGreaterThan(4);
  });

  it('preta reactions run hotter on unpleasant experience', () => {
    const human = new HumanBeing();
    const preta = new PretaBeing();
    const input = { senseBase: 'eye' as const, object: 'lack', intensity: 5, valence: 'unpleasant' as const };
    human.experience(input);
    preta.experience(input);
    const humanAversion = human.mind.getFactor('aversion');
    const pretaAversion = preta.mind.getFactor('aversion');
    expect(pretaAversion?.intensity ?? 0).toBeGreaterThan(humanAversion?.intensity ?? 0);
  });

  it('naraka intensifies unpleasant experiences', () => {
    const human = new HumanBeing();
    const naraka = new NarakaBeing();
    const input = { senseBase: 'body' as const, object: 'pain', intensity: 5, valence: 'unpleasant' as const };
    human.experience(input);
    naraka.experience(input);
    const humanIntensity = human.aggregates.feeling.getState().intensity;
    const narakaIntensity = naraka.aggregates.feeling.getState().intensity;
    expect(narakaIntensity).toBe(Math.min(10, humanIntensity + 2));
  });

  it('naraka clamps an already-maximal unpleasant experience to intensity 10 instead of overflowing to 12', () => {
    const naraka = new NarakaBeing();
    const input = { senseBase: 'body' as const, object: 'agony', intensity: 10, valence: 'unpleasant' as const };
    naraka.experience(input);
    const narakaIntensity = naraka.aggregates.feeling.getState().intensity;
    expect(narakaIntensity).toBeLessThanOrEqual(10);
  });

  it('naraka meditation gains are reduced like asura', () => {
    const human = new HumanBeing();
    const naraka = new NarakaBeing();
    human.meditate(600, 8);
    naraka.meditate(600, 8);
    expect(naraka.getState().pathProgress).toBeLessThan(human.getState().pathProgress);
  });

  it('base Being and HumanBeing behave identically', () => {
    const base = new Being();
    const human = new HumanBeing();

    expect(human.realm).toBe('human');

    base.meditate(30, 7);
    human.meditate(30, 7);
    expect(human.getState().pathProgress).toBe(base.getState().pathProgress);
    expect(human.getState().mindfulnessLevel).toBe(base.getState().mindfulnessLevel);
    expect(human.path.rightView.developmentLevel).toBe(base.path.rightView.developmentLevel);

    const input = { senseBase: 'eye' as const, object: 'thing', intensity: 5, valence: 'unpleasant' as const };
    const baseResult = base.experience(input);
    const humanResult = human.experience(input);
    expect(humanResult.feelingTone).toBe(baseResult.feelingTone);
    expect(humanResult.reactions).toEqual(baseResult.reactions);
    expect(human.aggregates.feeling.getState().intensity).toBe(base.aggregates.feeling.getState().intensity);
  });
});
