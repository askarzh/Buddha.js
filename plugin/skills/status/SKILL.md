---
name: buddha-status
description: Use when the user wants to check their being's current state, path progress, mindfulness level, or karmic status in Buddha.js
---

# Being Status

Show the current state of a Buddha.js being, including path progress, mindfulness level, pending karma, and mind state.

## Instructions

1. This is a stateful tool — it operates on an existing being. If you don't know the being's name, call `buddha_list_beings` (no parameters) to see what's saved, or `buddha_create_being` with a `name` (letters, numbers, hyphens, underscores) if none exists yet.

2. Call the `buddha_status` tool (from the bundled buddha-js MCP server) with:
   - `name` (string, required) — the being's name

3. The tool returns three pieces of content: a text summary, the full serialized being state as JSON (mindfulness level, karmic stream, experience history, aggregates, path, mind, dependent-origination chain), and a `{ seeds }` JSON block. Parse all three and present the results in a readable format:
   - **Path Progress**: Show which of the 8 path factors are developed and their levels
   - **Mindfulness**: Current mindfulness level and quality
   - **Pending Karma**: Number of wholesome/unwholesome seeds awaiting ripening
   - **Mind State**: Current mental factors and feeling tone
   - **Aggregates**: Summary of the five aggregates' current activity
   - **Seeds**: From the `seeds` block — `balance` (overall karmic balance), `byState` (seed counts grouped by lifecycle state: `dormant`, `active`, `ripening`, `ripened`, `exhausted`, `purified`), `byTiming` (seed counts grouped by ripening timing: `immediate`, `deferred`, `next-life`, `distant-future`), `incarnation` (the being's current incarnation number, starting at 1 and advancing via `buddha_rebirth`), and `realm` (the being's current realm of rebirth — `human`, `deva`, `asura`, `animal`, `preta`, or `naraka`). Present this as the being's accumulated karmic seed bank across its life(s) — not just the pending stream, but what is banked, when it is due to ripen, and which realm the being currently inhabits.

4. `buddha_status` is read-only: it reports whatever state was last saved and never settles a pending rebirth, even if the being's incarnation gap has elapsed since then (a rebirth may still be pending and will only be enacted by a mutating tool like `buddha_act` or `buddha_meditate`).

5. If the being does not exist yet, `buddha_status` will error. Inform the user and suggest creating one with `buddha_create_being`, or running another stateful tool (like `buddha_inquiry` or `buddha_act`) which requires a being to already exist.
