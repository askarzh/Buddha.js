import { Command } from 'commander';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { runChain } from '../utils/runner';
import { header, label, insight, subtle, divider } from '../utils/format';

export function chain(_localOpts: Record<string, unknown>, cmd: Command): void {
  const globalOpts = getGlobalOpts(cmd);
  const mgr = getStateManager(globalOpts);
  const payload = runChain(mgr, globalOpts.being);

  if (globalOpts.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(header('Dependent Origination — The 12 Links'));

  const links = payload.result.links;
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const arrow = i < links.length - 1 ? ' →' : '';
    console.log(`  ${subtle(`${link.position}.`)} ${label(link.name)} ${subtle(`(${link.sanskritName})`)}${arrow}`);
  }

  console.log();
  console.log(divider());
  console.log(label('Liberation Point:'));
  console.log(insight(payload.result.liberationPoint));
}
