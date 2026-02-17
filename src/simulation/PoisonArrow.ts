/**
 * PoisonArrow — Simplified Cessation Simulation
 *
 * Based on the Cula-Malunkyovada Sutta (MN 63): a man struck by a poisoned
 * arrow should remove it immediately rather than asking who shot it, what
 * the bow was made of, or where the archer came from.
 *
 * This class embodies that pragmatism. Given a description of suffering,
 * it walks through four steps to cessation — one per Noble Truth — without
 * requiring configuration of the 12 nidanas, aggregates, karma, or any
 * other deep machinery. Just pull out the arrow.
 */

import { CessationStage, CessationStep } from '../utils/types';

const STAGES: ReadonlyArray<{ stage: CessationStage; truth: CessationStep['truth'] }> = [
  { stage: 'recognize', truth: 'dukkha' },
  { stage: 'investigate', truth: 'samudaya' },
  { stage: 'release', truth: 'nirodha' },
  { stage: 'practice', truth: 'magga' },
];

export class PoisonArrow {
  private readonly suffering: string;
  private stepHistory: CessationStep[] = [];

  constructor(suffering: string) {
    this.suffering = suffering;
  }

  /**
   * Advance to the next cessation stage.
   * Throws if the arrow has already been removed (all 4 steps complete).
   */
  step(): CessationStep {
    if (this.isComplete()) {
      throw new Error(
        'The arrow has already been removed. There is nothing more to do.'
      );
    }

    const index = this.stepHistory.length;
    const { stage, truth } = STAGES[index];

    const cessationStep: CessationStep = {
      stage,
      truth,
      insight: this.generateInsight(stage),
      guidance: this.generateGuidance(stage),
    };

    this.stepHistory.push(cessationStep);
    return cessationStep;
  }

  /**
   * Get the current stage, or null if no steps have been taken.
   */
  getCurrentStage(): CessationStage | null {
    if (this.stepHistory.length === 0) return null;
    return this.stepHistory[this.stepHistory.length - 1].stage;
  }

  /**
   * True when all four steps have been completed.
   */
  isComplete(): boolean {
    return this.stepHistory.length >= STAGES.length;
  }

  /**
   * Read-only history of steps taken so far.
   */
  getSteps(): readonly CessationStep[] {
    return [...this.stepHistory];
  }

  /**
   * Text summary of the cessation path so far.
   */
  getSummary(): string {
    const lines = [`Suffering: "${this.suffering}"`, ''];

    for (const s of this.stepHistory) {
      lines.push(`[${s.stage}] (${s.truth})`);
      lines.push(`  Insight: ${s.insight}`);
      lines.push(`  Guidance: ${s.guidance}`);
      lines.push('');
    }

    if (this.isComplete()) {
      lines.push('The arrow has been removed.');
    } else {
      lines.push(
        `${STAGES.length - this.stepHistory.length} step(s) remaining.`
      );
    }

    return lines.join('\n').trim();
  }

  private generateInsight(stage: CessationStage): string {
    switch (stage) {
      case 'recognize':
        return (
          `This is suffering: "${this.suffering}". ` +
          `Acknowledging it clearly, without denial or dramatization, is the first step.`
        );
      case 'investigate':
        return (
          `The suffering is sustained by craving — wanting things to be different than they are. ` +
          `What resistance or clinging is fueling "${this.suffering}"?`
        );
      case 'release':
        return (
          `Cessation is possible. The suffering of "${this.suffering}" is not permanent — ` +
          `it depends on conditions that can change.`
        );
      case 'practice':
        return (
          `The path forward: meet "${this.suffering}" with wise attention, ` +
          `not with further craving or aversion.`
        );
    }
  }

  private generateGuidance(stage: CessationStage): string {
    switch (stage) {
      case 'recognize':
        return 'Sit with the experience. Name it. Do not push it away or pull it closer.';
      case 'investigate':
        return 'Ask: "What am I wanting right now? What am I resisting?" Look for the second arrow.';
      case 'release':
        return 'You do not need to force letting go. Simply see that the clinging is optional.';
      case 'practice':
        return 'Return attention to this moment. The arrow is out. What remains is just life, as it is.';
    }
  }
}
