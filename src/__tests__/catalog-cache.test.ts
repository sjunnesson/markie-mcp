import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatalogCache } from '../catalog-cache.js';
import type { MarkieClient } from '../client.js';
import type { Catalog } from '../types.js';

const mockCatalog: Catalog = {
  version: 1,
  assets: [],
};

function makeMockClient(getCatalog: () => Promise<Catalog>): MarkieClient {
  return {
    getCatalog: vi.fn(getCatalog),
    register: vi.fn(),
    getThumbnail: vi.fn(),
    getFile: vi.fn(),
  } as unknown as MarkieClient;
}

beforeEach(() => {
  vi.useRealTimers();
});

describe('CatalogCache', () => {
  it('fresh fetch — get() calls getCatalog() and returns catalog', async () => {
    const client = makeMockClient(() => Promise.resolve(mockCatalog));
    const cache = new CatalogCache(client);

    const result = await cache.get();

    expect(client.getCatalog).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockCatalog);
  });

  it('cache hit — second get() does not call getCatalog() again', async () => {
    const client = makeMockClient(() => Promise.resolve(mockCatalog));
    const cache = new CatalogCache(client);

    await cache.get();
    const result = await cache.get();

    expect(client.getCatalog).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockCatalog);
  });

  it('TTL expiry — after 5+ seconds, get() refetches', async () => {
    vi.useFakeTimers();
    const client = makeMockClient(() => Promise.resolve(mockCatalog));
    const cache = new CatalogCache(client);

    await cache.get();
    expect(client.getCatalog).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5001);

    await cache.get();
    expect(client.getCatalog).toHaveBeenCalledTimes(2);
  });

  it('deduplication — simultaneous get() calls result in only one getCatalog() call', async () => {
    const client = makeMockClient(() => Promise.resolve(mockCatalog));
    const cache = new CatalogCache(client);

    const [result1, result2] = await Promise.all([cache.get(), cache.get()]);

    expect(client.getCatalog).toHaveBeenCalledTimes(1);
    expect(result1).toEqual(mockCatalog);
    expect(result2).toEqual(mockCatalog);
  });

  it('error propagation — if getCatalog() throws, get() throws; subsequent call refetches', async () => {
    let callCount = 0;
    const client = makeMockClient(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('network error'));
      }
      return Promise.resolve(mockCatalog);
    });
    const cache = new CatalogCache(client);

    await expect(cache.get()).rejects.toThrow('network error');

    // After error, cache should not be stuck — next call should refetch
    const result = await cache.get();
    expect(callCount).toBe(2);
    expect(result).toEqual(mockCatalog);
  });

  it('invalidate() — after invalidating, next get() refetches', async () => {
    const client = makeMockClient(() => Promise.resolve(mockCatalog));
    const cache = new CatalogCache(client);

    await cache.get();
    expect(client.getCatalog).toHaveBeenCalledTimes(1);

    cache.invalidate();

    await cache.get();
    expect(client.getCatalog).toHaveBeenCalledTimes(2);
  });
});
