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
