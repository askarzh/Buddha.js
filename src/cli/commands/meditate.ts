import * as readline from 'readline';
import { MeditationTimer } from '../../meditation/MeditationTimer';
import { MeditationQuality } from '../../utils/types';
import { header, label, insight, success, subtle, divider } from '../utils/format';
import chalk from 'chalk';

export async function meditate(options: { interval?: string }): Promise<void> {
  const duration = 5;
  const intervalBell = options.interval ? parseInt(options.interval, 10) : 60;

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
        finishSession(timer);
        resolve();
      }
    }, 1000);

    rl.on('line', (line) => {
      if (line.trim().toLowerCase() === 'q') {
        clearInterval(updateInterval);
        rl.close();
        finishSession(timer);
        resolve();
        return;
      }

      if (timer.isRunning()) {
        timer.checkIn();
        const elapsed = timer.getElapsedSeconds();
        const remaining = timer.getRemainingSeconds();
        console.log(success(`  \u2713 Check-in at ${elapsed}s (${remaining}s remaining)`));
      }
    });
  });
}

function finishSession(timer: MeditationTimer): void {
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
      console.log(subtle(`  ${dp.start}s \u2192 ${dp.end}s (${dp.duration}s)`));
    }
  }

  console.log();
  console.log(insight(getQualityMessage(session.quality)));
}

function getQualityMessage(quality: MeditationQuality): string {
  switch (quality) {
    case 'absorbed': return 'Deep presence. The mind rests in stillness.';
    case 'sustained': return 'Good continuity. Awareness returns quickly after wandering.';
    case 'intermittent': return 'Some presence, some distraction. This is normal practice.';
    case 'scattered': return 'The mind was restless. Every sitting counts -- just showing up matters.';
  }
}
