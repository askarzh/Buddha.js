---
name: buddha-karma
description: Use when the user wants to explore karma, perform intentional actions, plant karmic seeds, or check their karmic stream in Buddha.js
---

# Karma — Intentional Action

Explore intentional action (karma), plant karmic seeds, and examine the karmic stream of a being.

## Instructions

These are stateful tools — they operate on an existing being. If you don't know the being's name, call `buddha_list_beings` (no parameters), or `buddha_create_being` with a `name` if none exists yet.

### View Karmic Stream

To see the current karmic state, including any newly ripened results, call `buddha_karma_ripen` with:

| Parameter | Type | Description |
|-----------|------|--------------|
| `name` | string, required | The being's name |
| `force` | optional boolean | Ripen everything eligible deterministically, bypassing each seed's attached ripening conditions. Default: `false` (conditional — a seed ripens only if its conditions are currently met). |

The result is `{ results, seedVipakas, whyNot }`:
- `results` — legacy karmic-stream results (unconditional, ripen as before)
- `seedVipakas` — karmic-store seeds that ripened this call (respecting conditions unless `force` was set)
- `whyNot` — for each seed that is still active and did *not* ripen, `{ seedId, description, unmet }` listing which of its conditions are unmet

Without `force`, nothing may ripen at all — that is not an error. Present the `whyNot` entries as practice guidance (what conditions still need to be met for a seed to bear fruit — e.g. sufficient mindfulness, the passage of time, a supporting state), never as a failure or bug. This mirrors the teaching that karma ripens when conditions align, not on demand.

For the full being state (including the complete karmic stream), call `buddha_status` with the same `name`.

### Perform a Karmic Action

To plant a new karmic seed, call `buddha_act` with:

| Parameter | Type | Description |
|-----------|------|--------------|
| `name` | string, required | The being's name |
| `description` | string, required | Description of the intentional action |
| `intensity` | integer 0-10, required | How strong the intention is |
| `root` | optional enum: `greed`, `aversion`, `delusion`, `non-greed`, `non-aversion`, `non-delusion` | The root motivation. Karmic quality (wholesome/unwholesome) is *derived* from this root — there is no separate `quality` parameter. Omit `root` entirely for a neutral act. |

### Presentation

- When viewing the stream, show a summary of wholesome vs unwholesome seeds, any recently ripened results, and the overall trajectory
- If `whyNot` is non-empty, gently explain what is still pending for each seed rather than treating it as a stall — karma ripens on its own conditions, not on request
- When performing an action, confirm what seed was planted and its potential consequences
- Help the user understand the Buddhist teaching: karma is about intention, not mechanical reward/punishment
