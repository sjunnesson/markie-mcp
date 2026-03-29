import type { CatalogCache } from '../catalog-cache.js';
import { MarkieOfflineError } from '../client.js';

export async function toolListColors(
  _args: Record<string, never>,
  cache: CatalogCache
) {
  try {
    const catalog = await cache.get();
    const counts = new Map<string, number>();
    for (const asset of catalog.assets) {
      if (!asset.colorPalette) continue;
      for (const color of asset.colorPalette) {
        const hex = color.toLowerCase();
        counts.set(hex, (counts.get(hex) ?? 0) + 1);
      }
    }
    const result = Array.from(counts.entries())
      .map(([hex, count]) => ({ hex, count }))
      .sort((a, b) => b.count - a.count);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    if (err instanceof MarkieOfflineError) {
      return { content: [{ type: 'text' as const, text: err.message }], isError: true };
    }
    throw err;
  }
}
