import type { CatalogCache } from '../catalog-cache.js';
import { MarkieOfflineError } from '../client.js';

export async function toolGetAssetDetail(
  args: { id: string },
  cache: CatalogCache
) {
  try {
    const catalog = await cache.get();
    const asset = catalog.assets.find((a) => a.id === args.id);
    if (!asset) {
      return {
        content: [{ type: 'text' as const, text: `Asset not found: ${args.id}` }],
        isError: true,
      };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(asset, null, 2) }] };
  } catch (err) {
    if (err instanceof MarkieOfflineError) {
      return { content: [{ type: 'text' as const, text: err.message }], isError: true };
    }
    throw err;
  }
}
