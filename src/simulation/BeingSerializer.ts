/**
 * BeingSerializer - Serialization/Deserialization for Being
 *
 * Extracted from Being.toJSON() and Being.fromJSON() to keep
 * the Being class focused on domain logic.
 */

import { Being } from './Being';
import { REALM_CLASSES } from './realms';
import { Karma } from '../karma/Karma';
import { Intention } from '../karma/Intention';
import { KarmicStore } from '../karma/KarmicEventSystem';
import { ProcessedExperience } from '../five-aggregates/FiveAggregates';
import {
  BeingData,
  PathData,
  MindData,
  NidanaChainData,
  KarmaData,
  UnwholesomeRoot,
  WholesomeRoot,
  SenseBase,
} from '../utils/types';

/**
 * Serialize a Being to a plain JSON-compatible object.
 */
export function serializeBeing(being: Being): BeingData {
  const pathFactors = being.path.getAllFactors();
  const path: PathData = {
    factors: pathFactors.map(f => ({
      name: f.name,
      developmentLevel: f.developmentLevel,
      isActive: f.isActive,
      hasArisen: f.hasArisen,
      hasCeased: f.hasCeased,
    })),
  };

  const mindFactorKeys = [
    'contact', 'feeling', 'perception', 'intention', 'attention',
    'greed', 'aversion', 'delusion',
    'mindfulness', 'equanimity', 'compassion', 'wisdom',
  ];
  const mindFactors: MindData['factors'] = [];
  for (const key of mindFactorKeys) {
    const factor = being.mind.getFactor(key);
    if (factor) {
      mindFactors.push({
        key,
        name: factor.name,
        sanskritName: factor.sanskritName,
        quality: factor.quality,
        intensity: factor.intensity,
        isActive: factor.isActive,
      });
    }
  }
  const mindState = being.mind.getState();
  const mind: MindData = {
    factors: mindFactors,
    clarity: mindState.clarity,
    stability: mindState.stability,
  };

  const chainState = being.dependentOrigination.getChainState();
  const dependentOrigination: NidanaChainData = {
    links: chainState.map(l => ({
      position: l.position,
      name: l.name,
      hasArisen: l.hasArisen,
      hasCeased: false,
      isBroken: l.isBroken,
    })),
  };

  const karmicStreamData: KarmaData[] = being.getKarmicStream().map(k => ({
    id: k.id,
    description: k.intention.description,
    quality: k.quality,
    intensity: k.intensity,
    root: k.intention.root,
    isCompleted: k.isCompleted,
    hasManifested: k.hasManifested,
  }));

  const snapshot = being.aggregates.getSnapshot();

  // Use Infinity to get ALL experiences (slice(-Infinity) returns the full array)
  const allExperiences = being.getExperienceHistory(Infinity);

  return {
    mindfulnessLevel: being.mindfulnessLevel,
    karmicStream: karmicStreamData,
    experienceHistory: allExperiences.map(e => ({
      input: {
        senseBase: e.input.senseBase,
        object: e.input.object,
        intensity: e.input.intensity,
        valence: e.input.valence,
      },
      label: e.label,
      feelingTone: e.feelingTone,
      reactions: [...e.reactions],
      timestamp: e.timestamp,
    })),
    aggregates: {
      form: { ...snapshot.form } as Record<string, unknown>,
      feeling: { ...snapshot.feeling } as Record<string, unknown>,
      perception: { ...snapshot.perception } as Record<string, unknown>,
      mentalFormations: {
        dominantQuality: snapshot.mentalFormations.dominantQuality,
        overallIntensity: snapshot.mentalFormations.overallIntensity,
        activeFactors: snapshot.mentalFormations.activeFactors.map(f => ({
          name: f.name,
          quality: f.quality,
          intensity: f.intensity,
          active: f.active,
        })),
      } as Record<string, unknown>,
      consciousness: {
        activeTypes: Array.from(snapshot.consciousness.activeTypes),
        primaryFocus: snapshot.consciousness.primaryFocus,
        clarity: snapshot.consciousness.clarity,
      } as Record<string, unknown>,
    },
    path,
    mind,
    dependentOrigination,
    karmicStore: being.karmicStore.toJSON(),
    incarnation: being.incarnation,
    // Refreshed on every serialization; deserializeBeing compares this
    // against the wall clock at load time to detect a rebirth-worthy gap.
    lastActiveAt: Date.now(),
    realm: being.realm,
  };
}

/**
 * Restore a Being from serialized data.
 */
export function deserializeBeing(data: BeingData): Being {
  // Factory: legacy saves (no `realm` field) predate typed rebirth and
  // default to 'human', matching the pre-realm class (Being/HumanBeing are
  // behaviorally identical — HumanBeing overrides nothing).
  const RealmClass = REALM_CLASSES[data.realm ?? 'human'];
  const being = new RealmClass();

  // Restore path factor development levels
  const factorMap = new Map(being.path.getAllFactors().map(f => [f.name, f]));
  for (const fd of data.path.factors) {
    const factor = factorMap.get(fd.name);
    if (factor) {
      factor.reset();
      if (fd.hasArisen || fd.isActive) {
        factor.activate();
      }
      // Direct assignment to protected fields for deserialization
      (factor as any)._developmentLevel = fd.developmentLevel;
      (factor as any)._hasArisen = fd.hasArisen;
      (factor as any)._hasCeased = fd.hasCeased;
    }
  }

  // Restore mind factors
  for (const mf of data.mind.factors) {
    const factor = being.mind.getFactor(mf.key);
    if (factor) {
      if (mf.isActive) {
        factor.activate(mf.intensity);
      } else {
        factor.deactivate();
      }
    }
  }
  being.mind.setClarity(data.mind.clarity);
  being.mind.setStability(data.mind.stability);

  // Restore dependent origination
  const links = being.dependentOrigination.links;
  for (const ld of data.dependentOrigination.links) {
    const link = links[ld.position - 1];
    if (link) {
      link.restoreLink();
      if (ld.hasArisen) (link as any)._hasArisen = true;
      if (ld.hasCeased) (link as any)._hasCeased = true;
      if (ld.isBroken) (link as any)._isBroken = true;
    }
  }

  // Restore karmic stream
  const karmicStream: Karma[] = data.karmicStream.map(kd => {
    const intention = new Intention(
      kd.description,
      kd.intensity,
      kd.root === 'neutral' ? undefined : kd.root as UnwholesomeRoot | WholesomeRoot
    );
    const karma = new Karma(intention, kd.intensity);
    if (kd.isCompleted) karma.complete();
    if (kd.hasManifested) karma.manifest();
    return karma;
  });

  // Restore experience history
  const experienceHistory: ProcessedExperience[] = data.experienceHistory.map(e => ({
    input: {
      senseBase: e.input.senseBase as SenseBase,
      object: e.input.object,
      intensity: e.input.intensity,
      valence: e.input.valence,
    },
    label: e.label,
    feelingTone: e.feelingTone,
    reactions: [...e.reactions],
    timestamp: e.timestamp,
  }));

  // Restore the karmic seed ledger (legacy saves omit this field, so the
  // being keeps its freshly-constructed, empty store in that case).
  let karmicStore: KarmicStore | undefined;
  if (data.karmicStore) {
    karmicStore = KarmicStore.fromJSON(data.karmicStore);
    // fromJSON honors the persisted config, which may have restarted the
    // auto-ripening interval — Being never runs a ripening timer.
    karmicStore.stopRipeningCheck();
  }

  // Incarnation-window gap detection: a load that arrives more than
  // BUDDHA_INCARNATION_GAP_MS after the save was written advances the
  // incarnation once, as if time itself carried the being into a new life.
  // Legacy saves (no lastActiveAt) default to "now", producing a ~0 elapsed
  // gap so no spurious increment occurs; legacy saves (no incarnation)
  // default to 1.
  const gapMs = Number(process.env.BUDDHA_INCARNATION_GAP_MS ?? 21600000);
  let incarnation = data.incarnation ?? 1;
  // Observation does not rebirth: crossing the gap only marks a rebirth as
  // DUE (pendingRebirth) — it never runs rebirth() itself. The incarnation
  // counter still advances here (it drives seed-window eligibility), but no
  // karmic transmigration, realm reselection, or faculty vipāka happens
  // until a caller explicitly invokes Being.settlePendingRebirth().
  let pendingRebirth = false;
  // A legacy save has no lastActiveAt at all — there is no prior timestamp
  // to measure a gap against, so it NEVER triggers an incarnation advance,
  // regardless of gapMs (including gapMs=0). Only compare against the gap
  // when the save actually recorded when it was written.
  if (data.lastActiveAt !== undefined) {
    // >= rather than a strict > : with the default gapMs (6h) the boundary
    // is never observable in practice, but BUDDHA_INCARNATION_GAP_MS=0
    // (used to force a rebirth-on-load deterministically, e.g. in tests)
    // needs an elapsed-time-of-zero to still count as "past the gap".
    const elapsed = Date.now() - data.lastActiveAt;
    if (elapsed >= gapMs) {
      incarnation += 1;
      pendingRebirth = true;
    }
  }

  // Use _restoreState to set private fields
  being._restoreState({
    mindfulnessLevel: data.mindfulnessLevel,
    karmicStream,
    experienceHistory,
    karmicStore,
    incarnation,
    pendingRebirth,
  });

  return being;
}
