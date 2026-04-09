import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { MarkieClient } from './client.js';
import { CatalogCache } from './catalog-cache.js';
import { toolSearchAssets } from './tools/search-assets.js';
import { toolGetAssetDetail } from './tools/get-asset-detail.js';
import { toolGetAssetThumbnail } from './tools/get-asset-thumbnail.js';
import { toolGetAssetFile } from './tools/get-asset-file.js';
import { toolListTags } from './tools/list-tags.js';
import { toolListColors } from './tools/list-colors.js';
import { toolGetRecent } from './tools/get-recent.js';
import { toolGetStats } from './tools/get-stats.js';

const client = new MarkieClient();
const cache = new CatalogCache(client);

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };

const server = new McpServer({
  name: 'markie',
  version: pkg.version,
});

// Register tools
server.registerTool('search_assets', {
  description: 'Search your Markie asset library. Supports full-text search plus filters for type, tags, date range, and colors.',
  inputSchema: {
    query: z.string().optional().describe('Full-text search query'),
    tags: z.array(z.string()).optional().describe('Filter assets that have ALL of these tags'),
    type: z.enum(['image', 'video', 'pdf', 'vector', 'website']).optional().describe('Filter by asset type'),
    dateFrom: z.string().optional().describe('Filter assets saved on or after this ISO date (e.g. 2026-03-01)'),
    dateTo: z.string().optional().describe('Filter assets saved on or before this ISO date'),
    colors: z.array(z.string()).optional().describe('Filter assets with at least one of these hex colors in their palette'),
    limit: z.number().int().min(1).max(100).optional().describe('Max results to return (default 20)'),
  },
}, async (args) => toolSearchAssets(args, cache));

server.registerTool('get_asset_detail', {
  description: 'Get full metadata for a single asset by ID.',
  inputSchema: {
    id: z.string().describe('Asset ID'),
  },
}, async (args) => toolGetAssetDetail(args, cache));

server.registerTool('get_asset_thumbnail', {
  description: 'Get the thumbnail image for an asset. Returns a base64-encoded JPEG so you can see the asset.',
  inputSchema: {
    id: z.string().describe('Asset ID'),
  },
}, async (args) => toolGetAssetThumbnail(args, cache, client));

server.registerTool('get_asset_file', {
  description: 'Get the full file content of an asset as base64. Returns an error if the file is larger than 10MB.',
  inputSchema: {
    id: z.string().describe('Asset ID'),
  },
}, async (args) => toolGetAssetFile(args, cache, client));

server.registerTool('list_tags', {
  description: 'List all tags used in your asset library, sorted by frequency.',
  inputSchema: {},
}, async () => toolListTags({} as Record<string, never>, cache));

server.registerTool('list_colors', {
  description: 'List all colors from asset color palettes, sorted by frequency.',
  inputSchema: {},
}, async () => toolListColors({} as Record<string, never>, cache));

server.registerTool('get_recent', {
  description: 'Get the most recently saved assets.',
  inputSchema: {
    n: z.number().int().min(1).max(50).optional().describe('Number of assets to return (default 10, max 50)'),
  },
}, async (args) => toolGetRecent(args, cache));

server.registerTool('get_stats', {
  description: 'Get statistics about your asset library: total count, breakdown by type, total size, tag count, and date range.',
  inputSchema: {},
}, async () => toolGetStats({} as Record<string, never>, cache));

// Connect and start
const transport = new StdioServerTransport();

// Startup: register with Markie (non-fatal if offline)
try {
  await client.register();
} catch (err) {
  // Markie is offline — tools will handle this gracefully
  process.stderr.write('Warning: Could not connect to Markie desktop app. Start Markie to use these tools.\n');
}

await server.connect(transport);
