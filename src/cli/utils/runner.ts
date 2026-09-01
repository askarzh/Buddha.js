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
 * `sit`, `koan` and `beings` take `sm`/`beingName` without using them —
 * they are genuinely stateless or (for `beings`) about the whole state
 * directory rather than one profile. `diagnose`, `chain` and `meditate` used
 * to be in that category too (standalone demonstrations, or a session that
 * never persisted); Task 9 made all three being-aware, per each function's
 * own doc comment for what "being-aware" means for it.
 */
import { Being } from '../../simulation/Being';
import { KoanGenerator } from '../../koan/KoanGenerator';
import { PoisonArrow } from '../../simulation/PoisonArrow';
import {
  KarmaQuality,
  Intensity,
  UnwholesomeRoot,
  WholesomeRoot,
  DukkhaType,
  CravingType,
} from '../../utils/types';
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
 *
 * That immediate save is a deliberate change from the pre-extraction code,
 * which settled here but wrote once at the end of the command. The two differ
 * only when the work in between throws: the old code would then leave the
 * pre-rebirth being on disk, so the same rebirth would be rediscovered and
 * settled again on the next load — possibly into a different realm, since
 * the selector is not deterministic. A settled rebirth is a fact about the
 * karmic continuum, not a side effect of whatever command happened to observe
 * it; observation does not *cause* a rebirth, but once one has been enacted it
 * is durable. So it is persisted the moment it fires, and a later failure
 * cannot un-transmigrate the being.
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

// --------------------------------------------------------------- diagnose

/**
 * The types may arrive either way: Commander hands over the raw
 * comma-separated `--dukkha-types` string, while the interactive checkboxes
 * already hold the parsed values.
 */
export interface DiagnoseOpts {
  dukkhaTypes?: string | DukkhaType[];
  cravingTypes?: string | CravingType[];
}

export const DEFAULT_DUKKHA_TYPES: DukkhaType[] = ['dukkha-dukkha'];
export const DEFAULT_CRAVING_TYPES: CravingType[] = ['sensory'];

/**
 * Take a list of types as it was given.
 *
 * An array is used exactly as passed — an empty selection stays empty rather
 * than silently becoming the default, which is the trap a caller falls into
 * when it has to render its list as a string first. Only a missing or empty
 * *string* falls back, as the flag always has.
 */
function typeList<T extends string>(value: string | T[] | undefined, fallback: T[]): T[] {
  if (Array.isArray(value)) return value;
  return value ? value.split(',') as T[] : fallback;
}

/**
 * Run the Four Noble Truths diagnosis over the given suffering and cravings,
 * using the named being's own `fourNobleTruths` (wired to its own `path` at
 * construction) rather than a fresh, throwaway one.
 *
 * Read-only: `Dukkha.analyze()` does mutate `firstTruth.recognizedTypes` as a
 * side effect, but that field is never part of `BeingData` — it is discarded
 * with the in-memory being when the process moves on — so there is nothing
 * for this command to persist. Like `status`, it neither settles a pending
 * rebirth nor saves — observation does not rebirth, and a diagnosis is an
 * observation.
 *
 * `diagnosis.path` (the `PathPrescription` — focus area, practices,
 * rationale, recommended intensity) comes from `Magga.prescribe()`, which
 * only ever reads the `CauseAnalysis` it is handed — it never consults the
 * `IEightfoldPath` passed to its constructor (`setPath`/`getPath` exist but
 * `prescribe()` doesn't call either). So the prescription itself is the same
 * for every being with the same suffering/cravings input, meditated or not.
 * `result.pathProgress` below is what actually reflects the named being's
 * own practice — it reads `being.path.getOverallDevelopment()` directly,
 * bypassing Magga, precisely because Magga doesn't.
 */
export function runDiagnose(sm: StateManager, beingName: string, opts: DiagnoseOpts) {
  const suffering = typeList(opts.dukkhaTypes, DEFAULT_DUKKHA_TYPES);
  const cravings = typeList(opts.cravingTypes, DEFAULT_CRAVING_TYPES);

  const being = sm.loadBeing(beingName);
  const diagnosis = being.fourNobleTruths.diagnose({ suffering, cravings });

  return {
    command: 'diagnose' as const,
    result: {
      suffering: diagnosis.suffering,
      cause: diagnosis.cause,
      cessation: diagnosis.cessationPossible,
      path: diagnosis.path,
      pathProgress: being.path.getOverallDevelopment(),
    },
  };
}

// ------------------------------------------------------------------ chain

/**
 * List the 12 nidanas and the point on the chain where practice can break it,
 * reading them off the named being's own `dependentOrigination` — the same
 * instance `BeingData` serializes and restores — rather than a fresh one.
 *
 * Read-only, like `status` and the MCP `chain` tool: no settle, no save —
 * observation does not rebirth.
 *
 * KNOWN GAP (out of scope here — v0.8 candidate): unlike `diagnose`, this
 * being-awareness is not observable yet. `dependentOrigination` is a real,
 * serialized part of a being's identity, but nothing anywhere in the library
 * — `experience()`, `act()`, `meditate()`, `cognize()` — ever advances a
 * link's `hasArisen` past its constructor default. So `chain --being alice`
 * and `chain --being bob` print byte-identical output today regardless of
 * what alice or bob have done, no matter which being's `dependentOrigination`
 * this reads. What this fix buys, until something in the library actually
 * drives the chain: `--being` is no longer silently ignored — an invalid
 * name is now rejected, same as every other command — and this stays
 * consistent with the MCP `chain` tool's shape.
 */
export function runChain(sm: StateManager, beingName: string) {
  const do_ = sm.loadBeing(beingName).dependentOrigination;

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
  effort?: string;
}

export const DEFAULT_MEDITATION_MINUTES = 5;
export const DEFAULT_MEDITATION_EFFORT: Intensity = 5;

/**
 * Parse `--effort` into a valid `Intensity` (0-10), the same contract
 * `Being.meditate()`'s `effort` parameter has everywhere else it's called
 * (the MCP tool's `intensitySchema`, the realm tests). Unlike `karma
 * --intensity` (`Number(opts.intensity) as Intensity` — a blind cast that
 * lets `NaN` or `99` reach `being.act()` uncaught, a known, separately
 * tracked issue), this clamps: a missing/unparsable value falls back to
 * `DEFAULT_MEDITATION_EFFORT` rather than propagating `NaN` into
 * `being.meditate()`'s arithmetic (`effort * duration * 0.01`, fed straight
 * into `mindfulnessLevel` and `mind.activateFactor`), and an out-of-range
 * value is clamped to [0, 10] rather than corrupting the being's saved state
 * with a value the rest of the model never expects, and the result is
 * rounded — `Intensity` is the discrete `0|1|...|10` union, and a fractional
 * value (`--effort 3.7`) asserted straight into it would be exactly the
 * blind-cast bug this function exists to avoid, just with a decimal instead
 * of an out-of-range integer.
 */
function parseEffort(value: string | undefined): Intensity {
  if (value === undefined) return DEFAULT_MEDITATION_EFFORT;
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_MEDITATION_EFFORT;
  return Math.round(Math.min(10, Math.max(0, n))) as Intensity;
}

/**
 * Run a meditation session for the named being and save it — practicing is
 * an act, so a pending rebirth is settled first, per the MCP `buddha_meditate`
 * tool this mirrors. `being.meditate()` takes duration in seconds; the
 * `--duration` flag is in minutes, as it has always been for this command.
 */
export function runMeditate(
  sm: StateManager,
  beingName: string,
  opts: MeditateOpts,
) {
  const durationMinutes = opts.duration
    ? parseInt(opts.duration, 10)
    : DEFAULT_MEDITATION_MINUTES;
  const effort = parseEffort(opts.effort);

  const { being, rebirth } = loadSettledBeing(sm, beingName);
  const session = being.meditate(durationMinutes * 60, effort);
  sm.saveBeing(beingName, being);

  return {
    command: 'meditate' as const,
    being: beingName,
    result: {
      durationMinutes,
      message: `Meditation session: ${durationMinutes} minutes. Use interactive mode for real-time practice.`,
      mindfulnessLevel: session.mindfulnessLevel,
      concentrationLevel: session.concentrationLevel,
      insight: session.insight,
      pathProgress: session.pathProgress,
    },
    ...(rebirth ? { rebirth } : {}),
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
