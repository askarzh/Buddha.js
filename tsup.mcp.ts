import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { mcp: 'src/mcp/index.ts' },
  format: ['esm'],
  outDir: 'dist',
  outExtension: () => ({ js: '.mjs' }),
  banner: { js: '#!/usr/bin/env node' },
});
