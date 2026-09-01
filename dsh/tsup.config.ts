import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'lib',
  dts: true,
  clean: true,
  sourcemap: true,
  // The host provides these; bundling them would put a second copy of DSH's
  // runtime classes in the process.
  // `buddha-js` is deliberately NOT forced back into the bundle: it is a
  // declared "dependencies" entry, so tsup already externalises it by
  // default and the package manager resolves it on install — the host
  // doesn't need to provide it, npm/pnpm does. Forcing it inline with
  // noExternal made the bundle ~7x larger for no benefit.
  external: [/^@deepseek-ai\//],
})
