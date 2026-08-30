---
name: buddha
description: Explore Buddhist philosophy tools
---

# Buddha.js — Buddhist Philosophy Tools

Buddha.js ships as a bundled MCP server (`buddha-js`) — no build step is required. Once the plugin is installed, its 14 tools are available directly in this session (as `buddha_*`, or `mcp__buddha-js__buddha_*` in tool listings):

| Tool | Description |
|------|--------------|
| `buddha_create_being` | Create a new being and persist it to disk |
| `buddha_list_beings` | List all saved beings |
| `buddha_delete_being` | Delete a saved being |
| `buddha_status` | Get the current status of a being |
| `buddha_experience` | Process a sensory experience through the five aggregates |
| `buddha_act` | Perform an intentional action that creates karma (quality derives from `root`) |
| `buddha_karma_ripen` | Check for and receive any ripened karmic results |
| `buddha_meditate` | Conduct a meditation session |
| `buddha_diagnose` | Diagnose suffering using the Four Noble Truths framework |
| `buddha_inquiry` | Investigate the nature of self (anatta) across the five aggregates |
| `buddha_chain` | Visualize the 12 links of dependent origination |
| `buddha_koan` | Present a Zen koan for contemplation |
| `buddha_contemplate` | Submit a response to a koan for dualism-trap evaluation |
| `buddha_sit` | Guided cessation via the Poison Arrow method |

## Workflow

Most tools are **stateful** and operate on a named being (`buddha_experience`, `buddha_act`, `buddha_karma_ripen`, `buddha_meditate`, `buddha_diagnose`, `buddha_inquiry`, `buddha_chain`, `buddha_status`). Before using one of these:

1. Call `buddha_list_beings` to see what already exists.
2. If the being you want doesn't exist, call `buddha_create_being` with a `name` (letters, numbers, hyphens, underscores).
3. Then call the stateful tool with that `name`.

`buddha_koan`, `buddha_contemplate`, and `buddha_sit` are **stateless** — no being required.

## Usage

Ask about any Buddhist concept — suffering, karma, meditation, self-inquiry, dependent origination, koans — and the relevant skill will activate automatically to guide tool use and presentation. Or invoke a tool directly by name for a quick check, e.g. `buddha_status` with `name: "default"` to see a being's current state.
