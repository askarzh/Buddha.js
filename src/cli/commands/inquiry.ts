import { Command } from 'commander';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { runInquiry } from '../utils/runner';
import { header, label, insight, divider } from '../utils/format';

export function inquiry(_localOpts: Record<string, never>, cmd: Command): void {
  const opts = getGlobalOpts(cmd);
  const mgr = getStateManager(opts);

  // Settle any pending rebirth before investigating — this command saves.
  const payload = runInquiry(mgr, opts.being);

  if (opts.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const { result, rebirth } = payload;

  if (rebirth) {
    console.log(insight(`Since you were last here, your being was reborn: ${rebirth.fromRealm} -> ${rebirth.toRealm} (incarnation ${rebirth.incarnation}).`));
    console.log();
  }

  console.log(header('Self Investigation'));

  console.log(label('Aggregate Search:'));
  console.log(`  Self found: ${result.selfFound}`);
  console.log(`  Searched in: ${result.aggregatesExamined.join(', ')}`);
  console.log(`  ${result.conclusion}`);

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
  console.log(insight(result.overallConclusion));
}
