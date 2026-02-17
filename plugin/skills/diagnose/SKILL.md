---
name: buddha-diagnose
description: Use when the user describes suffering, dissatisfaction, or a problem they want to examine through the Four Noble Truths in Buddha.js
---

# Diagnose Suffering (Four Noble Truths)

Diagnose the user's suffering or dissatisfaction using the framework of the Four Noble Truths: the truth of suffering, its origin in craving, the possibility of cessation, and the path to liberation.

## Instructions

1. First, understand the user's situation. Map their description to:
   - **Dukkha types**: the forms of suffering present
   - **Craving types**: the underlying cravings driving the suffering

2. Run the diagnosis:

```bash
node dist/cli.mjs diagnose --json --dukkha-types "ordinary,pervasive" --craving-types "sensual,existence"
```

**Valid dukkha types:**
- `ordinary` — everyday pain and discomfort
- `change` — suffering due to impermanence (things not staying as we want)
- `pervasive` — existential unsatisfactoriness of conditioned existence

**Valid craving types:**
- `sensual` — craving for pleasant experiences
- `existence` — craving to be, to become, to continue
- `non-existence` — craving to not be, to escape, to annihilate

3. Present the Four Noble Truths diagnosis:
   - **First Truth (Dukkha)**: What suffering is present and its nature
   - **Second Truth (Samudaya)**: The origin — what craving is fueling it
   - **Third Truth (Nirodha)**: That cessation is possible
   - **Fourth Truth (Magga)**: The path factors most relevant to this situation

4. Be compassionate and practical in presentation. This is not clinical diagnosis but contemplative insight.
