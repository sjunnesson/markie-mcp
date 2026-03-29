import type { CatalogCache } from '../catalog-cache.js';
import { MarkieClient, MarkieOfflineError } from '../client.js';

export async function toolGetAssetThumbnail(
  args: { id: string },
  _cache: CatalogCache,
  client: MarkieClient
) {
  try {
    const buffer = await client.getThumbnail(args.id);
    return {
      content: [{ type: 'image' as const, data: buffer.toString('base64'), mimeType: 'image/jpeg' }],
    };
  } catch (err) {
    if (err instanceof MarkieOfflineError) {
      return { content: [{ type: 'text' as const, text: err.message }], isError: true };
    }
    throw err;
  }
}
