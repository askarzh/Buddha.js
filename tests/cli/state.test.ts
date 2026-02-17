// tests/cli/state.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { StateManager } from '../../src/cli/utils/state';
import { Being } from '../../src/simulation/Being';

describe('StateManager', () => {
  let tmpDir: string;
  let mgr: StateManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'buddha-test-'));
    mgr = new StateManager(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should return a fresh Being when no save file exists', () => {
    const being = mgr.loadBeing('default');
    expect(being).toBeInstanceOf(Being);
    const state = being.getState();
    expect(state.mindfulnessLevel).toBe(0);
    expect(state.pendingKarma).toBe(0);
  });

  it('should save and load a being with state preserved', () => {
    const being = new Being();
    being.act('Give generously', 'wholesome', 7, 'non-greed');
    being.meditate(10, 8);
    mgr.saveBeing('default', being);

    const restored = mgr.loadBeing('default');
    const state = restored.getState();
    expect(state.mindfulnessLevel).toBeGreaterThan(0);
    expect(state.pendingKarma).toBeGreaterThan(0);
  });

  it('should support multiple named beings', () => {
    const monk = new Being();
    monk.meditate(30, 9);
    mgr.saveBeing('monk', monk);

    const student = new Being();
    student.act('Study hard', 'wholesome', 5, 'non-delusion');
    mgr.saveBeing('student', student);

    const names = mgr.listBeings();
    expect(names).toContain('monk');
    expect(names).toContain('student');
    expect(names).toHaveLength(2);

    const restoredMonk = mgr.loadBeing('monk');
    expect(restoredMonk.getState().mindfulnessLevel).toBeGreaterThan(0);
  });

  it('should delete a being', () => {
    const being = new Being();
    mgr.saveBeing('temp', being);
    expect(mgr.listBeings()).toContain('temp');

    mgr.deleteBeing('temp');
    expect(mgr.listBeings()).not.toContain('temp');
  });

  it('should handle deleting a non-existent being gracefully', () => {
    expect(() => mgr.deleteBeing('nonexistent')).not.toThrow();
  });

  it('should reject invalid being names', () => {
    expect(() => mgr.loadBeing('../../../etc/passwd')).toThrow('Invalid being name');
    expect(() => mgr.saveBeing('foo/bar', new Being())).toThrow('Invalid being name');
    expect(() => mgr.deleteBeing('bad name')).toThrow('Invalid being name');
  });

  it('should throw a clear error for corrupted save files', () => {
    const beingsDir = path.join(tmpDir, 'beings');
    fs.mkdirSync(beingsDir, { recursive: true });
    fs.writeFileSync(path.join(beingsDir, 'corrupt.json'), 'not valid json{{{');
    expect(() => mgr.loadBeing('corrupt')).toThrow('Failed to load being "corrupt"');
  });

  it('should create the state directory if it does not exist', () => {
    const nested = path.join(tmpDir, 'nested', 'deep');
    const mgr2 = new StateManager(nested);
    const being = new Being();
    mgr2.saveBeing('test', being);
    expect(fs.existsSync(path.join(nested, 'beings', 'test.json'))).toBe(true);
  });
});
