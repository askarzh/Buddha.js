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
import { Sunyata, EmptinessInsight } from '../emptiness/Sunyata';
import { Mind } from '../mind/Mind';
import { Intensity, KarmaQuality, DukkhaType, CravingType, UnwholesomeRoot, WholesomeRoot, SenseBase, BeingData, PathData, MindData, NidanaChainData, KarmaData, Serializable } from '../utils/types';

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
   * Perform an intentional action (creates karma)
   */
  act(
    description: string,
    _quality: KarmaQuality,
    intensity: Intensity,
    root?: UnwholesomeRoot | WholesomeRoot
  ): Karma {
    const intention = new Intention(description, intensity, root);
    const karma = new Karma(intention, intensity);
    karma.complete();
    this.karmicStream.push(karma);
    return karma;
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
            intensity: result.intensity
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
   * Serialize this being to a plain JSON-compatible object
   */
  toJSON(): BeingData {
    const pathFactors = this.path.getAllFactors();
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
      const factor = this.mind.getFactor(key);
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
    const mindState = this.mind.getState();
    const mind: MindData = {
      factors: mindFactors,
      clarity: mindState.clarity,
      stability: mindState.stability,
    };

    const chainState = this.dependentOrigination.getChainState();
    const dependentOrigination: NidanaChainData = {
      links: chainState.map(l => ({
        position: l.position,
        name: l.name,
        hasArisen: l.hasArisen,
        hasCeased: false,
        isBroken: l.isBroken,
      })),
    };

    const karmicStream: KarmaData[] = this.karmicStream.map(k => ({
      id: k.id,
      description: k.intention.description,
      quality: k.quality,
      intensity: k.intensity,
      root: k.intention.root,
      isCompleted: k.isCompleted,
      hasManifested: k.hasManifested,
    }));

    const snapshot = this.aggregates.getSnapshot();

    return {
      mindfulnessLevel: this._mindfulnessLevel,
      karmicStream,
      experienceHistory: this.experienceHistory.map(e => ({
        input: { senseBase: e.input.senseBase, object: e.input.object, intensity: e.input.intensity },
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
    };
  }

  /**
   * Restore a Being from serialized data
   */
  static fromJSON(data: BeingData): Being {
    const being = new Being();

    // Restore mindfulness
    being._mindfulnessLevel = data.mindfulnessLevel;

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
    being.karmicStream = data.karmicStream.map(kd => {
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
    being.experienceHistory = data.experienceHistory.map(e => ({
      input: {
        senseBase: e.input.senseBase as SenseBase,
        object: e.input.object,
        intensity: e.input.intensity,
      },
      label: e.label,
      feelingTone: e.feelingTone,
      reactions: [...e.reactions],
      timestamp: e.timestamp,
    }));

    return being;
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
