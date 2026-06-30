# markie-mcp

[![npm version](https://img.shields.io/npm/v/@vitgranen/markie-mcp)](https://www.npmjs.com/package/@vitgranen/markie-mcp)
[![license](https://img.shields.io/npm/l/@vitgranen/markie-mcp)](./LICENSE)

MCP (Model Context Protocol) server for [Markie](https://getmarkie.app) — a personal asset library for designers and developers. Markie collects images, videos, PDFs, SVGs, and website bookmarks via a Chrome extension, then enriches them with AI-generated descriptions, tags, and color palettes. This MCP server lets AI assistants search, browse, and retrieve assets from your Markie library.

## Prerequisites

1. The [Markie desktop app](https://getmarkie.app) must be running on your machine (it serves the API on `localhost:3210`).
2. Node.js 18 or later.

## Setup

No API key required — the server authenticates automatically with the local Markie app.

### Claude Code

```bash
claude mcp add markie -- npx -y @vitgranen/markie-mcp
```

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "markie": {
      "command": "npx",
      "args": ["-y", "@vitgranen/markie-mcp"]
    }
  }
}
```

### Cursor / other MCP clients

Use `npx -y @vitgranen/markie-mcp` as the command. The server communicates over stdio.

## Available Tools

### `search_assets`

Full-text search across your library with optional filters.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | Search query (searches descriptions, titles, tags, URLs, categories) |
| `tags` | string[] | No | Only assets that have **all** of these tags |
| `type` | string | No | Asset type: `image`, `video`, `pdf`, `vector`, or `website` |
| `dateFrom` | string | No | ISO date — assets saved on or after this date |
| `dateTo` | string | No | ISO date — assets saved on or before this date |
| `colors` | string[] | No | Hex colors — assets with at least one matching palette color |
| `limit` | number | No | Max results to return (default 20, max 100) |

### `get_asset_detail`

Full metadata for a single asset.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Asset ID |

### `get_asset_thumbnail`

Thumbnail image for an asset. Returns a base64-encoded JPEG so the AI can see the asset visually.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Asset ID |

### `get_asset_file`

Full file content as base64. Returns an error if the file exceeds 10 MB.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Asset ID |

### `list_tags`

All tags in your library, sorted by frequency (most used first). No parameters.

### `list_colors`

All hex colors extracted from asset color palettes, sorted by frequency. No parameters.

### `get_recent`

Most recently saved assets.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `n` | number | No | Number of assets to return (default 10, max 50) |

### `get_stats`

Library statistics: total asset count, breakdown by type, total storage size, unique tag count, AI-enriched count, and date range. No parameters.

## Asset Schema

Each asset returned by the tools contains these fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `sourceUrl` | string | Original URL the asset was saved from |
| `sourceDomain` | string | Domain of the source URL |
| `pageTitle` | string | Title of the page the asset was found on |
| `pageUrl` | string | Full URL of the source page |
| `type` | string | `image` \| `video` \| `pdf` \| `vector` \| `website` |
| `mimeType` | string | MIME type (e.g. `image/png`) |
| `fileName` | string | Stored file name |
| `originalName` | string | Original file name |
| `fileSize` | number | File size in bytes |
| `width` / `height` | number \| null | Dimensions (images and videos) |
| `savedAt` | string | ISO 8601 timestamp |
| `tags` | string[] | AI-generated and manual tags |
| `description` | string \| null | AI-generated description |
| `colorPalette` | string[] \| null | Extracted hex color palette |
| `category` | string \| null | AI-assigned category |
| `aiEnriched` | boolean | Whether AI enrichment has been applied |

## How It Works

The MCP server connects to the Markie desktop app's local API on `localhost:3210`. It registers for a bearer token on startup and caches the asset catalog in memory with a 5-second TTL. Full-text search uses fuzzy matching across descriptions, titles, tags, URLs, and categories.

If Markie isn't running when a tool is called, you'll get a friendly error message asking you to start the app. The server will re-register automatically on the next call once Markie is back.

## Troubleshooting

**"Markie is not running"** — Start the Markie desktop app. The MCP server needs it running on `localhost:3210`.

**Assets not showing up** — The server caches the catalog for 5 seconds. Newly saved assets will appear after a short delay.

**Tools work at first, then stop** — If you quit Markie after the MCP server started, tools will return a connection error. Restart Markie and the server will reconnect automatically.

## License

MIT
