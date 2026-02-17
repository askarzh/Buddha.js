import { describe, it, expect, beforeEach } from 'vitest';
import { MeditationTimer } from '../../src/meditation/MeditationTimer';
import { Clock } from '../../src/utils/types';

/** Manual clock for deterministic testing */
function createManualClock(startMs = 0): Clock & { advance(seconds: number): void } {
  let current = startMs;
  return {
    now() { return current; },
    advance(seconds: number) { current += seconds * 1000; },
  };
}

describe('MeditationTimer', () => {
  let clock: ReturnType<typeof createManualClock>;
  let timer: MeditationTimer;

  beforeEach(() => {
    clock = createManualClock();
    timer = new MeditationTimer({ duration: 300, clock }); // 5 min session
  });

  describe('initial state', () => {
    it('should not be running before start', () => {
      expect(timer.isRunning()).toBe(false);
    });

    it('should report 0 elapsed seconds before start', () => {
      expect(timer.getElapsedSeconds()).toBe(0);
    });

    it('should report full duration as remaining before start', () => {
      expect(timer.getRemainingSeconds()).toBe(300);
    });
  });

  describe('start()', () => {
    it('should set running to true', () => {
      timer.start();
      expect(timer.isRunning()).toBe(true);
    });

    it('should throw if already running', () => {
      timer.start();
      expect(() => timer.start()).toThrow();
    });
  });

  describe('elapsed and remaining time', () => {
    it('should track elapsed seconds', () => {
      timer.start();
      clock.advance(60);
      expect(timer.getElapsedSeconds()).toBe(60);
    });

    it('should track remaining seconds', () => {
      timer.start();
      clock.advance(60);
      expect(timer.getRemainingSeconds()).toBe(240);
    });

    it('should not go below 0 remaining', () => {
      timer.start();
      clock.advance(999);
      expect(timer.getRemainingSeconds()).toBe(0);
    });
  });

  describe('checkIn()', () => {
    it('should throw if timer not running', () => {
      expect(() => timer.checkIn()).toThrow();
    });

    it('should record check-in times relative to start', () => {
      timer.start();
      clock.advance(30);
      timer.checkIn();
      clock.advance(60);
      timer.checkIn();

      const session = timer.stop();
      expect(session.checkIns).toEqual([30, 90]);
    });
  });

  describe('stop()', () => {
    it('should throw if timer not running', () => {
      expect(() => timer.stop()).toThrow();
    });

    it('should set running to false', () => {
      timer.start();
      timer.stop();
      expect(timer.isRunning()).toBe(false);
    });

    it('should return a MeditationSession', () => {
      timer.start();
      clock.advance(120);
      timer.checkIn();
      clock.advance(180);
      const session = timer.stop();

      expect(session.duration).toBe(300);
      expect(session.mindfulMoments).toBe(1);
      expect(session.checkIns).toEqual([120]);
    });
  });

  describe('session analysis — distraction periods', () => {
    it('should identify gaps between check-ins as distraction periods', () => {
      timer.start();
      clock.advance(30);
      timer.checkIn();
      // 90 second gap (distraction)
      clock.advance(90);
      timer.checkIn();
      clock.advance(30);
      timer.checkIn();
      clock.advance(150);
      const session = timer.stop();

      expect(session.distractionPeriods.length).toBeGreaterThanOrEqual(1);
      expect(session.longestDistraction).toBeGreaterThan(0);
    });

    it('should report 0 longest distraction when checking in frequently', () => {
      timer.start();
      for (let i = 0; i < 10; i++) {
        clock.advance(25);
        timer.checkIn();
      }
      clock.advance(50);
      const session = timer.stop();

      expect(session.longestDistraction).toBeLessThanOrEqual(50);
    });
  });

  describe('session analysis — mindfulness ratio and quality', () => {
    it('should return scattered quality when no check-ins', () => {
      timer.start();
      clock.advance(300);
      const session = timer.stop();

      expect(session.mindfulnessRatio).toBe(0);
      expect(session.quality).toBe('scattered');
    });

    it('should return absorbed quality with frequent check-ins', () => {
      timer.start();
      for (let i = 0; i < 15; i++) {
        clock.advance(20);
        timer.checkIn();
      }
      const session = timer.stop();

      expect(session.mindfulnessRatio).toBeGreaterThanOrEqual(0.75);
      expect(session.quality).toBe('absorbed');
    });

    it('should return intermittent quality with sparse check-ins', () => {
      timer.start();
      clock.advance(60);
      timer.checkIn();
      clock.advance(120);
      timer.checkIn();
      clock.advance(100);
      timer.checkIn();
      clock.advance(20);
      const session = timer.stop();

      expect(session.quality).toBe('intermittent');
    });
  });

  describe('interval bell', () => {
    it('should call onBell at each interval when checking in', () => {
      let bellCount = 0;
      const bellTimer = new MeditationTimer({
        duration: 300,
        intervalBell: 60,
        onBell: () => { bellCount++; },
        clock,
      });

      bellTimer.start();
      clock.advance(60);
      bellTimer.checkIn();
      clock.advance(60);
      bellTimer.checkIn();
      bellTimer.stop();

      expect(bellCount).toBe(2);
    });

    it('should not call onBell before interval elapses', () => {
      let bellCount = 0;
      const bellTimer = new MeditationTimer({
        duration: 300,
        intervalBell: 60,
        onBell: () => { bellCount++; },
        clock,
      });

      bellTimer.start();
      clock.advance(30);
      bellTimer.checkIn();
      bellTimer.stop();

      expect(bellCount).toBe(0);
    });
  });

  describe('early stop', () => {
    it('should use actual elapsed time as duration when stopped early', () => {
      timer.start();
      clock.advance(120);
      const session = timer.stop();

      expect(session.duration).toBe(120);
    });
  });
});
