import { input } from '@inquirer/prompts';
import { PoisonArrow } from '../../simulation/PoisonArrow';
import { header, stage, insight, divider, success } from '../utils/format';

export async function sit(): Promise<void> {
  console.log(header('Poison Arrow -- Quick Cessation'));
  console.log('Based on the Cula-Malunkyovada Sutta: remove the arrow first.\n');

  const suffering = await input({
    message: 'What suffering are you sitting with?',
  });

  const sim = new PoisonArrow(suffering);

  while (!sim.isComplete()) {
    const step = sim.step();
    console.log();
    console.log(stage(step.stage.toUpperCase(), `Truth of ${step.truth}`));
    console.log(insight(step.insight));
    console.log(`  ${step.guidance}`);

    if (!sim.isComplete()) {
      await input({ message: 'Press Enter to continue...' });
    }
  }

  console.log();
  console.log(divider());
  console.log(success('The arrow has been removed.'));
  console.log();
  console.log(sim.getSummary());
}
