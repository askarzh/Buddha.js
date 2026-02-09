/**
 * Right Action (Samma Kammanta)
 *
 * The fourth factor of the Noble Eightfold Path.
 * Ethical conduct in bodily actions.
 *
 * Right Action involves abstaining from:
 * 1. Taking life (panatipata)
 * 2. Taking what is not given (adinnadana)
 * 3. Sexual misconduct (kamesu micchacara)
 *
 * And cultivating non-violence, generosity, and respectful relationships.
 */

import { PathFactor } from '../PathFactor';
import { Intensity } from '../../utils/types';

/**
 * Types of harmful action to abstain from
 */
export type HarmfulAction = 'killing' | 'stealing' | 'sexual-misconduct';

/**
 * Action assessment result
 */
export interface ActionAssessment {
  /** Does this action cause harm? */
  causesHarm: boolean;
  /** Who is affected? */
  affectedBeings: string[];
  /** What is the motivation? */
  motivation: 'greed' | 'aversion' | 'delusion' | 'wisdom' | 'compassion';
  /** Is this action skillful? */
  isSkillful: boolean;
  /** Recommendation */
  recommendation: string;
}

/**
 * Right Action - Acting without causing harm
 */
export class RightAction extends PathFactor {
  readonly name = 'Right Action';
  readonly sanskritName = 'Samyak-karmānta';
  readonly category = 'ethics' as const;
  readonly position = 4;

  protected onPractice(_effort: Intensity): void {
    // Practice deepens ethical sensitivity
  }

  /**
   * Assess whether an action is skillful
   */
  assessAction(action: {
    causesPhysicalHarm: boolean;
    takesWithoutPermission: boolean;
    violatesRelationships: boolean;
    motivation: 'greed' | 'aversion' | 'delusion' | 'wisdom' | 'compassion';
    affectedBeings: string[];
  }): ActionAssessment {
    const causesHarm = action.causesPhysicalHarm ||
                       action.takesWithoutPermission ||
                       action.violatesRelationships;

    const isSkillful = !causesHarm &&
                       (action.motivation === 'wisdom' || action.motivation === 'compassion');

    let recommendation: string;
    if (isSkillful) {
      recommendation = 'This action aligns with Right Action. Proceed mindfully.';
    } else if (action.causesPhysicalHarm) {
      recommendation = 'This action causes harm. Consider non-violent alternatives.';
    } else if (action.takesWithoutPermission) {
      recommendation = 'This involves taking what is not given. Practice generosity instead.';
    } else if (action.violatesRelationships) {
      recommendation = 'This may harm relationships. Act with respect and consent.';
    } else {
      recommendation = 'Examine your motivation. Act from wisdom, not craving.';
    }

    return {
      causesHarm,
      affectedBeings: action.affectedBeings,
      motivation: action.motivation,
      isSkillful,
      recommendation
    };
  }

  getPractices(): string[] {
    return [
      'Practice non-violence toward all beings',
      'Take only what is freely given',
      'Respect others in relationships',
      'Before acting, consider the effects on others',
      'Cultivate generosity as antidote to taking',
      'Practice protecting life, not just avoiding killing',
      'Act with consent and respect'
    ];
  }

  getDescription(): string {
    return `
Right Action is ethics in bodily conduct. The body is the instrument
through which we interact with the world, so right action shapes
our physical relationship with all beings.

ABSTAINING FROM:
• Taking life - harming or killing living beings
• Taking what is not given - theft, deception, exploitation
• Sexual misconduct - actions that harm through sexuality

CULTIVATING:
• Non-violence (ahimsa) - protecting and respecting life
• Generosity (dana) - giving freely, not taking
• Respectful relationships - consent, faithfulness, care

THE PRINCIPLE:
"What is hateful to yourself, do not do to others."
Consider how your actions affect all beings involved.
    `.trim();
  }

  getIndicators(): string[] {
    return [
      'Natural reluctance to cause any harm',
      'Generosity feels more natural than acquisition',
      'Relationships are characterized by respect',
      'You protect rather than exploit',
      'Others feel safe in your presence',
      'Actions considered before undertaken'
    ];
  }

  /**
   * Get the five precepts related to right action
   */
  getFivePrecepts(): string[] {
    return [
      '1. I undertake to abstain from taking life',
      '2. I undertake to abstain from taking what is not given',
      '3. I undertake to abstain from sexual misconduct',
      '4. I undertake to abstain from false speech',
      '5. I undertake to abstain from intoxicants that cloud the mind'
    ];
  }
}
