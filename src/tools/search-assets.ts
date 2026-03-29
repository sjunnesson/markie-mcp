import type { CatalogCache } from '../catalog-cache.js';
import { searchAssets } from '../search.js';
import { MarkieOfflineError } from '../client.js';
import type { AssetType } from '../types.js';

export async function toolSearchAssets(
  args: { query?: string; tags?: string[]; type?: AssetType; dateFrom?: string; dateTo?: string; colors?: string[]; limit?: number },
  cache: CatalogCache
) {
  try {
    const catalog = await cache.get();
    const results = searchAssets(catalog, args);
    return { content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }] };
  } catch (err) {
    if (err instanceof MarkieOfflineError) {
      return { content: [{ type: 'text' as const, text: err.message }], isError: true };
    }
    throw err;
  }
}
