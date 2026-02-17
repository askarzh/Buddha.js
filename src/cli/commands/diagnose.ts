import { checkbox } from '@inquirer/prompts';
import { EightfoldPath } from '../../eightfold-path/EightfoldPath';
import { FourNobleTruths } from '../../four-noble-truths/FourNobleTruths';
import { DukkhaType, CravingType } from '../../utils/types';
import { header, label, insight, divider } from '../utils/format';

const SUFFERING_CHOICES = [
  { name: 'Obvious suffering (pain, illness, loss)', value: 'dukkha-dukkha' as DukkhaType },
  { name: 'Suffering of change (impermanence of pleasure)', value: 'viparinama-dukkha' as DukkhaType },
  { name: 'Suffering of conditioned existence', value: 'sankhara-dukkha' as DukkhaType },
];

const CRAVING_CHOICES = [
  { name: 'Craving for sensory pleasures', value: 'sensory' as CravingType },
  { name: 'Craving for existence / becoming', value: 'becoming' as CravingType },
  { name: 'Craving for non-existence', value: 'non-becoming' as CravingType },
];

export async function diagnose(): Promise<void> {
  console.log(header('Four Noble Truths — Diagnosis'));

  const suffering = await checkbox<DukkhaType>({
    message: 'What types of suffering are present?',
    choices: SUFFERING_CHOICES,
    required: true,
  });

  const cravings = await checkbox<CravingType>({
    message: 'What cravings are active?',
    choices: CRAVING_CHOICES,
    required: true,
  });

  const path = new EightfoldPath();
  const truths = new FourNobleTruths(path);

  const diagnosis = truths.diagnose({
    suffering,
    cravings,
  });

  console.log();
  console.log(label('Suffering:'));
  console.log(`  Obvious suffering: ${diagnosis.suffering.obviousSuffering ? 'yes' : 'no'}`);
  console.log(`  Suffering of change: ${diagnosis.suffering.sufferingOfChange ? 'yes' : 'no'}`);
  console.log(`  Existential unsatisfactoriness: ${diagnosis.suffering.existentialUnsatisfactoriness ? 'yes' : 'no'}`);
  console.log(`  Types identified: ${diagnosis.suffering.totalTypes}`);
  console.log(`  Insight: ${diagnosis.suffering.insight}`);

  console.log();
  console.log(label('Cause:'));
  console.log(`  Cravings: ${diagnosis.cause.cravingsPresent.join(', ')}`);
  console.log(`  Root causes: ${diagnosis.cause.rootCauses.join(', ')}`);
  console.log(`  Intensity: ${diagnosis.cause.intensity}`);
  console.log(`  Primary driver: ${diagnosis.cause.primaryDriver ?? 'none'}`);
  console.log(`  Recommendation: ${diagnosis.cause.recommendation}`);

  console.log();
  console.log(label('Cessation:'));
  console.log(`  Possible: ${diagnosis.cessationPossible.isPossible}`);
  console.log(`  Progress level: ${diagnosis.cessationPossible.progressLevel}/10`);
  console.log(`  Obstacles: ${diagnosis.cessationPossible.obstacles.join('; ')}`);
  console.log(`  Path forward: ${diagnosis.cessationPossible.pathForward}`);

  console.log();
  console.log(label('Path Forward:'));
  console.log(`  Focus area: ${diagnosis.path.focusArea}`);
  console.log(`  Recommended intensity: ${diagnosis.path.recommendedIntensity}/10`);
  console.log(`  Rationale: ${diagnosis.path.rationale}`);
  console.log(`  Practices:`);
  for (const practice of diagnosis.path.practices) {
    console.log(`    - ${practice}`);
  }

  console.log(divider());
  console.log(insight('The diagnosis is complete. The path is clear.'));
}
