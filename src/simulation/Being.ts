/**
 * Being - A Sentient Being Simulation
 *
 * This class integrates all Buddhist concepts to simulate
 * a sentient being - composed of aggregates, subject to
 * dependent origination, capable of practicing the path.
 */

import { FiveAggregates, SensoryInput, ProcessedExperience, SelfInquiryResult } from '../five-aggregates/FiveAggregates';
import { EightfoldPath } from '../eightfold-path/EightfoldPath';
import { PathFactor } from '../eightfold-path/PathFactor';
import { DependentOrigination } from '../dependent-origination/DependentOrigination';
import { FourNobleTruths, Diagnosis } from '../four-noble-truths/FourNobleTruths';
import { Karma } from '../karma/Karma';
import { Intention } from '../karma/Intention';
import { KarmicResult } from '../karma/KarmicResult';
import { KarmicStore, KarmicVipaka, RipeningCondition, KarmicSeed, RipeningTiming } from '../karma/KarmicEventSystem';
import { Sunyata, EmptinessInsight } from '../emptiness/Sunyata';
import { Mind } from '../mind/Mind';
import { Citta, Ārammaṇa, CittaMoment } from '../mind/Citta';
import { Intensity, DukkhaType, CravingType, UnwholesomeRoot, WholesomeRoot, KarmaQuality, BeingData, Serializable, SenseBase, CittaDoor, CittaQuality, Realm, FeelingTone } from '../utils/types';
import { serializeBeing, deserializeBeing } from './BeingSerializer';

/**
 * Result of meditation practice
 */
export interface MeditationResult {
  mindfulnessLevel: Intensity;
  concentrationLevel: Intensity;
  insight: string | null;
  pathProgress: number;
}

/**
 * Result of self investigation
 */
export interface SelfInvestigationResult {
  aggregateSearch: SelfInquiryResult;
  dependentOriginationInsight: string;
  emptinessInsight: EmptinessInsight | null;
  conclusion: string;
}

/**
 * Report produced by receiveKarmicResults(): legacy karmic-stream results,
 * any karmic-store seeds that ripened, and an explanation of why the
 * remaining active seeds did not ripen this pass.
 */
export interface KarmicResultsReport {
  results: KarmicResult[];
  seedVipakas: KarmicVipaka[];
  whyNot: Array<{ seedId: string; description: string; unmet: string[] }>;
}

/**
 * Result of Being.rebirth(): the incarnation moved into, how many ahosi
 * (timed-out) seeds were expired in the transition, and which active seed
 * (if any) shapes the new incarnation.
 */
export interface RebirthResult {
  incarnation: number;
  expiredSeeds: number;
  shapingSeed: { id: string; description: string; reason: 'weighty' | 'habitual' | 'reserve' } | null;
  /** The realm the dying being inhabited. */
  fromRealm: Realm;
  /** The realm selected for the new incarnation (see `selectRealm`). */
  toRealm: Realm;
  /**
   * The NEW being — of the `toRealm` class — that this transmigration
   * produced. Only the karmic continuum (`karmicStore` + incarnation
   * counter) passes from the dying being; everything else (path, mind,
   * experience history) is a fresh arising. The dying being (`this`) is
   * detached from the continuum and disposed; callers must switch to
   * `being` for anything after rebirth().
   */
  being: Being;
}

/**
 * Result of Being.cognize(): the full moment stream produced by the citta-
 * vīthi, the overall javana quality, the resulting karmic impact, and the
 * (at most three) karmic seeds planted from the javana moments.
 */
export interface CognitionResult {
  moments: CittaMoment[];
  quality: CittaQuality;
  karmicImpact: 'strong' | 'weak' | 'none';
  seedsPlanted: Array<{ id: string; timing: string; strength: string; quality: KarmaQuality }>;
}

/**
 * Response to facing suffering
 */
export interface SufferingResponse {
  acknowledged: boolean;
  diagnosis: Diagnosis;
  response: string;
  nextStep: string;
}

/**
 * Current state of the being
 */
export interface BeingState {
  aggregatesSnapshot: ReturnType<FiveAggregates['getSnapshot']>;
  pathProgress: number;
  mindfulnessLevel: Intensity;
  pendingKarma: number;
  experienceCount: number;
  mindState: ReturnType<Mind['getState']>;
}

/**
 * Being - A sentient being composed of the five aggregates
 */
export class Being implements Serializable<BeingData> {
  /** The five aggregates that constitute the "person" */
  readonly aggregates: FiveAggregates;

  /** The Noble Eightfold Path being developed */
  readonly path: EightfoldPath;

  /** Dependent origination chain */
  readonly dependentOrigination: DependentOrigination;

  /** The Four Noble Truths framework */
  readonly fourNobleTruths: FourNobleTruths;

  /** Emptiness analyzer */
  readonly emptiness: Sunyata;

  /** Mind with mental factors */
  readonly mind: Mind;

  /**
   * Consciousness (Abhidhamma model) driving the citta-vīthi cognitive
   * process. Fresh per instance, synced from `mind` before each cognize()
   * call, and never serialized — a new Citta is always created in the
   * constructor, including on deserialization.
   */
  readonly citta: Citta;

  /**
   * Karmic seed ledger. Auto-ripening is always disabled here — Being drives
   * karmic ripening explicitly via receiveKarmicResults(), never a timer.
   */
  readonly karmicStore: KarmicStore;

  /** Stream of karma */
  private karmicStream: Karma[] = [];

  /** History of experiences */
  private experienceHistory: ProcessedExperience[] = [];

  /** Current mindfulness level */
  private _mindfulnessLevel: Intensity = 0;

  /**
   * Incarnation counter. Starts at 1; advances via rebirth() (explicit) or
   * BeingSerializer's gap detection on load (implicit, when the elapsed
   * wall-clock time since the last save exceeds BUDDHA_INCARNATION_GAP_MS).
   */
  private _incarnation = 1;

  /** Sense-door mapping for cognize(): SenseBase -> Citta's Pali door enum. */
  private static readonly senseDoors: Record<Exclude<SenseBase, 'mind'>, CittaDoor> = {
    eye: 'cakkhu-dvāra',
    ear: 'sota-dvāra',
    nose: 'ghāna-dvāra',
    tongue: 'jivhā-dvāra',
    body: 'kāya-dvāra',
  };

  constructor() {
    this.aggregates = new FiveAggregates();
    this.path = new EightfoldPath();
    this.dependentOrigination = new DependentOrigination();
    this.fourNobleTruths = new FourNobleTruths(this.path);
    this.emptiness = new Sunyata();
    this.mind = new Mind();
    this.citta = new Citta();
    this.karmicStore = new KarmicStore({ enableAutoRipening: false });
    this.registerRipeningConditions();
  }

  /**
   * Register the named ripening conditions used by seeds planted via act().
   * Must be re-run (followed by karmicStore.rebindConditions()) whenever
   * karmicStore is replaced — e.g. after deserialization — since the check
   * functions on a restored store's seeds are dead stubs until rebound.
   */
  private registerRipeningConditions(): void {
    this.karmicStore.registerCondition(
      'mindfulness-support',
      () => this.mindfulnessLevel >= 5
    );
    // Legacy fallback for seeds serialized before per-slug condition names
    // existed (plain 'habitual-accumulation', no ':<slug>' suffix). Excludes
    // structural tags — 'act'/'cognize', the incarnation marker, and the
    // seed's own root — so the count reflects description-derived groupings
    // only, not every seed sharing a process-kind or root tag.
    this.karmicStore.registerCondition('habitual-accumulation', () => {
      const tagCounts = new Map<string, number>();
      for (const seed of this.karmicStore.getSeeds()) {
        for (const tag of seed.tags) {
          if (
            tag === 'act' ||
            tag === 'cognize' ||
            tag === seed.root ||
            tag.startsWith('incarnation:')
          ) {
            continue;
          }
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
      }
      return Array.from(tagCounts.values()).some(count => count >= 3);
    });

    // Per-slug habitual conditions: seeds planted after this fix carry a
    // condition named 'habitual-accumulation:<slug>' whose check closure is
    // NOT serializable, so on restore it's a dead stub until we re-register
    // one closure per distinct slug actually present in the restored store.
    const slugs = new Set<string>();
    for (const seed of this.karmicStore.getSeeds()) {
      for (const condition of seed.ripeningConditions) {
        if (condition.name?.startsWith('habitual-accumulation:')) {
          slugs.add(condition.name.slice('habitual-accumulation:'.length));
        }
      }
    }
    for (const slug of slugs) {
      this.karmicStore.registerCondition(
        `habitual-accumulation:${slug}`,
        () => this.countDistinctPlantings(slug) >= 3
      );
    }
  }

  /**
   * The realm of rebirth (gati) this being currently inhabits. Base `Being`
   * (and `HumanBeing`) is 'human'; realm subclasses override this getter.
   */
  get realm(): Realm {
    return 'human';
  }

  /**
   * Soft modifier: multiplies effort-driven gains during meditate() — both
   * path factor practice increments and the mindfulness-level gain. Neutral
   * default (1) leaves meditate() bit-identical to pre-realm behavior.
   */
  protected meditationGainFactor(): number {
    return 1;
  }

  /**
   * Soft modifier: the ceiling rightView's developmentLevel may reach via
   * practicePathFactor(). Neutral default (10) matches PathFactor's own
   * internal maximum, so it never actually constrains anything for base
   * Being/HumanBeing.
   */
  protected wisdomCap(): Intensity {
    return 10;
  }

  /**
   * Soft modifier: added to the intensity of the unwholesome mental factor
   * (mirrored onto `mind`) activated by an experience() reaction. Neutral
   * default (0) means experience() never touches `mind` for base Being.
   */
  protected unwholesomeReactionBoost(): number {
    return 0;
  }

  /**
   * Soft modifier: added to the intensity of unpleasant-valence experience
   * inputs before they reach the aggregates. Neutral default (0) leaves
   * experience() bit-identical to pre-realm behavior.
   */
  protected unpleasantIntensityShift(): number {
    return 0;
  }

  /**
   * Experience something through the senses
   */
  experience(input: SensoryInput): ProcessedExperience {
    const shift = this.unpleasantIntensityShift();
    const adjustedInput = input.valence === 'unpleasant' && shift !== 0
      ? { ...input, intensity: input.intensity + shift }
      : input;

    const processed = this.aggregates.processExperience(adjustedInput);
    this.experienceHistory.push(processed);

    // Soft modifier: realms with a reaction boost run the same reaction
    // hotter by mirroring a boosted-intensity activation of the reacting
    // unwholesome factor onto `mind`. SamskaraAggregate.react() has a fixed
    // internal intensity (5, or 3 for restlessness) and can't accept a
    // boost without changing its signature, so this is applied out-of-band
    // on Being.mind instead of on aggregates.mentalFormations — see
    // task-1-report.md for the documented reasoning.
    const boost = this.unwholesomeReactionBoost();
    if (boost !== 0) {
      this.applyReactionBoost(processed.feelingTone, boost);
    }

    // If mindfulness is high, add mindful observation
    if (this._mindfulnessLevel > 5) {
      processed.reactions.push('mindful observation without automatic reaction');
    }

    return processed;
  }

  /**
   * Mirror SamskaraAggregate.react()'s reaction mapping onto `mind`, with
   * the realm's reaction boost added to the base intensity react() would
   * have used internally (5 for greed/aversion, 3 for restlessness).
   */
  private applyReactionBoost(feelingTone: FeelingTone, boost: number): void {
    const factorName = feelingTone === 'pleasant'
      ? 'greed'
      : feelingTone === 'unpleasant'
        ? 'aversion'
        : 'restlessness';
    const baseIntensity = feelingTone === 'neutral' ? 3 : 5;
    const boosted = Math.min(10, Math.max(0, baseIntensity + boost)) as Intensity;
    this.mind.activateFactor(factorName, boosted);
  }

  /**
   * Practice a path factor through Being, applying wisdomCap() as a ceiling
   * on rightView specifically. PathFactor has no setter for developmentLevel
   * (only reset() to zero), so the cap is enforced by pre-limiting the
   * effort passed to practice() rather than clamping the result — this
   * duplicates PathFactor.practice()'s internal `effort * 0.15` increment
   * formula, a documented coupling accepted so PathFactor itself is never
   * edited (see task-1-report.md).
   */
  private practicePathFactor(factor: PathFactor, effort: Intensity): Intensity {
    if (factor === this.path.rightView) {
      const cap = this.wisdomCap();
      const current = factor.developmentLevel;
      if (current >= cap) {
        return current;
      }
      const room = cap - current;
      const maxEffort = room / 0.15;
      effort = Math.min(effort, maxEffort) as Intensity;
    }
    return factor.practice(effort);
  }

  /**
   * Perform an intentional action (creates karma).
   * Quality is determined by the root motivation — "greed is a root of the
   * unwholesome... non-greed is a root of the wholesome" (M. I.46-47) — and
   * cannot be assigned independently of it.
   */
  act(
    description: string,
    intensity: Intensity,
    root?: UnwholesomeRoot | WholesomeRoot
  ): Karma {
    const intention = new Intention(description, intensity, root);
    const karma = new Karma(intention, intensity);
    karma.complete();
    this.karmicStream.push(karma);
    this.plantSeedFromAct(description, intensity, root);
    return karma;
  }

  /**
   * Dual-write path: alongside the legacy karmicStream entry, plant a
   * karmic seed in the KarmicStore. Quality is derived from the root
   * (never caller-supplied) using the same rule as Intention.determineQuality:
   * greed/aversion/delusion -> unwholesome, other roots -> wholesome,
   * no root -> neutral.
   */
  private plantSeedFromAct(
    description: string,
    intensity: Intensity,
    root?: UnwholesomeRoot | WholesomeRoot
  ): void {
    const unwholesomeRoots: UnwholesomeRoot[] = ['greed', 'aversion', 'delusion'];
    const quality: KarmaQuality = !root
      ? 'neutral'
      : unwholesomeRoots.includes(root as UnwholesomeRoot)
        ? 'unwholesome'
        : 'wholesome';

    const slug = Being.slugify(description);

    this.karmicStore.plantSeed({
      quality,
      description,
      intentionStrength: intensity,
      ...(root ? { root } : {}),
      potency: intensity * 7,
      ripeningTiming: 'deferred',
      minDelay: 0,
      maxDelay: Number.MAX_SAFE_INTEGER,
      tags: [root ?? 'neutral', 'act', slug, `incarnation:${this._incarnation}`],
      conditions: this.buildSeedConditions(quality, slug),
    });
  }

  /**
   * Ripening conditions shared by every seed Being plants: habitual-
   * accumulation is attached to every seed; mindfulness-support only to
   * wholesome seeds. Both closures are seed-specific at plant time; the
   * identically-named conditions registered in registerRipeningConditions()
   * are the generic fallbacks used after rebindConditions() restores a seed
   * from serialized data.
   */
  private buildSeedConditions(quality: KarmaQuality, slug: string): RipeningCondition[] {
    const conditions: RipeningCondition[] = [
      {
        type: 'accumulation',
        // Per-slug name so restore-time rebinding (registerRipeningConditions)
        // can register a closure scoped to THIS slug, instead of the v0.2
        // store-wide fallback that made every seed's condition true together.
        name: `habitual-accumulation:${slug}`,
        description: 'three or more similar actions',
        weight: 0.5,
        check: () => this.countDistinctPlantings(slug) >= 3,
      },
    ];
    if (quality === 'wholesome') {
      conditions.push({
        type: 'state',
        name: 'mindfulness-support',
        description: 'mindfulness level at least 5',
        weight: 0.5,
        check: () => this.mindfulnessLevel >= 5,
      });
    }
    return conditions;
  }

  /**
   * Count distinct planting events (by `createdAt`) among seeds tagged with
   * `slug`. A single citta-vīthi (cognize() or act()) plants multiple seeds
   * sharing one slug and one `createdAt`, so this counts repeated ACTIONS
   * (āciṇṇa-kamma: habitually repeated action), not raw seed count — one
   * cognition/action must not, by itself, look "habitual".
   */
  private countDistinctPlantings(slug: string): number {
    const createdAts = new Set(this.karmicStore.getSeedsByTag(slug).map(seed => seed.createdAt));
    return createdAts.size;
  }

  /**
   * The description slug for a seed, derived from its tags — excludes the
   * process-kind tags ('act', 'cognize'), the karmic root, and the
   * incarnation tag, leaving the actual description-derived slug.
   *
   * Falls back to the seed's own `id` when no description-derived tag
   * remains (e.g. a description that slugifies to a structural tag name
   * like "act", so `t !== 'act'` filters it out too) — the id is unique,
   * so such a seed simply never groups with others as "habitual" instead
   * of crashing downstream callers that assume a string.
   */
  /**
   * Turn free text into a tag-safe slug: lowercase, non-alphanumeric runs
   * collapsed to a single dash, leading/trailing dashes trimmed (so e.g.
   * "act!" doesn't produce a trailing-dash slug distinct from "act").
   */
  private static slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private slugOf(seed: KarmicSeed): string {
    return (
      seed.tags.find(
        t => t !== 'act' && t !== 'cognize' && t !== seed.root && !t.startsWith('incarnation:')
      ) ?? seed.id
    );
  }

  /**
   * Run a full cognitive process (citta-vīthi) over content, then plant
   * karmic seeds from its javana moments — the mind, working.
   *
   * `senseBase` undefined or `'mind'` runs the 13-moment mind-door process
   * (processMentalObject); any other sense base runs the 17-moment five-door
   * process (processSenseObject) through the matching door.
   */
  cognize(content: string, senseBase?: SenseBase): CognitionResult {
    this.syncCittaFromMind();

    const object: Ārammaṇa = senseBase && senseBase !== 'mind'
      ? { type: 'sense-object', content, senseBase }
      : { type: 'mental-object', content };

    const vithi = senseBase && senseBase !== 'mind'
      ? this.citta.processSenseObject(object, Being.senseDoors[senseBase])
      : this.citta.processMentalObject(object);

    const seedsPlanted = this.plantSeedsFromJavanas(vithi.quality, content);

    return {
      moments: vithi.moments,
      quality: vithi.quality,
      karmicImpact: vithi.karmicImpact,
      seedsPlanted,
    };
  }

  /**
   * Sync the five aliased mental factors from Mind into Citta's cetasikas
   * ahead of a cognitive process, so javana quality reflects the being's
   * current mental state.
   */
  private syncCittaFromMind(): void {
    const keys = ['mindfulness', 'wisdom', 'greed', 'aversion', 'delusion'] as const;
    for (const key of keys) {
      const factor = this.mind.getFactor(key);
      if (factor && factor.isActive && factor.intensity > 0) {
        this.citta.activateCetasika(key, factor.intensity);
      } else {
        this.citta.deactivateCetasika(key);
      }
    }
  }

  /**
   * Plant karmic seeds from the javana moments of a vīthi (canonical
   * mapping: javana position -> ripening-timing category). Javana 1 is
   * accumulating (weak, immediate); javanas 2-6 are full strength (moderate,
   * distant-future); javana 7 is fading (weak, next-life).
   */
  private plantSeedsFromJavanas(
    javanaQuality: CittaQuality,
    content: string
  ): CognitionResult['seedsPlanted'] {
    // determineJavanaQuality only ever returns 'kusala' or 'akusala' — vipāka
    // and kiriya cittas never run javana, so no seeds are planted for them.
    if (javanaQuality !== 'kusala' && javanaQuality !== 'akusala') {
      return [];
    }

    const quality: KarmaQuality = javanaQuality === 'kusala' ? 'wholesome' : 'unwholesome';
    const root = javanaQuality === 'kusala' ? this.determineActiveWholesomeRoot() : this.determineActiveUnwholesomeRoot();
    const slug = Being.slugify(content);

    const groups: Array<{ timing: RipeningTiming; potency: number }> = [
      { timing: 'immediate', potency: 10 },       // javana 1: weak
      { timing: 'distant-future', potency: 30 },  // javanas 2-6: moderate
      { timing: 'next-life', potency: 10 },        // javana 7: weak
    ];

    return groups.map(group => {
      const seed = this.karmicStore.plantSeed({
        quality,
        description: content,
        intentionStrength: 5,
        root,
        potency: group.potency,
        ripeningTiming: group.timing,
        minDelay: 0,
        maxDelay: Number.MAX_SAFE_INTEGER,
        tags: [root, 'cognize', slug, `incarnation:${this._incarnation}`],
        conditions: this.buildSeedConditions(quality, slug),
      });
      return { id: seed.id, timing: seed.ripeningTiming, strength: seed.strength, quality: seed.quality };
    });
  }

  /**
   * The wholesome root behind a kusala javana, derived from which wholesome
   * root cetasika is dominant on citta — not hardcoded to 'non-delusion'.
   * alobha (non-greed) and adosa (non-aversion) aren't synced from Mind by
   * syncCittaFromMind() (only mindfulness/wisdom/greed/aversion/delusion
   * are), so they only become active when set directly on citta; when
   * neither is active — or amoha (mindfulness/wisdom) is dominant — the
   * default 'non-delusion' applies, covering mindfulness/wisdom-driven
   * kusala moments.
   */
  private determineActiveWholesomeRoot(): WholesomeRoot {
    const cetasikas = this.citta.getCetasikas();
    const alobha = cetasikas.get('alobha');
    const adosa = cetasikas.get('adosa');
    // amoha stand-ins: wisdom (paññā) and mindfulness (sati) are the closest
    // aliased cetasikas representing non-delusion in this model.
    const wisdom = cetasikas.get('wisdom');
    const mindfulness = cetasikas.get('mindfulness');

    const alobhaIntensity = alobha?.isActive ? alobha.intensity : -1;
    const adosaIntensity = adosa?.isActive ? adosa.intensity : -1;
    const amohaIntensity = Math.max(
      wisdom?.isActive ? wisdom.intensity : -1,
      mindfulness?.isActive ? mindfulness.intensity : -1
    );

    if (alobhaIntensity >= 0 && alobhaIntensity >= adosaIntensity && alobhaIntensity >= amohaIntensity) {
      return 'non-greed';
    }
    if (adosaIntensity >= 0 && adosaIntensity > alobhaIntensity && adosaIntensity >= amohaIntensity) {
      return 'non-aversion';
    }
    return 'non-delusion';
  }

  /**
   * The highest-intensity active unwholesome root cetasika on citta
   * (greed, aversion, delusion) — the root motivation behind an akusala
   * javana. determineJavanaQuality guarantees at least one is active
   * whenever it returns 'akusala', so this always resolves to a real root.
   */
  private determineActiveUnwholesomeRoot(): UnwholesomeRoot {
    const roots: UnwholesomeRoot[] = ['greed', 'aversion', 'delusion'];
    const cetasikas = this.citta.getCetasikas();

    let best: UnwholesomeRoot = 'delusion';
    let bestIntensity = -1;
    for (const root of roots) {
      const factor = cetasikas.get(root);
      if (factor?.isActive && factor.intensity > bestIntensity) {
        bestIntensity = factor.intensity;
        best = root;
      }
    }
    return best;
  }

  /**
   * Release resources held by the karmic seed ledger (e.g. any ripening
   * timers). Safe to call even though auto-ripening is always disabled here.
   */
  dispose(): void {
    this.karmicStore.dispose();
  }

  /**
   * Receive karmic results (ripen pending karma).
   *
   * Ripens both the legacy karmic stream (unconditional, as before) and the
   * karmicStore's active seeds (conditional — subject to their attached
   * ripening conditions, unless `force` is set). Seeds that remain active
   * afterward are explained in `whyNot`.
   */
  receiveKarmicResults(force = false): KarmicResultsReport {
    const results: KarmicResult[] = [];

    for (const karma of this.karmicStream) {
      if (karma.isPotential()) {
        const result = karma.manifest();
        if (result) {
          results.push(result);

          // Experience the result through the aggregates
          this.experience({
            senseBase: 'mind',
            object: result.description,
            intensity: result.intensity,
            valence: result.experienceQuality
          });
        }
      }
    }

    const seedVipakas: KarmicVipaka[] = [];
    const candidateSeeds = this.karmicStore.getSeeds({ state: 'active' });

    // Incarnation-window pass: seeds whose timing window has lapsed are
    // expired (ahosi-kamma) here as a safety net (rebirth() already expires
    // them at the transition); seeds not yet in their window are excluded
    // from this pass and explained in whyNot instead.
    const windowNotes = new Map<string, string>();
    const eligibleSeeds: KarmicSeed[] = [];
    for (const seed of candidateSeeds) {
      const window = this.evaluateSeedWindow(seed);
      if (window.eligible) {
        eligibleSeeds.push(seed);
      } else if (window.expired) {
        seed.state = 'exhausted';
      } else if (window.reason) {
        windowNotes.set(seed.id, window.reason);
      }
    }

    for (const seed of eligibleSeeds) {
      const vipaka = force
        ? this.karmicStore.forceRipen(seed.id)
        : this.karmicStore.attemptRipening(seed.id);

      if (vipaka) {
        seedVipakas.push(vipaka);
        this.experience({
          senseBase: 'mind',
          object: vipaka.description,
          intensity: vipaka.intensity,
          valence: vipaka.quality
        });
      }
    }

    const whyNot: KarmicResultsReport['whyNot'] = [];
    for (const seed of candidateSeeds) {
      const current = this.karmicStore.getSeed(seed.id);
      if (current && current.state === 'active') {
        const windowNote = windowNotes.get(current.id);
        const unmetConditions = current.ripeningConditions
          .filter(condition => !condition.check())
          .map(condition => condition.description);
        whyNot.push({
          seedId: current.id,
          description: current.description,
          unmet: windowNote ? [windowNote, ...unmetConditions] : unmetConditions
        });
      }
    }

    return { results, seedVipakas, whyNot };
  }

  /**
   * Evaluate a seed's incarnation-window eligibility for ripening.
   * `immediate` (diṭṭhadhamma) ripens only in its planting incarnation;
   * `next-life` (upapajja) only in planting+1; `distant-future`
   * (aparāpariya) from planting+1 onward, never expiring; `deferred`
   * (and any seed without an incarnation tag) is always eligible.
   */
  private evaluateSeedWindow(
    seed: KarmicSeed
  ): { eligible: boolean; expired: boolean; reason?: string } {
    const tag = seed.tags.find(t => t.startsWith('incarnation:'));
    if (!tag) return { eligible: true, expired: false };

    const plantedAt = Number(tag.slice('incarnation:'.length));
    if (Number.isNaN(plantedAt)) return { eligible: true, expired: false };

    const timing: RipeningTiming = seed.ripeningTiming;
    switch (timing) {
      case 'immediate':
        if (this._incarnation === plantedAt) return { eligible: true, expired: false };
        return {
          eligible: false,
          expired: true,
          reason: `immediate seed: only ripens in incarnation ${plantedAt}`
        };
      case 'next-life':
        if (this._incarnation === plantedAt + 1) return { eligible: true, expired: false };
        if (this._incarnation > plantedAt + 1) {
          return {
            eligible: false,
            expired: true,
            reason: `next-life seed: only ripened in incarnation ${plantedAt + 1}`
          };
        }
        return {
          eligible: false,
          expired: false,
          reason: `next-life seed: ripens in incarnation ${plantedAt + 1}`
        };
      case 'distant-future':
        if (this._incarnation >= plantedAt + 1) return { eligible: true, expired: false };
        return {
          eligible: false,
          expired: false,
          reason: `distant-future seed: ripens from incarnation ${plantedAt + 1} onward`
        };
      case 'deferred':
      default:
        return { eligible: true, expired: false };
    }
  }

  /**
   * Pick the seed that shapes the next incarnation: a weighty seed takes
   * priority (garuka-kamma), then the most habitually-repeated slug
   * (āciṇṇa-kamma), then the oldest active seed as a reserve
   * (kaṭattā-kamma). Null when the store holds no active seeds.
   */
  private pickShapingSeed(): { seed: KarmicSeed; reason: 'weighty' | 'habitual' | 'reserve' } | null {
    const seeds = this.karmicStore.getSeeds({ state: 'active' });
    if (seeds.length === 0) return null;

    const weighty = seeds.find(s => s.strength === 'weighty');
    if (weighty) {
      return { seed: weighty, reason: 'weighty' };
    }

    const plantings = new Map<string, Set<number>>();
    for (const seed of seeds) {
      const slug = this.slugOf(seed);
      if (!slug) continue;
      if (!plantings.has(slug)) plantings.set(slug, new Set());
      plantings.get(slug)!.add(seed.createdAt);
    }

    let bestSlug: string | undefined;
    let bestCount = 1;
    for (const [slug, createdAts] of plantings) {
      if (createdAts.size > bestCount) {
        bestCount = createdAts.size;
        bestSlug = slug;
      }
    }
    if (bestSlug) {
      const habitual = seeds.find(s => this.slugOf(s) === bestSlug);
      if (habitual) {
        return { seed: habitual, reason: 'habitual' };
      }
    }

    const oldest = seeds.reduce((a, b) => (a.createdAt <= b.createdAt ? a : b));
    return { seed: oldest, reason: 'reserve' };
  }

  /**
   * Apply starting faculties (vipāka, spec §4) to a freshly-transmigrated
   * `next` being, derived from the karmic balance it just inherited — never
   * copied from the being that transmigrated into it. `share` is the
   * potency-weighted wholesome fraction of the inherited store's total
   * potency (0 on a zero-potency store): starting mindfulness is
   * `clamp(round(share*4), 0..4)`; each of the 8 path factors starts at
   * `clamp(round(share*3), 0..3)`, additionally capped by `next.wisdomCap()`
   * for rightView. Caps keep rebirth a real reset — a saint's continuum
   * starts ahead, but nobody is born liberated.
   */
  private applyStartingFaculties(next: Being): void {
    const balance = next.karmicStore.getKarmicBalance();
    const totalPotency = balance.wholesome + balance.unwholesome + balance.neutral;
    const share = totalPotency === 0 ? 0 : balance.wholesome / totalPotency;

    const mindfulness = Math.min(4, Math.max(0, Math.round(share * 4))) as Intensity;
    (next as any)._mindfulnessLevel = mindfulness;

    for (const factor of next.path.getAllFactors()) {
      let level = Math.min(3, Math.max(0, Math.round(share * 3)));
      if (factor === next.path.rightView) {
        level = Math.min(level, next.wisdomCap());
      }
      factor.reset();
      if (level > 0) {
        factor.activate();
      }
      (factor as any)._developmentLevel = level as Intensity;
    }
  }

  /**
   * Enact rebirth: transmigration without a transmigrator. Advances the
   * incarnation counter, expires any active seed whose timing window has
   * now lapsed (ahosi-kamma), selects the realm of the next arising from
   * the shaping seed, and constructs a NEW being of that realm's class.
   * Only the karmic continuum (this being's `karmicStore` object, plus the
   * incremented incarnation counter) passes to it — no path levels, mind
   * factors, or experience history transfer; those are a fresh arising,
   * with starting faculties conditioned by the inherited karmic balance
   * (vipāka, see `applyStartingFaculties`). The dying being (`this`) is
   * detached from the continuum (given a fresh, empty store) and disposed;
   * the new being is returned as `RebirthResult.being` — callers must use
   * it for anything after rebirth().
   */
  rebirth(): RebirthResult {
    this._incarnation += 1;

    // Sweep expiring seeds first: a seed whose window has now lapsed
    // (ahosi-kamma) is defunct at this transition and must not be eligible
    // to shape the next incarnation.
    let expiredSeeds = 0;
    for (const seed of this.karmicStore.getSeeds({ state: 'active' })) {
      const window = this.evaluateSeedWindow(seed);
      if (window.expired) {
        seed.state = 'exhausted';
        expiredSeeds++;
      }
    }

    const picked = this.pickShapingSeed();
    const shapingSeed = picked
      ? { id: picked.seed.id, description: picked.seed.description, reason: picked.reason }
      : null;

    const fromRealm = this.realm;
    const toRealm = selectRealm(picked?.seed ?? null, this.karmicStore.getKarmicBalance());

    const inheritedStore = this.karmicStore;
    const inheritedIncarnation = this._incarnation;

    // Construct the new arising and transfer ONLY the continuum onto it:
    // the same store object (by identity — the santāna itself) plus the
    // incremented incarnation counter. _restoreState also re-registers this
    // being's named ripening conditions and rebinds them against the
    // shared store, so per-slug closures (e.g. mindfulness-support) read
    // `next`'s faculties, not the dying being's.
    const next = new REALM_CLASSES[toRealm]();
    next._restoreState({
      mindfulnessLevel: 0,
      karmicStream: [],
      experienceHistory: [],
      karmicStore: inheritedStore,
      incarnation: inheritedIncarnation,
    });

    // Starting faculties are vipāka, derived from the balance next just
    // inherited — never copied from this dying being.
    this.applyStartingFaculties(next);

    // Detach the dying being from the continuum BEFORE disposing it: a
    // fresh, empty, non-auto-ripening store so `this` can no longer read or
    // mutate the santāna that now lives only on `next`.
    (this as any).karmicStore = new KarmicStore({ enableAutoRipening: false });
    this.dispose();

    return {
      incarnation: inheritedIncarnation,
      expiredSeeds,
      shapingSeed,
      fromRealm,
      toRealm,
      being: next,
    };
  }

  /**
   * Get the current incarnation number (starts at 1).
   */
  get incarnation(): number {
    return this._incarnation;
  }

  /**
   * Practice meditation
   */
  meditate(duration: number, effort: Intensity): MeditationResult {
    const gain = this.meditationGainFactor();
    const scaledEffort = Math.min(10, Math.max(0, effort * gain)) as Intensity;

    // Develop relevant path factors. rightView is included here because
    // meditate() is the only Being-driven path that touches it (see
    // task-1-report.md: "wisdom-cap driving path") — generateMeditationInsight()
    // already reads path.rightView.developmentLevel for its wisdom-gated
    // tiers, but nothing previously grew it.
    this.practicePathFactor(this.path.rightEffort, scaledEffort);
    this.practicePathFactor(this.path.rightMindfulness, scaledEffort);
    this.practicePathFactor(this.path.rightConcentration, scaledEffort);
    this.practicePathFactor(this.path.rightView, scaledEffort);

    // Activate mindfulness in the mind
    this.mind.activateFactor('mindfulness', effort);

    // Update mindfulness level
    const mindfulnessGain = effort * duration * 0.01 * gain;
    this._mindfulnessLevel = Math.min(10,
      Math.round(this._mindfulnessLevel + mindfulnessGain)
    ) as Intensity;

    // Calm the mind
    if (effort >= 5) {
      this.mind.calm();
    }

    return {
      mindfulnessLevel: this._mindfulnessLevel,
      concentrationLevel: this.path.rightConcentration.developmentLevel,
      insight: this.generateMeditationInsight(),
      pathProgress: this.path.getOverallDevelopment()
    };
  }

  /**
   * Generate insight based on practice levels
   */
  private generateMeditationInsight(): string | null {
    const concentration = this.path.rightConcentration.developmentLevel;
    const mindfulness = this._mindfulnessLevel;
    const wisdom = this.path.rightView.developmentLevel;

    if (concentration >= 8 && mindfulness >= 8 && wisdom >= 5) {
      return 'Deep insight: Directly seeing the three marks of existence in all phenomena. Liberation is near.';
    }
    if (concentration >= 6 && mindfulness >= 6) {
      return 'Clear seeing: Impermanence of mental states becomes obvious. Each moment arises and passes.';
    }
    if (concentration >= 4 && mindfulness >= 4) {
      return 'Growing clarity: Able to observe thoughts without being caught. Some detachment arising.';
    }
    if (concentration >= 2) {
      return 'Beginning stability: Moments of calm and clarity amidst distraction.';
    }
    return null;
  }

  /**
   * Investigate the nature of self
   */
  investigateSelf(): SelfInvestigationResult {
    const aggregateSearch = this.aggregates.searchForSelf();
    const dependentOriginationInsight =
      'This being arises dependent on causes and conditions, moment by moment.';

    // Examine one of the aggregates for emptiness
    const emptinessInsight = this.emptiness.examine(this.aggregates.form);

    return {
      aggregateSearch,
      dependentOriginationInsight,
      emptinessInsight,
      conclusion: 'What is called "self" is a convenient designation for a process. No unchanging, independent self can be found.'
    };
  }

  /**
   * Face suffering using the Four Noble Truths
   */
  faceSuffering(suffering: DukkhaType[], cravings: CravingType[]): SufferingResponse {
    const diagnosis = this.fourNobleTruths.diagnose({
      suffering,
      cravings
    });

    return {
      acknowledged: true,
      diagnosis,
      response: 'Applying the Four Noble Truths framework to understand and address this suffering.',
      nextStep: `Focus on ${diagnosis.path.focusArea} practice: ${diagnosis.path.practices[0]}`
    };
  }

  /**
   * Observe the dependent origination chain in action
   */
  observeDependentOrigination(): string {
    const chainState = this.dependentOrigination.getChainState();
    const activeLinks = chainState.filter(l => l.hasArisen).map(l => l.name);

    return `Dependent Origination observed:
Active links: ${activeLinks.join(' → ')}
Liberation point: ${this.dependentOrigination.practiceAtLiberationPoint()}`;
  }

  /**
   * Get current mindfulness level
   */
  get mindfulnessLevel(): Intensity {
    return this._mindfulnessLevel;
  }

  /**
   * Get current state
   */
  getState(): BeingState {
    return {
      aggregatesSnapshot: this.aggregates.getSnapshot(),
      pathProgress: this.path.getOverallDevelopment(),
      mindfulnessLevel: this._mindfulnessLevel,
      pendingKarma: this.karmicStream.filter(k => k.isPotential()).length,
      experienceCount: this.experienceHistory.length,
      mindState: this.mind.getState()
    };
  }

  /**
   * Get experience history
   */
  getExperienceHistory(count = 10): ProcessedExperience[] {
    return this.experienceHistory.slice(-count);
  }

  /**
   * Get karmic stream
   */
  getKarmicStream(): Karma[] {
    return [...this.karmicStream];
  }

  /**
   * Karmic seed statistics — balance, seed counts by state and ripening
   * timing, and the current incarnation. Single source of truth for both
   * the MCP `buddha_status` handler and the CLI `status --json` output, so
   * the two surfaces can't drift out of parity with each other.
   */
  getSeedStats(): {
    balance: ReturnType<KarmicStore['getKarmicBalance']>;
    byState: Record<string, number>;
    byTiming: Record<string, number>;
    incarnation: number;
  } {
    const balance = this.karmicStore.getKarmicBalance();
    const { byState } = this.karmicStore.getStatistics();
    const byTiming: Record<string, number> = {};
    for (const seed of this.karmicStore.getSeeds()) {
      byTiming[seed.ripeningTiming] = (byTiming[seed.ripeningTiming] ?? 0) + 1;
    }
    return { balance, byState, byTiming, incarnation: this._incarnation };
  }

  /**
   * @internal Used by BeingSerializer for deserialization.
   * Not part of the public API.
   */
  _restoreState(state: {
    mindfulnessLevel: Intensity;
    karmicStream: Karma[];
    experienceHistory: ProcessedExperience[];
    karmicStore?: KarmicStore;
    incarnation?: number;
  }): void {
    this._mindfulnessLevel = state.mindfulnessLevel;
    this.karmicStream = state.karmicStream;
    this.experienceHistory = state.experienceHistory;
    this._incarnation = state.incarnation ?? 1;
    if (state.karmicStore) {
      (this as any).karmicStore = state.karmicStore;
      // The restored store's seeds carry dead-stub checks for named
      // conditions (functions aren't serializable) — re-register the
      // conditions against this being's new store, then rebind seeds to them.
      this.registerRipeningConditions();
      this.karmicStore.rebindConditions();
    }
  }

  /**
   * Serialize this being to a plain JSON-compatible object
   */
  toJSON(): BeingData {
    return serializeBeing(this);
  }

  /**
   * Restore a Being from serialized data
   */
  static fromJSON(data: BeingData): Being {
    return deserializeBeing(data);
  }

  /**
   * Get a summary of this being
   */
  getSummary(): string {
    const state = this.getState();

    return `
BEING STATE SUMMARY

AGGREGATES:
  Form vitality: ${state.aggregatesSnapshot.form.vitality}/10
  Current feeling: ${state.aggregatesSnapshot.feeling.currentTone}
  Mind quality: ${state.aggregatesSnapshot.mentalFormations.dominantQuality}

PATH DEVELOPMENT:
  Overall progress: ${state.pathProgress.toFixed(1)}/10
  Mindfulness level: ${state.mindfulnessLevel}/10
  ${this.path.isBalanced() ? 'Path is balanced' : 'Path needs balancing'}

KARMA:
  Pending karmic seeds: ${state.pendingKarma}
  Total experiences: ${state.experienceCount}

MIND:
  Calm: ${state.mindState.isCalm ? 'Yes' : 'No'}
  Focused: ${state.mindState.isFocused ? 'Yes' : 'No'}
  Dominant factors: ${state.mindState.dominantFactors.join(', ') || 'None'}

INSIGHT:
  ${this.aggregates.searchForSelf().conclusion}
    `.trim();
  }
}

// =============================================================================
// THE SIX REALMS (gati) OF REBIRTH
// =============================================================================
//
// Defined here, after `Being`, rather than in `./realms.ts` (which re-exports
// them for the public import path `simulation/realms`): each realm class
// extends `Being`, and `Being.rebirth()` needs their constructors
// (REALM_CLASSES) to transmigrate into the next arising. Splitting that
// across two files makes it a circular ES module import — `realms.ts` would
// import `Being` for `extends`, and `Being.ts` would import `REALM_CLASSES`
// back — which fails at the `class X extends Being` statement: whichever
// file loads first, the other's `class Being` hasn't finished executing yet,
// so `Being` is still in its temporal dead zone (`Class extends value
// undefined is not a constructor`, confirmed both under Vitest and plain
// Node ESM). Keeping them in one module makes REALM_CLASSES/selectRealm a
// same-module forward reference from inside `rebirth()`'s method body
// (evaluated only when called, long after the whole file has loaded) rather
// than a cross-file cycle evaluated at class-declaration time.

/**
 * The human realm (manuṣya-gati) — the baseline realm. Neutral on every
 * hook; behaves identically to base `Being`.
 */
export class HumanBeing extends Being {}

/**
 * The deva (god) realm — long-lived, comfortable, and complacent. Divine
 * comfort dulls the sense of urgency (saṃvega) that drives practice, so
 * meditation gains are halved. Starts at full vitality (10), reflecting
 * the deva's vital, unafflicted form.
 */
export class DevaBeing extends Being {
  get realm(): Realm {
    return 'deva';
  }

  protected meditationGainFactor(): number {
    return 0.5; // pamāda: divine comfort dulls urgency (saṃvega)
  }

  constructor() {
    super();
    this.aggregates.form.update({ vitality: 10 });
  }
}

/**
 * The asura (titan) realm — driven by rivalry and envy of the devas.
 * Practice is somewhat undermined by that restlessness, and aversion-toned
 * reactions run hotter (a rivalry bias toward aversion).
 */
export class AsuraBeing extends Being {
  get realm(): Realm {
    return 'asura';
  }

  protected meditationGainFactor(): number {
    return 0.75;
  }

  protected unwholesomeReactionBoost(): number {
    return 1; // rivalry bias toward aversion
  }
}

/**
 * The animal realm (tiryagyoni-gati) — dominated by instinct, with little
 * capacity for reflective wisdom. rightView's developmentLevel is capped
 * low (4).
 */
export class AnimalBeing extends Being {
  get realm(): Realm {
    return 'animal';
  }

  protected wisdomCap(): Intensity {
    return 4;
  }
}

/**
 * The preta (hungry ghost) realm — defined by insatiable craving, which
 * amplifies reactions to experience regardless of valence.
 */
export class PretaBeing extends Being {
  get realm(): Realm {
    return 'preta';
  }

  protected unwholesomeReactionBoost(): number {
    return 2; // insatiable craving amplifies reactions
  }
}

/**
 * The naraka (hell) realm — a realm of intense, unrelenting suffering.
 * Practice is undermined by that suffering, and unpleasant experiences are
 * felt more intensely still.
 */
export class NarakaBeing extends Being {
  get realm(): Realm {
    return 'naraka';
  }

  protected meditationGainFactor(): number {
    return 0.75;
  }

  protected unpleasantIntensityShift(): number {
    return 2;
  }
}

/** Lookup from a `Realm` value to its concrete `Being` subclass. */
export const REALM_CLASSES: Record<Realm, new () => Being> = {
  human: HumanBeing,
  deva: DevaBeing,
  asura: AsuraBeing,
  animal: AnimalBeing,
  preta: PretaBeing,
  naraka: NarakaBeing,
};

/**
 * Select the realm of the next rebirth from the seed that shapes it
 * (garuka/āciṇṇa/kaṭattā-kamma — see `Being.pickShapingSeed`) and the
 * inherited karmic continuum's overall balance.
 *
 * Canonical mapping (spec §3, transcribed exactly):
 * - No shaping seed, or a neutral one -> human (the default, precious birth).
 * - Unwholesome, by dominant root -> preta (greed), naraka (aversion), or
 *   animal (delusion or any unmapped root).
 * - Wholesome and weighty or strong -> deva (heavenly comfort as the fruit
 *   of significant merit).
 * - Wholesome but not weighty/strong -> asura if the inherited continuum's
 *   unwholesome share of total potency is >= 40% (power tainted by rivalry
 *   and envy), otherwise human.
 */
export function selectRealm(
  shaping: KarmicSeed | null,
  balance: ReturnType<KarmicStore['getKarmicBalance']>
): Realm {
  if (!shaping || shaping.quality === 'neutral') return 'human';

  if (shaping.quality === 'unwholesome') {
    switch (shaping.root) {
      case 'greed':
        return 'preta';
      case 'aversion':
        return 'naraka';
      default:
        return 'animal'; // delusion and any unmapped root
    }
  }

  // wholesome:
  if (shaping.strength === 'weighty' || shaping.strength === 'strong') return 'deva';

  const totalPotency = balance.wholesome + balance.unwholesome + balance.neutral;
  const unwholesomeShare = totalPotency === 0 ? 0 : balance.unwholesome / totalPotency;
  return unwholesomeShare >= 0.4 ? 'asura' : 'human'; // power tainted by rivalry/envy
}
