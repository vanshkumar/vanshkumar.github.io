import type { TFile } from 'obsidian';

export type CollectionKey = 'terrain' | 'shelf';

export type WritingGroup = 'posts' | 'notes';

export const WRITING_TYPES = [
  { tag: 'projects', label: 'Project', group: 'posts' },
  { tag: 'essays', label: 'Essay', group: 'posts' },
  { tag: 'hunches', label: 'Hunch', group: 'notes' },
  { tag: 'questions', label: 'Question', group: 'notes' }
] as const;

export type WritingTypeTag = (typeof WRITING_TYPES)[number]['tag'];

export type TerrainFilter =
  | { mode: 'all' }
  | { mode: 'group'; group: WritingGroup };

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
  refreshedAt: string;
  items: WeatherItem[];
}

export const COLLECTION_CONFIGS: Record<CollectionKey, CollectionConfig> = {
  terrain: {
    key: 'terrain',
    folder: '',
    navLabel: 'Writing',
    title: 'Writing Weather',
    countLabel: 'entries',
    listLabel: 'Writing entries',
    titleLabel: 'Entry title',
    itemLabel: 'writing entry',
    addLabel: 'Add writing entry',
    cardClassName: 'writing-entry-card',
    stackClassName: 'writing-stack',
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

export const isWritingGroup = (value: unknown): value is WritingGroup =>
  value === 'posts' || value === 'notes';

export const isWritingTypeTag = (value: unknown): value is WritingTypeTag =>
  typeof value === 'string' && WRITING_TYPES.some((type) => type.tag === value);

export const writingGroupForTag = (value: unknown): WritingGroup | null =>
  WRITING_TYPES.find((type) => type.tag === value)?.group ?? null;

export const isTerrainFilter = (value: unknown): value is TerrainFilter => {
  if (!value || typeof value !== 'object' || !('mode' in value)) return false;
  const candidate = value as { mode?: unknown; group?: unknown };
  return candidate.mode === 'all' ||
    (candidate.mode === 'group' && isWritingGroup(candidate.group));
};

export const terrainFilterFromState = (value: unknown): TerrainFilter | null => {
  if (isTerrainFilter(value)) return value;
  if (!value || typeof value !== 'object' || !('mode' in value)) return null;

  const legacy = value as { mode?: unknown; tag?: unknown };
  if (legacy.mode === 'untagged') return ALL_TERRAIN_FILTER;
  if (legacy.mode !== 'tag') return null;

  const group = writingGroupForTag(legacy.tag);
  return group ? { mode: 'group', group } : ALL_TERRAIN_FILTER;
};
