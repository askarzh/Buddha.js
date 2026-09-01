import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'lib',
  dts: true,
  clean: true,
  sourcemap: true,
  // The host provides these; bundling them would put a second copy of DSH's
  // runtime classes in the process. `buddha-js` is NOT external — the host has
  // never heard of it, and inlining it is what makes the plugin a single file.
  // tsup externalises everything under "dependencies"/"peerDependencies" in
  // package.json by default, so buddha-js (a "dependencies" entry) must be
  // forced back into the bundle via noExternal.
  external: [/^@deepseek-ai\//],
  noExternal: ['buddha-js'],
})
