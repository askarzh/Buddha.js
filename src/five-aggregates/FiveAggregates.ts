/**
 * The Five Aggregates (Panca-skandha)
 *
 * Together they constitute what we conventionally call a "person".
 * None of them is self, and no self can be found apart from them.
 *
 * The Buddha's analysis: take any phenomenon and it will be found
 * in one of these five categories. Search all five - no self is found.
 */

import { Skandha } from './Skandha';
import { Rupa, BodyState } from './Rupa';
import { VedanaAggregate, FeelingState } from './VedanaAggregate';
import { Samjna, PerceptionState } from './Samjna';
import { SamskaraAggregate, SamskaraState } from './SamskaraAggregate';
import { VijnanaAggregate, ConsciousnessState } from './VijnanaAggregate';
import { SenseBase, FeelingTone } from '../utils/types';

/**
 * Sensory input for processing
 */
export interface SensoryInput {
  senseBase: SenseBase;
  object: unknown;
  intensity: number; // 1-10
}

/**
 * Processed experience through the aggregates
 */
export interface ProcessedExperience {
  input: SensoryInput;
  label: string;
  feelingTone: FeelingTone;
  reactions: string[];
  timestamp: number;
}

/**
 * Result of searching for self
 */
export interface SelfInquiryResult {
  aggregatesExamined: Array<{
    aggregate: string;
    isSelf: false;
    reason: string;
  }>;
  selfFound: false;
  conclusion: string;
}

/**
 * Snapshot of all aggregate states
 */
export interface AggregatesSnapshot {
  form: BodyState;
  feeling: FeelingState;
  perception: PerceptionState;
  mentalFormations: SamskaraState;
  consciousness: ConsciousnessState;
  timestamp: number;
}

/**
 * The Five Aggregates - the complete analysis of personal existence
 */
export class FiveAggregates {
  /** The form/body aggregate */
  readonly form: Rupa;

  /** The feeling aggregate */
  readonly feeling: VedanaAggregate;

  /** The perception aggregate */
  readonly perception: Samjna;

  /** The mental formations aggregate */
  readonly mentalFormations: SamskaraAggregate;

  /** The consciousness aggregate */
  readonly consciousness: VijnanaAggregate;

  /** All aggregates in order */
  private readonly allAggregates: Skandha[];

  constructor() {
    this.form = new Rupa();
    this.feeling = new VedanaAggregate();
    this.perception = new Samjna();
    this.mentalFormations = new SamskaraAggregate();
    this.consciousness = new VijnanaAggregate();

    this.allAggregates = [
      this.form,
      this.feeling,
      this.perception,
      this.mentalFormations,
      this.consciousness
    ];

    // Establish interdependencies
    this.establishInterdependencies();
  }

  /**
   * Establish interdependencies between aggregates
   */
  private establishInterdependencies(): void {
    // All aggregates condition each other
    this.allAggregates.forEach(agg => {
      this.allAggregates.forEach(other => {
        if (agg !== other) {
          agg.addCondition(other);
        }
      });
    });
  }

  /**
   * Process a sensory experience through the aggregates
   */
  processExperience(input: SensoryInput): ProcessedExperience {
    // 1. Form receives the sensory data (body/sense organ)
    // (For simulation, we just note the sense base used)

    // 2. Consciousness cognizes the object
    this.consciousness.cognize(input.senseBase, input.object);

    // 3. Perception recognizes and labels
    const label = this.perception.recognize(input.object);

    // 4. Feeling determines the hedonic tone
    const feelingTone = this.feeling.feel({
      senseBase: input.senseBase,
      pleasantness: input.intensity
    });

    // 5. Mental formations react
    const reactions = this.mentalFormations.react(feelingTone, label);

    return {
      input,
      label,
      feelingTone,
      reactions,
      timestamp: Date.now()
    };
  }

  /**
   * Examine where "self" might be found
   * Spoiler: it cannot be found in any aggregate
   */
  searchForSelf(): SelfInquiryResult {
    const results = this.allAggregates.map(agg => {
      const inquiry = (agg as Skandha).investigateSelf();
      return {
        aggregate: agg.name,
        isSelf: inquiry.isSelf,
        reason: inquiry.reason
      };
    });

    return {
      aggregatesExamined: results,
      selfFound: false,
      conclusion: 'No unchanging, independent self can be found in or apart from the five aggregates. What we call "self" is a process, not an entity.'
    };
  }

  /**
   * Get the current state of all aggregates
   */
  getSnapshot(): AggregatesSnapshot {
    return {
      form: this.form.getState(),
      feeling: this.feeling.getState(),
      perception: this.perception.getState(),
      mentalFormations: this.mentalFormations.getState(),
      consciousness: this.consciousness.getState(),
      timestamp: Date.now()
    };
  }

  /**
   * Get all aggregates
   */
  getAllAggregates(): Skandha[] {
    return [...this.allAggregates];
  }

  /**
   * Get aggregate by position (1-5)
   */
  getByPosition(position: number): Skandha | undefined {
    return this.allAggregates[position - 1];
  }

  /**
   * Get a summary of the five aggregates teaching
   */
  getSummary(): string {
    return `
THE FIVE AGGREGATES (Panca-skandha)

What we call a "person" is analyzed into five groups:

1. RUPA (Form/Body)
   Material aggregate - the physical form
   ${this.form.getState().vitality}/10 vitality

2. VEDANA (Feeling)
   The hedonic tone - pleasant/unpleasant/neutral
   Current: ${this.feeling.getCurrentTone()}

3. SAMJNA (Perception)
   Recognition and labeling
   Current: ${this.perception.getCurrentLabel() || 'none'}

4. SAMSKARA (Mental Formations)
   Intentions, emotions, volitions
   Quality: ${this.mentalFormations.getState().dominantQuality}

5. VIJNANA (Consciousness)
   Basic awareness/knowing
   Clarity: ${this.consciousness.getClarity()}/10

THE KEY INSIGHT:
"Form is not self. If form were self, then form would not lead to affliction."
"Feeling is not self... Perception is not self... Formations are not self..."
"Consciousness is not self..."

Search all five aggregates - no self can be found.
The "self" is a useful convention, not an ultimate truth.
    `.trim();
  }

  /**
   * Explain the not-self teaching through the aggregates
   */
  explainAnatta(): string {
    return `
THE NOT-SELF TEACHING (Anatta/Anatman)

The Buddha's analytical meditation on the aggregates:

FOR EACH AGGREGATE, ASK:

1. Is it permanent or impermanent?
   → All five are IMPERMANENT (arising and passing)

2. Is what is impermanent satisfying or unsatisfying?
   → What is impermanent is UNSATISFYING

3. Is what is impermanent and unsatisfying fit to be regarded as:
   "This is mine, this is I, this is my self"?
   → NO

CONCLUSION:
- Form is not self
- Feeling is not self
- Perception is not self
- Mental formations are not self
- Consciousness is not self

"Seeing thus, the well-instructed noble disciple becomes
disenchanted with form, disenchanted with feeling,
disenchanted with perception, disenchanted with formations,
disenchanted with consciousness.

Being disenchanted, passion fades.
With the fading of passion, one is liberated."

- Anattalakkhana Sutta
    `.trim();
  }
}
