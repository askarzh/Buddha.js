import { StateManager } from '../cli/utils/state';
import { Being } from '../simulation/Being';

export function createBeing(sm: StateManager, name: string): string {
  const being = new Being();
  sm.saveBeing(name, being);
  return being.getSummary();
}

export function listBeings(sm: StateManager): string[] {
  return sm.listBeings();
}

export function deleteBeing(sm: StateManager, name: string): string {
  sm.deleteBeing(name);
  return `Being "${name}" deleted.`;
}

export function getStatus(sm: StateManager, name: string) {
  const being = sm.loadBeing(name);
  return { summary: being.getSummary(), state: being.getState() };
}
