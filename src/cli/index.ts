import { Command } from 'commander';
import { inquiry } from './commands/inquiry';
import { chain } from './commands/chain';
import { status } from './commands/status';
import { sit } from './commands/sit';
import { koan } from './commands/koan';
import { diagnose } from './commands/diagnose';
import { karma } from './commands/karma';
import { meditate } from './commands/meditate';

const program = new Command();

program
  .name('buddha')
  .description('Buddha.js — Buddhist concepts from the terminal')
  .version('0.1.0')
  .option('--json', 'Output results as JSON (non-interactive)')
  .option('--being <name>', 'Named being profile to use', 'default')
  .option('--state-dir <path>', 'State directory for persistence');

program
  .command('inquiry')
  .description('Investigate the nature of self')
  .action(inquiry);

program
  .command('chain')
  .description('Display the 12 links of dependent origination')
  .action(chain);

program
  .command('status')
  .description('Show the current state of a being')
  .action(status);

program
  .command('sit')
  .description('Guided cessation through the Poison Arrow method')
  .action(sit);

program
  .command('koan')
  .description('Contemplate a Zen koan')
  .option('--id <id>', 'Present a specific koan by ID')
  .action(koan);

program
  .command('diagnose')
  .description('Diagnose suffering using the Four Noble Truths')
  .action(diagnose);

program
  .command('karma')
  .description('Explore intentional action and karmic results')
  .option('--quality <quality>', 'Karma quality: wholesome or unwholesome (for --json)')
  .option('--description <desc>', 'Action description (for --json)')
  .option('--intensity <n>', 'Action intensity 1-10 (for --json)')
  .option('--root <root>', 'Root: greed, aversion, delusion, non-greed, non-aversion, non-delusion (for --json)')
  .action(karma);

program
  .command('meditate')
  .description('Start a meditation session with mindful check-ins')
  .option('--interval <seconds>', 'Seconds between interval bells', '60')
  .action(meditate);

program.parse();
