---
name: buddha
description: Explore Buddhist philosophy tools
---

# Buddha.js — Buddhist Philosophy Tools

Available commands (run via `node dist/cli.mjs <command> --json`):

| Command | Description |
|---------|-------------|
| `status` | Show the current state of your being |
| `inquiry` | Investigate the nature of self (anatta) |
| `karma` | Explore intentional action and karmic results |
| `diagnose` | Diagnose suffering using the Four Noble Truths |
| `sit` | Guided cessation through the Poison Arrow method |
| `koan` | Contemplate a Zen koan |
| `chain` | Display the 12 links of dependent origination |
| `meditate` | Start a meditation session |
| `beings` | List saved beings |
| `reset` | Reset a being to fresh state |

## Usage

Ask about any Buddhist concept and the relevant skill will activate automatically. Or run a specific command:

```bash
node dist/cli.mjs status --json --being default
```

**Prerequisites:** The CLI must be built first: `npm run build:cli`
