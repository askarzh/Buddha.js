import { Command } from 'commander';
import { DependentOrigination } from '../../dependent-origination/DependentOrigination';
import { getGlobalOpts } from '../utils/state';
import { header, label, insight, subtle, divider } from '../utils/format';

export function chain(_localOpts: Record<string, unknown>, cmd: Command): void {
  const globalOpts = getGlobalOpts(cmd);
  const do_ = new DependentOrigination();

  if (globalOpts.json) {
    const links = do_.links.map((link, i) => ({
      position: i + 1,
      name: link.name,
      sanskritName: link.sanskritName,
    }));
    console.log(JSON.stringify({
      command: 'chain',
      result: {
        links,
        liberationPoint: do_.practiceAtLiberationPoint(),
      },
    }, null, 2));
    return;
  }

  console.log(header('Dependent Origination \u2014 The 12 Links'));

  const links = do_.links;
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const arrow = i < links.length - 1 ? ' \u2192' : '';
    console.log(`  ${subtle(`${i + 1}.`)} ${label(link.name)} ${subtle(`(${link.sanskritName})`)}${arrow}`);
  }

  console.log();
  console.log(divider());
  console.log(label('Liberation Point:'));
  console.log(insight(do_.practiceAtLiberationPoint()));
}
