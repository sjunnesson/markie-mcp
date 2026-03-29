import Fuse from 'fuse.js';
import type { Asset, AssetType, Catalog } from './types.js';

export interface SearchParams {
  query?: string;
  tags?: string[];
  type?: AssetType;
  dateFrom?: string;
  dateTo?: string;
  colors?: string[];
  limit?: number;
}

export function searchAssets(catalog: Catalog, params: SearchParams): Asset[] {
  const limit = params.limit ?? 20;

  // Step 1: Apply hard filters
  let filtered = catalog.assets.filter((asset) => {
    // Filter by type
    if (params.type !== undefined && asset.type !== params.type) {
      return false;
    }

    // Filter by tags (all specified tags must be present, case-insensitive)
    if (params.tags !== undefined && params.tags.length > 0) {
      const assetTagsLower = asset.tags.map((t) => t.toLowerCase());
      const allTagsPresent = params.tags.every((tag) =>
        assetTagsLower.includes(tag.toLowerCase())
      );
      if (!allTagsPresent) {
        return false;
      }
    }

    // Filter by dateFrom (inclusive)
    if (params.dateFrom !== undefined && asset.savedAt < params.dateFrom) {
      return false;
    }

    // Filter by dateTo (inclusive)
    if (params.dateTo !== undefined && asset.savedAt > params.dateTo) {
      return false;
    }

    // Filter by colors (at least one color in params.colors must match, case-insensitive)
    if (params.colors !== undefined && params.colors.length > 0) {
      if (!asset.colorPalette || asset.colorPalette.length === 0) {
        return false;
      }
      const assetColorsLower = asset.colorPalette.map((c) => c.toLowerCase());
      const anyColorMatches = params.colors.some((color) =>
        assetColorsLower.includes(color.toLowerCase())
      );
      if (!anyColorMatches) {
        return false;
      }
    }

    return true;
  });

  // Step 2: Apply full-text search if query is provided
  if (params.query !== undefined && params.query.trim() !== '') {
    const fuse = new Fuse(filtered, {
      includeScore: true,
      threshold: 0.4,
      keys: ['description', 'pageTitle', 'tags', 'sourceUrl', 'sourceDomain', 'category'],
    });
    const results = fuse.search(params.query);
    filtered = results.map((result) => result.item);
  }

  // Step 3: Apply limit
  return filtered.slice(0, limit);
}
