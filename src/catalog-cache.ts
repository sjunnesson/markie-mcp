import { MarkieClient } from './client.js';
import type { Catalog } from './types.js';

const CACHE_TTL_MS = 5000;

export class CatalogCache {
  private client: MarkieClient;
  private cached: { catalog: Catalog; fetchedAt: number } | null = null;
  private inflight: Promise<Catalog> | null = null;

  constructor(client: MarkieClient) {
    this.client = client;
  }

  async get(): Promise<Catalog> {
    // Return cached if still fresh (age < 5000ms)
    const now = Date.now();
    if (this.cached && now - this.cached.fetchedAt < CACHE_TTL_MS) {
      return this.cached.catalog;
    }

    // Deduplicate in-flight fetches: if already fetching, wait for same Promise
    if (this.inflight) {
      return this.inflight;
    }

    // Fetch fresh catalog
    this.inflight = this.client.getCatalog().then((catalog) => {
      this.cached = { catalog, fetchedAt: Date.now() };
      this.inflight = null;
      return catalog;
    }).catch((err) => {
      this.inflight = null;
      throw err;
    });

    return this.inflight;
  }

  // Optional: for testing — force cache expiry
  invalidate(): void {
    this.cached = null;
    this.inflight = null;
  }
}
