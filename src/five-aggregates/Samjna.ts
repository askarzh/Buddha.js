/**
 * Samjna - Perception/Recognition (Aggregate 3)
 *
 * The perception aggregate - the recognition and labeling function.
 * Samjna identifies, classifies, and names experience.
 *
 * "This is red." "That is a tree." "He is my friend."
 * Perception creates the conceptual overlay on raw experience.
 */

import { Skandha } from './Skandha';
import { SenseBase } from '../utils/types';

export interface PerceptionState {
  currentLabel: string;
  source: SenseBase;
  confidence: number; // 0-10
}

export interface PerceptionRecord {
  object: unknown;
  label: string;
  source: SenseBase;
  timestamp: number;
}

/**
 * Samjna - The Perception Aggregate
 */
export class Samjna extends Skandha {
  readonly name = 'Samjna';
  readonly sanskritName = 'Saṃjñā';
  readonly position = 3;
  readonly category = 'mental' as const;

  protected state: PerceptionState = {
    currentLabel: '',
    source: 'mind',
    confidence: 0
  };

  /** Memory of past perceptions for recognition */
  private perceptionMemory: Map<string, string> = new Map();

  /** History of perceptions */
  private perceptionHistory: PerceptionRecord[] = [];

  constructor() {
    super();
    this.arise();
  }

  /**
   * Update perception state
   */
  update(input: Partial<PerceptionState>): void {
    if (input.currentLabel !== undefined) {
      this.state.currentLabel = input.currentLabel;
    }
    if (input.source !== undefined) {
      this.state.source = input.source;
    }
    if (input.confidence !== undefined) {
      this.state.confidence = Math.min(10, Math.max(0, input.confidence));
    }
  }

  /**
   * Recognize and label an object
   */
  recognize(object: unknown): string {
    // Convert object to a key for lookup
    const key = typeof object === 'object' ?
      JSON.stringify(object) :
      String(object);

    // Check if we've seen this before
    let label = this.perceptionMemory.get(key);

    if (!label) {
      // Generate a new label
      label = this.generateLabel(object);
      this.perceptionMemory.set(key, label);
    }

    this.state = {
      currentLabel: label,
      source: 'mind',
      confidence: this.perceptionMemory.has(key) ? 8 : 5
    };

    this.perceptionHistory.push({
      object,
      label,
      source: 'mind',
      timestamp: Date.now()
    });

    return label;
  }

  /**
   * Generate a label for an unknown object
   */
  private generateLabel(object: unknown): string {
    if (typeof object === 'string') return object;
    if (typeof object === 'number') return `number:${object}`;
    if (typeof object === 'boolean') return object ? 'true' : 'false';
    if (object === null) return 'nothing';
    if (object === undefined) return 'undefined';
    if (Array.isArray(object)) return `collection[${object.length}]`;
    if (typeof object === 'object') {
      const keys = Object.keys(object as object);
      return keys.length > 0 ? `object:${keys[0]}...` : 'empty-object';
    }
    return 'unknown';
  }

  /**
   * Learn a new perception (training the recognition)
   */
  learn(object: unknown, label: string): void {
    const key = typeof object === 'object' ?
      JSON.stringify(object) :
      String(object);
    this.perceptionMemory.set(key, label);
  }

  /**
   * Get current perception state
   */
  getState(): PerceptionState {
    return { ...this.state };
  }

  /**
   * Get perception history
   */
  getHistory(count = 10): PerceptionRecord[] {
    return this.perceptionHistory.slice(-count);
  }

  /**
   * Get the current label
   */
  getCurrentLabel(): string {
    return this.state.currentLabel;
  }

  /**
   * Clear current perception
   */
  clear(): void {
    this.state = {
      currentLabel: '',
      source: 'mind',
      confidence: 0
    };
  }

  /**
   * Explanation of perception
   */
  static explainPerception(): string {
    return `
PERCEPTION (Samjna/Sanna)

Perception is the mental function that:
- Recognizes objects
- Labels and categorizes experience
- Recalls past associations
- Creates the conceptual world

Examples:
- Seeing red and knowing "this is red"
- Hearing a sound and knowing "this is a voice"
- Remembering "this person is my friend"

The nature of perception:
- It is a CONSTRUCTION, not a direct seeing
- It is based on past experience and conditioning
- It can be mistaken (misperception)
- It creates the "story" of experience

Perception is NOT self because:
- It arises and passes
- It is conditioned by memory and context
- It often operates without our control
- It can be trained and changed

The practice: See perception AS perception.
Notice the labeling function at work.
    `.trim();
  }
}
