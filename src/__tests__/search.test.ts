import { describe, it, expect } from 'vitest';
import { searchAssets } from '../search.js';
import type { Catalog, Asset } from '../types.js';

function makeAsset(overrides: Partial<Asset>): Asset {
  return {
    id: 'asset-1',
    sourceUrl: 'https://example.com/image.jpg',
    sourceDomain: 'example.com',
    pageTitle: 'Example Page',
    pageUrl: 'https://example.com',
    type: 'image',
    mimeType: 'image/jpeg',
    fileName: 'image.jpg',
    originalName: 'image.jpg',
    fileSize: 1000,
    width: 800,
    height: 600,
    savedAt: '2026-03-10T12:00:00Z',
    tags: [],
    description: null,
    colorPalette: null,
    category: null,
    aiEnriched: false,
    ...overrides,
  };
}

const catalog: Catalog = {
  version: 1,
  assets: [
    makeAsset({ id: '1', type: 'image', tags: ['hero', 'landing'], description: 'Dark sidebar UI screenshot', savedAt: '2026-03-10T12:00:00Z', colorPalette: ['#1E3D59', '#FA9819'] }),
    makeAsset({ id: '2', type: 'video', tags: ['animation', 'hero'], description: 'Loading animation video', savedAt: '2026-03-11T12:00:00Z', colorPalette: ['#FFFFFF'] }),
    makeAsset({ id: '3', type: 'pdf', tags: ['design', 'spec'], description: 'Design specification document', savedAt: '2026-03-12T12:00:00Z', colorPalette: null }),
    makeAsset({ id: '4', type: 'image', tags: ['logo'], description: null, pageTitle: 'Company Logo', savedAt: '2026-03-13T12:00:00Z', colorPalette: ['#1E3D59'] }),
    makeAsset({ id: '5', type: 'image', tags: ['hero', 'dark', 'UI'], description: 'Dark mode hero component', savedAt: '2026-03-14T12:00:00Z', colorPalette: ['#000000', '#1E3D59'] }),
  ],
};

describe('searchAssets', () => {
  it('no filters — returns all assets, respects default limit of 20', () => {
    const results = searchAssets(catalog, {});
    expect(results).toHaveLength(5);
    const ids = results.map((a) => a.id);
    expect(ids).toContain('1');
    expect(ids).toContain('2');
    expect(ids).toContain('3');
    expect(ids).toContain('4');
    expect(ids).toContain('5');
  });

  it('type filter — image returns 3', () => {
    const results = searchAssets(catalog, { type: 'image' });
    expect(results).toHaveLength(3);
    expect(results.map((a) => a.id)).toEqual(expect.arrayContaining(['1', '4', '5']));
  });

  it('type filter — pdf returns 1', () => {
    const results = searchAssets(catalog, { type: 'pdf' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('3');
  });

  it('tags filter — hero returns 3 assets (ids 1, 2, 5)', () => {
    const results = searchAssets(catalog, { tags: ['hero'] });
    expect(results).toHaveLength(3);
    expect(results.map((a) => a.id)).toEqual(expect.arrayContaining(['1', '2', '5']));
  });

  it('tags filter — hero + UI returns 1 asset (id 5, all tags must match)', () => {
    const results = searchAssets(catalog, { tags: ['hero', 'UI'] });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('5');
  });

  it('tags filter — case-insensitive, HERO matches same 3 assets as lowercase', () => {
    const lower = searchAssets(catalog, { tags: ['hero'] });
    const upper = searchAssets(catalog, { tags: ['HERO'] });
    expect(upper.map((a) => a.id).sort()).toEqual(lower.map((a) => a.id).sort());
    expect(upper).toHaveLength(3);
  });

  it('dateFrom filter — 2026-03-12 returns assets 3, 4, 5', () => {
    const results = searchAssets(catalog, { dateFrom: '2026-03-12T00:00:00Z' });
    expect(results).toHaveLength(3);
    expect(results.map((a) => a.id)).toEqual(expect.arrayContaining(['3', '4', '5']));
  });

  it('dateTo filter — 2026-03-11T23:59:59Z returns assets 1 and 2', () => {
    const results = searchAssets(catalog, { dateTo: '2026-03-11T23:59:59Z' });
    expect(results).toHaveLength(2);
    expect(results.map((a) => a.id)).toEqual(expect.arrayContaining(['1', '2']));
  });

  it('date range — dateFrom + dateTo returns only assets in range', () => {
    const results = searchAssets(catalog, {
      dateFrom: '2026-03-11T00:00:00Z',
      dateTo: '2026-03-12T23:59:59Z',
    });
    expect(results).toHaveLength(2);
    expect(results.map((a) => a.id)).toEqual(expect.arrayContaining(['2', '3']));
  });

  it('colors filter — #1E3D59 matches assets 1, 4, 5', () => {
    const results = searchAssets(catalog, { colors: ['#1E3D59'] });
    expect(results).toHaveLength(3);
    expect(results.map((a) => a.id)).toEqual(expect.arrayContaining(['1', '4', '5']));
  });

  it('colors filter — case-insensitive, lowercase hex matches same assets', () => {
    const upper = searchAssets(catalog, { colors: ['#1E3D59'] });
    const lower = searchAssets(catalog, { colors: ['#1e3d59'] });
    expect(lower.map((a) => a.id).sort()).toEqual(upper.map((a) => a.id).sort());
    expect(lower).toHaveLength(3);
  });

  it('limit — returns at most 2 assets', () => {
    const results = searchAssets(catalog, { limit: 2 });
    expect(results).toHaveLength(2);
  });

  it('full-text query — "dark sidebar" returns asset 1 first', () => {
    const results = searchAssets(catalog, { query: 'dark sidebar' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('1');
  });

  it('full-text query — "hero" returns assets containing hero in fields', () => {
    const results = searchAssets(catalog, { query: 'hero' });
    expect(results.length).toBeGreaterThan(0);
    const ids = results.map((a) => a.id);
    // Assets 1, 2, 5 have 'hero' in tags; asset 5 has 'hero' in description
    expect(ids).toEqual(expect.arrayContaining(['1', '2', '5']));
  });

  it('query + type filter combined — hero + image returns only image assets with hero content', () => {
    const results = searchAssets(catalog, { query: 'hero', type: 'image' });
    expect(results.length).toBeGreaterThan(0);
    // All results must be images
    results.forEach((a) => expect(a.type).toBe('image'));
    // video asset 2 should not appear
    expect(results.map((a) => a.id)).not.toContain('2');
  });

  it('no matches — type video + tags logo returns empty array', () => {
    const results = searchAssets(catalog, { type: 'video', tags: ['logo'] });
    expect(results).toHaveLength(0);
  });
});
