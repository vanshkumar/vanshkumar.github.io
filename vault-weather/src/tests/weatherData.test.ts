import { describe, expect, it } from 'vitest';
import type { App, TAbstractFile, TFile } from 'obsidian';
import { WeatherDataService } from '../lib/weatherData';

interface FakeFile {
  path: string;
  name: string;
  basename: string;
  extension: string;
  parent: { path: string };
}

const makeFile = (path: string): FakeFile => {
  const name = path.split('/').at(-1) ?? path;
  const extension = name.includes('.') ? name.split('.').at(-1) ?? '' : '';
  return {
    path,
    name,
    basename: extension ? name.slice(0, -(extension.length + 1)) : name,
    extension,
    parent: { path: path.split('/').slice(0, -1).join('/') }
  };
};

const makeApp = ({
  files,
  frontmatter = {}
}: {
  files: FakeFile[];
  frontmatter?: Record<string, Record<string, unknown>>;
}) => {
  const folders = new Set(files.map((file) => file.parent.path));
  const contents = new Map<string, string>();
  const find = (path: string): TAbstractFile | null => {
    const file = files.find((candidate) => candidate.path === path);
    if (file) return file as TFile;
    return folders.has(path) ? ({ path } as TAbstractFile) : null;
  };

  const vault = {
    getMarkdownFiles: () => files.filter((file) => file.extension === 'md') as TFile[],
    getAbstractFileByPath: find,
    getResourcePath: (file: TFile) => `app://vault/${file.path}`,
    createFolder: async (path: string) => {
      folders.add(path);
    },
    create: async (path: string, content: string) => {
      const file = makeFile(path);
      files.push(file);
      contents.set(path, content);
      return file as TFile;
    }
  };
  const metadataCache = {
    getFileCache: (file: TFile) => ({ frontmatter: frontmatter[file.path] ?? {} })
  };

  return {
    app: { vault, metadataCache } as unknown as App,
    contents,
    folders
  };
};

describe('WeatherDataService', () => {
  it('builds direct-folder question data from Obsidian metadata', async () => {
    const files = [makeFile('questions/A Question.md'), makeFile('questions/nested/Ignore.md')];
    const { app } = makeApp({
      files,
      frontmatter: {
        'questions/A Question.md': {
          title: 'Custom title',
          date: '2026-06-01',
          lastMod: '2026-06-14',
          slug: 'custom-question'
        }
      }
    });

    const data = await new WeatherDataService(app).buildCollection(
      'questions',
      new Date('2026-06-15T12:00:00Z')
    );

    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      title: 'Custom title',
      slug: 'custom-question',
      date: '2026-06-01',
      lastmod: '2026-06-14',
      vaultPath: 'questions/A Question.md',
      activity: { recentUpdateCount: 1, level: 5, lastActivity: '2026-06-14' }
    });
  });

  it('resolves only valid in-vault shelf covers', async () => {
    const files = [
      makeFile('shelf/Book.md'),
      makeFile('shelf/Missing.md'),
      makeFile('assets/shelf/book.webp')
    ];
    const { app } = makeApp({
      files,
      frontmatter: {
        'shelf/Book.md': { coverImage: '/assets/shelf/book.webp' },
        'shelf/Missing.md': { coverImage: '../outside.webp' }
      }
    });

    const data = await new WeatherDataService(app).buildCollection('shelf');

    expect(data.items.map((item) => item.coverUrl)).toEqual([
      'app://vault/assets/shelf/book.webp',
      null
    ]);
  });

  it('creates notes through the vault API and creates a missing collection folder', async () => {
    const files: FakeFile[] = [];
    const { app, contents, folders } = makeApp({ files });

    const file = await new WeatherDataService(app).createNote({
      collectionKey: 'hunches',
      title: 'Reality has feedback loops',
      now: new Date('2026-06-30T12:00:00Z')
    });

    expect(folders.has('hunches')).toBe(true);
    expect(file.path).toBe('hunches/Reality has feedback loops.md');
    expect(contents.get(file.path)).toBe(
      '---\ndate: 2026-06-30\nlastmod: 2026-06-30\n---\n\n'
    );
  });

  it('rejects duplicate filenames and frontmatter slugs', async () => {
    const files = [makeFile('questions/Existing.md')];
    const { app } = makeApp({
      files,
      frontmatter: { 'questions/Existing.md': { slug: 'duplicate-question' } }
    });
    const service = new WeatherDataService(app);

    await expect(
      service.createNote({ collectionKey: 'questions', title: 'Existing' })
    ).rejects.toThrow('A question with that title already exists');
    await expect(
      service.createNote({ collectionKey: 'questions', title: 'Duplicate Question' })
    ).rejects.toThrow('A question with that slug already exists');
  });
});
