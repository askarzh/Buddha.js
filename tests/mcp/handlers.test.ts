import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StateManager } from '../../src/cli/utils/state';
import { createBeing, listBeings, deleteBeing, getStatus, experienceSensory, act, ripenKarma, meditate, diagnose, inquiry, chain } from '../../src/mcp/handlers';

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
    const result = act(sm, 'actor', 'gave food to a hungry person', 'wholesome', 7, 'non-greed');
    expect(result).toHaveProperty('quality', 'wholesome');
    expect(result).toHaveProperty('intention.description');
  });

  test('ripenKarma returns array of results', () => {
    act(sm, 'actor', 'small kind act', 'wholesome', 3);
    const results = ripenKarma(sm, 'actor');
    expect(Array.isArray(results)).toBe(true);
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

  test('chain returns dependent origination visualization', () => {
    const result = chain(sm, 'meditator');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
