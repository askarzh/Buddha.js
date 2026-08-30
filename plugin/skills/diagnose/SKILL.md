---
name: buddha-diagnose
description: Use when the user describes suffering, dissatisfaction, or a problem they want to examine through the Four Noble Truths in Buddha.js
---

# Diagnose Suffering (Four Noble Truths)

Diagnose the user's suffering or dissatisfaction using the framework of the Four Noble Truths: the truth of suffering, its origin in craving, the possibility of cessation, and the path to liberation.

## Instructions

1. This is a stateful tool — it operates on an existing being. If you don't know the being's name, call `buddha_list_beings` (no parameters), or `buddha_create_being` with a `name` if none exists yet.

2. Understand the user's situation, then map their description to:
   - **Dukkha types**: the forms of suffering present
   - **Craving types**: the underlying cravings driving the suffering

3. Call the `buddha_diagnose` tool with:

| Parameter | Type | Description |
|-----------|------|--------------|
| `name` | string, required | The being's name |
| `suffering` | array of dukkha-type strings, required, at least 1 | Types of suffering present |
| `cravings` | array of craving-type strings, required, at least 1 | Types of craving driving the suffering |

**Valid dukkha types (`suffering`):**
- `dukkha-dukkha` — pain of pain (obvious, ordinary suffering)
- `viparinama-dukkha` — pain of change (suffering due to impermanence)
- `sankhara-dukkha` — pain of conditioned existence (pervasive existential unsatisfactoriness)

**Valid craving types (`cravings`):**
- `sensory` — craving for pleasant sense experiences
- `becoming` — craving to be, to become, to continue
- `non-becoming` — craving to not be, to escape, to annihilate

4. Present the Four Noble Truths diagnosis:
   - **First Truth (Dukkha)**: What suffering is present and its nature
   - **Second Truth (Samudaya)**: The origin — what craving is fueling it
   - **Third Truth (Nirodha)**: That cessation is possible
   - **Fourth Truth (Magga)**: The path factors most relevant to this situation

5. Be compassionate and practical in presentation. This is not clinical diagnosis but contemplative insight.
