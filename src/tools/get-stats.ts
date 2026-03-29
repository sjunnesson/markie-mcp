import type { CatalogCache } from '../catalog-cache.js';
import { MarkieOfflineError } from '../client.js';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export async function toolGetStats(
  _args: Record<string, never>,
  cache: CatalogCache
) {
  try {
    const catalog = await cache.get();
    const assets = catalog.assets;

    const byType: Record<string, number> = {};
    for (const a of assets) {
      byType[a.type] = (byType[a.type] ?? 0) + 1;
    }

    const totalSize = assets.reduce((sum, a) => sum + (a.fileSize ?? 0), 0);

    const tagSet = new Set<string>();
    for (const a of assets) for (const t of a.tags) tagSet.add(t);

    const dates = assets.map(a => a.savedAt).sort();
    const aiEnriched = assets.filter(a => a.aiEnriched).length;

    const stats = {
      totalAssets: assets.length,
      byType,
      totalSizeBytes: totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      uniqueTags: tagSet.size,
      aiEnrichedAssets: aiEnriched,
      dateRange: dates.length ? { oldest: dates[0], newest: dates[dates.length - 1] } : null,
    };

    return { content: [{ type: 'text' as const, text: JSON.stringify(stats, null, 2) }] };
  } catch (err) {
    if (err instanceof MarkieOfflineError) {
      return { content: [{ type: 'text' as const, text: err.message }], isError: true };
    }
    throw err;
  }
}
