import { Command } from 'commander';
import { inquiry } from './commands/inquiry';
import { chain } from './commands/chain';
import { status } from './commands/status';
import { sit } from './commands/sit';
import { koan } from './commands/koan';

const program = new Command();

program
  .name('buddha')
  .description('Buddha.js — Buddhist concepts from the terminal')
  .version('0.1.0');

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

program.parse();
