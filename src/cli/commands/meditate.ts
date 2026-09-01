import { Command } from 'commander';
import * as readline from 'readline';
import { MeditationTimer } from '../../meditation/MeditationTimer';
import { Intensity, MeditationQuality } from '../../utils/types';
import { getGlobalOpts, getStateManager, StateManager } from '../utils/state';
import { DEFAULT_MEDITATION_MINUTES, MeditateOpts, loadSettledBeing, runMeditate } from '../utils/runner';
import { header, label, insight, success, subtle, divider } from '../utils/format';
import chalk from 'chalk';

const DEFAULT_INTERVAL_BELL_SECONDS = 60;

export async function meditate(localOpts: MeditateOpts, cmd: Command): Promise<void> {
  const globalOpts = getGlobalOpts(cmd);
  const mgr = getStateManager(globalOpts);

  if (globalOpts.json) {
    const session = runMeditate(mgr, globalOpts.being, localOpts);
    console.log(JSON.stringify(session, null, 2));
    return;
  }

  // Interactive path: nothing touches the being here. `--duration` and
  // `--effort` only size the timer; the being is loaded and saved once, in
  // finishSession(), from the REAL session the timer measured — not from
  // these flags. (Regression this guards against: runMeditate() used to be
  // called unconditionally above the --json branch, which settled a pending
  // rebirth and saved a synthetic session's worth of progress the instant
  // this command was invoked, before the timer — or the user — had done
  // anything. See tests/cli/commands.test.ts, `meditate > interactive path`.)
  const duration = localOpts.duration
    ? parseInt(localOpts.duration, 10)
    : DEFAULT_MEDITATION_MINUTES;
  const intervalBell = localOpts.interval
    ? parseInt(localOpts.interval, 10)
    : DEFAULT_INTERVAL_BELL_SECONDS;

  console.log(header('Meditation Timer'));
  console.log(`Duration: ${duration} minutes`);
  console.log(`Interval bell: every ${intervalBell}s`);
  console.log(subtle('\nPress Enter to check in (record a mindful moment).'));
  console.log(subtle('Press q + Enter to stop early.\n'));

  const timer = new MeditationTimer({
    duration: duration * 60,
    intervalBell,
    onBell: () => {
      process.stdout.write(chalk.yellow('  \u{1F514} Bell\n'));
    },
  });

  timer.start();

  return new Promise<void>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const updateInterval = setInterval(() => {
      const remaining = timer.getRemainingSeconds();
      if (remaining <= 0) {
        clearInterval(updateInterval);
        rl.close();
        finishSession(timer, mgr, globalOpts.being);
        resolve();
      }
    }, 1000);

    rl.on('line', (line) => {
      if (line.trim().toLowerCase() === 'q') {
        clearInterval(updateInterval);
        rl.close();
        finishSession(timer, mgr, globalOpts.being);
        resolve();
        return;
      }

      if (timer.isRunning()) {
        timer.checkIn();
        const elapsed = timer.getElapsedSeconds();
        const remaining = timer.getRemainingSeconds();
        console.log(success(`  ✓ Check-in at ${elapsed}s (${remaining}s remaining)`));
      }
    });
  });
}

/**
 * Report the session the timer just measured, and persist that same real
 * session onto the named being — its actual elapsed duration and an effort
 * derived from its own measured `mindfulnessRatio` (not the `--duration`/
 * `--effort` flags, which only describe what was intended). A pending
 * rebirth is settled first, since this now saves.
 */
function finishSession(timer: MeditationTimer, sm: StateManager, beingName: string): void {
  if (!timer.isRunning()) return;

  const session = timer.stop();

  console.log();
  console.log(divider());
  console.log(header('Session Complete'));

  console.log(label('Duration:') + ` ${session.duration}s`);
  console.log(label('Mindful moments:') + ` ${session.mindfulMoments}`);
  console.log(label('Mindfulness ratio:') + ` ${(session.mindfulnessRatio * 100).toFixed(0)}%`);
  console.log(label('Longest distraction:') + ` ${session.longestDistraction}s`);

  const qualityColors: Record<MeditationQuality, (text: string) => string> = {
    absorbed: chalk.green,
    sustained: chalk.cyan,
    intermittent: chalk.yellow,
    scattered: chalk.red,
  };
  const colorFn = qualityColors[session.quality];
  console.log(label('Quality:') + ` ${colorFn(session.quality)}`);

  if (session.distractionPeriods.length > 0) {
    console.log();
    console.log(label('Distraction periods:'));
    for (const dp of session.distractionPeriods) {
      console.log(subtle(`  ${dp.start}s → ${dp.end}s (${dp.duration}s)`));
    }
  }

  console.log();
  console.log(insight(getQualityMessage(session.quality)));

  const { being } = loadSettledBeing(sm, beingName);
  const effort = Math.round(session.mindfulnessRatio * 10) as Intensity;
  being.meditate(session.duration, effort);
  sm.saveBeing(beingName, being);
}

function getQualityMessage(quality: MeditationQuality): string {
  switch (quality) {
    case 'absorbed': return 'Deep presence. The mind rests in stillness.';
    case 'sustained': return 'Good continuity. Awareness returns quickly after wandering.';
    case 'intermittent': return 'Some presence, some distraction. This is normal practice.';
    case 'scattered': return 'The mind was restless. Every sitting counts -- just showing up matters.';
  }
}
