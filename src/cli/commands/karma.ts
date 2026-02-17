import { input, select } from '@inquirer/prompts';
import { Being } from '../../simulation/Being';
import { KarmaQuality, Intensity, UnwholesomeRoot, WholesomeRoot } from '../../utils/types';
import { header, label, insight, subtle, divider, success } from '../utils/format';
import chalk from 'chalk';

export async function karma(): Promise<void> {
  const being = new Being();

  console.log(header('Karma — Intentional Action'));
  console.log('Every action plants a seed. What will you cultivate?\n');

  let running = true;
  while (running) {
    const action = await select({
      message: 'What would you like to do?',
      choices: [
        { name: 'Perform an action', value: 'act' },
        { name: 'Receive karmic results', value: 'receive' },
        { name: 'View karmic stream', value: 'view' },
        { name: 'Quit', value: 'quit' },
      ],
    });

    switch (action) {
      case 'act': {
        const description = await input({ message: 'Describe the action:' });
        const quality = await select<KarmaQuality>({
          message: 'Quality:',
          choices: [
            { name: 'Wholesome', value: 'wholesome' },
            { name: 'Unwholesome', value: 'unwholesome' },
          ],
        });
        const intensity = await select<Intensity>({
          message: 'Intensity (1-10):',
          choices: ([3, 5, 7, 9] as Intensity[]).map(n => ({ name: `${n}`, value: n })),
        });
        const root = quality === 'wholesome'
          ? await select<WholesomeRoot>({
              message: 'Root:',
              choices: [
                { name: 'Non-greed (generosity)', value: 'non-greed' },
                { name: 'Non-aversion (loving-kindness)', value: 'non-aversion' },
                { name: 'Non-delusion (wisdom)', value: 'non-delusion' },
              ],
            })
          : await select<UnwholesomeRoot>({
              message: 'Root:',
              choices: [
                { name: 'Greed', value: 'greed' },
                { name: 'Aversion', value: 'aversion' },
                { name: 'Delusion', value: 'delusion' },
              ],
            });

        const k = being.act(description, quality, intensity, root);
        console.log(success(`\n  Karma created: ${k.quality} (intensity ${k.intensity})\n`));
        break;
      }

      case 'receive': {
        const results = being.receiveKarmicResults();
        if (results.length === 0) {
          console.log(subtle('\n  No karma has ripened yet.\n'));
        } else {
          console.log(label('\n  Karmic Results:'));
          for (const r of results) {
            const color = r.experienceQuality === 'pleasant' ? chalk.green
              : r.experienceQuality === 'unpleasant' ? chalk.red
              : chalk.gray;
            console.log(`    ${color('•')} ${r.description} (${r.experienceQuality})`);
          }
          console.log();
        }
        break;
      }

      case 'view': {
        const stream = being.getKarmicStream();
        if (stream.length === 0) {
          console.log(subtle('\n  No actions taken yet.\n'));
        } else {
          console.log(label('\n  Karmic Stream:'));
          for (const k of stream) {
            const symbol = k.quality === 'wholesome' ? chalk.green('●') : chalk.red('●');
            console.log(`    ${symbol} ${k.intention.description} (${k.quality}, intensity ${k.intensity})`);
          }
          console.log();
        }
        break;
      }

      case 'quit':
        running = false;
        break;
    }
  }

  console.log(divider());
  const state = being.getState();
  console.log(insight(`Session complete. ${state.pendingKarma} karmic seeds planted.`));
}
