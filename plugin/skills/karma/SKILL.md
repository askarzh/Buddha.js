---
name: buddha-karma
description: Use when the user wants to explore karma, perform intentional actions, plant karmic seeds, or check their karmic stream in Buddha.js
---

# Karma — Intentional Action

Explore intentional action (karma), plant karmic seeds, and examine the karmic stream of a being.

## Instructions

### View Karmic Stream

To see the current karmic state:

```bash
node dist/cli.mjs karma --json --being default
```

This shows pending seeds, recent results, and the overall karmic balance.

### Perform a Karmic Action

To plant a new karmic seed:

```bash
node dist/cli.mjs karma --json --being default --quality wholesome --description "Helping a colleague" --intensity 7 --root non-aversion
```

**Flags:**

| Flag | Values | Description |
|------|--------|-------------|
| `--quality` | `wholesome`, `unwholesome` | The moral quality of the intention |
| `--description` | any string | A description of the action |
| `--intensity` | `1` to `10` | How strong the intention is |
| `--root` | `non-greed`, `non-aversion`, `non-delusion`, `greed`, `aversion`, `delusion` | The root motivation |

### Presentation

- When viewing the stream, show a summary of wholesome vs unwholesome seeds, any recently ripened results, and the overall trajectory
- When performing an action, confirm what seed was planted and its potential consequences
- Help the user understand the Buddhist teaching: karma is about intention, not mechanical reward/punishment
