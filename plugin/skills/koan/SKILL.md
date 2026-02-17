---
name: buddha-koan
description: Use when the user wants a Zen koan, a paradox to contemplate, or wants to practice non-dual thinking in Buddha.js
---

# Koan — Zen Contemplation

Present a Zen koan for contemplation. Koans are paradoxical statements or questions designed to transcend rational thinking and provoke direct insight.

## Instructions

1. For a random koan:

```bash
node dist/cli.mjs koan --json
```

2. For a specific koan by ID:

```bash
node dist/cli.mjs koan --json --id 3
```

3. Present the koan from the JSON output:
   - Show the **koan text** prominently
   - Include the **source** or attribution if available
   - Add a brief **invitation to sit with it** — koans are not puzzles to solve but gateways to direct experience

4. Do NOT explain or interpret the koan. The whole point is that the rational mind cannot resolve it. Simply present it and let the user sit with it.

5. If the user asks for the "answer" to a koan, gently explain that koans don't have conventional answers — they are pointers beyond conceptual thought.
