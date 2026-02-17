import { Command } from 'commander';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { header } from '../utils/format';

export function status(_localOpts: Record<string, never>, cmd: Command): void {
  const opts = getGlobalOpts(cmd);
  const mgr = getStateManager(opts);
  const being = mgr.loadBeing(opts.being);

  if (opts.json) {
    const state = being.getState();
    console.log(JSON.stringify({
      command: 'status',
      being: opts.being,
      result: {
        pathProgress: state.pathProgress,
        mindfulnessLevel: state.mindfulnessLevel,
        pendingKarma: state.pendingKarma,
        experienceCount: state.experienceCount,
        mindState: {
          isCalm: state.mindState.isCalm,
          isFocused: state.mindState.isFocused,
          dominantFactors: state.mindState.dominantFactors,
        },
      },
      state: { mindfulness: state.mindfulnessLevel, karmicActions: state.pendingKarma },
    }, null, 2));
    return;
  }

  console.log(header('Being Status'));
  console.log(being.getSummary());
}
