/**
 * Jaramarana - Aging and Death (Link 12)
 *
 * Conditioned by birth, aging and death arise.
 * This is the inevitable result of birth -
 * the culmination of the chain of suffering.
 *
 * Includes: aging (jara), death (marana),
 * sorrow, lamentation, pain, grief, and despair.
 */

import { Nidana, NidanaExplanation } from '../Nidana';

export interface AgingDeathManifestations {
  aging: boolean;
  death: boolean;
  sorrow: boolean;
  lamentation: boolean;
  pain: boolean;
  grief: boolean;
  despair: boolean;
}

export class Jaramarana extends Nidana {
  readonly name = 'Jaramarana';
  readonly sanskritName = 'Jarāmaraṇa';
  readonly position = 12;
  readonly temporalSpan = 'future' as const;

  private manifestations: AgingDeathManifestations = {
    aging: false,
    death: false,
    sorrow: false,
    lamentation: false,
    pain: false,
    grief: false,
    despair: false
  };

  protected onArise(): void {
    // All manifestations arise together
    this.manifestations = {
      aging: true,
      death: true,
      sorrow: true,
      lamentation: true,
      pain: true,
      grief: true,
      despair: true
    };
    // This is the end of the chain - no next link
  }

  getExplanation(): NidanaExplanation {
    return {
      name: this.name,
      meaning: 'Aging and death - the inevitable result of birth. Also includes sorrow, lamentation, pain, grief, and despair. The culmination of suffering.',
      conditionedBy: 'Jati (birth)',
      conditions: 'Nothing - this is the end. But the cycle continues with fresh ignorance...',
      howToBreak: 'When birth does not occur, neither does aging and death. End the cycle at its root.'
    };
  }

  /**
   * Get current manifestations
   */
  getManifestations(): AgingDeathManifestations {
    return { ...this.manifestations };
  }

  /**
   * Check if specific manifestation is present
   */
  hasManifested(type: keyof AgingDeathManifestations): boolean {
    return this.manifestations[type];
  }

  /**
   * Get all active manifestations
   */
  getActiveManifestations(): string[] {
    return Object.entries(this.manifestations)
      .filter(([_, active]) => active)
      .map(([name]) => name);
  }

  /**
   * The complete suffering formula
   */
  static getCompleteSufferingFormula(): string {
    return `
THE COMPLETE MASS OF SUFFERING

With birth as condition, there arise:
- JARA (Aging) - the decay of faculties, weakening
- MARANA (Death) - the ending of the life faculty
- SOKA (Sorrow) - inner grief and dejection
- PARIDEVA (Lamentation) - vocal expression of grief
- DUKKHA (Pain) - bodily suffering
- DOMANASSA (Grief) - mental suffering
- UPAYASA (Despair) - utter hopelessness

"Thus is the origin of this whole mass of suffering."

This is the First Noble Truth in full detail.
This is what the Buddha saw under the Bodhi tree.
This is what motivates the path to liberation.
    `.trim();
  }

  /**
   * Explain the circularity of the chain
   */
  static explainCircularity(): string {
    return `
THE CIRCLE OF DEPENDENT ORIGINATION

The chain does not end with aging and death.
Fueled by ignorance, it continues:

Aging/Death → (in the dying moment) →
→ Ignorance (not seeing things as they are) →
→ Formations (new karmic impulses) →
→ Consciousness (descending into new existence) →
→ ... the cycle continues ...

This is SAMSARA - the wheel of existence.
Round and round, beginningless.

THE WAY OUT:
Break the chain at any point.
Most effectively at Craving (link 8).
When craving ceases, clinging ceases.
When clinging ceases, becoming ceases.
When becoming ceases, birth ceases.
When birth ceases, aging and death cease.

"Thus is the cessation of this whole mass of suffering."
    `.trim();
  }
}
