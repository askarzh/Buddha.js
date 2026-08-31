# v0.5 "Harness Discipline" Design: `dsh-plugin-buddha` for DeepSeek Harness

**Status:** Direction approved by Askar on 2026-08-31 ("I would start with DSH"); layout and scope decisions approved (monorepo; full scope including loop replacement). Spec pending Askar's review.
**Origin:** Askar's discussion with Antigravity (2026-08-30/31): Buddhist mechanics as an agent-discipline layer — five failure modes of autonomous agents (panic loops, context bloat, zombie subagents, ungrounded assumptions, dirty finish) mapped to Buddha.js machinery. Critical review concluded: the value lies in a discipline layer *over* existing harnesses, not in owning a harness. DSH is the first target because its "everything is a plugin" architecture exposes exactly the seams the mechanics need.
**Ground truth:** All DSH contracts below were read from the installed packages `@deepseek-ai/dsh@0.1.1-rc.2` / `@deepseek-ai/cordis@4.0.2` (pnpm; npm crashes resolving the ~275 MB tree on this machine) and cross-checked with `docs/subsystems/*.md`, then independently reviewed by a second model (Antigravity/Gemini 3.7, 2026-08-31) whose five contract corrections were each re-verified against the `.d.ts` files and folded in below. DSH is in **developer preview** ("THERE WILL BE COMPATIBILITY-BREAKING CHANGES") — every task pins the exact version and the plugin has a compatibility test against it.

## Problem

Buddha.js's MCP tools are passive: an agent may call `buddha_sit` or ignore it. The five agent failure modes are *loop-level* problems, and fixing them needs *loop-level* hooks. DSH provides those hooks as waterfall events; a Cordis plugin can veto, replace, or annotate at each seam without owning the runtime.

## Goals

1. **Circuit breaker (Poison Arrow) on tool failures** — after N consecutive failures the model receives the four-step protocol as model-visible context; blind retries are interrupted, never silently.
2. **Being per session** — the agent's actions plant karma (success → pleasant/wholesome, repeated identical failing calls → habitual unwholesome); status is inspectable; state persists across sessions via the existing serializer; pending rebirth settles on mutating events (v0.3 discipline preserved).
3. **Commands without a model turn** — `/sit`, `/koan`, `/status`, `/rebirth` via `ctx.commands`.
4. **Six-realms subagent personas** — a `ctx.subagents` provider that maps `persona` → realm and shapes the child's system prompt + tool filter, delegating actual execution to DSH's in-process provider (anattā: the child gets a contract, not the parent's context).
5. **Citta-vīthi as the step model** — Layer A (ships in the MVP): the sanctioned waterfall (`agent/pre-step`, `agent/request`, `tools/result`) annotates each step with vīthi phases and plants javana-derived seeds. Layer B (last task, opt-in flag): a full `AgentFactory` replacement registered after disabling the stock `agent-loop` plugin.
6. Buddha.js core stays runtime-agnostic: no DSH types leak into `src/`; the plugin lives in `dsh/`.

**Non-goals (v0.6+):** the Trisvabhāva grounding ledger (claims → verified-by-tool promotion; the most novel piece, but it needs its own design); Ālaya as a real context-compaction strategy (DSH has a `compaction/` seam — a candidate, but summarization is not a seed store). **Quick win adopted instead (cross-review):** the plugin's dev overlay and docs recommend enabling the stock `@deepseek-ai/dsh-compaction-tool-result-pruner` (replay-safe, model-free head/middle/tail pruning of over-budget tool results) — the honest answer to failure mode 2 today; a TUI of our own; a Claude Code hooks adapter (separate track).

## Verified DSH contracts (the plugin's only dependencies)

| Seam | Contract (verbatim from installed types) | Used for |
|---|---|---|
| Plugin entry | `export const name`, `export const inject = [...]`, `export function apply(ctx: Context, config)`; config via `Config` (Standard Schema); resources via `ctx.effect(() => disposer)`; listeners via `ctx.on(name, fn)` (auto-disposed with the fiber) | everything |
| Tool pipeline | `'tools/post-execute'(this, exec: ToolExecution, result: Readonly<ToolExecutionResult>, next): Promise<PostToolDecision>` — waterfall; `ToolExecution extends ToolExecutionInput` — `.name`, `.arguments`, `.agent?: Agent`, `.callId`, `.parent?: ToolExecutionToken` (from the input) plus required `.rootCallId: CallId` and `.token: ToolExecutionToken` (registry identity; Code-Mode sub-dispatches share the root's `rootCallId`); `ToolExecutionResult = {isError:false, value, content, additionalContexts?} \| {isError:true, error: ToolFailure, content, additionalContexts?}`; `PostToolDecision` is a strict three-arm union: `{kind:'accept', content?: ContentBlock[], value?: never, additionalContexts?: UserMessage[]}` \| `{kind:'accept', value: JsonValue, content?: never, additionalContexts?}` \| `{kind:'block', feedback: ContentBlock[], additionalContexts?}` — never both `content` and `value`; `'tools/result'` emit (observe-only) | breaker, karma from outcomes |
| Agent step | `'agent/pre-step'(this, {agent, messages, turn, step, signal}, next): Promise<PreStepDecision>` waterfall, `PreStepDecision = {kind:'reject'} \| {kind:'enter', messages: UserMessage[]}` (no other fields); `'agent/request'(…, next): Promise<LlmCallConfig>` waterfall (`LlmCallConfig = {provider, model, reasoningEffort?, temperature?, maxTokens?, stop?}`); `'agent/turn-stopping'` serial; `Agent.inject(message: UserMessage)`, `agent.session`, `agent.ctx` | vīthi Layer A, breaker notices |
| Loop replacement | `ctx.agents.setFactory(factory: AgentFactory): () => void` — throws if a factory exists; disposer clears the slot. Stock loop = plugin id `agent-loop` (`@deepseek-ai/dsh-agent-loop`) in `@deepseek-ai/dsh-base/cordis.patch.yml`. `AgentFactory = { createAgent(ownerCtx, options): Promise<AgentHandle>; resume(ownerCtx, options): Promise<AgentHandle> }`; `AgentHandle = { agent: Agent; dispose(): Promise<void> }`. Loop duties (docs): append every accepted fact to the session log, dispatch tools through the guarded pipeline, derive history from the session, synthesize `ABORTED_BEFORE_DISPATCH` on cancel | vīthi Layer B |
| Commands | `ctx.commands.register({name, description, input?, recordInput?, handler(invocation: {commandId, agent, rawInput, attachments, signal}) => CommandResult}): () => void`; `CommandResult = {kind:'success', text?: string, sourceEventSeq?: number} \| {kind:'error', text: string}` (error text is required); runs "without a model round trip" | /sit /koan /status /rebirth |
| System prompt | `ctx.systemPrompt.section({name, order, text})`; per-agent scoping via `agent.ctx.systemPrompt…` shadows globals | discipline section; realm persona sections |
| Subagents | `ctx.subagents.registerProvider(provider: SubagentProvider): () => void`; `SubagentProvider = {name, capabilities: {outputSchema, depthLimit, toolFilter, persona: boolean}, inheritsParentContext: boolean, start(request: ResolvedSubagentStartRequest): Promise<SubagentRun>}`; the request has `prompt: ContentBlock[]`, `parent: Agent`, `persona?: string`, `toolFilter?`, `agentOptions?: AgentOptions` (on the request, not on capabilities), `signal`; the stock in-process provider is registered as `'spawn'` by `@deepseek-ai/dsh-subagent-spawn-in-process` (config `providerName`, default `"spawn"`); `SubagentRun = {id, localAgent, result: Promise<SubagentResult>, dispose()}`; events `subagent/start|end` emit | realm personas |
| Sessions | `ctx.sessions` append-only log; `agent.session.header.cwd`; session id on `agent.session` | Being keyed by session id |
| Testing | vitest; "product-visible plugins require a non-unit REAL-composition test" booted through a test `cordis.yml` via the Loader; unit tests may mount a bare `Context` + the specific dsh services (`ToolRegistry` injects only `systemPrompt`) | test strategy |

## Design

### 1. Package layout (monorepo, approved)

```
dsh/
  package.json        # name: dsh-plugin-buddha (unscoped, matches the GitHub topic); peerDependency @deepseek-ai/cordis ^4;
                      # dependency buddha-js via "file:.."; devDependency @deepseek-ai/dsh 0.1.1-rc.2 (pinned exactly)
  tsup.config.ts      # ESM only ("type": "module"), entry src/index.ts → lib/index.js + d.ts
  src/index.ts        # apply(ctx, config): mounts the sub-plugins below in order
  src/config.ts       # Config schema (Standard Schema via the schema lib dsh uses, or zod's standard-schema output)
  src/being-registry.ts   # Being-per-session: get/create/persist, settle-on-mutate
  src/breaker.ts      # tools/post-execute waterfall: failure streaks + Poison Arrow injection
  src/karma.ts        # tools/result → Being.experience/act; agent/turn-stopping → save
  src/commands.ts     # /sit /koan /status /rebirth
  src/realms.ts       # ctx.subagents provider mapping persona → realm
  src/vithi.ts        # Layer A: agent/pre-step + agent/request annotations; javana seeds
  src/loop.ts         # Layer B (opt-in): AgentFactory replacement
  tests/              # vitest: unit (bare Context + dsh services) + one real-composition boot
  cordis.dev.yml      # --patch overlay for local dev: insert this plugin; (Layer B) disable agent-loop
```
Root `package.json` gains `build:dsh` / `test:dsh` scripts; CI installs `dsh/` deps with **pnpm** (documented: npm cannot resolve the tree on 8 GB machines).

### 2. Being per session (`being-registry.ts`)

- Key: DSH session id. Storage: `BUDDHA_STATE_DIR`-style directory under the DSH state root (config `stateDir`, default `~/.buddha/dsh/`), file per session via the existing `serializeBeing`/`deserializeBeing` — the v0.3 gap logic and realm factory come for free.
- Access discipline (v0.3 rule): read-only paths (`/status`) never settle nor save; mutating paths (`tools/result` karma, `/rebirth`, subagent start) call `settlePendingRebirth()` first and operate on the returned being; save at `agent/turn-stopping` and after every command that mutates.
- `Being.dispose()` on `subagent/end` for child beings and on session disposal.

### 3. Circuit breaker (`breaker.ts`) — the Poison Arrow

- Listener on `tools/post-execute` (waterfall). Per `(agent id, tool name)` keep a streak counter: `result.isError` → +1, success → reset. Identical failing `arguments` (deep-equal, hashed) count double — the definition of a blind retry.
- Below threshold (config `breaker.threshold`, default 3): `return next()`.
- At threshold: still `next()` (never hide the real error — the first arrow must be seen), but return `{ kind: 'accept', additionalContexts: [protocolMessage] }` where `protocolMessage` is a `UserMessage` rendering `PoisonArrow(suffering = "<tool> failed <n>× with <error class>")`'s four steps — recognize / investigate / release (`git checkout`-style discard of unverified edits is *advised*, never executed by the plugin) / practice — plus the being's current whyNot-style guidance. Plant an unwholesome seed (root `aversion`, description `blind retry of <tool>`) so thrashing becomes visible karma.
- Above 2× threshold: `{ kind: 'block', feedback: [...] }` with the protocol — the model must acknowledge before the tool can be retried (a subsequent successful non-identical call resets).
- All thresholds configurable; `breaker.enabled: false` turns it into observe-only.
- **Waterfall discipline (cross-review, High):** the listener ALWAYS `await next()`s first and then returns the downstream decision with the protocol message *merged* into `additionalContexts` — never a fresh decision object, so other post-execute plugins (spill logger, guards) still run. `block` likewise wraps the downstream decision.
- **Streak identity (cross-review):** count on the root call only (`exec.rootCallId === exec.callId`); Code-Mode sub-dispatches never increment. **Per step, not per call:** N parallel failures in one step count as one failure event (`DEFAULT_MAX_PARALLEL_TOOL_CALLS > 1`), so a single burst cannot trip the breaker. **Intervening edits reset the streak:** any successful mutating tool call (write/edit/apply-patch family, configurable list) between two failures resets it — a legitimate edit-then-retest cycle is not a blind retry.
- **Lifecycle:** streak state lives in a per-agent map created inside `agent.ctx.effect()` (disposed with the agent), never a module-level singleton.

### 4. Karma from outcomes (`karma.ts`)

- `tools/result` (emit, observe-only): success → `being.experience({ senseBase:'body', object: tool name, intensity: 4, valence:'pleasant' })`; failure → same with `'unpleasant'`, intensity scaled by streak. A completed turn with green tests/tool results → `act('completed <goal>', 6, 'non-delusion')`.
- This is deliberately shallow (metaphor-honest): karma here is telemetry of the agent's conduct, ripening under the v0.2 conditions; it is NOT a context-management system (see non-goals).

### 5. Commands (`commands.ts`)

`/sit <text>` → `PoisonArrow` four steps rendered as text (stateless); `/koan [id]` → `KoanGenerator.present`; `/status` → `getSummary()` + `getSeedStats()` + realm (read-only, no save); `/rebirth` → settle-or-rebirth on the session being, persist the NEW being, return `fromRealm → toRealm` + shaping seed. All return `{ kind: 'success', text }`.

### 6. Realm personas (`realms.ts`)

Provider `buddha-realms` with `capabilities.persona = true`, `inheritsParentContext = false` (anattā by contract). `start(request)`: map `persona` (`deva` architect/read-mostly, `asura` adversarial auditor, `human` implementer — unknown persona → human) to (a) a per-child `systemPrompt.section` carrying the realm's stance and the canonical caveat (deva comfort dulls urgency; asura rivalry; human balance) and (b) a `toolFilter` (deva: read-only tools; asura: read + test/run; human: all); then **delegate execution** to DSH's in-process provider `'spawn'` (`@deepseek-ai/dsh-subagent-spawn-in-process`, verified) — resolve it through the subagent runtime's provider lookup (the exact accessor is transcribed at implementation time; if no public lookup exists, the plugin composes by registering its provider with `inheritsParentContext: false` and constructing the child through `ctx.agents.create` like the stock provider does). Deva children may additionally run under `@deepseek-ai/dsh-plan-mode` (verified package) — read-mostly planning is what that mode enforces natively. The child's Being is a `transmigrate`d realm class seeded from the parent's karmic balance; on `subagent/end` its wholesome/unwholesome outcome is planted back into the parent as vipāka.

### 7. Citta-vīthi — Layer A (`vithi.ts`, ships)

- `agent/pre-step`: annotate the step (`bhavaṅga → āvajjana`), attach a `vithi` object to the step via a WeakMap keyed by agent; `return next()` unchanged.
- `agent/request`: `next()` unchanged (LlmCallConfig has no free-form slot — annotation lives in the plugin's own step record, not in the request).
- `tools/result` + turn end: run `being.cognize(<tool outcome summary>, 'mind')` once per step — the javanas plant ≤3 seeds with the canonical timing (1st → this incarnation, 2–6 → any future, 7th → next) — and expose the last vīthi in `/status`.
- Zero risk to the loop; pure observation + karma.

### 8. Citta-vīthi — Layer B (`loop.ts`, opt-in, last task)

- Enabled only with config `loop: 'citta-vithi'` AND an overlay that disables plugin `agent-loop`; the plugin refuses to `setFactory` if a factory is already registered (clear error naming the overlay).
- **Verified cost (cross-review, High):** the stock loop's `ReactLoopAgent` is package-internal — `@deepseek-ai/dsh-agent-loop` exports only the `AgentLoop` service (`lib/index.js` is 1,318 lines); there is no public class to compose or wrap. Layer B therefore means reimplementing the driver state machine. It is kept in v0.5 per the approved scope, but as the LAST task with an explicit go/no-go after Layer A ships (criteria: the rc API unchanged since the pin, and Layer A's real-composition test green); if the gate fails it moves to v0.6 without blocking the release.
- Implementation strategy when the gate passes: reimplement the documented duties with the stock loop's source as the reference: each step = 17 named phases (bhavaṅga → āvajjana → pañca-viññāṇa (inbox) → sampaṭicchana (history derivation) → santīraṇa (system prompt assembly) → voṭṭhabbana (LlmCallConfig) → javana ×7 (streaming + tool dispatch through the guarded pipeline) → tadārammaṇa ×2 (session append) → bhavaṅga), honoring every documented loop duty. Ships behind the flag with its own real-composition test; if the rc API churns before merge, the task is allowed to land as "experimental, tested against 0.1.1-rc.2 only".

### 9. Testing

- Unit (vitest, in `dsh/tests`): breaker streak/threshold/identical-args logic with a bare Cordis `Context` + a mounted `ToolRegistry` (+ its `systemPrompt` dependency) and a fake tool that fails on demand; commands via direct `handler(invocation)` calls; realm mapping; being registry persistence with a temp dir; Layer A annotations.
- Real-composition: one test that boots `dsh` headless through a test `cordis.yml` (Loader) with `dsh-plugin-buddha` inserted and a `MockAdapter`-style fake LLM, drives a scripted tool failure ×3, and asserts the protocol message reached the model request (via the session log — "model-visible ⟺ logged").
- Compatibility gate: `dsh/tests/compat.test.ts` asserts the exact event names and decision shapes exist in the installed dsh version — a churned API fails loudly, not silently.

### 10. Risks

| Risk | Mitigation |
|---|---|
| rc API breaks | exact pin + compat test + Layer B behind a flag |
| npm cannot install dsh (OOM) | pnpm documented and used in CI; Buddha.js core needs no dsh at all |
| Breaker blocks a legitimately-retried flaky tool | threshold ≥3, identical-args heuristic, `block` only at 2×, configurable, observe-only mode |
| Persona naming as cargo-cult | personas are real prompt sections + tool filters, not labels |
| Being.ts coupling | plugin depends only on public exports (`Being`, `REALM_CLASSES`, `PoisonArrow`, `KoanGenerator`, serializer) |
