import { input, confirm } from '@inquirer/prompts';
import { KoanGenerator } from '../../koan/KoanGenerator';
import { header, label, insight, subtle, divider, success } from '../utils/format';
import chalk from 'chalk';

export async function koan(options: { id?: string }): Promise<void> {
  const generator = new KoanGenerator();

  let continueLoop = true;
  while (continueLoop) {
    const k = options.id ? generator.present(options.id) : generator.present();

    console.log(header(k.title));
    console.log(k.case);
    console.log(subtle(`-- ${k.source}`));

    if (k.hint) {
      console.log(subtle(`\nHint: ${k.hint}`));
    }

    console.log();
    const response = await input({
      message: 'Contemplate and respond:',
    });

    const result = generator.contemplate(k.id, response);

    console.log();
    if (result.isNonDual) {
      console.log(success('No dualistic traps detected.'));
    } else {
      console.log(label('Traps detected:'));
      for (const trap of result.trapsDetected) {
        console.log(`  ${chalk.red('\u2022')} ${trap}`);
      }
    }

    console.log();
    console.log(insight(result.reflection));
    console.log(divider());

    continueLoop = await confirm({
      message: 'Try another koan?',
      default: false,
    });

    // Clear specific id after first round so subsequent koans are random
    options = {};
  }
}
