---
name: buddha-chain
description: Use when the user asks about dependent origination, the 12 links/nidanas, or how suffering arises through conditions in Buddha.js
---

# Chain — Dependent Origination (Pratityasamutpada)

Display the 12 links of dependent origination, the causal chain that describes how suffering arises and how it can be broken.

## Instructions

1. This is a stateful tool — it operates on an existing being. If you don't know the being's name, call `buddha_list_beings` (no parameters), or `buddha_create_being` with a `name` if none exists yet.

2. Call the `buddha_chain` tool (from the bundled buddha-js MCP server) with:
   - `name` (string, required) — the being's name

   It returns a rendered text visualization of the being's 12-link chain (not raw JSON).

3. Present the 12 links (nidanas) from the tool's output:
   1. **Ignorance** (Avidya)
   2. **Formations** (Samskara)
   3. **Consciousness** (Vijnana)
   4. **Name-and-Form** (Namarupa)
   5. **Six Sense Bases** (Sadayatana)
   6. **Contact** (Sparsha)
   7. **Feeling** (Vedana)
   8. **Craving** (Trishna)
   9. **Clinging** (Upadana)
   10. **Becoming** (Bhava)
   11. **Birth** (Jati)
   12. **Aging-and-Death** (Jaramarana)

4. Highlight the **liberation point**: the link between Feeling and Craving (links 7-8) is where the chain can be broken through mindfulness. When feeling arises, one can choose not to react with craving.

5. Show the connections between links — each arises dependent on the previous one. This is not a linear timeline but a description of how experience is constructed moment to moment.
