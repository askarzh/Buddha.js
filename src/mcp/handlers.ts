import { StateManager } from '../cli/utils/state';
import { Being } from '../simulation/Being';
import type {
  SenseBase, Intensity, KarmaQuality,
  UnwholesomeRoot, WholesomeRoot,
  DukkhaType, CravingType,
} from '../utils/types';

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

export function experienceSensory(
  sm: StateManager,
  name: string,
  input: { senseBase: SenseBase; object: unknown; intensity: Intensity },
) {
  const being = sm.loadBeing(name);
  const result = being.experience(input);
  sm.saveBeing(name, being);
  return result;
}

export function act(
  sm: StateManager,
  name: string,
  description: string,
  quality: KarmaQuality,
  intensity: Intensity,
  root?: UnwholesomeRoot | WholesomeRoot,
) {
  const being = sm.loadBeing(name);
  const karma = being.act(description, quality, intensity, root);
  sm.saveBeing(name, being);
  return karma;
}

export function ripenKarma(sm: StateManager, name: string) {
  const being = sm.loadBeing(name);
  const results = being.receiveKarmicResults();
  sm.saveBeing(name, being);
  return results;
}

export function meditate(
  sm: StateManager,
  name: string,
  duration: number,
  effort: Intensity,
) {
  const being = sm.loadBeing(name);
  const result = being.meditate(duration, effort);
  sm.saveBeing(name, being);
  return result;
}

export function diagnose(
  sm: StateManager,
  name: string,
  suffering: DukkhaType[],
  cravings: CravingType[],
) {
  const being = sm.loadBeing(name);
  return being.faceSuffering(suffering, cravings);
}

export function inquiry(sm: StateManager, name: string) {
  const being = sm.loadBeing(name);
  return being.investigateSelf();
}

export function chain(sm: StateManager, name: string): string {
  const being = sm.loadBeing(name);
  return being.observeDependentOrigination();
}
