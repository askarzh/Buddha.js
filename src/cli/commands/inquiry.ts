import { Command } from 'commander';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { header, label, insight, divider } from '../utils/format';

export function inquiry(_localOpts: Record<string, never>, cmd: Command): void {
  const opts = getGlobalOpts(cmd);
  const mgr = getStateManager(opts);
  const being = mgr.loadBeing(opts.being);

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
    }, null, 2));
    return;
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
