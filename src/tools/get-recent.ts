import type { CatalogCache } from '../catalog-cache.js';
import { MarkieOfflineError } from '../client.js';

const MAX_N = 50;
const DEFAULT_N = 10;

export async function toolGetRecent(
  args: { n?: number },
  cache: CatalogCache
) {
  try {
    const catalog = await cache.get();
    const n = Math.min(args.n ?? DEFAULT_N, MAX_N);
    const sorted = [...catalog.assets].sort((a, b) => {
      if (a.savedAt > b.savedAt) return -1;
      if (a.savedAt < b.savedAt) return 1;
      return 0;
    });
    const result = sorted.slice(0, n);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    if (err instanceof MarkieOfflineError) {
      return { content: [{ type: 'text' as const, text: err.message }], isError: true };
    }
    throw err;
  }
}
