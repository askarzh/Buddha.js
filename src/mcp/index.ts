import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as os from 'node:os';
import * as path from 'node:path';
import { StateManager } from '../cli/utils/state';
import { createBeing, listBeings, deleteBeing, getStatus, experienceSensory, act, ripenKarma } from './handlers';
import type { SenseBase, KarmaQuality, Intensity, UnwholesomeRoot, WholesomeRoot } from '../utils/types';

const stateDir = process.env.BUDDHA_STATE_DIR || path.join(os.homedir(), '.buddha');
const sm = new StateManager(stateDir);

const server = new McpServer({
  name: 'buddha-js',
  version: '0.1.0',
});

const nameSchema = {
  name: z.string().describe('Name of the being (letters, numbers, hyphens, underscores)'),
};

const intensitySchema = z.number().int().min(0).max(10).describe('Intensity level (0-10)');
const senseBaseSchema = z.enum(['eye', 'ear', 'nose', 'tongue', 'body', 'mind']).describe('Sense base');
const karmaQualitySchema = z.enum(['wholesome', 'unwholesome', 'neutral']).describe('Moral quality');
const rootSchema = z.enum([
  'greed', 'aversion', 'delusion',
  'non-greed', 'non-aversion', 'non-delusion',
]).optional().describe('Root cause');

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

server.tool(
  'buddha_experience',
  'Process a sensory experience through the five aggregates',
  {
    ...nameSchema,
    senseBase: senseBaseSchema,
    object: z.string().describe('What is experienced'),
    intensity: intensitySchema,
  },
  async ({ name, senseBase, object, intensity }) => {
    try {
      const result = experienceSensory(sm, name, {
        senseBase: senseBase as SenseBase,
        object,
        intensity: intensity as Intensity,
      });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);

server.tool(
  'buddha_act',
  'Perform an intentional action that creates karma',
  {
    ...nameSchema,
    description: z.string().describe('Description of the intentional action'),
    quality: karmaQualitySchema,
    intensity: intensitySchema,
    root: rootSchema,
  },
  async ({ name, description, quality, intensity, root }) => {
    try {
      const result = act(
        sm, name, description,
        quality as KarmaQuality,
        intensity as Intensity,
        root as UnwholesomeRoot | WholesomeRoot | undefined,
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);

server.tool(
  'buddha_karma_ripen',
  'Check for and receive any ripened karmic results',
  nameSchema,
  async ({ name }) => {
    try {
      const results = ripenKarma(sm, name);
      return { content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
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
