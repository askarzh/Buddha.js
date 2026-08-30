---
name: buddha-koan
description: Use when the user wants a Zen koan, a paradox to contemplate, or wants to practice non-dual thinking in Buddha.js
---

# Koan — Zen Contemplation

Present a Zen koan for contemplation. Koans are paradoxical statements or questions designed to transcend rational thinking and provoke direct insight.

## Instructions

Both tools are stateless — no being required.

1. To present a koan, call `buddha_koan` (from the bundled buddha-js MCP server) with:
   - `id` (string, optional) — omit for a random koan. Valid ids: `mu`, `one-hand`, `stone-mind`, `flag-wind`, `marrow`, `nansen-cat`, `fan-wind`, `original-face`

2. Present the koan from the returned JSON (`title`, `case`, `source`, optional `hint`):
   - Show the **case** text prominently
   - Include the **source** or attribution if available
   - Add a brief **invitation to sit with it** — koans are not puzzles to solve but gateways to direct experience

3. Do NOT explain or interpret the koan. The whole point is that the rational mind cannot resolve it. Simply present it and let the user sit with it.

4. If the user offers a response to contemplate, call `buddha_contemplate` with:
   - `koanId` (string, required) — the id of the koan being contemplated
   - `response` (string, required) — the user's contemplative response

   The tool evaluates the response for dualism traps (`binary`, `intellectual`, `seeking`, `nihilistic`, `grasping`) and returns whether it reads as non-dual. Use this to reflect back gently — not as a pass/fail grade, but as a mirror for where conceptual grasping may still be present.

5. If the user asks for the "answer" to a koan, gently explain that koans don't have conventional answers — they are pointers beyond conceptual thought.
