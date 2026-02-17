---
name: buddha-status
description: Use when the user wants to check their being's current state, path progress, mindfulness level, or karmic status in Buddha.js
---

# Being Status

Show the current state of a Buddha.js being, including path progress, mindfulness level, pending karma, and mind state.

## Instructions

1. Run the status command:

```bash
node dist/cli.mjs status --json --being default
```

2. Parse the JSON output and present the results in a readable format:
   - **Path Progress**: Show which of the 8 path factors are developed and their levels
   - **Mindfulness**: Current mindfulness level and quality
   - **Pending Karma**: Number of wholesome/unwholesome seeds awaiting ripening
   - **Mind State**: Current mental factors and feeling tone
   - **Aggregates**: Summary of the five aggregates' current activity

3. If the being does not exist yet, inform the user and suggest running another command first (like `inquiry` or `karma`) to initialize one.

4. Use the `--being <name>` flag to check a specific named being. Default is `default`.
