import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StateManager } from '../../src/cli/utils/state';
import { createBeing, listBeings, deleteBeing, getStatus, experienceSensory, act, ripenKarma, meditate, diagnose, inquiry, chain, presentKoan, contemplateKoan, sitWithSuffering, cognizeObject, rebirthBeing } from '../../src/mcp/handlers';

describe('MCP handlers — being management', () => {
  let sm: StateManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'buddha-mcp-'));
    sm = new StateManager(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test('createBeing creates and persists a new being', () => {
    const result = createBeing(sm, 'tester');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(sm.listBeings()).toContain('tester');
  });

  test('listBeings returns empty array initially', () => {
    expect(listBeings(sm)).toEqual([]);
  });

  test('listBeings returns created beings', () => {
    createBeing(sm, 'one');
    createBeing(sm, 'two');
    expect(listBeings(sm).sort()).toEqual(['one', 'two']);
  });

  test('deleteBeing removes a being', () => {
    createBeing(sm, 'temp');
    deleteBeing(sm, 'temp');
    expect(listBeings(sm)).toEqual([]);
  });

  test('getStatus returns summary and state', () => {
    createBeing(sm, 'monk');
    const result = getStatus(sm, 'monk');
    expect(typeof result.summary).toBe('string');
    expect(result.state).toBeDefined();
  });

  test('getStatus throws for a nonexistent being instead of creating one', () => {
    expect(() => getStatus(sm, 'no-such-being')).toThrow(/Being not found/);
    expect(sm.listBeings()).not.toContain('no-such-being');
  });

  test('act throws for a nonexistent being', () => {
    expect(() => act(sm, 'no-such-being', 'walk', 3)).toThrow(/Being not found/);
  });
});

describe('MCP handlers — stateful actions', () => {
  let sm: StateManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'buddha-mcp-'));
    sm = new StateManager(tempDir);
    createBeing(sm, 'actor');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test('experienceSensory processes input and saves state', () => {
    const result = experienceSensory(sm, 'actor', {
      senseBase: 'mind',
      object: 'thought of kindness',
      intensity: 5,
    });
    expect(result).toHaveProperty('feelingTone');
    expect(result).toHaveProperty('label');
  });

  test('act creates karma and saves state', () => {
    const result = act(sm, 'actor', 'gave food to a hungry person', 7, 'non-greed');
    expect(result).toHaveProperty('quality', 'wholesome');
    expect(result).toHaveProperty('intention.description');
  });

  test('act derives quality from root, ignoring any independently-assigned quality', () => {
    const result = act(sm, 'actor', 'stole food', 7, 'greed');
    expect(result).toHaveProperty('quality', 'unwholesome');
  });

  test('ripenKarma returns a karmic results report', () => {
    act(sm, 'actor', 'small kind act', 3);
    const report = ripenKarma(sm, 'actor');
    expect(Array.isArray(report.results)).toBe(true);
    expect(Array.isArray(report.seedVipakas)).toBe(true);
    expect(Array.isArray(report.whyNot)).toBe(true);
  });

  test('ripenKarma without force returns whyNot explanations', () => {
    act(sm, 'actor', 'planted rice', 5, 'non-greed');
    const report = ripenKarma(sm, 'actor');
    expect(report.whyNot.length).toBeGreaterThan(0);
  });

  test('ripenKarma with force ripens everything eligible deterministically', () => {
    act(sm, 'actor', 'gave alms', 5, 'non-greed');
    const report = ripenKarma(sm, 'actor', true);
    expect(Array.isArray(report.seedVipakas)).toBe(true);
  });
});

describe('MCP handlers — depth features', () => {
  let sm: StateManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'buddha-mcp-'));
    sm = new StateManager(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test('cognizeObject runs a vithi and persists planted seeds', () => {
    createBeing(sm, 'seer');
    const result = cognizeObject(sm, 'seer', 'a red flower', 'eye');
    expect(result.seedsPlanted).toHaveLength(3);
    const reloaded = sm.loadExistingBeing('seer');
    expect(reloaded.karmicStore.getSeeds().length).toBeGreaterThanOrEqual(3);
  });

  test('rebirthBeing advances the incarnation', () => {
    createBeing(sm, 'phoenix');
    expect(rebirthBeing(sm, 'phoenix').incarnation).toBe(2);
  });

  test('getStatus includes a seeds section', () => {
    createBeing(sm, 'yogi');
    act(sm, 'yogi', 'meditated', 4, 'non-delusion');
    const result = getStatus(sm, 'yogi');
    expect(result.seeds).toHaveProperty('balance');
    expect(result.seeds).toHaveProperty('byState');
    expect(result.seeds).toHaveProperty('byTiming');
    expect(result.seeds).toHaveProperty('incarnation', 1);
  });
});

describe('MCP handlers — contemplative tools', () => {
  let sm: StateManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'buddha-mcp-'));
    sm = new StateManager(tempDir);
    createBeing(sm, 'meditator');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test('meditate develops path factors and returns result', () => {
    const result = meditate(sm, 'meditator', 300, 7);
    expect(result).toHaveProperty('mindfulnessLevel');
    expect(result).toHaveProperty('insight');
  });

  test('diagnose returns suffering analysis', () => {
    const result = diagnose(sm, 'meditator', ['dukkha-dukkha'], ['sensory']);
    expect(result).toBeDefined();
  });

  test('inquiry investigates self and returns result', () => {
    const result = inquiry(sm, 'meditator');
    expect(result).toHaveProperty('conclusion');
  });

  // Note: `faceSuffering` and `investigateSelf` are pure analysis methods — they
  // don't mutate any Being state that gets serialized, so the persisted JSON is
  // byte-identical before and after the handler runs. A before/after file-content
  // diff would therefore be a false assertion here. Instead, spy on the actual
  // write call so the test fails precisely when `sm.saveBeing(...)` is removed
  // from the handler (verified locally by commenting it out — see fixwave report).
  test('diagnose persists the being via a save call', () => {
    const beingFile = join(tempDir, 'beings', 'meditator.json');
    expect(readFileSync(beingFile, 'utf-8').length).toBeGreaterThan(0);

    const saveSpy = vi.spyOn(sm, 'saveBeing');
    diagnose(sm, 'meditator', ['dukkha-dukkha'], ['sensory']);

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith('meditator', expect.anything());
    saveSpy.mockRestore();
  });

  test('inquiry persists the being via a save call', () => {
    const beingFile = join(tempDir, 'beings', 'meditator.json');
    expect(readFileSync(beingFile, 'utf-8').length).toBeGreaterThan(0);

    const saveSpy = vi.spyOn(sm, 'saveBeing');
    inquiry(sm, 'meditator');

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith('meditator', expect.anything());
    saveSpy.mockRestore();
  });

  test('chain returns dependent origination visualization', () => {
    const result = chain(sm, 'meditator');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('MCP handlers — koan tools', () => {
  test('presentKoan returns a random koan', () => {
    const koan = presentKoan();
    expect(koan).toHaveProperty('id');
    expect(koan).toHaveProperty('title');
    expect(koan).toHaveProperty('case');
    expect(koan).toHaveProperty('source');
  });

  test('presentKoan with id returns specific koan', () => {
    const koan = presentKoan('mu');
    expect(koan.id).toBe('mu');
  });

  test('contemplateKoan evaluates response for dualism traps', () => {
    const result = contemplateKoan('mu', 'yes');
    expect(result).toHaveProperty('trapsDetected');
    expect(result).toHaveProperty('isNonDual');
    expect(result).toHaveProperty('reflection');
  });
});

describe('sitWithSuffering', () => {
  it('walks all four cessation stages for a named suffering', () => {
    const result = sitWithSuffering('deadline pressure');
    expect(result.suffering).toBe('deadline pressure');
    expect(result.steps.map(s => s.stage)).toEqual(['recognize', 'investigate', 'release', 'practice']);
    expect(result.steps.map(s => s.truth)).toEqual(['dukkha', 'samudaya', 'nirodha', 'magga']);
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('rejects empty suffering', () => {
    expect(() => sitWithSuffering('   ')).toThrow();
  });
});
