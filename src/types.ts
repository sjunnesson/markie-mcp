// Mirrored from @markie/shared — keep in sync with packages/shared/src/types.ts

export type AssetType = 'image' | 'video' | 'pdf' | 'website' | 'vector';

export interface Asset {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  pageTitle: string;
  pageUrl: string;
  type: AssetType;
  mimeType: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  thumbWidth?: number | null;
  thumbHeight?: number | null;
  savedAt: string;
  tags: string[];
  description: string | null;
  colorPalette: string[] | null;
  category: string | null;
  aiEnriched: boolean;
}

export interface Catalog {
  version: 1;
  assets: Asset[];
}
