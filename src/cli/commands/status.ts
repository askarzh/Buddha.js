import { Being } from '../../simulation/Being';
import { header } from '../utils/format';

export function status(): void {
  const being = new Being();

  console.log(header('Being Status'));
  console.log(being.getSummary());
}
