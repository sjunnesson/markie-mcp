import type { CatalogCache } from '../catalog-cache.js';
import { MarkieClient, MarkieOfflineError } from '../client.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function toolGetAssetFile(
  args: { id: string },
  _cache: CatalogCache,
  client: MarkieClient
) {
  try {
    const { buffer, contentType } = await client.getFile(args.id);
    if (buffer.byteLength > MAX_FILE_SIZE) {
      return {
        content: [{ type: 'text' as const, text: `File too large to return (${buffer.byteLength} bytes). Maximum allowed size is 10MB.` }],
        isError: true,
      };
    }
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ base64: buffer.toString('base64'), mimeType: contentType, size: buffer.byteLength }),
      }],
    };
  } catch (err) {
    if (err instanceof MarkieOfflineError) {
      return { content: [{ type: 'text' as const, text: err.message }], isError: true };
    }
    throw err;
  }
}
