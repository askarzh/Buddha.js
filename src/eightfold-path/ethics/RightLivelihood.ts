/**
 * Right Livelihood (Samma Ajiva)
 *
 * The fifth factor of the Noble Eightfold Path.
 * Earning a living in a way that does not cause harm.
 *
 * The Buddha specifically mentioned five types of wrong livelihood:
 * 1. Trading in weapons
 * 2. Trading in living beings (slavery, trafficking)
 * 3. Trading in meat (butchery)
 * 4. Trading in intoxicants
 * 5. Trading in poisons
 *
 * More broadly, any livelihood based on deceit, harm, or exploitation is wrong.
 */

import { PathFactor } from '../PathFactor';
import { Intensity } from '../../utils/types';

/**
 * Types of wrong livelihood explicitly mentioned
 */
export type WrongLivelihood = 'weapons' | 'beings' | 'meat' | 'intoxicants' | 'poisons';

/**
 * Assessment of a livelihood
 */
export interface LivelihoodAssessment {
  /** Does this livelihood cause harm? */
  causesHarm: boolean;
  /** Types of harm if any */
  harmTypes: string[];
  /** Is it based on deceit? */
  involvesDeceit: boolean;
  /** Is it exploitative? */
  isExploitative: boolean;
  /** Overall assessment */
  isRightLivelihood: boolean;
  /** Suggestions for improvement */
  suggestions: string[];
}

/**
 * Right Livelihood - Ethical means of making a living
 */
export class RightLivelihood extends PathFactor {
  readonly name = 'Right Livelihood';
  readonly sanskritName = 'Samyag-ājīva';
  readonly category = 'ethics' as const;
  readonly position = 5;

  /** The five wrong livelihoods */
  private readonly fiveWrongLivelihoods: WrongLivelihood[] = [
    'weapons', 'beings', 'meat', 'intoxicants', 'poisons'
  ];

  protected onPractice(_effort: Intensity): void {
    // Practice involves reflection on one's livelihood
  }

  /**
   * Assess whether a livelihood is right livelihood
   */
  assessLivelihood(livelihood: {
    description: string;
    involvesWeapons: boolean;
    involvesTradingBeings: boolean;
    involvesButchery: boolean;
    involvesIntoxicants: boolean;
    involvesPoisons: boolean;
    involvesDeceit: boolean;
    isExploitative: boolean;
    causesEnvironmentalHarm: boolean;
  }): LivelihoodAssessment {
    const harmTypes: string[] = [];

    if (livelihood.involvesWeapons) harmTypes.push('Dealing in weapons');
    if (livelihood.involvesTradingBeings) harmTypes.push('Trading in beings');
    if (livelihood.involvesButchery) harmTypes.push('Butchery/meat trade');
    if (livelihood.involvesIntoxicants) harmTypes.push('Dealing in intoxicants');
    if (livelihood.involvesPoisons) harmTypes.push('Dealing in poisons');
    if (livelihood.causesEnvironmentalHarm) harmTypes.push('Environmental harm');

    const causesHarm = harmTypes.length > 0;
    const isRightLivelihood = !causesHarm &&
                               !livelihood.involvesDeceit &&
                               !livelihood.isExploitative;

    const suggestions = this.generateSuggestions(livelihood, harmTypes);

    return {
      causesHarm,
      harmTypes,
      involvesDeceit: livelihood.involvesDeceit,
      isExploitative: livelihood.isExploitative,
      isRightLivelihood,
      suggestions
    };
  }

  private generateSuggestions(
    livelihood: { involvesDeceit: boolean; isExploitative: boolean },
    harmTypes: string[]
  ): string[] {
    const suggestions: string[] = [];

    if (harmTypes.length > 0) {
      suggestions.push('Consider transitioning to work that does not cause direct harm');
    }

    if (livelihood.involvesDeceit) {
      suggestions.push('Cultivate honesty in all business dealings');
    }

    if (livelihood.isExploitative) {
      suggestions.push('Ensure fair treatment and compensation for all involved');
    }

    if (suggestions.length === 0) {
      suggestions.push('Continue practicing mindfulness in your work');
      suggestions.push('Look for ways to make your work even more beneficial');
    }

    return suggestions;
  }

  getPractices(): string[] {
    return [
      'Reflect on how your work affects others',
      'Ensure honest dealings in all business',
      'Treat colleagues and customers with respect',
      'Consider the environmental impact of your work',
      'If in harmful livelihood, plan transition mindfully',
      'Bring mindfulness to your daily work',
      'Use earnings wisely and generously'
    ];
  }

  getDescription(): string {
    return `
Right Livelihood extends ethics to how we earn our living.
We spend much of our lives working, so work should align with the path.

SPECIFICALLY AVOID:
• Dealing in weapons
• Dealing in living beings (slavery, trafficking)
• Dealing in meat (butchery)
• Dealing in intoxicants
• Dealing in poisons

GENERAL PRINCIPLES:
• Livelihood should not require deceit
• Livelihood should not exploit others
• Livelihood should not cause harm
• Livelihood should ideally benefit others

MODERN CONSIDERATIONS:
• Environmental impact of work
• Social justice in employment
• Ethical investing of earnings
• Work-life balance for practice
    `.trim();
  }

  getIndicators(): string[] {
    return [
      'Work does not require lying or manipulation',
      'No one is harmed by what you do for a living',
      'You can speak openly about your work without shame',
      'Your work contributes positively to society',
      'Fair dealing is natural, not a burden',
      'Work supports rather than hinders your practice'
    ];
  }

  /**
   * Get the five wrong livelihoods
   */
  getFiveWrongLivelihoods(): WrongLivelihood[] {
    return [...this.fiveWrongLivelihoods];
  }
}
