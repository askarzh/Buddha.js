/**
 * Right Mindfulness (Samma Sati)
 *
 * The seventh factor of the Noble Eightfold Path.
 * Central to Buddhist meditation practice.
 *
 * Right Mindfulness involves the Four Foundations:
 * 1. Kayanupassana - Mindfulness of body
 * 2. Vedananupassana - Mindfulness of feelings
 * 3. Cittanupassana - Mindfulness of mind
 * 4. Dhammanupassana - Mindfulness of mental objects/phenomena
 */

import { PathFactor } from '../PathFactor';
import { Intensity } from '../../utils/types';

/**
 * The four foundations of mindfulness
 */
export interface FourFoundations {
  /** Mindfulness of body */
  body: Intensity;
  /** Mindfulness of feelings/sensations */
  feelings: Intensity;
  /** Mindfulness of mind states */
  mind: Intensity;
  /** Mindfulness of mental phenomena */
  phenomena: Intensity;
}

/**
 * Result of a mindfulness observation
 */
export interface MindfulObservation {
  /** What was observed */
  object: string;
  /** Foundation used */
  foundation: keyof FourFoundations;
  /** Was arising noted? */
  notedArising: boolean;
  /** Was passing noted? */
  notedPassing: boolean;
  /** Quality of attention */
  attention: 'scattered' | 'intermittent' | 'sustained';
  /** Insight gained */
  insight?: string;
}

/**
 * Right Mindfulness - Clear awareness of present experience
 */
export class RightMindfulness extends PathFactor {
  readonly name = 'Right Mindfulness';
  readonly sanskritName = 'Samyak-smṛti';
  readonly category = 'meditation' as const;
  readonly position = 7;

  /** Development of the four foundations */
  private foundations: FourFoundations = {
    body: 0,
    feelings: 0,
    mind: 0,
    phenomena: 0
  };

  /** Observation count */
  private observationCount = 0;

  protected onPractice(effort: Intensity): void {
    const increment = effort * 0.1;
    this.foundations.body = Math.min(10, this.foundations.body + increment) as Intensity;
    this.foundations.feelings = Math.min(10, this.foundations.feelings + increment) as Intensity;
    this.foundations.mind = Math.min(10, this.foundations.mind + increment) as Intensity;
    this.foundations.phenomena = Math.min(10, this.foundations.phenomena + increment) as Intensity;
  }

  /**
   * Practice mindfulness of a specific foundation
   */
  observe(
    foundation: keyof FourFoundations,
    object: string,
    notedArising: boolean,
    notedPassing: boolean
  ): MindfulObservation {
    this.observationCount++;
    this.foundations[foundation] = Math.min(10, this.foundations[foundation] + 0.1) as Intensity;

    let attention: 'scattered' | 'intermittent' | 'sustained';
    if (notedArising && notedPassing) {
      attention = 'sustained';
    } else if (notedArising || notedPassing) {
      attention = 'intermittent';
    } else {
      attention = 'scattered';
    }

    let insight: string | undefined;
    if (attention === 'sustained' && this.foundations[foundation] >= 5) {
      insight = `Seeing the ${object} arise and pass, impermanence becomes clear.`;
    }

    return {
      object,
      foundation,
      notedArising,
      notedPassing,
      attention,
      insight
    };
  }

  /**
   * Get current foundation development
   */
  getFoundations(): FourFoundations {
    return { ...this.foundations };
  }

  /**
   * Get observation count
   */
  getObservationCount(): number {
    return this.observationCount;
  }

  getPractices(): string[] {
    return [
      'Practice breath awareness as anchor',
      'Note body sensations throughout the day',
      'Label feelings as pleasant, unpleasant, or neutral',
      'Notice mind states: calm, agitated, contracted, expanded',
      'Observe thoughts arising and passing',
      'Practice formal sitting meditation daily',
      'Bring mindfulness to ordinary activities'
    ];
  }

  getDescription(): string {
    return `
Right Mindfulness is clear, non-judgmental awareness of present experience.
It is developed through the Four Foundations of Mindfulness.

THE FOUR FOUNDATIONS:

1. BODY (Kayanupassana)
   - Breath awareness
   - Body postures and movements
   - Physical sensations
   - Contemplation of body parts
   - Awareness of impermanence of body

2. FEELINGS (Vedananupassana)
   - Pleasant, unpleasant, neutral
   - Worldly and unworldly feelings
   - Seeing feelings arise and pass

3. MIND (Cittanupassana)
   - Knowing when mind is contracted/expanded
   - Knowing presence of greed, hatred, delusion
   - Knowing when mind is concentrated/scattered

4. PHENOMENA (Dhammanupassana)
   - Five hindrances
   - Five aggregates
   - Sense bases
   - Seven factors of enlightenment
   - Four Noble Truths

KEY QUALITIES:
- Present-moment awareness
- Non-judgmental observation
- Continuity of attention
- Seeing arising and passing
    `.trim();
  }

  getIndicators(): string[] {
    return [
      'Quicker recognition of mental and physical states',
      'Less reactivity to pleasant and unpleasant',
      'Increased awareness of subtle body sensations',
      'Ability to observe thoughts without being caught',
      'More presence in daily activities',
      'Clear seeing of impermanence in experience'
    ];
  }

  /**
   * Get the most developed foundation
   */
  getStrongestFoundation(): keyof FourFoundations {
    const entries = Object.entries(this.foundations) as [keyof FourFoundations, Intensity][];
    return entries.reduce((max, curr) => curr[1] > max[1] ? curr : max)[0];
  }
}
