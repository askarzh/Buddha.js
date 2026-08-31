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

Both `buddha_act` and `buddha_karma_ripen` are mutating tools: before doing their own work, they settle any pending rebirth the being's incarnation gap has produced since it was last saved (see below). If one fires, the result carries an extra `rebirth` field — `{ fromRealm, toRealm, incarnation }` — describing the transition; mention it to the user before presenting the rest of the result, since everything after it now describes the *new* incarnation, not the one they last saw.

### Rebirth and the Six Realms

`buddha_rebirth` explicitly enacts rebirth: it advances the incarnation, expires any timed-out (ahosi-kamma) seeds, and transmigrates the karmic continuum into a new incarnation whose realm (gati) — `human`, `deva`, `asura`, `animal`, `preta`, or `naraka` — is chosen by the karmic seed that shaped it (its dominant root if unwholesome, or its weight/strength if wholesome) and the inherited karmic balance. It never returns a live being object, only the transmigration summary (`incarnation`, `expiredSeeds`, `shapingSeed`, `fromRealm`, `toRealm`, and a one-line `description` of what the new realm means). Present the realm transition as a meaningful event, not a number bump — each realm biases how the being's next life unfolds (e.g. a deva's meditation gains are halved by comfort-driven complacency, a preta's reactions run hotter from insatiable craving) without disabling anything it can still do.

Rebirth can also happen implicitly: any mutating tool (`buddha_act`, `buddha_karma_ripen`, `buddha_experience`, `buddha_cognize`, `buddha_meditate`, `buddha_diagnose`, `buddha_inquiry`) settles a rebirth that was merely *pending* (detected on load, once the being's incarnation gap has elapsed) before doing its own work — observation alone (e.g. `buddha_status`) never triggers it.

### Presentation

- When viewing the stream, show a summary of wholesome vs unwholesome seeds, any recently ripened results, and the overall trajectory
- If `whyNot` is non-empty, gently explain what is still pending for each seed rather than treating it as a stall — karma ripens on its own conditions, not on request
- When performing an action, confirm what seed was planted and its potential consequences
- Help the user understand the Buddhist teaching: karma is about intention, not mechanical reward/punishment
