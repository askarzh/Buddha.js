/**
 * Karmic Event System
 *
 * Models karma as an event system where actions create consequences
 * with delayed execution, similar to how karmic seeds ripen when
 * conditions are right.
 *
 * Key concepts:
 * - KarmicSeed: Potential energy stored from intentional action
 * - Ālaya (Store): Repository of karmic seeds awaiting ripening
 * - Ripening: When conditions align, seeds produce results
 * - Vipāka: The experienced result of ripened karma
 *
 * "The seeds we plant today become the fruits we harvest tomorrow."
 */

import { generateId, KarmaQuality, FeelingTone, Intensity, UnwholesomeRoot, WholesomeRoot, KarmicSeedData, KarmicStoreData } from '../utils/types';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/** Types of karmic actions */
export type KarmaType = 'bodily' | 'verbal' | 'mental';

/** Timing for karmic ripening */
export type RipeningTiming =
  | 'immediate'        // Ripens in this lifetime, soon
  | 'deferred'         // Ripens in this lifetime, later
  | 'next-life'        // Ripens in the next existence
  | 'distant-future';  // Ripens in future existences

/** Strength categories */
export type KarmaStrength = 'weak' | 'moderate' | 'strong' | 'weighty';

/** Events emitted by the karmic system */
export type KarmicEventType =
  | 'seed:planted'       // Action created karmic potential
  | 'seed:strengthened'  // Repeated action increased potency
  | 'seed:weakened'      // Counter-action reduced potency
  | 'seed:ripening'      // Conditions met, beginning to manifest
  | 'seed:ripened'       // Result has manifested
  | 'seed:exhausted'     // Karmic potential fully spent
  | 'seed:purified'      // Seed neutralized through practice
  | 'store:overflow'     // Too many seeds (for simulation limits)
  | 'collective:formed'; // Collective karma established

/** A karmic seed - the potential energy from an action */
export interface KarmicSeed {
  readonly id: string;
  readonly createdAt: number;

  // Action characteristics
  readonly type: KarmaType;
  readonly quality: KarmaQuality;
  readonly description: string;

  // Intention behind the action
  readonly intentionStrength: Intensity;
  readonly root: UnwholesomeRoot | WholesomeRoot | 'neutral';

  // Potency
  potency: number;              // Current strength (can change)
  readonly originalPotency: number;
  readonly strength: KarmaStrength;

  // Ripening configuration
  readonly ripeningTiming: RipeningTiming;
  readonly minDelay: number;    // Minimum ms before can ripen
  readonly maxDelay: number;    // Maximum ms to ripen (or expires)
  ripeningConditions: RipeningCondition[];

  // State
  state: 'dormant' | 'active' | 'ripening' | 'ripened' | 'exhausted' | 'purified';
  ripeningProgress: number;     // 0-100
  timesRipened: number;         // Some seeds can ripen multiple times
  maxRipenings: number;         // How many times this seed can produce results

  // Metadata
  tags: string[];
  collectiveId?: string;        // If part of collective karma
}

/** Conditions required for a seed to ripen */
export interface RipeningCondition {
  type: 'time' | 'state' | 'trigger' | 'random' | 'accumulation';
  name?: string;
  description: string;
  check: () => boolean;
  weight: number;  // How important this condition is (0-1)
}

/** Result produced when karma ripens */
export interface KarmicVipaka {
  readonly id: string;
  readonly seedId: string;
  readonly timestamp: number;
  readonly quality: FeelingTone;
  readonly intensity: Intensity;
  readonly description: string;
  readonly isPartial: boolean;  // Seed may ripen again
}

/** Event payload */
export interface KarmicEvent {
  type: KarmicEventType;
  timestamp: number;
  seed?: KarmicSeed;
  vipaka?: KarmicVipaka;
  metadata?: Record<string, unknown>;
}

/** Event listener function */
export type KarmicEventListener = (event: KarmicEvent) => void;

/** Configuration for the karmic store */
export interface KarmicStoreConfig {
  maxSeeds?: number;              // Maximum seeds to store
  defaultMinDelay?: number;       // Default minimum ripening delay
  defaultMaxDelay?: number;       // Default maximum ripening delay
  ripeningCheckInterval?: number; // How often to check for ripening
  enableAutoRipening?: boolean;   // Automatically process ripening
  timeScale?: number;             // Speed up/slow down time (1 = realtime)
}

// =============================================================================
// KARMIC SEED FACTORY
// =============================================================================

export interface CreateSeedOptions {
  type?: KarmaType;
  quality: KarmaQuality;
  description: string;
  intentionStrength?: Intensity;
  root?: UnwholesomeRoot | WholesomeRoot;
  ripeningTiming?: RipeningTiming;
  minDelay?: number;
  maxDelay?: number;
  conditions?: RipeningCondition[];
  potency?: number;
  maxRipenings?: number;
  tags?: string[];
  collectiveId?: string;
}

/**
 * Create a karmic seed with sensible defaults
 */
export function createKarmicSeed(options: CreateSeedOptions): KarmicSeed {
  const {
    type = 'mental',
    quality,
    description,
    intentionStrength = 5,
    root = 'neutral',
    ripeningTiming = 'deferred',
    minDelay = 1000,
    maxDelay = 60000,
    conditions = [],
    potency,
    maxRipenings = 1,
    tags = [],
    collectiveId
  } = options;

  // Calculate potency based on intention strength if not provided
  const calculatedPotency = potency ?? intentionStrength * 10;

  // Determine strength category
  const strength: KarmaStrength =
    calculatedPotency >= 80 ? 'weighty' :
    calculatedPotency >= 50 ? 'strong' :
    calculatedPotency >= 25 ? 'moderate' : 'weak';

  return {
    id: generateId(),
    createdAt: Date.now(),
    type,
    quality,
    description,
    intentionStrength,
    root,
    potency: calculatedPotency,
    originalPotency: calculatedPotency,
    strength,
    ripeningTiming,
    minDelay,
    maxDelay,
    ripeningConditions: conditions,
    state: 'dormant',
    ripeningProgress: 0,
    timesRipened: 0,
    maxRipenings,
    tags,
    collectiveId
  };
}

// =============================================================================
// KARMIC STORE (ĀLAYA-VIJÑĀNA)
// =============================================================================

/**
 * KarmicStore - The storehouse consciousness for karmic seeds
 *
 * In Yogācāra Buddhism, the ālaya-vijñāna stores karmic seeds until
 * they ripen. This class models that function as an event-driven system.
 */
export class KarmicStore {
  private seeds: Map<string, KarmicSeed> = new Map();
  private listeners: Map<KarmicEventType, Set<KarmicEventListener>> = new Map();
  private ripeningTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private config: Required<KarmicStoreConfig>;
  private conditionRegistry: Map<string, () => boolean> = new Map();

  constructor(config: KarmicStoreConfig = {}) {
    this.config = {
      maxSeeds: config.maxSeeds ?? 1000,
      defaultMinDelay: config.defaultMinDelay ?? 1000,
      defaultMaxDelay: config.defaultMaxDelay ?? 300000,
      ripeningCheckInterval: config.ripeningCheckInterval ?? 1000,
      enableAutoRipening: config.enableAutoRipening ?? true,
      timeScale: config.timeScale ?? 1
    };

    if (this.config.enableAutoRipening) {
      this.startRipeningCheck();
    }
  }

  // ===========================================================================
  // SEED MANAGEMENT
  // ===========================================================================

  /**
   * Plant a karmic seed (perform an intentional action)
   */
  plantSeed(options: CreateSeedOptions): KarmicSeed {
    // Check capacity
    if (this.seeds.size >= this.config.maxSeeds) {
      this.emit({
        type: 'store:overflow',
        timestamp: Date.now(),
        metadata: { currentSize: this.seeds.size, maxSize: this.config.maxSeeds }
      });
      // Remove oldest exhausted or weakest seed
      this.pruneOldestSeed();
    }

    const seed = createKarmicSeed({
      ...options,
      minDelay: options.minDelay ?? this.config.defaultMinDelay,
      maxDelay: options.maxDelay ?? this.config.defaultMaxDelay
    });

    seed.state = 'active';
    this.seeds.set(seed.id, seed);

    this.emit({
      type: 'seed:planted',
      timestamp: Date.now(),
      seed
    });

    // Schedule potential ripening
    this.scheduleRipening(seed);

    return seed;
  }

  /**
   * Strengthen an existing seed (repeat the action)
   */
  strengthenSeed(seedId: string, amount: number = 10): boolean {
    const seed = this.seeds.get(seedId);
    if (!seed || seed.state === 'exhausted' || seed.state === 'purified') {
      return false;
    }

    seed.potency = Math.min(100, seed.potency + amount);

    this.emit({
      type: 'seed:strengthened',
      timestamp: Date.now(),
      seed,
      metadata: { amountAdded: amount, newPotency: seed.potency }
    });

    return true;
  }

  /**
   * Weaken a seed (counter-action, regret, confession)
   */
  weakenSeed(seedId: string, amount: number = 10): boolean {
    const seed = this.seeds.get(seedId);
    if (!seed || seed.state === 'exhausted' || seed.state === 'purified') {
      return false;
    }

    seed.potency = Math.max(0, seed.potency - amount);

    this.emit({
      type: 'seed:weakened',
      timestamp: Date.now(),
      seed,
      metadata: { amountReduced: amount, newPotency: seed.potency }
    });

    // If potency reaches 0, seed is effectively purified
    if (seed.potency === 0) {
      seed.state = 'purified';
      this.emit({
        type: 'seed:purified',
        timestamp: Date.now(),
        seed
      });
    }

    return true;
  }

  /**
   * Purify a seed completely (through realization/wisdom)
   */
  purifySeed(seedId: string): boolean {
    const seed = this.seeds.get(seedId);
    if (!seed || seed.state === 'exhausted' || seed.state === 'purified') {
      return false;
    }

    seed.state = 'purified';
    seed.potency = 0;

    // Cancel any scheduled ripening
    const timer = this.ripeningTimers.get(seedId);
    if (timer) {
      clearTimeout(timer);
      this.ripeningTimers.delete(seedId);
    }

    this.emit({
      type: 'seed:purified',
      timestamp: Date.now(),
      seed
    });

    return true;
  }

  /**
   * Get a seed by ID
   */
  getSeed(seedId: string): KarmicSeed | undefined {
    return this.seeds.get(seedId);
  }

  /**
   * Get all seeds matching criteria
   */
  getSeeds(filter?: Partial<Pick<KarmicSeed, 'quality' | 'state' | 'type'>>): KarmicSeed[] {
    let results = Array.from(this.seeds.values());

    if (filter) {
      if (filter.quality) {
        results = results.filter(s => s.quality === filter.quality);
      }
      if (filter.state) {
        results = results.filter(s => s.state === filter.state);
      }
      if (filter.type) {
        results = results.filter(s => s.type === filter.type);
      }
    }

    return results;
  }

  /**
   * Get seeds by tag
   */
  getSeedsByTag(tag: string): KarmicSeed[] {
    return Array.from(this.seeds.values()).filter(s => s.tags.includes(tag));
  }

  // ===========================================================================
  // RIPENING MECHANICS
  // ===========================================================================

  /**
   * Schedule a seed for potential ripening
   */
  private scheduleRipening(seed: KarmicSeed): void {
    // Immediate karma ripens right away
    if (seed.ripeningTiming === 'immediate') {
      setTimeout(() => this.attemptRipening(seed.id), seed.minDelay * this.config.timeScale);
      return;
    }

    // Calculate delay based on timing type
    const baseDelay = seed.minDelay + Math.random() * (seed.maxDelay - seed.minDelay);
    const scaledDelay = baseDelay / this.config.timeScale;

    const timer = setTimeout(() => {
      this.attemptRipening(seed.id);
    }, scaledDelay);

    this.ripeningTimers.set(seed.id, timer);
  }

  /**
   * Attempt to ripen a seed (check conditions)
   */
  attemptRipening(seedId: string): KarmicVipaka | null {
    const seed = this.seeds.get(seedId);
    if (!seed) return null;

    // Can't ripen if not active
    if (seed.state !== 'active') return null;

    // Check if enough time has passed
    const elapsed = Date.now() - seed.createdAt;
    if (elapsed < seed.minDelay) return null;

    // Check ripening conditions
    if (!this.checkRipeningConditions(seed)) {
      // Reschedule for later
      this.scheduleRipening(seed);
      return null;
    }

    // Begin ripening
    return this.ripenSeed(seed);
  }

  /**
   * Check if ripening conditions are met
   */
  private checkRipeningConditions(seed: KarmicSeed): boolean {
    if (seed.ripeningConditions.length === 0) {
      // No conditions, use random chance based on potency
      return Math.random() < (seed.potency / 100);
    }

    // Calculate weighted condition score
    let totalWeight = 0;
    let satisfiedWeight = 0;

    for (const condition of seed.ripeningConditions) {
      totalWeight += condition.weight;
      if (condition.check()) {
        satisfiedWeight += condition.weight;
      }
    }

    // Need at least 50% of weighted conditions satisfied
    const conditionScore = totalWeight > 0 ? satisfiedWeight / totalWeight : 1;
    const potencyFactor = seed.potency / 100;

    // Combined probability
    return Math.random() < (conditionScore * potencyFactor);
  }

  /**
   * Ripen a seed and produce a result
   */
  private ripenSeed(seed: KarmicSeed): KarmicVipaka {
    seed.state = 'ripening';
    seed.ripeningProgress = 50;

    this.emit({
      type: 'seed:ripening',
      timestamp: Date.now(),
      seed
    });

    // Calculate result
    const vipaka = this.createVipaka(seed);

    // Update seed state
    seed.timesRipened++;
    seed.ripeningProgress = 100;

    if (seed.timesRipened >= seed.maxRipenings) {
      seed.state = 'exhausted';
      this.emit({
        type: 'seed:exhausted',
        timestamp: Date.now(),
        seed
      });
    } else {
      // Reduce potency for partial ripening
      seed.potency = Math.max(0, seed.potency - (seed.originalPotency / seed.maxRipenings));
      seed.state = 'active';
      // Reschedule for potential future ripening
      this.scheduleRipening(seed);
    }

    seed.state = seed.timesRipened >= seed.maxRipenings ? 'ripened' : 'active';

    this.emit({
      type: 'seed:ripened',
      timestamp: Date.now(),
      seed,
      vipaka
    });

    return vipaka;
  }

  /**
   * Create a vipaka (result) from a seed
   */
  private createVipaka(seed: KarmicSeed): KarmicVipaka {
    // Map quality to feeling tone
    const quality: FeelingTone =
      seed.quality === 'wholesome' ? 'pleasant' :
      seed.quality === 'unwholesome' ? 'unpleasant' : 'neutral';

    // Calculate intensity based on remaining potency
    const intensityRatio = seed.potency / 100;
    const intensity = Math.max(1, Math.round(seed.intentionStrength * intensityRatio)) as Intensity;

    return {
      id: generateId(),
      seedId: seed.id,
      timestamp: Date.now(),
      quality,
      intensity,
      description: `Result of ${seed.quality} ${seed.type} karma: ${seed.description}`,
      isPartial: seed.timesRipened < seed.maxRipenings
    };
  }

  /**
   * Force ripening of a specific seed (for testing/simulation)
   */
  forceRipen(seedId: string): KarmicVipaka | null {
    const seed = this.seeds.get(seedId);
    if (!seed || seed.state === 'exhausted' || seed.state === 'purified') {
      return null;
    }

    seed.state = 'active'; // Ensure it can ripen
    return this.ripenSeed(seed);
  }

  /**
   * Process all seeds that are ready to ripen
   */
  processRipeningQueue(): KarmicVipaka[] {
    const results: KarmicVipaka[] = [];
    const now = Date.now();

    for (const seed of this.seeds.values()) {
      if (seed.state !== 'active') continue;

      const elapsed = now - seed.createdAt;
      if (elapsed >= seed.minDelay && elapsed <= seed.maxDelay) {
        const vipaka = this.attemptRipening(seed.id);
        if (vipaka) {
          results.push(vipaka);
        }
      } else if (elapsed > seed.maxDelay) {
        // Seed expired without ripening (rare, but possible)
        seed.state = 'exhausted';
        this.emit({
          type: 'seed:exhausted',
          timestamp: now,
          seed,
          metadata: { reason: 'expired' }
        });
      }
    }

    return results;
  }

  // ===========================================================================
  // EVENT SYSTEM
  // ===========================================================================

  /**
   * Subscribe to karmic events
   */
  on(eventType: KarmicEventType, listener: KarmicEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => this.off(eventType, listener);
  }

  /**
   * Subscribe to all events
   */
  onAny(listener: KarmicEventListener): () => void {
    const eventTypes: KarmicEventType[] = [
      'seed:planted', 'seed:strengthened', 'seed:weakened',
      'seed:ripening', 'seed:ripened', 'seed:exhausted',
      'seed:purified', 'store:overflow', 'collective:formed'
    ];

    const unsubscribers = eventTypes.map(type => this.on(type, listener));

    return () => unsubscribers.forEach(unsub => unsub());
  }

  /**
   * Unsubscribe from events
   */
  off(eventType: KarmicEventType, listener: KarmicEventListener): void {
    this.listeners.get(eventType)?.delete(listener);
  }

  /**
   * Emit an event
   */
  private emit(event: KarmicEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in karmic event listener for ${event.type}:`, error);
        }
      });
    }
  }

  /**
   * Wait for a specific event (Promise-based)
   */
  once(eventType: KarmicEventType): Promise<KarmicEvent> {
    return new Promise(resolve => {
      const unsub = this.on(eventType, (event) => {
        unsub();
        resolve(event);
      });
    });
  }

  /**
   * Wait for a seed to ripen
   */
  waitForRipening(seedId: string, timeout?: number): Promise<KarmicVipaka | null> {
    return new Promise((resolve) => {
      const seed = this.seeds.get(seedId);
      if (!seed || seed.state === 'exhausted' || seed.state === 'purified') {
        resolve(null);
        return;
      }

      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const unsub = this.on('seed:ripened', (event) => {
        if (event.seed?.id === seedId && event.vipaka) {
          unsub();
          if (timeoutId) clearTimeout(timeoutId);
          resolve(event.vipaka);
        }
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          unsub();
          resolve(null);
        }, timeout);
      }
    });
  }

  // ===========================================================================
  // COLLECTIVE KARMA
  // ===========================================================================

  /**
   * Create collective karma (shared by a group)
   */
  createCollectiveKarma(
    participants: string[],
    options: Omit<CreateSeedOptions, 'collectiveId'>
  ): KarmicSeed[] {
    const collectiveId = generateId();
    const seeds: KarmicSeed[] = [];

    // Each participant gets their own seed linked to the collective
    for (const _participant of participants) {
      const seed = this.plantSeed({
        ...options,
        collectiveId,
        tags: [...(options.tags ?? []), 'collective']
      });
      seeds.push(seed);
    }

    this.emit({
      type: 'collective:formed',
      timestamp: Date.now(),
      metadata: {
        collectiveId,
        participantCount: participants.length,
        quality: options.quality
      }
    });

    return seeds;
  }

  /**
   * Get all seeds in a collective
   */
  getCollectiveSeeds(collectiveId: string): KarmicSeed[] {
    return Array.from(this.seeds.values()).filter(s => s.collectiveId === collectiveId);
  }

  // ===========================================================================
  // STATISTICS AND ANALYSIS
  // ===========================================================================

  /**
   * Get karmic balance summary
   */
  getKarmicBalance(): {
    wholesome: number;
    unwholesome: number;
    neutral: number;
    balance: number;
    totalPotency: number;
  } {
    let wholesome = 0;
    let unwholesome = 0;
    let neutral = 0;
    let totalPotency = 0;

    for (const seed of this.seeds.values()) {
      if (seed.state === 'exhausted' || seed.state === 'purified') continue;

      totalPotency += seed.potency;

      switch (seed.quality) {
        case 'wholesome':
          wholesome += seed.potency;
          break;
        case 'unwholesome':
          unwholesome += seed.potency;
          break;
        default:
          neutral += seed.potency;
      }
    }

    return {
      wholesome,
      unwholesome,
      neutral,
      balance: wholesome - unwholesome,
      totalPotency
    };
  }

  /**
   * Get detailed statistics
   */
  getStatistics(): {
    totalSeeds: number;
    byState: Record<KarmicSeed['state'], number>;
    byQuality: Record<KarmaQuality, number>;
    byType: Record<KarmaType, number>;
    averagePotency: number;
    oldestSeed: number | null;
    newestSeed: number | null;
  } {
    const seeds = Array.from(this.seeds.values());

    const byState: Record<KarmicSeed['state'], number> = {
      dormant: 0, active: 0, ripening: 0, ripened: 0, exhausted: 0, purified: 0
    };
    const byQuality: Record<KarmaQuality, number> = {
      wholesome: 0, unwholesome: 0, neutral: 0
    };
    const byType: Record<KarmaType, number> = {
      bodily: 0, verbal: 0, mental: 0
    };

    let totalPotency = 0;

    for (const seed of seeds) {
      byState[seed.state]++;
      byQuality[seed.quality]++;
      byType[seed.type]++;
      totalPotency += seed.potency;
    }

    const timestamps = seeds.map(s => s.createdAt);

    return {
      totalSeeds: seeds.length,
      byState,
      byQuality,
      byType,
      averagePotency: seeds.length > 0 ? totalPotency / seeds.length : 0,
      oldestSeed: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestSeed: timestamps.length > 0 ? Math.max(...timestamps) : null
    };
  }

  // ===========================================================================
  // LIFECYCLE MANAGEMENT
  // ===========================================================================

  /**
   * Start automatic ripening checks
   */
  startRipeningCheck(): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.processRipeningQueue();
    }, this.config.ripeningCheckInterval);
  }

  /**
   * Stop automatic ripening checks
   */
  stopRipeningCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Remove oldest/weakest seed to make room
   */
  private pruneOldestSeed(): void {
    // First try to remove exhausted/purified seeds
    for (const [id, seed] of this.seeds.entries()) {
      if (seed.state === 'exhausted' || seed.state === 'purified') {
        this.seeds.delete(id);
        return;
      }
    }

    // Otherwise remove weakest active seed
    let weakest: KarmicSeed | null = null;
    for (const seed of this.seeds.values()) {
      if (!weakest || seed.potency < weakest.potency) {
        weakest = seed;
      }
    }
    if (weakest) {
      this.seeds.delete(weakest.id);
    }
  }

  /**
   * Clear all seeds and timers
   */
  clear(): void {
    // Clear all timers
    for (const timer of this.ripeningTimers.values()) {
      clearTimeout(timer);
    }
    this.ripeningTimers.clear();

    // Clear seeds
    this.seeds.clear();
  }

  /**
   * Dispose of the store
   */
  dispose(): void {
    this.stopRipeningCheck();
    this.clear();
    this.listeners.clear();
  }

  /**
   * Set time scale (for simulation speed)
   */
  setTimeScale(scale: number): void {
    this.config.timeScale = Math.max(0.1, scale);
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  toJSON(): KarmicStoreData {
    const seeds: KarmicSeedData[] = Array.from(this.seeds.values()).map(seed => ({
      id: seed.id,
      createdAt: seed.createdAt,
      type: seed.type,
      quality: seed.quality,
      description: seed.description,
      intentionStrength: seed.intentionStrength,
      root: seed.root,
      potency: seed.potency,
      originalPotency: seed.originalPotency,
      strength: seed.strength,
      ripeningTiming: seed.ripeningTiming,
      minDelay: seed.minDelay,
      maxDelay: seed.maxDelay,
      ripeningConditions: seed.ripeningConditions.map(c => ({
        type: c.type,
        ...(c.name ? { name: c.name } : {}),
        description: c.description,
        weight: c.weight,
      })),
      state: seed.state,
      ripeningProgress: seed.ripeningProgress,
      timesRipened: seed.timesRipened,
      maxRipenings: seed.maxRipenings,
      tags: [...seed.tags],
      ...(seed.collectiveId ? { collectiveId: seed.collectiveId } : {}),
    }));

    return {
      seeds,
      config: { ...this.config },
    };
  }

  static fromJSON(data: KarmicStoreData): KarmicStore {
    const store = new KarmicStore({
      ...data.config,
      enableAutoRipening: false,
    });

    for (const seedData of data.seeds) {
      const conditions: RipeningCondition[] = seedData.ripeningConditions.map(c => ({
        type: c.type,
        ...(c.name ? { name: c.name } : {}),
        description: c.description,
        check: () => false,
        weight: c.weight,
      }));

      const seed: KarmicSeed = {
        id: seedData.id,
        createdAt: seedData.createdAt,
        type: seedData.type,
        quality: seedData.quality,
        description: seedData.description,
        intentionStrength: seedData.intentionStrength,
        root: seedData.root,
        potency: seedData.potency,
        originalPotency: seedData.originalPotency,
        strength: seedData.strength,
        ripeningTiming: seedData.ripeningTiming,
        minDelay: seedData.minDelay,
        maxDelay: seedData.maxDelay,
        ripeningConditions: conditions,
        state: seedData.state,
        ripeningProgress: seedData.ripeningProgress,
        timesRipened: seedData.timesRipened,
        maxRipenings: seedData.maxRipenings,
        tags: [...seedData.tags],
        ...(seedData.collectiveId ? { collectiveId: seedData.collectiveId } : {}),
      };

      store.seeds.set(seed.id, seed);
    }

    store.config = { ...data.config };

    return store;
  }

  rebindConditions(): void {
    for (const seed of this.seeds.values()) {
      for (let i = 0; i < seed.ripeningConditions.length; i++) {
        const condition = seed.ripeningConditions[i];
        if (condition.name) {
          const check = this.conditionRegistry.get(condition.name);
          if (check) {
            seed.ripeningConditions[i] = { ...condition, check };
          }
        }
      }
    }
  }

  // ===========================================================================
  // CONDITION REGISTRY
  // ===========================================================================

  registerCondition(name: string, check: () => boolean): void {
    this.conditionRegistry.set(name, check);
  }

  getCondition(name: string): (() => boolean) | undefined {
    return this.conditionRegistry.get(name);
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Create a simple wholesome karma
 */
export function wholesomeAction(
  description: string,
  intensity: Intensity = 5,
  type: KarmaType = 'mental'
): CreateSeedOptions {
  return {
    type,
    quality: 'wholesome',
    description,
    intentionStrength: intensity,
    root: 'non-greed'
  };
}

/**
 * Create a simple unwholesome karma
 */
export function unwholesomeAction(
  description: string,
  intensity: Intensity = 5,
  root: UnwholesomeRoot = 'greed',
  type: KarmaType = 'mental'
): CreateSeedOptions {
  return {
    type,
    quality: 'unwholesome',
    description,
    intentionStrength: intensity,
    root
  };
}

/**
 * Create immediate karma (ripens quickly)
 */
export function immediateKarma(
  options: CreateSeedOptions
): CreateSeedOptions {
  return {
    ...options,
    ripeningTiming: 'immediate',
    minDelay: 100,
    maxDelay: 5000
  };
}

/**
 * Create weighty karma (very strong, certain to ripen)
 */
export function weightyKarma(
  options: CreateSeedOptions
): CreateSeedOptions {
  return {
    ...options,
    potency: 100,
    intentionStrength: 10,
    maxRipenings: 3  // Weighty karma can ripen multiple times
  };
}

// =============================================================================
// PREDEFINED RIPENING CONDITIONS
// =============================================================================

export const RipeningConditions = {
  /**
   * Condition: A certain amount of time has passed
   */
  afterTime(ms: number): RipeningCondition {
    const startTime = Date.now();
    return {
      type: 'time',
      description: `${ms}ms have passed`,
      check: () => Date.now() - startTime >= ms,
      weight: 1
    };
  },

  /**
   * Condition: Random chance
   */
  randomChance(probability: number): RipeningCondition {
    return {
      type: 'random',
      description: `${probability * 100}% chance`,
      check: () => Math.random() < probability,
      weight: 0.5
    };
  },

  /**
   * Condition: A state variable is true
   */
  whenTrue(getValue: () => boolean, description: string): RipeningCondition {
    return {
      type: 'state',
      description,
      check: getValue,
      weight: 1
    };
  },

  /**
   * Condition: Accumulation threshold reached
   */
  accumulationThreshold(
    getCount: () => number,
    threshold: number,
    description: string
  ): RipeningCondition {
    return {
      type: 'accumulation',
      description: `${description} reaches ${threshold}`,
      check: () => getCount() >= threshold,
      weight: 1
    };
  },

  /**
   * Condition: Similar karma already ripened
   */
  afterSimilarRipens(
    store: KarmicStore,
    quality: KarmaQuality
  ): RipeningCondition {
    let triggered = false;
    store.on('seed:ripened', (event) => {
      if (event.seed?.quality === quality) {
        triggered = true;
      }
    });

    return {
      type: 'trigger',
      description: `After ${quality} karma ripens`,
      check: () => triggered,
      weight: 0.8
    };
  }
};

// =============================================================================
// EXPLANATION
// =============================================================================

/**
 * Explain the karmic event system
 */
export function explainKarmicEventSystem(): string {
  return `
KARMIC EVENT SYSTEM

This system models karma as an event-driven architecture where:
- Actions create "seeds" (potential consequences)
- Seeds are stored in a "storehouse" (ālaya)
- Seeds ripen when conditions are met
- Ripening produces "results" (vipāka)

LIFECYCLE OF A KARMIC SEED:

  Action → [seed:planted] → Dormant
                              ↓
                           Active → [seed:strengthened] (repeated)
                              ↓        [seed:weakened] (counter-action)
                              ↓
  Conditions Met → [seed:ripening] → Ripening
                              ↓
                   [seed:ripened] → Result Manifests
                              ↓
               [seed:exhausted] or continues (partial ripening)

FACTORS AFFECTING RIPENING:

1. POTENCY: Strength of the original intention
2. CONDITIONS: External circumstances that allow ripening
3. TIME: Minimum/maximum delay before ripening
4. REPETITION: Repeated actions strengthen seeds

TYPES OF TIMING:

- Immediate: Ripens soon (within this session)
- Deferred: Ripens later (after some delay)
- Next-life: Would ripen in next existence
- Distant-future: May take many cycles to ripen

KEY PRINCIPLES:

1. No karma is lost - seeds persist until ripened or purified
2. Karma can be weakened through counter-actions
3. Karma can be purified through wisdom/realization
4. Results match the quality of the original action
5. Collective karma affects groups who acted together

EVENT-DRIVEN USAGE:

  const store = new KarmicStore();

  // Listen for ripening
  store.on('seed:ripened', (event) => {
    console.log(\`Karma ripened: \${event.vipaka?.description}\`);
  });

  // Plant a seed
  const seed = store.plantSeed({
    quality: 'wholesome',
    description: 'Act of generosity'
  });

  // Wait for ripening
  const result = await store.waitForRipening(seed.id);
  `.trim();
}
