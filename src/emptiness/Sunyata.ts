/**
 * Sunyata - Emptiness
 *
 * The central teaching of Madhyamaka Buddhism.
 * Emptiness is not nothingness, but the lack of inherent,
 * independent existence in all phenomena.
 *
 * All things are empty of svabhava (own-being/self-nature).
 * They exist dependently, not independently.
 */

import { Phenomenon } from '../core/Phenomenon';

/**
 * Insight into the empty nature of a phenomenon
 */
export interface EmptinessInsight {
  /** Name of the phenomenon examined */
  phenomenon: string;
  /** Is it empty? (always true for conditioned phenomena) */
  isEmpty: true;
  /** What it depends on for existence */
  dependsOn: string[];
  /** Does it arise from causes? */
  arisesCausally: boolean;
  /** Does it cease when causes change? */
  ceasesCausally: boolean;
  /** Does it have independent, inherent existence? */
  hasInherentExistence: false;
  /** Detailed explanation */
  explanation: string;
}

/**
 * The Heart Sutra insight on form and emptiness
 */
export interface HeartSutraInsight {
  formIsEmptiness: string;
  emptinessIsForm: string;
  explanation: string;
  appliesTo: string[];
}

/**
 * Two truths perspective on emptiness
 */
export interface TwoTruthsOnEmptiness {
  conventional: string;
  ultimate: string;
  reconciliation: string;
}

/**
 * Sunyata - Emptiness Analyzer
 *
 * A tool for examining phenomena for their empty nature.
 */
export class Sunyata {
  /**
   * Examine a phenomenon for emptiness
   */
  examine(phenomenon: Phenomenon): EmptinessInsight {
    const conditions = phenomenon.getConditions();
    const impermanence = phenomenon.examineImpermanence();
    // Calling examineNotSelf() for completeness (part of Three Marks analysis)
    phenomenon.examineNotSelf();

    return {
      phenomenon: phenomenon.name,
      isEmpty: true,
      dependsOn: conditions.map(c => c.name),
      arisesCausally: impermanence.arises,
      ceasesCausally: impermanence.ceases,
      hasInherentExistence: false,
      explanation: this.generateExplanation(phenomenon, conditions)
    };
  }

  /**
   * Generate detailed explanation
   */
  private generateExplanation(phenomenon: Phenomenon, conditions: readonly Phenomenon[]): string {
    const conditionNames = conditions.map(c => c.name).join(', ') || 'various conditions';

    return `${phenomenon.name} is empty of inherent existence because:

1. DEPENDENT ORIGINATION
   It depends on: ${conditionNames}
   Without these conditions, it would not exist.

2. IMPERMANENCE
   It arises when conditions gather.
   It ceases when conditions disperse.
   It has no permanent essence.

3. NOT-SELF
   It lacks independent existence.
   It cannot be found apart from its parts.
   It is not controlled by a self.

4. CONCEPTUAL DESIGNATION
   "${phenomenon.name}" is a label applied to a process.
   The label is conventional, not ultimate.

Therefore, ${phenomenon.name} exists conventionally (it functions)
but is empty ultimately (it lacks inherent existence).`;
  }

  /**
   * The famous formula from the Heart Sutra
   */
  getHeartSutraInsight(): HeartSutraInsight {
    return {
      formIsEmptiness: 'Form does not differ from emptiness',
      emptinessIsForm: 'Emptiness does not differ from form',
      explanation: `This is not saying form is nothing.
It means: form exists dependently, therefore it is "empty."
Emptiness is not separate from phenomena - it IS their nature.
There is no form that is not empty.
There is no emptiness apart from form.`,
      appliesTo: [
        'form (rupa)',
        'feeling (vedana)',
        'perception (samjna)',
        'mental formations (samskara)',
        'consciousness (vijnana)'
      ]
    };
  }

  /**
   * Two truths perspective on emptiness
   */
  getTwoTruthsPerspective(): TwoTruthsOnEmptiness {
    return {
      conventional: 'Things exist conventionally - they appear, function, and can be spoken about. Conventional existence is not denied.',
      ultimate: 'Things lack inherent, independent, permanent existence. When analyzed, no essence can be found. This is ultimate truth.',
      reconciliation: 'Both truths are true simultaneously. Emptiness does not negate conventional existence - it explains HOW things exist (dependently, not independently).'
    };
  }

  /**
   * Examine the emptiness of emptiness itself
   */
  examineEmptinessItself(): string {
    return `EMPTINESS IS ALSO EMPTY

Even emptiness is not an inherent nature or essence.
Emptiness is not a "thing" that phenomena possess.
It is not a cosmic void or nihilistic nothingness.

Emptiness is simply the way things are:
- Dependently originated
- Without inherent existence
- Neither truly existent nor truly non-existent

If we grasp at emptiness as a view, we miss the point.
"Emptiness wrongly grasped is like picking up a snake by the wrong end."

The realization of emptiness is not an intellectual understanding,
but a direct seeing that liberates.`;
  }

  /**
   * Common misunderstandings about emptiness
   */
  getMisunderstandings(): Array<{ wrong: string; correct: string }> {
    return [
      {
        wrong: 'Emptiness means nothingness - things don\'t exist',
        correct: 'Emptiness means things lack INHERENT existence, not that they don\'t exist at all'
      },
      {
        wrong: 'If things are empty, nothing matters',
        correct: 'Because things are empty (interdependent), everything matters - our actions have effects'
      },
      {
        wrong: 'Emptiness is a thing or place',
        correct: 'Emptiness is the NATURE of phenomena, not a separate thing'
      },
      {
        wrong: 'Understanding emptiness intellectually is realization',
        correct: 'True realization is direct insight that transforms, not just intellectual understanding'
      },
      {
        wrong: 'Emptiness negates conventional reality',
        correct: 'Emptiness explains conventional reality - why things can change, interact, and function'
      }
    ];
  }

  /**
   * Get summary of emptiness teaching
   */
  getSummary(): string {
    return `
SUNYATA - EMPTINESS

The central insight of Madhyamaka Buddhism.

WHAT EMPTINESS IS:
- The lack of inherent, independent existence
- Dependent origination (things arise from causes)
- The middle way between eternalism and nihilism

WHAT EMPTINESS IS NOT:
- Nothingness or void
- A thing or substance
- Nihilism (nothing exists/matters)

THE FORMULA:
"Whatever is dependently originated is empty.
Whatever is empty is dependently originated."

Emptiness = Dependent Origination = The Middle Way

PRACTICAL SIGNIFICANCE:
- Liberation from grasping at permanent self
- Compassion arises from seeing interdependence
- Freedom from extremes of belief
- Understanding that change is possible
    `.trim();
  }
}
