---
name: buddha-cognize
description: Use when the user wants to observe how a moment of cognition unfolds, watch the 17-moment vīthi, or see how karma is born from javana moments in Buddha.js
---

# Cognize — The Process of Cognition (Citta-Vīthi)

Run a full cognitive process (citta-vīthi) over some content and show how a single moment of experience unfolds — from the mind's resting state, through registering an object, to the seven javana moments where karma is actually made.

## Instructions

1. This is a stateful tool — it operates on an existing being. If you don't know the being's name, call `buddha_list_beings` (no parameters), or `buddha_create_being` with a `name` if none exists yet.

2. Call the `buddha_cognize` tool (from the bundled buddha-js MCP server) with:

| Parameter | Type | Description |
|-----------|------|--------------|
| `name` | string, required | The being's name |
| `content` | string, required (min length 1) | What is being cognized |
| `senseBase` | optional enum: `eye`, `ear`, `nose`, `tongue`, `body`, `mind` | The sense door the object enters through. Default: `mind`. `mind` (or omitting this) runs the 13-moment mind-door process; any other sense base runs the fuller 17-moment five-door process through that door. |

The tool returns a moment-by-moment listing (stage, quality, karmic potency), a "Seeds planted" listing (id, quality, strength, ripening timing), and the full JSON result.

`buddha_cognize` is a mutating tool: before running the vīthi, it settles any pending rebirth left over from the being's incarnation gap (see the `buddha-karma` skill). If one fires, the result carries a `rebirth` field (`{ fromRealm, toRealm, incarnation }`) — mention the realm transition before walking through the moment stream, since the vīthi that follows runs on the *new* incarnation.

### Presenting the moment stream

Walk the user through the vīthi contemplatively, not as a debug dump:

- Most of the stream is not karmically active. The early stages (`bhavaṅga`, `bhavaṅga-calana`, `bhavaṅgupaccheda`, `āvajjana`, the sense/mind-door consciousness, receiving, investigating, determining) are **vipāka** (resultant — the ripening of past karma) or **kiriya** (functional — neither cause nor result). Only the **javana** moments are karmically active (`kusala` wholesome or `akusala` unwholesome).
- Emphasize: **karma is made only during the 7 javana moments.** Everything before them is the mind registering and evaluating what already arose; only javana is where intention actively responds and creates new seeds.
- The 7 javana moments are not uniform in strength — point this out using `karmicPotency`:
  - **1st javana** — weak, still accumulating momentum.
  - **2nd-6th javana** — full strength, the bulk of the karmic weight.
  - **7th javana** — weak again, fading.
- If `quality` for the whole process comes back `vipāka` or `kiriya` (not `kusala`/`akusala`), no javana ran karmically active and no seeds are planted — this is a valid, even instructive, outcome: not every moment of experience creates new karma.

### Presenting the planted seeds

Each planted seed's `timing` reflects which javana position it came from — this is a canonical mapping, not arbitrary:

| Javana position | Ripening timing | Meaning |
|---|---|---|
| 1st | `immediate` | Ripens only within this incarnation |
| 2nd-6th | `distant-future` | Can ripen in any future incarnation |
| 7th | `next-life` | Ripens specifically in the next incarnation |

- Frame this as the Abhidhamma teaching on why some acts fade quickly (weak first/last javana) while the sustained middle of an intention carries the most karmic weight, and can outlast a single lifetime.
- If no seeds were planted (`seedsPlanted` is empty), say so plainly — it means the javana moments were resultant/functional, not karmically active.

### Tone

Keep the plugin's established contemplative tone: this is an invitation to observe how quickly and mechanically a "moment of experience" actually assembles itself, not a technical trace to be debugged.
