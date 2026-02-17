import { Command } from 'commander';

const program = new Command();

program
  .name('buddha')
  .description('Buddha.js — Buddhist concepts from the terminal')
  .version('0.1.0');

// Commands will be registered here in subsequent tasks

program.parse();
