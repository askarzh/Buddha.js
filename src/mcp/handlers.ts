import { StateManager } from '../cli/utils/state';
import { Being } from '../simulation/Being';
import { KoanGenerator } from '../koan/KoanGenerator';
import { PoisonArrow } from '../simulation/PoisonArrow';
import type {
  SenseBase, Intensity,
  UnwholesomeRoot, WholesomeRoot,
  DukkhaType, CravingType, FeelingTone,
} from '../utils/types';

const koanGenerator = new KoanGenerator();

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
  const being = sm.loadExistingBeing(name);
  const balance = being.karmicStore.getKarmicBalance();
  const { byState } = being.karmicStore.getStatistics();
  const byTiming: Record<string, number> = {};
  for (const seed of being.karmicStore.getSeeds()) {
    byTiming[seed.ripeningTiming] = (byTiming[seed.ripeningTiming] ?? 0) + 1;
  }
  return {
    summary: being.getSummary(),
    state: being.getState(),
    seeds: {
      balance,
      byState,
      byTiming,
      incarnation: being.incarnation,
    },
  };
}

export function experienceSensory(
  sm: StateManager,
  name: string,
  input: { senseBase: SenseBase; object: unknown; intensity: Intensity; valence?: FeelingTone },
) {
  const being = sm.loadExistingBeing(name);
  const result = being.experience(input);
  sm.saveBeing(name, being);
  return result;
}

export function act(
  sm: StateManager,
  name: string,
  description: string,
  intensity: Intensity,
  root?: UnwholesomeRoot | WholesomeRoot,
) {
  const being = sm.loadExistingBeing(name);
  const karma = being.act(description, intensity, root);
  sm.saveBeing(name, being);
  return karma;
}

export function ripenKarma(sm: StateManager, name: string, force = false) {
  const being = sm.loadExistingBeing(name);
  const report = being.receiveKarmicResults(force);
  sm.saveBeing(name, being);
  return report;
}

export function cognizeObject(
  sm: StateManager,
  name: string,
  content: string,
  senseBase?: SenseBase,
) {
  const being = sm.loadExistingBeing(name);
  const result = being.cognize(content, senseBase);
  sm.saveBeing(name, being);
  return result;
}

export function rebirthBeing(sm: StateManager, name: string) {
  const being = sm.loadExistingBeing(name);
  const result = being.rebirth();
  sm.saveBeing(name, being);
  return result;
}

export function meditate(
  sm: StateManager,
  name: string,
  duration: number,
  effort: Intensity,
) {
  const being = sm.loadExistingBeing(name);
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
  const being = sm.loadExistingBeing(name);
  const result = being.faceSuffering(suffering, cravings);
  sm.saveBeing(name, being);
  return result;
}

export function inquiry(sm: StateManager, name: string) {
  const being = sm.loadExistingBeing(name);
  const result = being.investigateSelf();
  sm.saveBeing(name, being);
  return result;
}

export function chain(sm: StateManager, name: string): string {
  const being = sm.loadExistingBeing(name);
  return being.observeDependentOrigination();
}

export function presentKoan(id?: string) {
  return koanGenerator.present(id);
}

export function contemplateKoan(koanId: string, response: string) {
  return koanGenerator.contemplate(koanId, response);
}

export function sitWithSuffering(suffering: string) {
  const sim = new PoisonArrow(suffering);
  const steps = [];
  while (!sim.isComplete()) {
    const step = sim.step();
    steps.push({ stage: step.stage, truth: step.truth, insight: step.insight, guidance: step.guidance });
  }
  return { suffering, steps, summary: sim.getSummary() };
}
