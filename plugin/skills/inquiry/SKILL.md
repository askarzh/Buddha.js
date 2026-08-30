---
name: buddha-inquiry
description: Use when the user asks about the nature of self, identity, anatta (not-self), or wants to investigate what they really are in Buddha.js
---

# Self-Inquiry (Anatta Investigation)

Investigate the nature of self through the Buddha.js anatta (not-self) analysis. This examines the five aggregates, dependent origination, and emptiness to reveal the constructed nature of identity.

## Instructions

1. This is a stateful tool — it operates on an existing being. If you don't know the being's name, call `buddha_list_beings` (no parameters), or `buddha_create_being` with a `name` if none exists yet.

2. Call the `buddha_inquiry` tool (from the bundled buddha-js MCP server) with:
   - `name` (string, required) — the being's name

3. Parse the returned JSON and present the investigation results:
   - **Aggregate Search**: Walk through each of the five aggregates (form, feeling, perception, mental formations, consciousness) showing that none is a fixed self
   - **Dependent Origination Insight**: How the sense of self arises through conditions
   - **Emptiness Analysis**: The three natures examination (imagined, dependent, perfected)
   - **Conclusion**: The teaching that emerges from the investigation

3. **Important**: This command modifies the being's state. The investigation itself is a transformative practice that affects mindfulness and insight levels.

4. Present the results contemplatively — this is a meditative investigation, not just data retrieval.
