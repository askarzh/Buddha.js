import chalk from 'chalk';

export function header(text: string): string {
  return chalk.bold.cyan(`\n═══ ${text} ═══\n`);
}

export function label(text: string): string {
  return chalk.bold(text);
}

export function insight(text: string): string {
  return chalk.italic.yellow(text);
}

export function success(text: string): string {
  return chalk.green(text);
}

export function subtle(text: string): string {
  return chalk.dim(text);
}

export function stage(name: string, description: string): string {
  return `${chalk.bold.magenta(name)} ${chalk.dim('—')} ${description}`;
}

export function divider(): string {
  return chalk.dim('─'.repeat(50));
}
