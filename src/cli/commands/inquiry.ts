import { Being } from '../../simulation/Being';
import { header, label, insight, divider } from '../utils/format';

export function inquiry(): void {
  const being = new Being();
  const result = being.investigateSelf();

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
