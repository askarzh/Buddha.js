/**
 * Bhava - Becoming (Link 10)
 *
 * Conditioned by clinging, becoming arises.
 * Bhava is the process by which we create our existence -
 * the karmic momentum that propels us into continued being.
 *
 * Three realms of becoming:
 * - Kama-bhava: Sensory realm
 * - Rupa-bhava: Form realm
 * - Arupa-bhava: Formless realm
 */

import { Nidana, NidanaExplanation } from '../Nidana';
import { KarmaQuality } from '../../utils/types';

export type BecomingRealm = 'sensory' | 'form' | 'formless';

export interface BecomingProcess {
  realm: BecomingRealm;
  quality: KarmaQuality;
  momentum: number; // 1-10
  description: string;
}

export class Bhava extends Nidana {
  readonly name = 'Bhava';
  readonly sanskritName = 'Bhava';
  readonly position = 10;
  readonly temporalSpan = 'present' as const;

  private becomingProcesses: BecomingProcess[] = [];
  private currentMomentum = 0;

  getExplanation(): NidanaExplanation {
    return {
      name: this.name,
      meaning: 'Becoming - the process of existence being created through clinging. The karmic momentum that propels us toward birth.',
      conditionedBy: 'Upadana (clinging)',
      conditions: 'Jati (birth)',
      howToBreak: 'When clinging ceases, becoming ceases. Without fuel (upadana), the fire of becoming goes out.'
    };
  }

  /**
   * Add a becoming process
   */
  addBecoming(realm: BecomingRealm, quality: KarmaQuality, momentum: number, description: string): BecomingProcess {
    const process: BecomingProcess = {
      realm,
      quality,
      momentum: Math.min(10, Math.max(1, momentum)),
      description
    };
    this.becomingProcesses.push(process);
    this.currentMomentum += process.momentum;
    return process;
  }

  /**
   * Get current karmic momentum
   */
  getMomentum(): number {
    return this.currentMomentum;
  }

  /**
   * Get all becoming processes
   */
  getProcesses(): BecomingProcess[] {
    return [...this.becomingProcesses];
  }

  /**
   * Get processes by realm
   */
  getProcessesByRealm(realm: BecomingRealm): BecomingProcess[] {
    return this.becomingProcesses.filter(p => p.realm === realm);
  }

  /**
   * Reduce momentum (through practice)
   */
  reduceMomentum(amount: number): void {
    this.currentMomentum = Math.max(0, this.currentMomentum - amount);
  }

  /**
   * Explain the three realms
   */
  static explainRealms(): string {
    return `
THE THREE REALMS OF BECOMING (Bhava)

1. KAMA-BHAVA (Sensory Realm)
   - Existence dominated by sense desires
   - Includes humans, animals, hungry ghosts, hell beings
   - Also lower celestial realms
   - Most beings exist here

2. RUPA-BHAVA (Form Realm)
   - Existence with subtle form but no sense desires
   - Attained through jhana practice
   - Celestial realms of form
   - Still impermanent

3. ARUPA-BHAVA (Formless Realm)
   - Existence without any form
   - Attained through formless absorptions
   - Highest celestial realms
   - Still within samsara, still impermanent

ALL THREE REALMS are within conditioned existence.
ALL THREE involve suffering.
Liberation transcends all realms of becoming.
    `.trim();
  }

  /**
   * Explain the two aspects of bhava
   */
  static explainTwoAspects(): string {
    return `
TWO ASPECTS OF BHAVA:

1. KAMMA-BHAVA (Karmic Becoming)
   - The active process of creating karma
   - Intentions and volitions that shape future
   - The "doing" aspect of becoming

2. UPAPATTI-BHAVA (Resultant Becoming)
   - The passive process of receiving results
   - Being born into certain conditions
   - The "receiving" aspect of becoming

Together they form the cycle:
Actions → Results → Conditions for more actions
    `.trim();
  }
}
