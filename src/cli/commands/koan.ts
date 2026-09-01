import { Command } from 'commander';
import { input, confirm } from '@inquirer/prompts';
import { KoanGenerator } from '../../koan/KoanGenerator';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { KoanOpts, runKoan } from '../utils/runner';
import { header, label, insight, subtle, divider, success } from '../utils/format';
import chalk from 'chalk';

export async function koan(localOpts: KoanOpts, cmd: Command): Promise<void> {
  const globalOpts = getGlobalOpts(cmd);
  const generator = new KoanGenerator();

  if (globalOpts.json) {
    const mgr = getStateManager(globalOpts);
    console.log(JSON.stringify(runKoan(mgr, globalOpts.being, localOpts), null, 2));
    return;
  }

  let options = { ...localOpts };
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
