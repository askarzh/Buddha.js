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

3. The tool returns a text summary plus the full serialized being state as JSON (mindfulness level, karmic stream, experience history, aggregates, path, mind, dependent-origination chain). Parse both and present the results in a readable format:
   - **Path Progress**: Show which of the 8 path factors are developed and their levels
   - **Mindfulness**: Current mindfulness level and quality
   - **Pending Karma**: Number of wholesome/unwholesome seeds awaiting ripening
   - **Mind State**: Current mental factors and feeling tone
   - **Aggregates**: Summary of the five aggregates' current activity

4. If the being does not exist yet, `buddha_status` will error. Inform the user and suggest creating one with `buddha_create_being`, or running another stateful tool (like `buddha_inquiry` or `buddha_act`) which requires a being to already exist.
