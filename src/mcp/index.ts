import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as os from 'node:os';
import * as path from 'node:path';
import { StateManager } from '../cli/utils/state';
import { createBeing, listBeings, deleteBeing, getStatus } from './handlers';

const stateDir = process.env.BUDDHA_STATE_DIR || path.join(os.homedir(), '.buddha');
const sm = new StateManager(stateDir);

const server = new McpServer({
  name: 'buddha-js',
  version: '0.1.0',
});

const nameSchema = {
  name: z.string().describe('Name of the being (letters, numbers, hyphens, underscores)'),
};

server.tool(
  'buddha_list_beings',
  'List all saved beings',
  {},
  async () => ({
    content: [{ type: 'text' as const, text: JSON.stringify(listBeings(sm)) }],
  }),
);

server.tool(
  'buddha_create_being',
  'Create a new being and persist it to disk',
  nameSchema,
  async ({ name }) => {
    try {
      const summary = createBeing(sm, name);
      return {
        content: [{ type: 'text' as const, text: summary }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Error creating being: ${(err as Error).message}` }],
        isError: true,
      };
    }
  },
);

server.tool(
  'buddha_delete_being',
  'Delete a saved being',
  nameSchema,
  async ({ name }) => {
    try {
      const message = deleteBeing(sm, name);
      return {
        content: [{ type: 'text' as const, text: message }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Error deleting being: ${(err as Error).message}` }],
        isError: true,
      };
    }
  },
);

server.tool(
  'buddha_status',
  'Get the current status of a being',
  nameSchema,
  async ({ name }) => {
    try {
      const { summary, state } = getStatus(sm, name);
      return {
        content: [
          { type: 'text' as const, text: summary },
          { type: 'text' as const, text: JSON.stringify(state, null, 2) },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Error getting status: ${(err as Error).message}` }],
        isError: true,
      };
    }
  },
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
