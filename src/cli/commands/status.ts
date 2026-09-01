import { Command } from 'commander';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { runStatus } from '../utils/runner';
import { header } from '../utils/format';

export function status(_localOpts: Record<string, never>, cmd: Command): void {
  const opts = getGlobalOpts(cmd);
  const mgr = getStateManager(opts);

  if (opts.json) {
    console.log(JSON.stringify(runStatus(mgr, opts.being), null, 2));
    return;
  }

  // Read-only, like the JSON branch: status observes, it never writes.
  console.log(header('Being Status'));
  console.log(mgr.loadBeing(opts.being).getSummary());
}
