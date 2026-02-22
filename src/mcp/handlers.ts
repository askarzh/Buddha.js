import { StateManager } from '../cli/utils/state';

export function listBeings(sm: StateManager): string[] {
  return sm.listBeings();
}
