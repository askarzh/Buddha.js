import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { StateManager } from '../../src/cli/utils/state';
import {
  runKarma,
  runStatus,
  runMeditate,
  runKoan,
  runSit,
  runBeings,
  runBeingsDelete,
  runReset,
  isKarmaError,
  KarmaResult,
} from '../../src/cli/utils/runner';

/** Narrow away the error branch so a test can read the result. */
function karmaOf(result: ReturnType<typeof runKarma>): KarmaResult {
  if (isKarmaError(result)) {
    throw new Error(`expected a karma result, got an error: ${result.error}`);
  }
  return result;
}

describe('CLI command bodies', () => {
  let dir: string;
  let sm: StateManager;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'buddha-cli-'));
    sm = new StateManager(dir);
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  describe('karma', () => {
    it('plants a seed with the quality its root implies', () => {
      const result = karmaOf(runKarma(sm, 'tester', {
        description: 'helped a stranger',
        intensity: '6',
        root: 'non-greed',
      }));
      expect(result.result.karmicSeeds.length).toBeGreaterThan(0);
      expect(result.result.karmicSeeds[0].quality).toBe('wholesome');
    });

    it('derives an unwholesome quality from an unwholesome root', () => {
      const result = karmaOf(runKarma(sm, 'tester', {
        description: 'snapped at a colleague',
        intensity: '6',
        root: 'aversion',
      }));
      expect(result.result.karmicSeeds[0].quality).toBe('unwholesome');
    });

    it('persists the seed so a later call sees it', () => {
      runKarma(sm, 'tester', { description: 'a deed', intensity: '5', root: 'greed' });
      const second = karmaOf(runKarma(sm, 'tester', {}));
      expect(second.result.totalActions).toBeGreaterThan(0);
      expect(second.result.karmicSeeds.some(s => s.description.includes('a deed'))).toBe(true);
    });

    it('rejects a --quality that contradicts the root', () => {
      const result = runKarma(sm, 'tester', {
        description: 'gave freely',
        intensity: '5',
        root: 'non-greed',
        quality: 'unwholesome',
      });
      expect(isKarmaError(result)).toBe(true);
    });

    it('plants nothing when the action fields are incomplete', () => {
      const result = karmaOf(runKarma(sm, 'tester', { description: 'partial' }));
      expect(result.result.totalActions).toBe(0);
    });
  });

  describe('status', () => {
    it('reports the being it was asked about', () => {
      const result = runStatus(sm, 'tester');
      expect(result.command).toBe('status');
      expect(result.being).toBe('tester');
      expect(typeof result.result.mindfulnessLevel).toBe('number');
      expect(result.result.mindState).toHaveProperty('isCalm');
    });

    it('sees the karma another command planted', () => {
      runKarma(sm, 'tester', { description: 'a deed', intensity: '5', root: 'greed' });
      expect(runStatus(sm, 'tester').result.pendingKarma).toBeGreaterThan(0);
    });

    it('never writes to disk', () => {
      runKarma(sm, 'tester', { description: 'a deed', intensity: '5', root: 'greed' });
      const file = path.join(dir, 'beings', 'tester.json');
      const before = fs.readFileSync(file);
      runStatus(sm, 'tester');
      expect(fs.readFileSync(file)).toEqual(before);
    });

    it('creates no file for a being that does not exist', () => {
      runStatus(sm, 'nobody');
      expect(fs.existsSync(path.join(dir, 'beings', 'nobody.json'))).toBe(false);
    });
  });

  describe('meditate', () => {
    // The regression that motivated this task: --duration reached the JSON
    // path only, and nothing asserted it was read at all.
    it('honours --duration', () => {
      expect(runMeditate(sm, 'tester', { duration: '15' }).result.durationMinutes).toBe(15);
    });

    it('defaults to five minutes when no duration is given', () => {
      expect(runMeditate(sm, 'tester', {}).result.durationMinutes).toBe(5);
    });

    it('names the duration in its message', () => {
      expect(runMeditate(sm, 'tester', { duration: '20' }).result.message).toContain('20 minutes');
    });

    // Current behaviour, deliberately pinned: meditate persists nothing, so a
    // session leaves no trace on the named being. Task 9 changes this.
    it('persists nothing today', () => {
      runMeditate(sm, 'tester', { duration: '15' });
      expect(fs.existsSync(path.join(dir, 'beings', 'tester.json'))).toBe(false);
    });
  });

  describe('koan', () => {
    it('returns a koan with an id and a source', () => {
      const { result } = runKoan(sm, 'tester', {});
      expect(result.id).toBeTruthy();
      expect(result.source).toBeTruthy();
      expect(result.case).toBeTruthy();
      expect(result.title).toBeTruthy();
    });

    it('presents the koan named by --id', () => {
      const anyKoan = runKoan(sm, 'tester', {}).result;
      expect(runKoan(sm, 'tester', { id: anyKoan.id }).result.id).toBe(anyKoan.id);
    });

    it('reports a missing hint as null rather than undefined', () => {
      const { result } = runKoan(sm, 'tester', {});
      expect(result.hint === null || typeof result.hint === 'string').toBe(true);
    });
  });

  describe('sit', () => {
    it('walks the four stages of cessation', () => {
      const { result } = runSit(sm, 'tester', { situation: 'a missed deadline' });
      expect(result.steps).toHaveLength(4);
      expect(result.steps.every(s => s.stage && s.truth && s.insight && s.guidance)).toBe(true);
    });

    it('echoes the situation it was given', () => {
      expect(runSit(sm, 'tester', { situation: 'a missed deadline' }).result.suffering)
        .toBe('a missed deadline');
    });

    it('falls back to unspecified suffering', () => {
      expect(runSit(sm, 'tester', {}).result.suffering).toBe('unspecified suffering');
    });

    it('summarises the completed walk', () => {
      expect(runSit(sm, 'tester', {}).result.summary).toBeTruthy();
    });
  });

  describe('beings', () => {
    it('lists nothing before anything is saved', () => {
      const { result } = runBeings(sm);
      expect(result.beings).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('lists what other commands created', () => {
      runKarma(sm, 'alice', { description: 'a deed', intensity: '5', root: 'greed' });
      runKarma(sm, 'bob', { description: 'a deed', intensity: '5', root: 'greed' });
      const { result } = runBeings(sm);
      expect(result.beings.sort()).toEqual(['alice', 'bob']);
      expect(result.count).toBe(2);
    });

    it('delete removes the named being and leaves the others', () => {
      runKarma(sm, 'alice', { description: 'a deed', intensity: '5', root: 'greed' });
      runKarma(sm, 'bob', { description: 'a deed', intensity: '5', root: 'greed' });
      expect(runBeingsDelete(sm, 'alice').result.deleted).toBe('alice');
      expect(runBeings(sm).result.beings).toEqual(['bob']);
    });

    it('delete of an unknown being is not an error', () => {
      expect(() => runBeingsDelete(sm, 'nobody')).not.toThrow();
    });
  });

  describe('reset', () => {
    it('clears the karma that had been planted', () => {
      runKarma(sm, 'tester', { description: 'a deed', intensity: '5', root: 'greed' });
      expect(runStatus(sm, 'tester').result.pendingKarma).toBeGreaterThan(0);

      const payload = runReset(sm, 'tester');
      expect(payload.result.reset).toBe(true);
      expect(payload.being).toBe('tester');
      expect(runStatus(sm, 'tester').result.pendingKarma).toBe(0);
    });

    // It overwrites rather than unlinks, so the being stays listed.
    it('writes a fresh being rather than removing the file', () => {
      runReset(sm, 'tester');
      expect(fs.existsSync(path.join(dir, 'beings', 'tester.json'))).toBe(true);
      expect(runBeings(sm).result.beings).toContain('tester');
    });

    it('leaves other beings alone', () => {
      runKarma(sm, 'other', { description: 'a deed', intensity: '5', root: 'greed' });
      runReset(sm, 'tester');
      expect(runStatus(sm, 'other').result.pendingKarma).toBeGreaterThan(0);
    });
  });
});
