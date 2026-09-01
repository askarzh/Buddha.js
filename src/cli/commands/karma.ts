import { Command } from 'commander';
import { input, select } from '@inquirer/prompts';
import { Being } from '../../simulation/Being';
import { KarmaQuality, Intensity, UnwholesomeRoot, WholesomeRoot } from '../../utils/types';
import { GlobalOpts, getStateManager } from '../utils/state';
import { KarmaOpts, runKarma, isKarmaError, loadSettledBeing } from '../utils/runner';
import { header, label, insight, subtle, divider, success } from '../utils/format';
import chalk from 'chalk';

export async function karma(localOpts: KarmaOpts, cmd: Command): Promise<void> {
  const globalOpts = cmd.optsWithGlobals() as GlobalOpts;
  const mgr = getStateManager(globalOpts);

  if (globalOpts.json) {
    const payload = runKarma(mgr, globalOpts.being, localOpts);
    console.log(JSON.stringify(payload, null, 2));
    if (isKarmaError(payload)) {
      process.exitCode = 1;
    }
    return;
  }

  // Settle any pending rebirth (incarnation gap crossed since the last save)
  // before this command does its own work — observation-on-load only
  // detects that a rebirth is due; it never enacts it on its own. If one
  // fires, the newly-transmigrated being is persisted immediately and
  // everything after continues on it.
  const { being, rebirth } = loadSettledBeing(mgr, globalOpts.being);

  if (rebirth) {
    console.log(insight(`Since you were last here, your being was reborn: ${rebirth.fromRealm} -> ${rebirth.toRealm} (incarnation ${rebirth.incarnation}).`));
    console.log();
  }

  await interactiveMode(being);
  mgr.saveBeing(globalOpts.being, being);
}

async function interactiveMode(being: Being): Promise<void> {
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

        const k = being.act(description, intensity, root);
        console.log(success(`\n  Karma created: ${k.quality} (intensity ${k.intensity})\n`));
        break;
      }

      case 'receive': {
        const report = being.receiveKarmicResults();
        if (report.seedVipakas.length === 0) {
          console.log(subtle('\n  No karma has ripened yet.\n'));
        } else {
          console.log(label('\n  Karmic Results:'));
          for (const v of report.seedVipakas) {
            const color = v.quality === 'pleasant' ? chalk.green
              : v.quality === 'unpleasant' ? chalk.red
              : chalk.gray;
            console.log(`    ${color('•')} ${v.description} (${v.quality})`);
          }
          console.log();
        }
        if (report.whyNot.length > 0) {
          console.log(subtle(`  ${report.whyNot.length} karmic seed(s) awaiting conditions:`));
          for (const w of report.whyNot) {
            console.log(subtle(`    - ${w.description}: unmet — ${w.unmet.join(', ')}`));
          }
          console.log();
        }
        break;
      }

      case 'view': {
        const seeds = being.karmicStore.getSeeds();
        if (seeds.length === 0) {
          console.log(subtle('\n  No actions taken yet.\n'));
        } else {
          console.log(label('\n  Karmic Seeds:'));
          for (const seed of seeds) {
            const symbol = seed.quality === 'wholesome' ? chalk.green('●') : chalk.red('●');
            console.log(
              `    ${symbol} ${seed.description} (${seed.quality}, intensity ${seed.intentionStrength}, ${seed.state})`
            );
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
