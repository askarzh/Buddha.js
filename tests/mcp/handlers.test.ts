import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StateManager } from '../../src/cli/utils/state';
import { createBeing, listBeings, deleteBeing, getStatus } from '../../src/mcp/handlers';

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
