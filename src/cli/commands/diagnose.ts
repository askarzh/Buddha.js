import { Command } from 'commander';
import { checkbox } from '@inquirer/prompts';
import { DukkhaType, CravingType } from '../../utils/types';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { DiagnoseOpts, runDiagnose } from '../utils/runner';
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

export async function diagnose(localOpts: DiagnoseOpts, cmd: Command): Promise<void> {
  const globalOpts = getGlobalOpts(cmd);
  const mgr = getStateManager(globalOpts);

  if (globalOpts.json) {
    console.log(JSON.stringify(runDiagnose(mgr, globalOpts.being, localOpts), null, 2));
    return;
  }

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

  const diagnosis = runDiagnose(mgr, globalOpts.being, {
    dukkhaTypes: suffering.join(','),
    cravingTypes: cravings.join(','),
  }).result;

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
  console.log(`  Possible: ${diagnosis.cessation.isPossible}`);
  console.log(`  Progress level: ${diagnosis.cessation.progressLevel}/10`);
  console.log(`  Obstacles: ${diagnosis.cessation.obstacles.join('; ')}`);
  console.log(`  Path forward: ${diagnosis.cessation.pathForward}`);

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
