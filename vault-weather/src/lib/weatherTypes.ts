import type { TFile } from 'obsidian';

export type CollectionKey = 'questions' | 'hunches' | 'shelf';

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
  rating: unknown;
  coverImage: string | null;
  coverUrl: string | null;
  activity: Activity;
}

export interface WeatherCollectionData {
  key: CollectionKey;
  refreshedAt: string;
  items: WeatherItem[];
}

export const COLLECTION_CONFIGS: Record<CollectionKey, CollectionConfig> = {
  questions: {
    key: 'questions',
    folder: 'questions',
    navLabel: 'Questions',
    title: 'Question Weather',
    countLabel: 'questions',
    listLabel: 'Questions',
    titleLabel: 'Question title',
    itemLabel: 'question',
    addLabel: 'Add question',
    cardClassName: 'question-card',
    stackClassName: 'question-stack',
    cardMode: 'plain',
    requiresRating: false
  },
  hunches: {
    key: 'hunches',
    folder: 'hunches',
    navLabel: 'Hunches',
    title: 'Hunch Weather',
    countLabel: 'hunches',
    listLabel: 'Hunches',
    titleLabel: 'Hunch title',
    itemLabel: 'hunch',
    addLabel: 'Add hunch',
    cardClassName: 'hunch-card',
    stackClassName: 'hunch-stack',
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
