import { Command } from 'commander';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { runReset } from '../utils/runner';
import { success } from '../utils/format';

export function reset(_localOpts: Record<string, never>, cmd: Command): void {
  const opts = getGlobalOpts(cmd);
  const mgr = getStateManager(opts);
  const payload = runReset(mgr, opts.being);

  if (opts.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(success(`  Being "${opts.being}" has been reset to a fresh state.`));
}
