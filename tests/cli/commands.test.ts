import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { StateManager } from '../../src/cli/utils/state';
import {
  runKarma,
  runStatus,
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
});
