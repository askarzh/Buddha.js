/**
 * Command bodies, extracted from the Commander action handlers.
 *
 * Every `buddha` command already had a non-interactive `--json` path; this
 * module holds that path as a plain function so it can be called and asserted
 * without a TTY, a Commander instance, or stdout parsing. Each function takes
 * a `StateManager`, the being name, and the command's parsed options, and
 * returns exactly the object the `--json` branch prints. The command files are
 * thin wrappers that print the result (JSON) or format it (interactive).
 *
 * Some functions take `sm`/`beingName` without using them: `meditate` never
 * persists, and `diagnose`/`chain` are standalone demonstrations that ignore
 * the named being. The signature is uniform so that making those being-aware
 * is a change of body, not of call sites.
 */
import { Being } from '../../simulation/Being';
import { KoanGenerator } from '../../koan/KoanGenerator';
import { PoisonArrow } from '../../simulation/PoisonArrow';
import { DependentOrigination } from '../../dependent-origination/DependentOrigination';
import { KarmaQuality, Intensity, UnwholesomeRoot, WholesomeRoot } from '../../utils/types';
import { StateManager } from './state';

export interface RebirthInfo {
  fromRealm: string;
  toRealm: string;
  incarnation: number;
}

/**
 * Load a being and settle any rebirth that came due while it was on disk.
 *
 * Observation-on-load only detects that a rebirth is due; it never enacts it.
 * Handlers that save must settle first — so when one fires here, the
 * newly-transmigrated being is persisted immediately and returned in place of
 * the loaded one.
 */
export function loadSettledBeing(
  sm: StateManager,
  beingName: string,
): { being: Being; rebirth?: RebirthInfo } {
  const loaded = sm.loadBeing(beingName);
  const settled = loaded.settlePendingRebirth();
  if (!settled) return { being: loaded };
  sm.saveBeing(beingName, settled.being);
  return {
    being: settled.being,
    rebirth: {
      fromRealm: settled.fromRealm,
      toRealm: settled.toRealm,
      incarnation: settled.incarnation,
    },
  };
}

// ------------------------------------------------------------------ chain

/**
 * List the 12 nidanas and the point on the chain where practice can break it.
 *
 * NOTE: this is a standalone demonstration — it builds a fresh
 * DependentOrigination and ignores `sm`/`beingName` entirely, so `--being`
 * has no effect on the output today.
 */
export function runChain(_sm: StateManager, _beingName: string) {
  const do_ = new DependentOrigination();

  return {
    command: 'chain' as const,
    result: {
      links: do_.links.map((link, i) => ({
        position: i + 1,
        name: link.name,
        sanskritName: link.sanskritName,
      })),
      liberationPoint: do_.practiceAtLiberationPoint(),
    },
  };
}

// ---------------------------------------------------------------- inquiry

/**
 * Investigate the named being's sense of self, and save — investigating is an
 * act, so a pending rebirth is settled first.
 */
export function runInquiry(sm: StateManager, beingName: string) {
  const { being, rebirth } = loadSettledBeing(sm, beingName);

  const result = being.investigateSelf();
  sm.saveBeing(beingName, being);
  const state = being.getState();

  return {
    command: 'inquiry' as const,
    being: beingName,
    result: {
      selfFound: result.aggregateSearch.selfFound,
      aggregatesExamined: result.aggregateSearch.aggregatesExamined.map(a => a.aggregate),
      conclusion: result.aggregateSearch.conclusion,
      dependentOriginationInsight: result.dependentOriginationInsight,
      emptinessInsight: result.emptinessInsight ? {
        phenomenon: result.emptinessInsight.phenomenon,
        hasInherentExistence: result.emptinessInsight.hasInherentExistence,
        dependsOn: result.emptinessInsight.dependsOn,
      } : null,
      overallConclusion: result.conclusion,
    },
    state: { mindfulness: state.mindfulnessLevel, karmicActions: state.pendingKarma },
    ...(rebirth ? { rebirth } : {}),
  };
}

// ------------------------------------------------------------------ reset

/**
 * Overwrite the named being with a fresh one. No pending rebirth is settled:
 * whatever was there is discarded, not transmigrated.
 */
export function runReset(sm: StateManager, beingName: string) {
  sm.saveBeing(beingName, new Being());
  return {
    command: 'reset' as const,
    being: beingName,
    result: { reset: true },
  };
}

// ----------------------------------------------------------------- beings

/**
 * List every saved being. `beingName` is unused — this command is about the
 * whole state directory, not one profile.
 */
export function runBeings(sm: StateManager, _beingName?: string) {
  const names = sm.listBeings();
  return {
    command: 'beings' as const,
    result: { beings: names, count: names.length },
  };
}

/** Delete a saved being. Deleting one that does not exist is not an error. */
export function runBeingsDelete(sm: StateManager, beingName: string) {
  sm.deleteBeing(beingName);
  return {
    command: 'beings delete' as const,
    result: { deleted: beingName },
  };
}

// -------------------------------------------------------------------- sit

export interface SitOpts {
  situation?: string;
}

/**
 * Walk the Poison Arrow cessation to completion and report every stage.
 * Stateless: no being is loaded and nothing is saved.
 */
export function runSit(_sm: StateManager, _beingName: string, opts: SitOpts) {
  const suffering = opts.situation || 'unspecified suffering';
  const sim = new PoisonArrow(suffering);
  const steps = [];
  while (!sim.isComplete()) {
    const step = sim.step();
    steps.push({
      stage: step.stage,
      truth: step.truth,
      insight: step.insight,
      guidance: step.guidance,
    });
  }

  return {
    command: 'sit' as const,
    result: {
      suffering,
      steps,
      summary: sim.getSummary(),
    },
  };
}

// ------------------------------------------------------------------- koan

export interface KoanOpts {
  id?: string;
}

/**
 * Present a koan — the one named by `--id`, or a random one. Stateless: no
 * being is loaded and nothing is saved.
 */
export function runKoan(_sm: StateManager, _beingName: string, opts: KoanOpts) {
  const generator = new KoanGenerator();
  const k = opts.id ? generator.present(opts.id) : generator.present();

  return {
    command: 'koan' as const,
    result: {
      id: k.id,
      title: k.title,
      case: k.case,
      source: k.source,
      hint: k.hint ?? null,
    },
  };
}

// --------------------------------------------------------------- meditate

export interface MeditateOpts {
  interval?: string;
  duration?: string;
}

export const DEFAULT_MEDITATION_MINUTES = 5;

/**
 * Resolve a meditation session's parameters.
 *
 * NOTE: this does not run a session and does not persist anything — the
 * `--json` path has always been a description of the session the interactive
 * path would run. `sm` and `beingName` are unused for that reason.
 */
export function runMeditate(
  _sm: StateManager,
  _beingName: string,
  opts: MeditateOpts,
) {
  const durationMinutes = opts.duration
    ? parseInt(opts.duration, 10)
    : DEFAULT_MEDITATION_MINUTES;

  return {
    command: 'meditate' as const,
    result: {
      durationMinutes,
      message: `Meditation session: ${durationMinutes} minutes. Use interactive mode for real-time practice.`,
    },
  };
}

// ----------------------------------------------------------------- status

/**
 * Report a being's current state. Read-only: `status` neither settles a
 * pending rebirth nor saves — observation does not rebirth.
 */
export function runStatus(sm: StateManager, beingName: string) {
  const being = sm.loadBeing(beingName);
  const state = being.getState();

  return {
    command: 'status' as const,
    being: beingName,
    result: {
      pathProgress: state.pathProgress,
      mindfulnessLevel: state.mindfulnessLevel,
      pendingKarma: state.pendingKarma,
      experienceCount: state.experienceCount,
      mindState: {
        isCalm: state.mindState.isCalm,
        isFocused: state.mindState.isFocused,
        dominantFactors: state.mindState.dominantFactors,
      },
    },
    state: { mindfulness: state.mindfulnessLevel, karmicActions: state.pendingKarma },
    seeds: being.getSeedStats(),
  };
}

// ------------------------------------------------------------------ karma

export interface KarmaOpts {
  quality?: string;
  description?: string;
  intensity?: string;
  root?: string;
}

export interface KarmaSeedView {
  quality: KarmaQuality;
  intensity: number;
  description: string;
  state: string;
  potency: number;
}

export interface KarmaResult {
  command: 'karma';
  being: string;
  result: {
    karmicSeeds: KarmaSeedView[];
    totalActions: number;
  };
  state: { mindfulness: number; karmicActions: number };
  rebirth?: RebirthInfo;
}

export interface KarmaError {
  error: string;
}

const UNWHOLESOME_ROOTS: UnwholesomeRoot[] = ['greed', 'aversion', 'delusion'];

export function deriveQuality(root: UnwholesomeRoot | WholesomeRoot): KarmaQuality {
  return UNWHOLESOME_ROOTS.includes(root as UnwholesomeRoot) ? 'unwholesome' : 'wholesome';
}

export function isKarmaError(result: KarmaResult | KarmaError): result is KarmaError {
  return 'error' in result;
}

/**
 * Plant a karmic seed (when description, intensity and root are all given)
 * and report the being's karmic seeds. Saves whenever it acts, and whenever a
 * pending rebirth settles.
 */
export function runKarma(
  sm: StateManager,
  beingName: string,
  opts: KarmaOpts,
): KarmaResult | KarmaError {
  const { being, rebirth } = loadSettledBeing(sm, beingName);

  if (opts.description && opts.intensity && opts.root) {
    const intensity = Number(opts.intensity) as Intensity;
    const root = opts.root as WholesomeRoot | UnwholesomeRoot;

    if (opts.quality) {
      const derivedQuality = deriveQuality(root);
      if (opts.quality !== derivedQuality) {
        return {
          error: `Quality '${opts.quality}' contradicts root '${root}' — quality is determined by the root`,
        };
      }
    }

    being.act(opts.description, intensity, root);
    sm.saveBeing(beingName, being);
  }

  const seeds = being.karmicStore.getSeeds();
  const state = being.getState();

  return {
    command: 'karma',
    being: beingName,
    result: {
      // `karmicStream` until 0.6.0, when the duplicate stream record of every
      // act was removed; these are the seeds those acts planted.
      karmicSeeds: seeds.map(seed => ({
        quality: seed.quality,
        intensity: seed.intentionStrength,
        description: seed.description,
        state: seed.state,
        potency: seed.potency,
      })),
      totalActions: seeds.length,
    },
    state: { mindfulness: state.mindfulnessLevel, karmicActions: state.pendingKarma },
    ...(rebirth ? { rebirth } : {}),
  };
}
