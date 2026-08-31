import { Command } from 'commander';
import { input, select } from '@inquirer/prompts';
import { Being } from '../../simulation/Being';
import { KarmaQuality, Intensity, UnwholesomeRoot, WholesomeRoot } from '../../utils/types';
import { GlobalOpts, getStateManager } from '../utils/state';
import { header, label, insight, subtle, divider, success } from '../utils/format';
import chalk from 'chalk';

interface KarmaLocalOpts {
  quality?: string;
  description?: string;
  intensity?: string;
  root?: string;
}

export async function karma(localOpts: KarmaLocalOpts, cmd: Command): Promise<void> {
  const globalOpts = cmd.optsWithGlobals() as GlobalOpts;
  const mgr = getStateManager(globalOpts);
  const loaded = mgr.loadBeing(globalOpts.being);

  // Settle any pending rebirth (incarnation gap crossed since the last save)
  // before this command does its own work — observation-on-load only
  // detects that a rebirth is due; it never enacts it on its own. If one
  // fires, persist the newly-transmigrated being immediately and continue
  // on it for everything after.
  const settled = loaded.settlePendingRebirth();
  const being = settled ? settled.being : loaded;
  if (settled) {
    mgr.saveBeing(globalOpts.being, being);
  }
  const rebirth = settled
    ? { fromRealm: settled.fromRealm, toRealm: settled.toRealm, incarnation: settled.incarnation }
    : undefined;

  if (globalOpts.json) {
    await jsonMode(being, localOpts, globalOpts, mgr, rebirth);
    return;
  }

  if (rebirth) {
    console.log(insight(`Since you were last here, your being was reborn: ${rebirth.fromRealm} -> ${rebirth.toRealm} (incarnation ${rebirth.incarnation}).`));
    console.log();
  }

  await interactiveMode(being);
  mgr.saveBeing(globalOpts.being, being);
}

const UNWHOLESOME_ROOTS: UnwholesomeRoot[] = ['greed', 'aversion', 'delusion'];

function deriveQuality(root: UnwholesomeRoot | WholesomeRoot): KarmaQuality {
  return UNWHOLESOME_ROOTS.includes(root as UnwholesomeRoot) ? 'unwholesome' : 'wholesome';
}

async function jsonMode(
  being: Being,
  localOpts: KarmaLocalOpts,
  globalOpts: GlobalOpts,
  mgr: ReturnType<typeof getStateManager>,
  rebirth?: { fromRealm: string; toRealm: string; incarnation: number },
): Promise<void> {
  if (localOpts.description && localOpts.intensity && localOpts.root) {
    const intensity = Number(localOpts.intensity) as Intensity;
    const root = localOpts.root as WholesomeRoot | UnwholesomeRoot;

    if (localOpts.quality) {
      const derivedQuality = deriveQuality(root);
      if (localOpts.quality !== derivedQuality) {
        console.log(JSON.stringify({
          error: `Quality '${localOpts.quality}' contradicts root '${root}' — quality is determined by the root`,
        }, null, 2));
        process.exitCode = 1;
        return;
      }
    }

    being.act(localOpts.description, intensity, root);
    mgr.saveBeing(globalOpts.being, being);
  }

  const stream = being.getKarmicStream();
  const state = being.getState();

  console.log(JSON.stringify({
    command: 'karma',
    being: globalOpts.being,
    result: {
      karmicStream: stream.map(k => ({
        quality: k.quality,
        intensity: k.intensity,
        description: k.intention.description,
        status: k.isPotential() ? 'potential' : 'manifested',
      })),
      totalActions: stream.length,
    },
    state: { mindfulness: state.mindfulnessLevel, karmicActions: state.pendingKarma },
    ...(rebirth ? { rebirth } : {}),
  }, null, 2));
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
        if (report.results.length === 0) {
          console.log(subtle('\n  No karma has ripened yet.\n'));
        } else {
          console.log(label('\n  Karmic Results:'));
          for (const r of report.results) {
            const color = r.experienceQuality === 'pleasant' ? chalk.green
              : r.experienceQuality === 'unpleasant' ? chalk.red
              : chalk.gray;
            console.log(`    ${color('•')} ${r.description} (${r.experienceQuality})`);
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
