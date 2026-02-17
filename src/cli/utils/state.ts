import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Command } from 'commander';
import { Being } from '../../simulation/Being';
import { BeingData } from '../../utils/types';

export interface GlobalOpts {
  json?: boolean;
  being: string;
  stateDir?: string;
}

export function getGlobalOpts(cmd: Command): GlobalOpts {
  return cmd.optsWithGlobals() as GlobalOpts;
}

export function getStateManager(opts: GlobalOpts): StateManager {
  return new StateManager(resolveStateDir(opts.stateDir));
}

export class StateManager {
  private readonly beingsDir: string;

  constructor(stateDir: string) {
    this.beingsDir = path.join(stateDir, 'beings');
  }

  loadBeing(name: string): Being {
    const filePath = this.beingPath(name);
    if (!fs.existsSync(filePath)) {
      return new Being();
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data: BeingData = JSON.parse(raw);
      return Being.fromJSON(data);
    } catch (err) {
      throw new Error(`Failed to load being "${name}": ${(err as Error).message}`);
    }
  }

  saveBeing(name: string, being: Being): void {
    fs.mkdirSync(this.beingsDir, { recursive: true });
    const filePath = this.beingPath(name);
    fs.writeFileSync(filePath, JSON.stringify(being.toJSON(), null, 2));
  }

  listBeings(): string[] {
    if (!fs.existsSync(this.beingsDir)) {
      return [];
    }
    return fs.readdirSync(this.beingsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''));
  }

  deleteBeing(name: string): void {
    const filePath = this.beingPath(name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  private beingPath(name: string): string {
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error(`Invalid being name: "${name}". Names may only contain letters, numbers, hyphens, and underscores.`);
    }
    return path.join(this.beingsDir, `${name}.json`);
  }
}

/**
 * Resolve the state directory from: --state-dir flag > BUDDHA_STATE_DIR env > ~/.buddha/
 */
export function resolveStateDir(flagValue?: string): string {
  if (flagValue) return flagValue;
  if (process.env.BUDDHA_STATE_DIR) return process.env.BUDDHA_STATE_DIR;
  return path.join(os.homedir(), '.buddha');
}
