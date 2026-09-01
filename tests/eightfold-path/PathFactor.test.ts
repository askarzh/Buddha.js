import { describe, it, expect } from 'vitest';
import { PathFactor } from '../../src/eightfold-path/PathFactor';
import { RightView } from '../../src/eightfold-path/wisdom/RightView';
import { Intensity, PathCategory } from '../../src/utils/types';

/** A factor whose practice() never moves the needle — pins practiceTo()'s termination guard. */
class StuckFactor extends PathFactor {
  readonly name = 'Stuck Factor';
  readonly sanskritName = 'sthira';
  readonly category: PathCategory = 'wisdom';
  readonly position = 1;

  practice(_effort: Intensity): Intensity {
    // Deliberately a no-op: development level never advances.
    return this._developmentLevel;
  }

  getPractices(): string[] {
    return [];
  }

  getDescription(): string {
    return 'A factor that never develops, for testing practiceTo() termination.';
  }

  getIndicators(): string[] {
    return [];
  }
}

describe('PathFactor.practiceTo', () => {
  it('practises up to the target and stops there', () => {
    const factor = new RightView();
    expect(factor.practiceTo(3)).toBe(3);
    expect(factor.developmentLevel).toBe(3);
  });

  it('does nothing when already at or above the target', () => {
    const factor = new RightView();
    factor.practiceTo(5);
    expect(factor.practiceTo(2)).toBe(5);
  });

  it('never exceeds the target, whatever the internal step size is', () => {
    const factor = new RightView();
    for (let target = 1; target <= 10; target++) {
      const reached = factor.practiceTo(target as Intensity);
      expect(reached).toBeLessThanOrEqual(target);
    }
  });

  it('terminates instead of looping forever when practice() is a no-op below the target', () => {
    const factor = new StuckFactor();
    // practice() never advances this factor's level, so practiceTo() must
    // detect the stall and break out rather than spinning forever.
    expect(factor.practiceTo(7)).toBe(0);
    expect(factor.developmentLevel).toBe(0);
  });

  it('a plain factor reaching its hard ceiling (10) also terminates cleanly', () => {
    const factor = new RightView();
    factor.practiceTo(10);
    expect(factor.developmentLevel).toBe(10);
    // Calling again with a target the factor cannot exceed must return immediately,
    // not spin — practice() at level 10 is a no-op (roomToGrow === 0).
    expect(factor.practiceTo(10)).toBe(10);
  });
});

describe('PathFactor.practice with a max ceiling', () => {
  it('a single low-effort call moves the level by a step, not straight to the ceiling', () => {
    const factor = new RightView();
    const level = factor.practice(1, 5);
    expect(level).toBeGreaterThan(0);
    expect(level).toBeLessThan(5);
  });

  it('growth stays gradual and effort-scaled right up to the ceiling, then stops', () => {
    const factor = new RightView();
    let level: Intensity = 0;
    for (let i = 0; i < 50; i++) {
      level = factor.practice(10, 4);
    }
    expect(level).toBe(4);
    expect(factor.developmentLevel).toBe(4);
    // One more call at the ceiling must not push past it.
    expect(factor.practice(10, 4)).toBe(4);
  });

  it('omitting max behaves exactly like unbounded practice() (default ceiling is 10)', () => {
    const withDefault = new RightView();
    const withExplicitTen = new RightView();
    for (let i = 0; i < 10; i++) {
      withDefault.practice(7);
      withExplicitTen.practice(7, 10);
    }
    expect(withDefault.developmentLevel).toBe(withExplicitTen.developmentLevel);
  });
});
