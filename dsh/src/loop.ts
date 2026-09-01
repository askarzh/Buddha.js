import type { Context } from '@deepseek-ai/cordis'
import type {
  Agent,
  AgentFactory,
  AgentHandle,
  AgentOptions,
  AgentStatus,
  CancelOptions,
  CreateAgentOptions,
  PreStepDecision,
  ResumeAgentOptions,
} from '@deepseek-ai/dsh-agent'
import { Inbox, agentCarrier, agentEvents, assembleContextFor, emitAgentEvent } from '@deepseek-ai/dsh-agent'
import type { InboxTarget } from '@deepseek-ai/dsh-agent'
import {
  createAssistantMessage,
  createToolResultMessage,
  markAgentLoopRequest,
  type ContentBlock,
  type FinishReason,
  type GenerateOptions,
  type LlmCallConfig,
  type Message,
  type TokenUsage,
  type ToolCallBlock,
} from '@deepseek-ai/dsh-llm'
import type { AgentCancelCause, RequestHeaderReason, Session, SessionId, TurnEndReason, UserMessage } from '@deepseek-ai/dsh-session'
import { renderPrompt } from '@deepseek-ai/dsh-system-prompt'
import { TOOL_ABORTED_BEFORE_DISPATCH, type ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import type { BeingRegistry } from './being-registry.js'
import { reportSwallowed } from './errors.js'

/**
 * Merge-extension of the durable session vocabulary: one lightweight,
 * ignorable-by-default marker per citta-vīthi mind-moment phase this loop
 * passes through for a step. Not model-visible — a plain observability
 * fact, appended the same way `@deepseek-ai/dsh-agent`'s own `types.ts`
 * merges `agent/inbox/spliced` into this map (the sanctioned mechanism for
 * a plugin to grow the vocabulary; see `SessionEventMap`'s own doc comment).
 *
 * The classical Abhidhamma model names 17 mind-moments per full citta-vīthi:
 * atīta-bhavaṅga, bhavaṅga-calana, bhavaṅgupaccheda (3, collapsed here into
 * one `bhavanga-arising` marker), āvajjana (1), pañca-dvārāviññāṇa (1),
 * sampaṭicchana (1), santīraṇa (1), voṭṭhabbana (1), javana (7, collapsed
 * into one `javana` marker spanning the model stream plus its tool
 * dispatches), and tadārammaṇa (2, logged as two separate `tadarammana`
 * markers — once after the assistant message is recorded, once after tool
 * results and any breaker/karma-staged context are recorded). 3+1+1+1+1+1+7+2
 * = 17. The full mapping is documented in the Task 9 report, not re-derived
 * at every call site.
 */
export type VithiPhase =
  | 'bhavanga-arising'
  | 'avajjana'
  | 'pancadvaravinnana'
  | 'sampaticchana'
  | 'santirana'
  | 'votthapana'
  | 'javana'
  | 'tadarammana'

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    'buddha/vithi-phase': { turn: number; step: number; phase: VithiPhase }
  }
}

/** How many steps one turn may run before this experimental loop gives up and closes it as an error. Guards against a misbehaving mock/model looping forever. */
const MAX_STEPS_PER_TURN = 64

/**
 * Minimal same-process `Agent` implementation driving the citta-vīthi
 * structured loop. Ported DUTIES (not code) from the stock
 * `@deepseek-ai/dsh-agent-loop` (`lib/index.js`, ~1318 lines), read as
 * reference for Task 9:
 *
 * - every accepted fact (claimed inbox messages, the request header,
 *   the assistant message, tool results, breaker/karma-staged context) is
 *   appended to `session` before the loop acts on it — with one deliberate
 *   divergence: context a tool call produces (`additionalContexts`) is
 *   attached to that call's own tool result rather than spliced into the
 *   next-step inbox as a free-standing `user/message`, because a model that
 *   reads the cessation protocol in the user's voice is right to distrust it
 *   (see the FRAMING note at the attachment site);
 * - every tool call is dispatched through `ctx.tools.execute()` — the
 *   guarded pre/around/post pipeline — never a tool's `execute` directly;
 * - the LLM request's message history is `session.deriveMessages()`,
 *   re-derived fresh each step, never accumulated in a local variable;
 * - `agent/pre-step` (waterfall), `agent/request` (waterfall), and
 *   `agent/turn-stopping` (serial) are dispatched exactly as the stock loop
 *   documents them, so Layer A (`vithi.ts`) and the Poison Arrow breaker
 *   (`breaker.ts`), both registered as plain (unscoped) listeners on the
 *   same plugin `ctx`, keep firing unmodified;
 * - a tool call that would dispatch after the turn's signal already
 *   aborted is never sent to `ctx.tools.execute()` — it is synthesized
 *   locally as an `ABORTED_BEFORE_DISPATCH` failure, matching the stock
 *   loop's cancellation contract.
 *
 * Deliberate simplifications versus the stock loop (documented honestly in
 * the Task 9 report, not hidden): tool calls within one step dispatch
 * strictly sequentially (no parallel/exclusive scheduling); no raw
 * `assistant/chunk` replay-fidelity logging (only the assembled
 * `assistant/message`); sessions are created via the simpler
 * `ctx.sessions.create()` rather than the ordered `prepare`/`enter`/
 * `announce` transaction the stock loop uses to keep session and agent
 * teardown ordered; `resume()` is not implemented.
 */
class CittaVithiAgent implements Agent {
  readonly id: SessionId
  readonly options: AgentOptions
  readonly session: Session
  readonly inbox: Inbox
  readonly ctx: Context
  status: AgentStatus = 'idle'

  private readonly events: ReturnType<typeof agentEvents>
  private turnCounter = 0
  private driving: Promise<void> | undefined
  private idleWaiters: Array<() => void> = []
  private activeController: AbortController | undefined
  private maintenanceActive = false

  constructor(
    private readonly rootCtx: Context,
    ctx: Context,
    id: SessionId,
    session: Session,
    options: AgentOptions,
  ) {
    this.id = id
    this.ctx = ctx
    this.session = session
    this.options = options
    const carrier = agentCarrier(this)
    this.events = agentEvents(rootCtx, this, carrier)
    this.inbox = new Inbox(session, {
      inserted: (message) => this.events.emit('agent/inbox/inserted', { message }),
      discarded: (message) => this.events.emit('agent/inbox/discarded', { message }),
      claimed: (message, turn) => this.events.emit('agent/inbox/claimed', { message, turn }),
    })
  }

  cancel(cause: AgentCancelCause, options?: CancelOptions): void {
    this.activeController?.abort(cause)
    if (!options?.keepInbox) this.inbox.clear()
  }

  async whenIdle(): Promise<void> {
    if (!this.driving) return
    await new Promise<void>((resolve) => this.idleWaiters.push(resolve))
  }

  async runMaintenance<T>(task: (signal: AbortSignal) => Promise<T>): Promise<T> {
    if (this.status === 'running' || this.maintenanceActive) {
      throw new Error('citta-vithi loop: runMaintenance() called while the agent is already driving or maintaining')
    }
    this.maintenanceActive = true
    const controller = new AbortController()
    try {
      return await task(controller.signal)
    } finally {
      this.maintenanceActive = false
    }
  }

  send(message: UserMessage, target: InboxTarget, wakeup: boolean): void {
    this.inbox.append(target, message)
    if (wakeup) this.wake()
  }

  followup(message: UserMessage): void {
    this.inbox.append('next-turn', message)
    this.wake()
  }

  steer(message: UserMessage): void {
    this.inbox.append('next-step', message)
    this.wake()
  }

  inject(message: UserMessage): void {
    this.inbox.append('next-step', message)
  }

  private setStatus(status: AgentStatus): void {
    if (this.status === status) return
    this.status = status
    this.events.emit('agent/status', { status })
  }

  private wake(): void {
    if (this.status === 'running') return
    this.setStatus('running')
    this.driving = this.driveLoop()
      .catch((error) => {
        emitAgentEvent(this.rootCtx, this, 'agent/error', { turn: this.turnCounter, step: 0, error })
      })
      .finally(() => {
        this.driving = undefined
        this.setStatus('idle')
        const waiters = this.idleWaiters
        this.idleWaiters = []
        for (const resolve of waiters) resolve()
      })
  }

  private async driveLoop(): Promise<void> {
    while (this.inbox.hasPending) {
      await this.runTurn()
    }
  }

  private markPhase(turn: number, step: number, phase: VithiPhase): void {
    this.session.append('buddha/vithi-phase', { turn, step, phase })
  }

  private async runTurn(): Promise<void> {
    const turn = ++this.turnCounter
    const controller = new AbortController()
    this.activeController = controller
    this.session.append('turn/start', { turn })

    let reason: TurnEndReason = { kind: 'completed' }
    try {
      const firstBatch = this.inbox.claim('next-turn', turn)
      let step = 0
      let pending: UserMessage[] = firstBatch

      for (;;) {
        step += 1
        if (step > MAX_STEPS_PER_TURN) {
          reason = { kind: 'error', error: { message: `citta-vithi loop: exceeded ${MAX_STEPS_PER_TURN} steps in one turn`, code: 'STEP_LIMIT' } }
          break
        }

        this.markPhase(turn, step, 'bhavanga-arising')

        this.markPhase(turn, step, 'avajjana')
        const decision = await this.events.waterfall(
          'agent/pre-step',
          { messages: pending, turn, step, signal: controller.signal },
          async (): Promise<PreStepDecision> => ({ kind: 'enter', messages: pending }),
        )
        if (decision.kind === 'reject') {
          reason = { kind: 'blocked' }
          break
        }

        this.markPhase(turn, step, 'pancadvaravinnana')
        for (const message of decision.messages) {
          this.session.append('user/message', message, { surfaceOp: 'append' })
        }

        this.markPhase(turn, step, 'sampaticchana')
        const history: Message[] = this.session.deriveMessages()

        this.markPhase(turn, step, 'santirana')
        const assembly = await this.rootCtx.systemPrompt.assemble(assembleContextFor(this, controller.signal))
        const system = renderPrompt(assembly)
        const tools = this.rootCtx.tools.schemas(this)

        this.markPhase(turn, step, 'votthapana')
        const priorHeader = this.session.requestHeader()
        const defaultConfig: LlmCallConfig = priorHeader?.config ?? {
          provider: this.options.provider ?? 'unset',
          model: this.options.model ?? 'unset',
          ...(this.options.maxTokens === undefined ? {} : { maxTokens: this.options.maxTokens }),
        }
        const config = await this.events.waterfall('agent/request', { turn, step, signal: controller.signal }, async () => defaultConfig)
        const headerReason: RequestHeaderReason = priorHeader === undefined ? 'initial' : 'change'
        // Session events must be losslessly JSON-serializable: an object key
        // present with value `undefined` is rejected, so optional fields are
        // omitted entirely rather than set to `undefined`.
        this.session.append('request/header', {
          header: {
            config,
            ...(system ? { system } : {}),
            ...(tools.length > 0 ? { tools } : {}),
          },
          reason: headerReason,
        })

        const options: GenerateOptions = markAgentLoopRequest({
          provider: config.provider,
          model: config.model,
          ...(config.reasoningEffort === undefined ? {} : { reasoningEffort: config.reasoningEffort }),
          ...(config.temperature === undefined ? {} : { temperature: config.temperature }),
          ...(config.maxTokens === undefined ? {} : { maxTokens: config.maxTokens }),
          ...(config.stop === undefined ? {} : { stop: config.stop }),
          messages: history,
          ...(system ? { system } : {}),
          ...(tools.length > 0 ? { tools } : {}),
          signal: controller.signal,
          sessionId: this.id,
        })

        this.markPhase(turn, step, 'javana')
        const content: ContentBlock[] = []
        let usage: TokenUsage | undefined
        let finish: FinishReason | undefined
        for await (const chunk of this.rootCtx.llm.stream(options)) {
          if (chunk.type === 'block-end') content.push(chunk.block)
          else if (chunk.type === 'usage') usage = chunk.usage
          else if (chunk.type === 'finish') finish = chunk.reason
        }

        const assistantMessage = createAssistantMessage({ content, source: { provider: config.provider, model: config.model } })
        this.markPhase(turn, step, 'tadarammana')
        this.session.append(
          'assistant/message',
          { turn, step, message: assistantMessage, ...(usage === undefined ? {} : { usage }) },
          { surfaceOp: 'append' },
        )

        if (finish?.kind === 'error') {
          reason = { kind: 'error', error: finish.failure }
          break
        }
        if (finish?.kind === 'aborted') {
          reason = { kind: 'aborted', reason: { kind: 'hook', reason: finish.failure.message } }
          break
        }
        if (finish?.kind === 'max-tokens') {
          reason = { kind: 'max-tokens' }
        }

        const toolCalls = content.filter((block): block is ToolCallBlock => block.type === 'tool-call')
        const staged: UserMessage[] = []
        let concludesTurn = false

        for (const call of toolCalls) {
          let result: ToolExecutionResult
          // Whether `result` came back from a real `ctx.tools.execute()`
          // dispatch (and therefore has an owning, executed tool call that
          // any `additionalContexts` on it belong to), as opposed to a
          // failure this loop synthesized locally without ever entering the
          // tool pipeline.
          let dispatched = false
          if (controller.signal.aborted) {
            result = {
              isError: true,
              error: { message: 'Aborted before dispatch.', info: { name: 'HarnessError', code: TOOL_ABORTED_BEFORE_DISPATCH } },
              content: [{ type: 'text', text: 'Aborted before dispatch.' }],
            }
          } else {
            let parsedArgs: unknown
            let parseError: string | undefined
            try {
              parsedArgs = call.arguments.length > 0 ? JSON.parse(call.arguments) : {}
            } catch (error) {
              parseError = error instanceof Error ? error.message : String(error)
            }
            if (parseError !== undefined) {
              result = {
                isError: true,
                error: { message: `Invalid tool call arguments: ${parseError}`, info: { name: 'HarnessError', code: 'INVALID_ARGUMENTS' } },
                content: [{ type: 'text', text: `Invalid tool call arguments: ${parseError}` }],
              }
            } else {
              // The guarded pipeline: pre-execute policy, around-dispatch,
              // post-execute policy (this is where the Poison Arrow breaker
              // and karma tracking observe/react — see breaker.ts/karma.ts),
              // then final notification. Never call a tool's own `execute`.
              result = await this.rootCtx.tools.execute({
                callId: call.id,
                name: call.name,
                arguments: parsedArgs,
                agent: this,
                signal: controller.signal,
              })
              dispatched = true
            }
          }

          // `additionalContexts` (e.g. the breaker's Poison Arrow notice) is
          // carried on BOTH `ToolExecutionSuccess` and `ToolExecutionFailure`
          // — a failed call is exactly when the breaker has something to
          // say — so it is read unconditionally; only `concludesTurn` is
          // success-only.
          //
          // FRAMING (the point of this branch): context produced BY a tool
          // call rides back attached to that call's own tool result, inside
          // the `tool-result` block's content, never as a standalone
          // `user/message`. Detached, the Poison Arrow cessation protocol
          // reads to a model like text of unknown provenance appearing in
          // the user's voice — a live DeepSeek run under this loop called it
          // "prompting-injection-style material masquerading as a
          // system/cessation signal" and deliberately ignored it, while the
          // same protocol delivered on the tool result was followed. A
          // discipline the model correctly discounts is worse than none.
          const owned = dispatched ? (result.additionalContexts ?? []) : []
          const attachedBlocks: ContentBlock[] = owned.flatMap((message) => [...message.content])

          const toolResultMessage = createToolResultMessage({
            callId: call.id,
            content: attachedBlocks.length > 0 ? [...result.content, ...attachedBlocks] : result.content,
            isError: result.isError,
          })
          this.session.append(
            'tool/result',
            {
              turn,
              step,
              message: toolResultMessage,
              ...(result.isError && result.error.info ? { error: result.error.info } : {}),
            },
            { surfaceOp: 'append' },
          )
          // The surviving `staged` path: context with NO owning executed tool
          // call. Not every `additionalContexts` producer is the breaker —
          // a result this loop synthesized itself (aborted before dispatch,
          // unparseable arguments) never entered `tools/post-execute`, so
          // any context on it was not produced by this call and has no tool
          // result of its own to ride; it is appended as its own message
          // rather than silently dropped or falsely attributed to a tool the
          // harness never actually ran.
          if (!dispatched && result.additionalContexts) staged.push(...result.additionalContexts)
          if (!result.isError && result.concludesTurn) concludesTurn = true
        }

        this.markPhase(turn, step, 'tadarammana')
        for (const message of staged) {
          this.session.append('user/message', message, { surfaceOp: 'append' })
        }

        if (toolCalls.length === 0 || concludesTurn) {
          await this.events.serial('agent/turn-stopping', { turn, signal: controller.signal })
          if (this.inbox.nextStep.length === 0) break
          pending = this.inbox.claim('next-step', turn)
          continue
        }

        pending = this.inbox.claim('next-step', turn)
      }
    } catch (error) {
      reason = { kind: 'error', error: { message: error instanceof Error ? error.message : String(error), code: 'UNKNOWN' } }
    } finally {
      this.activeController = undefined
    }

    this.session.append('turn/end', { turn, reason })

    // Not itself a documented loop duty (the stock loop delegates this to
    // `dsh-session-checkpoint-policy`), but flushing at the turn boundary
    // guarantees any persistence backend actually durably observes this
    // turn's events without depending on which optional checkpoint plugin
    // happens to be mounted alongside this experimental loop. Contained:
    // a flush failure must not be reported as this turn's own failure.
    try {
      await this.rootCtx.sessions.flush(this.session)
    } catch (error) {
      // best-effort; see comment above
      reportSwallowed('loop: session flush', error)
    }
  }
}

/**
 * The agent-creation factory registered via `ctx.agents.setFactory()` when
 * `config.loop === 'citta-vithi'`. See `CittaVithiAgent` for the ported
 * duties and documented simplifications.
 */
export class CittaVithiFactory implements AgentFactory {
  constructor(private readonly ctx: Context) {}

  async createAgent(ownerCtx: Context, options: CreateAgentOptions): Promise<AgentHandle> {
    const session = this.ctx.sessions.create(options.sessionId, { seed: options.seed, meta: options.meta })
    const agentCtx = ownerCtx.extend({})
    const agent = new CittaVithiAgent(this.ctx, agentCtx, options.sessionId, session, options.agentOptions ?? {})

    if (options.setup) {
      const commit = await options.setup(agentCtx)
      if (commit && 'commit' in commit) commit.commit()
    }

    const disposeRegistration = this.ctx.agents.register(agent)
    emitAgentEvent(this.ctx, agent, 'agent/session-start', { source: 'startup' })

    return {
      agent,
      async dispose(): Promise<void> {
        agent.cancel({ kind: 'disposed' })
        await agent.whenIdle()
        disposeRegistration()
      },
    }
  }

  async resume(_ownerCtx: Context, _options: ResumeAgentOptions): Promise<AgentHandle> {
    // Not implemented: resuming a persisted session correctly requires the
    // same ordered `sessionPersistence.prepare()` + `prepare`/`enter`/
    // `announce` transaction the stock loop uses, which this experimental,
    // opt-in loop does not attempt to reproduce. Documented honestly in the
    // Task 9 report rather than faked.
    throw new Error('dsh-plugin-buddha: citta-vithi loop does not implement resume() — experimental loop supports fresh sessions only')
  }
}

/**
 * Mount the citta-vīthi loop replacement. Deferred behind `ctx.inject`
 * (never eagerly touching `ctx.agents`, matching `applyRealms`'s and
 * `applyCommands`'s discipline for services the root plugin does not
 * declare in its own `inject` list) so this is a no-op against a context
 * that never provides `agents`/`llm`/`sessions` (e.g. `tests/mount.test.ts`'s
 * bare `Context`).
 *
 * `ctx.agents.setFactory()` throws if a factory is already registered —
 * i.e. the stock `agent-loop` plugin is still mounted — so that throw is
 * caught and re-raised with an actionable message naming the overlay change
 * the user must make.
 */
export function applyLoop(ctx: Context, _deps: { registry: BeingRegistry }) {
  return ctx.inject(['agents', 'llm', 'sessions', 'systemPrompt'], (ctx) => {
    const factory = new CittaVithiFactory(ctx)
    try {
      ctx.agents.setFactory(factory)
    } catch (error) {
      throw new Error(
        'dsh-plugin-buddha: loop replacement requires disabling plugin "agent-loop" in your cordis overlay ' +
          `(setFactory failed: ${error instanceof Error ? error.message : String(error)})`,
      )
    }

    // The stock `agent-loop` plugin owns the `{{cwd}}` prompt variable read
    // by the deployment persona template (alongside `provider`/`model`,
    // which `agent-default-model` already registers independently, so this
    // loop must not re-register those two — `SystemPrompt.variable()`
    // throws on a duplicate name). Since `agent-loop` is disabled whenever
    // this loop is active, this loop must take over that one variable or
    // every assembly fails with "unknown prompt variable {{cwd}}".
    ctx.systemPrompt.variable('cwd', (context) => context.agent?.session.header.cwd)
  })
}
