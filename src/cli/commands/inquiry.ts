import { Command } from 'commander';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { header, label, insight, divider } from '../utils/format';

export function inquiry(_localOpts: Record<string, never>, cmd: Command): void {
  const opts = getGlobalOpts(cmd);
  const mgr = getStateManager(opts);
  const loaded = mgr.loadBeing(opts.being);

  // Settle any pending rebirth (incarnation gap crossed since the last save)
  // before this command does its own work — observation-on-load only
  // detects that a rebirth is due; it never enacts it on its own. If one
  // fires, switch to the newly-transmigrated being for everything after.
  const settled = loaded.settlePendingRebirth();
  const being = settled ? settled.being : loaded;

  const result = being.investigateSelf();
  mgr.saveBeing(opts.being, being);

  if (opts.json) {
    console.log(JSON.stringify({
      command: 'inquiry',
      being: opts.being,
      result: {
        selfFound: result.aggregateSearch.selfFound,
        aggregatesExamined: result.aggregateSearch.aggregatesExamined.map(a => a.aggregate),
        conclusion: result.aggregateSearch.conclusion,
        dependentOriginationInsight: result.dependentOriginationInsight,
        emptinessInsight: result.emptinessInsight ? {
          phenomenon: result.emptinessInsight.phenomenon,
          hasInherentExistence: result.emptinessInsight.hasInherentExistence,
          dependsOn: result.emptinessInsight.dependsOn,
        } : null,
        overallConclusion: result.conclusion,
      },
      state: { mindfulness: being.getState().mindfulnessLevel, karmicActions: being.getState().pendingKarma },
      ...(settled ? { rebirth: { fromRealm: settled.fromRealm, toRealm: settled.toRealm, incarnation: settled.incarnation } } : {}),
    }, null, 2));
    return;
  }

  if (settled) {
    console.log(insight(`Since you were last here, your being was reborn: ${settled.fromRealm} -> ${settled.toRealm} (incarnation ${settled.incarnation}).`));
    console.log();
  }

  console.log(header('Self Investigation'));

  console.log(label('Aggregate Search:'));
  console.log(`  Self found: ${result.aggregateSearch.selfFound}`);
  console.log(`  Searched in: ${result.aggregateSearch.aggregatesExamined.map(a => a.aggregate).join(', ')}`);
  console.log(`  ${result.aggregateSearch.conclusion}`);

  console.log();
  console.log(label('Dependent Origination:'));
  console.log(`  ${result.dependentOriginationInsight}`);

  if (result.emptinessInsight) {
    console.log();
    console.log(label('Emptiness Analysis:'));
    console.log(`  Phenomenon: ${result.emptinessInsight.phenomenon}`);
    console.log(`  Inherent existence: ${result.emptinessInsight.hasInherentExistence}`);
    console.log(`  Depends on: ${result.emptinessInsight.dependsOn.join(', ') || 'various conditions'}`);
  }

  console.log();
  console.log(divider());
  console.log(insight(result.conclusion));
}
