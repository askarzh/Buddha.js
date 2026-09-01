/**
 * Report a fault that is deliberately not rethrown.
 *
 * Written to stderr rather than `ctx.logger`: at dsh 0.1.1-rc.2 nothing
 * registers a logger exporter, so a logged record is dropped before it reaches
 * any stream. A swallowed fault that leaves no trace is undebuggable; this
 * keeps the swallow (callers must not crash) while leaving the trace.
 */
export function reportSwallowed(where: string, error: unknown): void {
  let detail: string
  try {
    detail = error instanceof Error ? (error.stack ?? error.message) : String(error)
  } catch {
    detail = '<unprintable error>'
  }
  process.stderr.write(`buddha: swallowed fault in ${where}: ${detail}\n`)
}
