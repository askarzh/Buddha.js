/**
 * MeditationTimer — Real-time Meditation Session Tracker
 *
 * Tracks meditation sessions by recording "mindful moments" (check-ins)
 * versus periods of distraction. Uses an injectable Clock interface
 * for testability — defaults to wall-clock time (Date.now).
 *
 * Based on the practice of sati (mindfulness): the quality of meditation
 * is measured not by absence of distraction, but by how quickly one
 * recognizes distraction and returns to presence.
 */

import {
  Clock,
  MeditationTimerOptions,
  MeditationSession,
  MeditationQuality,
  DistractionPeriod,
} from '../utils/types';

/** Default clock using Date.now */
const DEFAULT_CLOCK: Clock = { now: () => Date.now() };

/** Expected check-in interval in seconds (used for mindfulness ratio) */
const EXPECTED_INTERVAL = 30;

/** Threshold in seconds — gaps longer than this are distraction periods */
const DISTRACTION_THRESHOLD = 30;

export class MeditationTimer {
  private readonly duration: number;
  private readonly intervalBell: number | undefined;
  private readonly onBell: (() => void) | undefined;
  private readonly clock: Clock;

  private startTime: number | null = null;
  private checkInTimes: number[] = [];
  private running = false;
  private lastBellTime = 0;

  constructor(options: MeditationTimerOptions) {
    if (options.duration <= 0) {
      throw new Error('Duration must be positive.');
    }
    this.duration = options.duration;
    this.intervalBell = options.intervalBell;
    this.onBell = options.onBell;
    this.clock = options.clock ?? DEFAULT_CLOCK;
  }

  /**
   * Begin the meditation session.
   */
  start(): void {
    if (this.running) {
      throw new Error('Timer is already running.');
    }
    this.startTime = this.clock.now();
    this.checkInTimes = [];
    this.running = true;
    this.lastBellTime = 0;
  }

  /**
   * Record a mindful moment — "I am present."
   */
  checkIn(): void {
    if (!this.running || this.startTime === null) {
      throw new Error('Timer is not running. Call start() first.');
    }
    const elapsed = this.getElapsedSeconds();
    this.checkInTimes.push(elapsed);
    this.checkIntervalBell(elapsed);
  }

  /**
   * End the session and return the analysis.
   */
  stop(): MeditationSession {
    if (!this.running || this.startTime === null) {
      throw new Error('Timer is not running.');
    }

    const elapsed = this.getElapsedSeconds();
    this.running = false;

    const actualDuration = Math.min(elapsed, this.duration);
    const distractionPeriods = this.computeDistractionPeriods(actualDuration);
    const longestDistraction = this.computeLongestGap(actualDuration);
    const expectedCheckIns = Math.floor(actualDuration / EXPECTED_INTERVAL);
    const mindfulnessRatio = expectedCheckIns > 0
      ? Math.min(1, this.checkInTimes.length / expectedCheckIns)
      : 0;

    return {
      duration: actualDuration,
      checkIns: [...this.checkInTimes],
      mindfulMoments: this.checkInTimes.length,
      distractionPeriods,
      longestDistraction,
      mindfulnessRatio,
      quality: this.assessQuality(mindfulnessRatio),
    };
  }

  /**
   * Is the timer currently running?
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Seconds elapsed since start. Returns 0 if not started.
   */
  getElapsedSeconds(): number {
    if (this.startTime === null) return 0;
    return Math.round((this.clock.now() - this.startTime) / 1000);
  }

  /**
   * Seconds remaining in the session. Returns full duration if not started.
   */
  getRemainingSeconds(): number {
    return Math.max(0, this.duration - this.getElapsedSeconds());
  }

  private checkIntervalBell(elapsed: number): void {
    if (!this.intervalBell || !this.onBell) return;
    while (this.lastBellTime + this.intervalBell <= elapsed) {
      this.lastBellTime += this.intervalBell;
      this.onBell();
    }
  }

  private computeGaps(totalDuration: number): { start: number; end: number; duration: number }[] {
    const points = [0, ...this.checkInTimes, totalDuration];
    const gaps: { start: number; end: number; duration: number }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      gaps.push({
        start: points[i],
        end: points[i + 1],
        duration: points[i + 1] - points[i],
      });
    }

    return gaps;
  }

  private computeDistractionPeriods(totalDuration: number): DistractionPeriod[] {
    return this.computeGaps(totalDuration)
      .filter(gap => gap.duration > DISTRACTION_THRESHOLD);
  }

  private computeLongestGap(totalDuration: number): number {
    const gaps = this.computeGaps(totalDuration);
    return gaps.length > 0 ? Math.max(...gaps.map(g => g.duration)) : 0;
  }

  private assessQuality(ratio: number): MeditationQuality {
    if (ratio >= 0.75) return 'absorbed';
    if (ratio >= 0.5) return 'sustained';
    if (ratio >= 0.25) return 'intermittent';
    return 'scattered';
  }
}
