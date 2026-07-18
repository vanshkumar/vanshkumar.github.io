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
  COLLECTION_CONFIGS,
  type CollectionKey,
  type WeatherCollectionData,
  type WeatherItem
} from './weatherTypes';

const IMAGE_EXTENSIONS = new Set(['avif', 'gif', 'jpeg', 'jpg', 'png', 'webp']);

const isFile = (file: TAbstractFile | null): file is TFile =>
  Boolean(file && 'extension' in file && typeof file.extension === 'string');

const stringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

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
    now = new Date()
  ): Promise<WeatherCollectionData> {
    const config = COLLECTION_CONFIGS[collectionKey];
    const items = this.directMarkdownFiles(collectionKey).map((file): WeatherItem => {
      const frontmatter = this.frontmatter(file);
      const lastmod = dateToIsoDate(frontmatter.lastmod ?? frontmatter.lastMod);
      const cover = config.cardMode === 'cover' ? this.resolveCover(frontmatter.coverImage) : null;

      return {
        file,
        slug: frontmatter.slug ? slugifyPath(frontmatter.slug) : slugify(file.name),
        title: stringValue(frontmatter.title) ?? file.basename,
        vaultPath: file.path,
        date: dateToIsoDate(frontmatter.date),
        lastmod,
        rating: frontmatter.rating ?? null,
        coverImage: stringValue(frontmatter.coverImage),
        coverUrl: cover?.url ?? null,
        activity: buildActivity({ events: [lastmod], now })
      };
    });

    return {
      key: collectionKey,
      refreshedAt: new Date().toISOString(),
      items: assignActivityLevels(items)
    };
  }

  async createNote({
    collectionKey,
    title,
    rating,
    now = new Date()
  }: {
    collectionKey: CollectionKey;
    title: unknown;
    rating?: unknown;
    now?: Date;
  }): Promise<TFile> {
    const config = COLLECTION_CONFIGS[collectionKey];
    const draft = createNoteDraft({ collectionKey, title, rating, now });

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

    if (!this.app.vault.getAbstractFileByPath(config.folder)) {
      await this.app.vault.createFolder(config.folder);
    }

    return this.app.vault.create(draft.vaultPath, draft.markdown);
  }
}
