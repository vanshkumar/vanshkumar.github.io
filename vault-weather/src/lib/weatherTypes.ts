import type { TFile } from 'obsidian';

export type CollectionKey = 'terrain' | 'shelf';

export type TerrainFilter =
  | { mode: 'all' }
  | { mode: 'untagged' }
  | { mode: 'tag'; tag: string };

export const ALL_TERRAIN_FILTER: TerrainFilter = { mode: 'all' };

export interface CollectionConfig {
  key: CollectionKey;
  folder: string;
  navLabel: string;
  title: string;
  countLabel: string;
  listLabel: string;
  titleLabel: string;
  itemLabel: string;
  addLabel: string;
  cardClassName: string;
  stackClassName: string;
  cardMode: 'plain' | 'cover';
  requiresRating: boolean;
}

export interface Activity {
  windowDays: number;
  recentUpdateCount: number;
  score: number;
  level: number;
  normalized?: number;
  lastActivity: string | null;
  events: string[];
}

export interface WeatherItem {
  file: TFile;
  slug: string;
  title: string;
  vaultPath: string;
  date: string | null;
  lastmod: string | null;
  tags: string[];
  rating: unknown;
  coverImage: string | null;
  coverUrl: string | null;
  activity: Activity;
}

export interface WeatherCollectionData {
  key: CollectionKey;
  filter: TerrainFilter;
  availableTags: string[];
  refreshedAt: string;
  items: WeatherItem[];
}

export const COLLECTION_CONFIGS: Record<CollectionKey, CollectionConfig> = {
  terrain: {
    key: 'terrain',
    folder: '',
    navLabel: 'Terrain',
    title: 'Terrain Weather',
    countLabel: 'entries',
    listLabel: 'Terrain entries',
    titleLabel: 'Entry title',
    itemLabel: 'terrain entry',
    addLabel: 'Add terrain entry',
    cardClassName: 'terrain-entry-card',
    stackClassName: 'terrain-stack',
    cardMode: 'plain',
    requiresRating: false
  },
  shelf: {
    key: 'shelf',
    folder: 'shelf',
    navLabel: 'Shelf',
    title: 'Shelf Weather',
    countLabel: 'shelf items',
    listLabel: 'Shelf',
    titleLabel: 'Shelf title',
    itemLabel: 'shelf item',
    addLabel: 'Add shelf item',
    cardClassName: 'shelf-card',
    stackClassName: 'shelf-stack',
    cardMode: 'cover',
    requiresRating: true
  }
};

export const COLLECTION_KEYS = Object.keys(COLLECTION_CONFIGS) as CollectionKey[];

export const isCollectionKey = (value: unknown): value is CollectionKey =>
  typeof value === 'string' && value in COLLECTION_CONFIGS;

export const isTerrainFilter = (value: unknown): value is TerrainFilter => {
  if (!value || typeof value !== 'object' || !('mode' in value)) return false;
  const candidate = value as { mode?: unknown; tag?: unknown };
  if (candidate.mode === 'all' || candidate.mode === 'untagged') return true;
  return candidate.mode === 'tag' && typeof candidate.tag === 'string' && Boolean(candidate.tag);
};
