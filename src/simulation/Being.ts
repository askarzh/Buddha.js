/**
 * Being - A Sentient Being Simulation
 *
 * This class integrates all Buddhist concepts to simulate
 * a sentient being - composed of aggregates, subject to
 * dependent origination, capable of practicing the path.
 */

import { FiveAggregates, SensoryInput, ProcessedExperience, SelfInquiryResult } from '../five-aggregates/FiveAggregates';
import { EightfoldPath } from '../eightfold-path/EightfoldPath';
import { DependentOrigination } from '../dependent-origination/DependentOrigination';
import { FourNobleTruths, Diagnosis } from '../four-noble-truths/FourNobleTruths';
import { Karma } from '../karma/Karma';
import { Intention } from '../karma/Intention';
import { KarmicResult } from '../karma/KarmicResult';
import { KarmicStore, KarmicVipaka, RipeningCondition, KarmicSeed, RipeningTiming } from '../karma/KarmicEventSystem';
import { Sunyata, EmptinessInsight } from '../emptiness/Sunyata';
import { Mind } from '../mind/Mind';
import { Citta, Ārammaṇa, CittaMoment } from '../mind/Citta';
import { Intensity, DukkhaType, CravingType, UnwholesomeRoot, WholesomeRoot, KarmaQuality, BeingData, Serializable, SenseBase, CittaDoor, CittaQuality } from '../utils/types';
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
    this.karmicStore.registerCondition('habitual-accumulation', () => {
      const tagCounts = new Map<string, number>();
      for (const seed of this.karmicStore.getSeeds()) {
        for (const tag of seed.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
      }
      return Array.from(tagCounts.values()).some(count => count >= 3);
    });
  }

  /**
   * Experience something through the senses
   */
  experience(input: SensoryInput): ProcessedExperience {
    const processed = this.aggregates.processExperience(input);
    this.experienceHistory.push(processed);

    // If mindfulness is high, add mindful observation
    if (this._mindfulnessLevel > 5) {
      processed.reactions.push('mindful observation without automatic reaction');
    }

    return processed;
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

    const slug = description.toLowerCase().replace(/[^a-z0-9]+/g, '-');

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
        name: 'habitual-accumulation',
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
   */
  private slugOf(seed: KarmicSeed): string | undefined {
    return seed.tags.find(
      t => t !== 'act' && t !== 'cognize' && t !== seed.root && !t.startsWith('incarnation:')
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
    const root = javanaQuality === 'kusala' ? 'non-delusion' : this.determineActiveUnwholesomeRoot();
    const slug = content.toLowerCase().replace(/[^a-z0-9]+/g, '-');

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
  private pickShapingSeed(): RebirthResult['shapingSeed'] {
    const seeds = this.karmicStore.getSeeds({ state: 'active' });
    if (seeds.length === 0) return null;

    const weighty = seeds.find(s => s.strength === 'weighty');
    if (weighty) {
      return { id: weighty.id, description: weighty.description, reason: 'weighty' };
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
        return { id: habitual.id, description: habitual.description, reason: 'habitual' };
      }
    }

    const oldest = seeds.reduce((a, b) => (a.createdAt <= b.createdAt ? a : b));
    return { id: oldest.id, description: oldest.description, reason: 'reserve' };
  }

  /**
   * Enact rebirth: advance the incarnation counter, expire any active seed
   * whose timing window has now lapsed (ahosi-kamma — its potential to
   * ripen is spent, unfulfilled), and name the seed that shapes the new
   * incarnation.
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

    const shapingSeed = this.pickShapingSeed();

    return { incarnation: this._incarnation, expiredSeeds, shapingSeed };
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
    // Develop relevant path factors
    this.path.rightEffort.practice(effort);
    this.path.rightMindfulness.practice(effort);
    this.path.rightConcentration.practice(effort);

    // Activate mindfulness in the mind
    this.mind.activateFactor('mindfulness', effort);

    // Update mindfulness level
    const mindfulnessGain = effort * duration * 0.01;
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
