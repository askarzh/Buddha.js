import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { mcp: 'src/mcp/index.ts' },
  format: ['esm'],
  outDir: 'dist',
  outExtension: () => ({ js: '.mjs' }),
  banner: { js: '#!/usr/bin/env node' },
  // The bundle is redistributed standalone (Claude Code plugin, MCPB) where no
  // node_modules exists up-tree — inline all npm dependencies (tsup externalizes
  // package.json dependencies by default, which only works inside this repo).
  noExternal: [/^@modelcontextprotocol\/sdk/, 'zod'],
});
