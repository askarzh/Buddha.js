/**
 * The Unconditioned (Asankhata)
 *
 * "Sabbe sankhara anicca, sabbe sankhara dukkha, sabbe DHAMMA anatta" —
 * impermanence and unsatisfactoriness mark only conditioned phenomena;
 * not-self marks all dharmas without exception. Nirvana is the one
 * unconditioned dharma: it does not arise from conditions and does not cease.
 */

import { TwoTruthsExaminable, ConventionalTruth, UltimateTruth } from './TwoTruths';
import { generateId } from '../utils/types';

/** Marks of the unconditioned: beyond anicca and dukkha, still anatta. */
export interface AsankhataMarks {
  readonly impermanence: false;
  readonly unsatisfactoriness: false;
  readonly notSelf: true;
}

/**
 * Base class for unconditioned dharmas. Deliberately has NO conditions,
 * arising, or cessation — that is the point.
 */
export abstract class UnconditionedDharma implements AsankhataMarks, TwoTruthsExaminable {
  readonly impermanence = false as const;
  readonly unsatisfactoriness = false as const;
  readonly notSelf = true as const;

  readonly id: string;
  abstract readonly name: string;
  abstract readonly sanskritName: string;

  constructor() {
    this.id = generateId();
  }

  abstract getConventionalTruth(): ConventionalTruth;
  abstract getUltimateTruth(): UltimateTruth;
}
