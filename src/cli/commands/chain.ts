import { DependentOrigination } from '../../dependent-origination/DependentOrigination';
import { header, label, insight, subtle, divider } from '../utils/format';

export function chain(): void {
  const do_ = new DependentOrigination();

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
