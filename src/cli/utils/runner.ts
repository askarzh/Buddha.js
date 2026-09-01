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
