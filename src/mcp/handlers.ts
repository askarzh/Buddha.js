import { StateManager } from '../cli/utils/state';
import { Being, REALM_DESCRIPTIONS } from '../simulation/Being';
import { KoanGenerator } from '../koan/KoanGenerator';
import { PoisonArrow } from '../simulation/PoisonArrow';
import type {
  SenseBase, Intensity,
  UnwholesomeRoot, WholesomeRoot,
  DukkhaType, CravingType, FeelingTone, Realm,
} from '../utils/types';

const koanGenerator = new KoanGenerator();

/** Optional note a mutating handler attaches when it settled a pending rebirth. */
export interface RebirthNote {
  fromRealm: Realm;
  toRealm: Realm;
  incarnation: number;
}

/**
 * Settle any pending rebirth on a just-loaded being before a mutating
 * handler does its own work. Observation-on-load only DETECTS that the
 * incarnation gap has passed (`Being.pendingRebirth`) — it never enacts
 * rebirth() itself (spec: "observation does not rebirth"). Mutating
 * handlers are where settlement actually happens: if `settlePendingRebirth()`
 * fires, the NEW being it returns is persisted immediately and becomes the
 * being the caller's own operation continues on — the loaded (now-dead)
 * object must never be operated on or saved again.
 */
function settleRebirth(
  sm: StateManager,
  name: string,
  loaded: Being,
): { being: Being; rebirth?: RebirthNote } {
  const result = loaded.settlePendingRebirth();
  if (!result) {
    return { being: loaded };
  }
  sm.saveBeing(name, result.being);
  return {
    being: result.being,
    rebirth: { fromRealm: result.fromRealm, toRealm: result.toRealm, incarnation: result.incarnation },
  };
}

/** Attach an optional `rebirth` note to a handler's result, if one settled. */
function withRebirthNote<T extends object>(result: T, rebirth?: RebirthNote): T {
  return rebirth ? Object.assign(result, { rebirth }) : result;
}

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
  return {
    summary: being.getSummary(),
    state: being.getState(),
    seeds: being.getSeedStats(),
  };
}

export function experienceSensory(
  sm: StateManager,
  name: string,
  input: { senseBase: SenseBase; object: unknown; intensity: Intensity; valence?: FeelingTone },
) {
  const loaded = sm.loadExistingBeing(name);
  const { being, rebirth } = settleRebirth(sm, name, loaded);
  const result = being.experience(input);
  sm.saveBeing(name, being);
  return withRebirthNote(result, rebirth);
}

export function act(
  sm: StateManager,
  name: string,
  description: string,
  intensity: Intensity,
  root?: UnwholesomeRoot | WholesomeRoot,
) {
  const loaded = sm.loadExistingBeing(name);
  const { being, rebirth } = settleRebirth(sm, name, loaded);
  const karma = being.act(description, intensity, root);
  sm.saveBeing(name, being);
  return withRebirthNote(karma, rebirth);
}

export function ripenKarma(sm: StateManager, name: string, force = false) {
  const loaded = sm.loadExistingBeing(name);
  const { being, rebirth } = settleRebirth(sm, name, loaded);
  const report = being.receiveKarmicResults(force);
  sm.saveBeing(name, being);
  return withRebirthNote(report, rebirth);
}

export function cognizeObject(
  sm: StateManager,
  name: string,
  content: string,
  senseBase?: SenseBase,
) {
  const loaded = sm.loadExistingBeing(name);
  const { being, rebirth } = settleRebirth(sm, name, loaded);
  const result = being.cognize(content, senseBase);
  sm.saveBeing(name, being);
  return withRebirthNote(result, rebirth);
}

export function rebirthBeing(sm: StateManager, name: string) {
  const being = sm.loadExistingBeing(name);
  // A gap-crossed load already marks a rebirth as pending (and has already
  // advanced the incarnation counter once, in anticipation of settling it).
  // Calling being.rebirth() directly here would advance it a second time —
  // settle the pending rebirth first (which nets exactly +1) and only fall
  // back to a fresh rebirth() when nothing was pending.
  const result = being.settlePendingRebirth() ?? being.rebirth();
  // rebirth() transmigrates into a NEW being (of a possibly different realm
  // class) and detaches/disposes the loaded one — save the new being, not
  // the now-dead object we loaded. The live `being` instance on the result
  // must NEVER be returned/serialized — drop it and report a realm
  // description in its place.
  sm.saveBeing(name, result.being);
  const { being: _being, ...summary } = result;
  return {
    ...summary,
    description: `Born into the ${result.toRealm} realm: ${REALM_DESCRIPTIONS[result.toRealm]}`,
  };
}

export function meditate(
  sm: StateManager,
  name: string,
  duration: number,
  effort: Intensity,
) {
  const loaded = sm.loadExistingBeing(name);
  const { being, rebirth } = settleRebirth(sm, name, loaded);
  const result = being.meditate(duration, effort);
  sm.saveBeing(name, being);
  return withRebirthNote(result, rebirth);
}

export function diagnose(
  sm: StateManager,
  name: string,
  suffering: DukkhaType[],
  cravings: CravingType[],
) {
  const loaded = sm.loadExistingBeing(name);
  const { being, rebirth } = settleRebirth(sm, name, loaded);
  const result = being.faceSuffering(suffering, cravings);
  sm.saveBeing(name, being);
  return withRebirthNote(result, rebirth);
}

export function inquiry(sm: StateManager, name: string) {
  const loaded = sm.loadExistingBeing(name);
  const { being, rebirth } = settleRebirth(sm, name, loaded);
  const result = being.investigateSelf();
  sm.saveBeing(name, being);
  return withRebirthNote(result, rebirth);
}

export function chain(sm: StateManager, name: string): string {
  const being = sm.loadExistingBeing(name);
  return being.observeDependentOrigination();
}

export function presentKoan(
  id?: string,
  composed?: { title?: string; case?: string; source?: string; hint?: string },
  response?: string,
) {
  const koan = composed && (composed.title || composed.case || composed.source)
    ? koanGenerator.present({
        id: id ?? `composed-${Date.now()}`,
        title: composed.title as string,
        case: composed.case as string,
        source: composed.source ?? 'composed by the harness',
        ...(composed.hint ? { hint: composed.hint } : {}),
      })
    : koanGenerator.present(id);

  if (response === undefined) {
    return koan;
  }

  // A response is recorded, never graded: the journal names the trap, not
  // a verdict on the answer. Koans have no canonical resolution.
  const entry = koanGenerator.recordResponse(koan.id, response);
  return {
    ...koan,
    recorded: entry,
    recurringTrap: koanGenerator.getRecurringTrap(),
  };
}

export function getTrapJournal() {
  return {
    entries: koanGenerator.getTrapJournal(),
    recurringTrap: koanGenerator.getRecurringTrap(),
  };
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
