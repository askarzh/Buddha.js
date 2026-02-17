import { Command } from 'commander';
import { Being } from '../../simulation/Being';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { success } from '../utils/format';

export function reset(_localOpts: Record<string, never>, cmd: Command): void {
  const opts = getGlobalOpts(cmd);
  const mgr = getStateManager(opts);
  mgr.saveBeing(opts.being, new Being());

  if (opts.json) {
    console.log(JSON.stringify({
      command: 'reset',
      being: opts.being,
      result: { reset: true },
    }, null, 2));
    return;
  }

  console.log(success(`  Being "${opts.being}" has been reset to a fresh state.`));
}
