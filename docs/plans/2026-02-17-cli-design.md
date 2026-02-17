# Design: Buddha.js CLI

**Date:** 2026-02-17
**Status:** Approved

## Summary

A `buddha` CLI command exposing the full library interactively. Uses Commander.js for subcommands, Inquirer.js for interactive prompts, and Chalk for styled terminal output. Eight commands cover meditation, cessation, koans, self-inquiry, diagnosis, karma, dependent origination, and being status.

## Dependencies (new)

- `commander` — subcommand routing and help
- `inquirer` — interactive prompts
- `chalk` — colored terminal output

## File Structure

```
src/cli/
  index.ts              — Commander setup, register all commands
  commands/
    meditate.ts         — meditation timer command
    sit.ts              — poison arrow cessation
    koan.ts             — koan contemplation
    inquiry.ts          — self investigation
    diagnose.ts         — four noble truths diagnosis
    karma.ts            — karma actions and results
    chain.ts            — dependent origination chain
    status.ts           — being state summary
  utils/
    format.ts           — chalk formatting helpers
```

## Commands

| Command | Class Used | Mode | Description |
|---------|-----------|------|-------------|
| `buddha meditate [duration] [--interval N]` | MeditationTimer | Interactive | Timed session, Enter to check in, bell on interval |
| `buddha sit` | PoisonArrow | Interactive | Name suffering, step through 4-stage cessation |
| `buddha koan [--id ID]` | KoanGenerator | Interactive | Present koan, prompt contemplation, show trap feedback |
| `buddha inquiry` | Being | One-shot | Investigate self, print findings |
| `buddha diagnose` | FourNobleTruths | Interactive | Select suffering/craving types, get diagnosis |
| `buddha karma` | Being | Interactive | Act, receive results, view stream |
| `buddha chain` | DependentOrigination | One-shot | Display 12-link chain and liberation point |
| `buddha status` | Being | One-shot | Print being state summary |

## Command Details

### `buddha meditate [duration] [--interval N]`
- Duration in minutes (default: 5)
- Starts timer, shows countdown
- Press Enter for check-in (mindful moment)
- Bell notification at interval (default: 60s)
- On complete: show session report (quality, ratio, distractions)

### `buddha sit`
- Prompts: "What suffering are you sitting with?"
- Steps through 4 stages with Enter between each
- Shows insight + guidance per stage
- Ends with summary

### `buddha koan [--id ID]`
- Presents random koan (or specific by ID)
- Prompts: "Contemplate and respond:"
- Shows detected traps and reflection
- Option to try another

### `buddha inquiry`
- Creates Being, runs investigateSelf()
- Prints aggregate search, dependent origination insight, emptiness analysis, conclusion

### `buddha diagnose`
- Prompts for suffering types (multi-select)
- Prompts for craving types
- Runs FourNobleTruths.diagnose(), shows formatted diagnosis

### `buddha karma`
- Interactive loop: act / receive / view / quit
- Act: describe action, choose quality/intensity/root
- Receive: ripen pending karma, show results
- View: show karmic stream

### `buddha chain`
- Displays 12-link chain with arrows
- Shows liberation point message

### `buddha status`
- Creates Being, prints getSummary()

## Build & Bin

```json
{
  "bin": {
    "buddha": "./dist/cli.js"
  }
}
```

CLI entry point compiled separately via tsup. Shebang `#!/usr/bin/env node` at top.

## Shared State

Being instance created per command. State is ephemeral (no persistence between runs). Persistence layer exists for future `--save`/`--load` flags.

## Testing

CLI commands are thin wrappers. Tests in `tests/cli/` verify each command module can be called with mocked I/O. Library classes already have 196 tests.
