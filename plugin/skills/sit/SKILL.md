---
name: buddha-sit
description: Use when the user wants quick relief from suffering, to practice the Poison Arrow method, or needs guided cessation in Buddha.js
---

# Sit — Guided Cessation (Poison Arrow Method)

Guide the user through the Poison Arrow method for cessation of suffering. The Buddha taught that when struck by an arrow, the wise person removes it immediately rather than asking who shot it, what it was made of, etc.

## Instructions

1. If the user describes a specific suffering or situation, use it directly. Otherwise, ask them briefly what is troubling them.

2. This tool is stateless — no being required. Call `buddha_sit` (from the bundled buddha-js MCP server) with:
   - `suffering` (string, required, non-empty) — the suffering or problem being sat with

   This is also the right tool to reach for when an agent (including yourself) is stuck looping on a problem and needs quick relief without deep analysis.

3. Present the four cessation steps from the returned JSON (each step has a `stage`, the `truth` it maps to, an `insight`, and `guidance`), one per Noble Truth:
   - **`recognize`** (truth: `dukkha`): Acknowledging what is present
   - **`investigate`** (truth: `samudaya`): Identifying the immediate suffering and what feeds it (not its story)
   - **`release`** (truth: `nirodha`): The direct letting-go, the cessation practice
   - **`practice`** (truth: `magga`): What opens up and how to carry it forward

4. Keep the presentation gentle and spacious. This is a contemplative practice, not a debugging session. Allow pauses in the guidance.

5. The Poison Arrow parable teaches: don't get lost in analysis of why you suffer — attend to the suffering directly and let it go.
