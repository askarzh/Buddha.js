import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as os from 'node:os';
import * as path from 'node:path';
import { StateManager } from '../cli/utils/state';
import { listBeings } from './handlers';

const stateDir = process.env.BUDDHA_STATE_DIR || path.join(os.homedir(), '.buddha');
const sm = new StateManager(stateDir);

const server = new McpServer({
  name: 'buddha-js',
  version: '0.1.0',
});

server.tool(
  'buddha_list_beings',
  'List all saved beings',
  {},
  async () => ({
    content: [{ type: 'text' as const, text: JSON.stringify(listBeings(sm)) }],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Buddha.js MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
