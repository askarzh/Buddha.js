---
name: buddha-meditate
description: Use when the user wants to meditate, practice mindfulness, or start a meditation session in Buddha.js
---

# Meditate — Guided Meditation Session

Start a meditation session using the Buddha.js meditation engine.

## Instructions

1. **Interactive mode is recommended.** Meditation is an ongoing, timed practice that works best when run directly in the terminal:

```bash
node dist/cli.mjs meditate --interval 30
```

Suggest the user run this command directly for the full experience with timed intervals and progressive guidance.

2. For JSON metadata about meditation (without the interactive session):

```bash
node dist/cli.mjs meditate --json --being default
```

This returns meditation configuration and the being's current mindfulness state, but does not run an interactive session.

3. The `--interval` flag sets the number of seconds between meditation prompts. Common values:
   - `15` — quick check-in pace
   - `30` — standard practice (default)
   - `60` — spacious, deeper practice

4. If the user cannot run the interactive session, use the JSON output to guide a brief mindfulness exercise conversationally:
   - Invite them to pause and notice their breath
   - Note the current state of their being (from the JSON data)
   - Offer a brief instruction based on their mindfulness level

5. Meditation modifies the being's state — mindfulness increases with practice.
