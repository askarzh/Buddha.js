---
name: buddha-meditate
description: Use when the user wants to meditate, practice mindfulness, or start a meditation session in Buddha.js
---

# Meditate — Guided Meditation Session

Start a meditation session using the Buddha.js meditation engine.

## Instructions

1. This is a stateful tool — it operates on an existing being. If you don't know the being's name, call `buddha_list_beings` (no parameters), or `buddha_create_being` with a `name` if none exists yet.

2. This tool runs a session synchronously and returns its result — there is no interactive/live timer. Call `buddha_meditate` with:

| Parameter | Type | Description |
|-----------|------|--------------|
| `name` | string, required | The being's name |
| `duration` | positive number, required | Duration of the session, in seconds |
| `effort` | integer 0-10, required | Meditation effort/intensity |

3. Common `duration` values (in seconds): `60` for a brief check-in, `300` (5 min) for a standard session, `900`+ (15 min or more) for a spacious, deeper practice. Since there's no live clock, treat this as a simulated session length rather than something the user waits through in real time.

4. The result develops path factors, mindfulness, and generates insights. Present it conversationally:
   - Invite the user to pause and notice their breath before or after presenting the result
   - Note the resulting state of their being (mindfulness, insights)
   - Offer a brief instruction based on their mindfulness level

5. Meditation modifies the being's state — mindfulness increases with practice. Use `buddha_status` afterward if the user wants the full updated state.
