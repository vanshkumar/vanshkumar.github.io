import {
  COLLECTION_CONFIGS,
  type Activity,
  type CollectionKey,
  type WeatherItem
} from './weatherTypes';

export const ACTIVITY_WINDOW_DAYS = 30;

export class WeatherCreateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherCreateError';
  }
}

export const slugify = (value: unknown): string =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const slugifyPath = (value: unknown): string =>
  String(value)
    .split('/')
    .map(slugify)
    .filter(Boolean)
    .join('/');

export const normalizeNoteTitle = (value: unknown): string =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.md$/i, '')
    .trim();

export const normalizeTag = (value: unknown): string =>
  normalizeNoteTitle(value).replace(/^#+/, '').trim();

const withoutControlCharacters = (value: string): string =>
  Array.from(value)
    .filter((character) => character.charCodeAt(0) >= 32)
    .join('');

export const noteFilenameFromTitle = (value: unknown): string | null => {
  const title = normalizeNoteTitle(value);
  const filenameBase = withoutControlCharacters(title)
    .replace(/[\\/]/g, '-')
    .replace(/:/g, ' -')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .trim();

  return filenameBase ? `${filenameBase}.md` : null;
};

export const dateToIsoDate = (value: unknown): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const daysBetweenIsoDates = (laterDate: string, earlierDate: string): number =>
  Math.max(
    0,
    (new Date(`${laterDate}T00:00:00.000Z`).getTime() -
      new Date(`${earlierDate}T00:00:00.000Z`).getTime()) /
      86_400_000
  );

export const activityWeightForAge = (ageInDays: number): number =>
  1 / (Math.max(0, ageInDays) + 1) ** 2;

const uniqueIsoDates = (dates: unknown[]): string[] =>
  Array.from(new Set(dates.map(dateToIsoDate).filter((date): date is string => Boolean(date)))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

export const buildActivity = ({
  events = [],
  now = new Date(),
  windowDays = ACTIVITY_WINDOW_DAYS,
  level = 0
}: {
  events?: unknown[];
  now?: Date;
  windowDays?: number;
  level?: number;
} = {}): Activity => {
  const today = dateToIsoDate(now) ?? dateToIsoDate(new Date())!;
  const updateEvents = uniqueIsoDates(events).filter(
    (value) => daysBetweenIsoDates(today, value) <= windowDays
  );
  const score = updateEvents.reduce((total, value) => {
    const ageInDays = daysBetweenIsoDates(today, value);
    return total + activityWeightForAge(ageInDays);
  }, 0);

  return {
    windowDays,
    recentUpdateCount: updateEvents.length,
    score: Number(score.toFixed(4)),
    level,
    lastActivity: updateEvents[0] ?? null,
    events: updateEvents
  };
};

export const assignActivityLevels = <T extends { activity: Activity }>(items: T[]): T[] => {
  const maxScore = Math.max(...items.map((item) => item.activity.score), 0);
  return items.map((item) => {
    const normalized = maxScore > 0 ? item.activity.score / maxScore : 0;
    return {
      ...item,
      activity: {
        ...item.activity,
        normalized: Number(normalized.toFixed(4)),
        level: normalized > 0 ? Math.max(1, Math.ceil(normalized * 5)) : 0
      }
    };
  });
};

export const normalizeVaultAssetPath = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;

  const segments = trimmed
    .replace(/^\/+/, '')
    .split('/')
    .filter((segment) => segment && segment !== '.');
  if (segments.length === 0 || segments.includes('..')) return null;
  return segments.join('/');
};

export interface NoteDraft {
  title: string;
  slug: string;
  filename: string;
  vaultPath: string;
  markdown: string;
}

const normalizeRating = (value: unknown): number => {
  if (value === null || value === undefined || String(value).trim() === '') {
    throw new WeatherCreateError('Shelf rating is required');
  }
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
    throw new WeatherCreateError('Shelf rating must be an integer from 0 to 5');
  }
  return rating;
};

export const createNoteDraft = ({
  collectionKey,
  title,
  rating,
  tag,
  now = new Date()
}: {
  collectionKey: CollectionKey;
  title: unknown;
  rating?: unknown;
  tag?: unknown;
  now?: Date;
}): NoteDraft => {
  const config = COLLECTION_CONFIGS[collectionKey];
  const cleanTitle = normalizeNoteTitle(title);
  if (!cleanTitle) throw new WeatherCreateError(`${config.titleLabel} is required`);

  const filename = noteFilenameFromTitle(cleanTitle);
  if (!filename) {
    throw new WeatherCreateError(`${config.titleLabel} must include letters or numbers`);
  }

  const slug = slugify(filename);
  if (!slug) {
    throw new WeatherCreateError(`${config.titleLabel} must include letters or numbers`);
  }

  const date = dateToIsoDate(now) ?? dateToIsoDate(new Date())!;
  const fields = [`date: ${date}`, `lastmod: ${date}`];
  const cleanTag = collectionKey === 'terrain' ? normalizeTag(tag) : '';
  if (cleanTag) fields.push('tags:', `  - ${JSON.stringify(cleanTag)}`);
  if (config.requiresRating) fields.push(`rating: ${normalizeRating(rating)}`);

  const vaultPath = config.folder ? `${config.folder}/${filename}` : filename;

  return {
    title: cleanTitle,
    slug,
    filename,
    vaultPath,
    markdown: ['---', ...fields, '---', '', ''].join('\n')
  };
};

export const getItemUpdatedDate = (item: WeatherItem): string | null =>
  item.lastmod ?? item.date ?? item.activity.lastActivity;

const compareDatesDesc = (a: string | null, b: string | null): number => {
  const aTime = a ? new Date(a).getTime() : 0;
  const bTime = b ? new Date(b).getTime() : 0;
  return bTime - aTime;
};

const compareTitle = (a: WeatherItem, b: WeatherItem): number =>
  a.title.localeCompare(b.title);

export const activityTone = (level = 0): string => {
  if (level >= 5) return 'electric';
  if (level >= 4) return 'bright';
  if (level >= 2) return 'warm';
  if (level >= 1) return 'stirring';
  return 'quiet';
};

export const sortWeatherItems = (items: WeatherItem[]): WeatherItem[] =>
  [...items].sort(
    (a, b) =>
      b.activity.score - a.activity.score ||
      b.activity.recentUpdateCount - a.activity.recentUpdateCount ||
      compareDatesDesc(getItemUpdatedDate(a), getItemUpdatedDate(b)) ||
      compareTitle(a, b)
  );
