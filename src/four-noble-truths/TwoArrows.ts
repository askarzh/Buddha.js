/**
 * TwoArrows — The "84th Problem" Helper
 *
 * A farmer once came to the Buddha listing all his problems — trouble with
 * crops, a difficult wife, worries about his children. The Buddha replied:
 * "I can't help you with those. Everyone has 83 problems. When you solve one,
 * another takes its place. But I can help you with the 84th problem."
 * "What's the 84th problem?" asked the farmer.
 * "The 84th problem is that you don't want to have any problems."
 *
 * This connects to the Sallatha Sutta (SN 36.6), the "two arrows" teaching:
 *   - First arrow: unavoidable pain (the raw sensation or loss)
 *   - Second arrow: self-inflicted suffering through resistance, craving, or aversion
 *
 * The untrained person, struck by pain, grieves and resists — experiencing
 * two arrows. The trained person feels the same pain but doesn't add the
 * second arrow. The 84th problem IS the second arrow: wanting no problems.
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { ArrowInput, ArrowAnalysis } from '../utils/types';

export class TwoArrows extends Phenomenon {
  readonly name = 'TwoArrows';
  readonly sanskritName = 'Dvē Sallā';

  private analysisHistory: ArrowAnalysis[] = [];

  /**
   * Analyze a painful situation to distinguish first and second arrows.
   */
  analyze(input: ArrowInput): ArrowAnalysis {
    const hasSecondArrow = input.mentalReactions.length > 0;

    const analysis: ArrowAnalysis = {
      firstArrow: {
        description: input.pain,
        isUnavoidable: true,
      },
      secondArrow: {
        reactions: [...input.mentalReactions],
        count: input.mentalReactions.length,
        isOptional: true,
      },
      totalArrows: hasSecondArrow ? 'two' : 'one',
      isEightyFourthProblem: hasSecondArrow,
      insight: hasSecondArrow
        ? `The pain of "${input.pain}" is the first arrow — unavoidable. ` +
          `But ${input.mentalReactions.length} mental reaction(s) form the second arrow: ` +
          `"${input.mentalReactions.join('", "')}". ` +
          `This second arrow is optional. Recognizing it as self-added is the beginning of relief.`
        : `Only the first arrow is present: "${input.pain}". ` +
          `No second arrow of resistance has been added. ` +
          `This is the mark of equanimity — meeting pain without adding suffering.`,
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  /**
   * Returns true if any past analysis found a second arrow (mental resistance).
   * Indicates the 84th problem has been encountered and recognized.
   */
  hasRecognizedSecondArrow(): boolean {
    return this.analysisHistory.some(a => a.isEightyFourthProblem);
  }

  /**
   * Total number of analyses performed.
   */
  getAnalysisCount(): number {
    return this.analysisHistory.length;
  }

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: 'Pain is inevitable; suffering through resistance to pain is optional',
      usefulFor: [
        'Distinguishing unavoidable pain from self-added suffering',
        'Reducing unnecessary mental anguish',
        'Developing equanimity in the face of difficulty',
        'Practical daily application of Buddhist insight',
      ],
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description:
        'Neither arrow has inherent existence; both arise dependently and cease when conditions change',
      transcends: [
        'Belief that all pain can be eliminated',
        'Belief that resistance to pain is inevitable',
        'Identification with suffering as "my" suffering',
        'The project of wanting no problems (the 84th problem itself)',
      ],
    };
  }
}
