import type { App, FrontMatterCache, TAbstractFile, TFile } from 'obsidian';
import {
  assignActivityLevels,
  buildActivity,
  createNoteDraft,
  dateToIsoDate,
  normalizeVaultAssetPath,
  slugify,
  slugifyPath,
  WeatherCreateError
} from './weatherCore';
import {
  ALL_TERRAIN_FILTER,
  COLLECTION_CONFIGS,
  type CollectionKey,
  type TerrainFilter,
  type WeatherCollectionData,
  type WeatherItem
} from './weatherTypes';

const IMAGE_EXTENSIONS = new Set(['avif', 'gif', 'jpeg', 'jpg', 'png', 'webp']);

const isFile = (file: TAbstractFile | null): file is TFile =>
  Boolean(file && 'extension' in file && typeof file.extension === 'string');

const stringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const tagsValue = (value: unknown): string[] => {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return Array.from(
    new Set(
      values
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim().replace(/^#+/, ''))
        .filter(Boolean)
    )
  );
};

export class WeatherDataService {
  constructor(private readonly app: App) {}

  private directMarkdownFiles(collectionKey: CollectionKey): TFile[] {
    const folder = COLLECTION_CONFIGS[collectionKey].folder;
    return this.app.vault
      .getMarkdownFiles()
      .filter((file) => file.parent?.path === folder)
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  private frontmatter(file: TFile): FrontMatterCache {
    return this.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  }

  private resolveCover(value: unknown): { path: string; url: string } | null {
    const normalizedPath = normalizeVaultAssetPath(value);
    if (!normalizedPath) return null;

    const file = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (!isFile(file) || !IMAGE_EXTENSIONS.has(file.extension.toLowerCase())) return null;

    return {
      path: normalizedPath,
      url: this.app.vault.getResourcePath(file)
    };
  }

  async buildCollection(
    collectionKey: CollectionKey,
    filter: TerrainFilter = ALL_TERRAIN_FILTER,
    now = new Date()
  ): Promise<WeatherCollectionData> {
    const allItems = this.directMarkdownFiles(collectionKey).map((file): WeatherItem => {
      const frontmatter = this.frontmatter(file);
      const lastmod = dateToIsoDate(frontmatter.lastmod ?? frontmatter.lastMod);
      const cover = this.resolveCover(frontmatter.coverImage);

      return {
        file,
        slug: frontmatter.slug ? slugifyPath(frontmatter.slug) : slugify(file.name),
        title: stringValue(frontmatter.title) ?? file.basename,
        vaultPath: file.path,
        date: dateToIsoDate(frontmatter.date),
        lastmod,
        tags: tagsValue(frontmatter.tags),
        rating: frontmatter.rating ?? null,
        coverImage: stringValue(frontmatter.coverImage),
        coverUrl: cover?.url ?? null,
        activity: buildActivity({ events: [lastmod], now })
      };
    });

    const availableTags = Array.from(new Set(allItems.flatMap((item) => item.tags))).sort((a, b) =>
      a.localeCompare(b)
    );
    const visibleItems =
      collectionKey !== 'terrain' || filter.mode === 'all'
        ? allItems
        : filter.mode === 'untagged'
          ? allItems.filter((item) => item.tags.length === 0)
          : allItems.filter((item) => item.tags.includes(filter.tag));

    return {
      key: collectionKey,
      filter,
      availableTags: collectionKey === 'terrain' ? availableTags : [],
      refreshedAt: new Date().toISOString(),
      items: assignActivityLevels(visibleItems)
    };
  }

  async createNote({
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
  }): Promise<TFile> {
    const config = COLLECTION_CONFIGS[collectionKey];
    const draft = createNoteDraft({ collectionKey, title, rating, tag, now });

    if (this.app.vault.getAbstractFileByPath(draft.vaultPath)) {
      throw new WeatherCreateError(`A ${config.itemLabel} with that title already exists`);
    }

    const existingSlugs = new Set(
      this.directMarkdownFiles(collectionKey).map((file) => {
        const frontmatter = this.frontmatter(file);
        return frontmatter.slug ? slugifyPath(frontmatter.slug) : slugify(file.name);
      })
    );
    if (existingSlugs.has(draft.slug)) {
      throw new WeatherCreateError(`A ${config.itemLabel} with that slug already exists`);
    }

    if (config.folder && !this.app.vault.getAbstractFileByPath(config.folder)) {
      await this.app.vault.createFolder(config.folder);
    }

    return this.app.vault.create(draft.vaultPath, draft.markdown);
  }
}
