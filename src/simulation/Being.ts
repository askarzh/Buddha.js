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
import { KarmicStore } from '../karma/KarmicEventSystem';
import { Sunyata, EmptinessInsight } from '../emptiness/Sunyata';
import { Mind } from '../mind/Mind';
import { Intensity, DukkhaType, CravingType, UnwholesomeRoot, WholesomeRoot, KarmaQuality, BeingData, Serializable } from '../utils/types';
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

  constructor() {
    this.aggregates = new FiveAggregates();
    this.path = new EightfoldPath();
    this.dependentOrigination = new DependentOrigination();
    this.fourNobleTruths = new FourNobleTruths(this.path);
    this.emptiness = new Sunyata();
    this.mind = new Mind();
    this.karmicStore = new KarmicStore({ enableAutoRipening: false });
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

    // NOTE: 'incarnation:1' is hardcoded for now; Task 5 replaces it with a
    // live incarnation counter.
    this.karmicStore.plantSeed({
      quality,
      description,
      intentionStrength: intensity,
      ...(root ? { root } : {}),
      potency: intensity * 7,
      ripeningTiming: 'deferred',
      minDelay: 0,
      maxDelay: Number.MAX_SAFE_INTEGER,
      tags: [root ?? 'neutral', 'act', slug, 'incarnation:1'],
    });
  }

  /**
   * Release resources held by the karmic seed ledger (e.g. any ripening
   * timers). Safe to call even though auto-ripening is always disabled here.
   */
  dispose(): void {
    this.karmicStore.dispose();
  }

  /**
   * Receive karmic results (ripen pending karma)
   */
  receiveKarmicResults(): KarmicResult[] {
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

    return results;
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
  }): void {
    this._mindfulnessLevel = state.mindfulnessLevel;
    this.karmicStream = state.karmicStream;
    this.experienceHistory = state.experienceHistory;
    if (state.karmicStore) {
      (this as any).karmicStore = state.karmicStore;
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
