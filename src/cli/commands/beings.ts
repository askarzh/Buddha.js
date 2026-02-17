import { Command } from 'commander';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { header, label, subtle } from '../utils/format';

export function beings(_localOpts: Record<string, never>, cmd: Command): void {
  const opts = getGlobalOpts(cmd);
  const mgr = getStateManager(opts);
  const names = mgr.listBeings();

  if (opts.json) {
    console.log(JSON.stringify({
      command: 'beings',
      result: { beings: names, count: names.length },
    }, null, 2));
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
  mgr.deleteBeing(name);

  if (globalOpts.json) {
    console.log(JSON.stringify({
      command: 'beings delete',
      result: { deleted: name },
    }, null, 2));
    return;
  }

  console.log(`  Deleted being: ${name}`);
}
