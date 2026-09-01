import { Command } from 'commander';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { runBeings, runBeingsDelete } from '../utils/runner';
import { header, label, subtle } from '../utils/format';

export function beings(_localOpts: Record<string, never>, cmd: Command): void {
  const opts = getGlobalOpts(cmd);
  const mgr = getStateManager(opts);
  const payload = runBeings(mgr);
  const names = payload.result.beings;

  if (opts.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(header('Saved Beings'));
  if (names.length === 0) {
    console.log(subtle('  No beings saved yet. Run a command to create one.'));
  } else {
    for (const name of names) {
      console.log(`  ${label(name)}`);
    }
    console.log(subtle(`\n  ${names.length} being(s) saved.`));
  }
}

export function beingsDelete(name: string, _localOpts: Record<string, never>, cmd: Command): void {
  const globalOpts = getGlobalOpts(cmd);
  const mgr = getStateManager(globalOpts);
  const payload = runBeingsDelete(mgr, name);

  if (globalOpts.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`  Deleted being: ${name}`);
}
