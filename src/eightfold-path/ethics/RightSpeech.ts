/**
 * Right Speech (Samma Vaca)
 *
 * The third factor of the Noble Eightfold Path.
 * The first of the ethical trainings (Sila).
 *
 * Right Speech involves abstaining from:
 * 1. False speech (musavada)
 * 2. Divisive speech (pisunavaca)
 * 3. Harsh speech (pharusavaca)
 * 4. Idle chatter (samphappalapa)
 *
 * And cultivating speech that is truthful, harmonious, kind, and meaningful.
 */

import { PathFactor } from '../PathFactor';
import { Intensity } from '../../utils/types';

/**
 * Types of unskillful speech to abstain from
 */
export type UnskilfulSpeech = 'false' | 'divisive' | 'harsh' | 'idle';

/**
 * Speech quality assessment
 */
export interface SpeechAssessment {
  /** Is it true? */
  truthful: boolean;
  /** Is it helpful/beneficial? */
  beneficial: boolean;
  /** Is it timely? */
  timely: boolean;
  /** Is it spoken with goodwill? */
  kindly: boolean;
  /** Overall: should this be spoken? */
  shouldSpeak: boolean;
}

/**
 * Right Speech - Communicating with truth and kindness
 */
export class RightSpeech extends PathFactor {
  readonly name = 'Right Speech';
  readonly sanskritName = 'Samyag-vāc';
  readonly category = 'ethics' as const;
  readonly position = 3;

  /** Count of mindful speech moments */
  private mindfulSpeechCount = 0;

  protected onPractice(_effort: Intensity): void {
    this.mindfulSpeechCount++;
  }

  /**
   * Assess whether something should be spoken
   * Based on the Buddha's criteria for right speech
   */
  assessSpeech(speech: {
    isTruthful: boolean;
    isBeneficial: boolean;
    isTimely: boolean;
    isKindly: boolean;
  }): SpeechAssessment {
    const shouldSpeak = speech.isTruthful &&
                        speech.isBeneficial &&
                        speech.isTimely &&
                        speech.isKindly;

    return {
      truthful: speech.isTruthful,
      beneficial: speech.isBeneficial,
      timely: speech.isTimely,
      kindly: speech.isKindly,
      shouldSpeak
    };
  }

  /**
   * Get the criteria for right speech
   */
  getCriteria(): string[] {
    return [
      'Is it true?',
      'Is it beneficial?',
      'Is it the right time?',
      'Is it spoken with goodwill?'
    ];
  }

  getPractices(): string[] {
    return [
      'Pause before speaking to check motivation',
      'Practice noble silence when unsure',
      'Speak truthfully but kindly',
      'Avoid gossip and idle chatter',
      'Use speech to heal, not to harm',
      'Listen more than you speak',
      'Practice saying difficult truths with compassion'
    ];
  }

  getDescription(): string {
    return `
Right Speech transforms communication into a spiritual practice.
Words have power - they can harm or heal, divide or unite.

ABSTAINING FROM:
• False speech - lies, deception, misleading
• Divisive speech - creating conflict, gossip
• Harsh speech - angry, hurtful, cruel words
• Idle chatter - pointless, distracting talk

CULTIVATING:
• Truthfulness - speaking what is true
• Harmony - speech that brings people together
• Gentleness - kind, encouraging words
• Meaningful discourse - useful, timely communication

THE FIVE CRITERIA (before speaking):
1. Is it true?
2. Is it beneficial?
3. Is it timely?
4. Is it spoken with goodwill?
5. If all yes, speak. If any no, remain silent.
    `.trim();
  }

  getIndicators(): string[] {
    return [
      'People trust your words because you speak truthfully',
      'Your speech brings people together, not apart',
      'Others feel safe and respected in conversation',
      'You are comfortable with silence',
      'Gossip and harsh words feel uncomfortable',
      'You naturally pause before responding'
    ];
  }

  /**
   * Get mindful speech count
   */
  getMindfulSpeechCount(): number {
    return this.mindfulSpeechCount;
  }
}
