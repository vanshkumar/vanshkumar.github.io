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
  it('builds root Terrain data and ignores nested Markdown files', async () => {
    const files = [makeFile('A Question.md'), makeFile('writing inbox/Ignore.md')];
    const { app } = makeApp({
      files,
      frontmatter: {
        'A Question.md': {
          title: 'Custom title',
          date: '2026-06-01',
          lastMod: '2026-06-14',
          slug: 'custom-question',
          tags: ['questions']
        }
      }
    });

    const data = await new WeatherDataService(app).buildCollection(
      'terrain',
      { mode: 'all' },
      new Date('2026-06-15T12:00:00Z')
    );

    expect(data.availableTags).toEqual(['questions']);
    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      title: 'Custom title',
      slug: 'custom-question',
      tags: ['questions'],
      vaultPath: 'A Question.md',
      activity: { recentUpdateCount: 1, level: 5, lastActivity: '2026-06-14' }
    });
  });

  it('filters tag and untagged views before assigning activity levels', async () => {
    const files = [makeFile('Question.md'), makeFile('Multiple.md'), makeFile('Untagged.md')];
    const { app } = makeApp({
      files,
      frontmatter: {
        'Question.md': { tags: ['questions'], lastmod: '2026-06-15' },
        'Multiple.md': { tags: ['questions', 'essays'], lastmod: '2026-06-13' },
        'Untagged.md': { lastmod: '2026-06-14' }
      }
    });
    const service = new WeatherDataService(app);

    const questions = await service.buildCollection(
      'terrain',
      { mode: 'tag', tag: 'questions' },
      new Date('2026-06-15T12:00:00Z')
    );
    const untagged = await service.buildCollection(
      'terrain',
      { mode: 'untagged' },
      new Date('2026-06-15T12:00:00Z')
    );

    expect(questions.items.map((item) => item.title)).toEqual(['Multiple', 'Question']);
    expect(questions.items[0].activity.level).toBeLessThan(5);
    expect(questions.items[1].activity.level).toBe(5);
    expect(untagged.items.map((item) => item.title)).toEqual(['Untagged']);
    expect(untagged.items[0].activity.level).toBe(5);
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

  it('creates tagged and untagged Terrain entries at the vault root', async () => {
    const files: FakeFile[] = [];
    const { app, contents } = makeApp({ files });
    const service = new WeatherDataService(app);

    const tagged = await service.createNote({
      collectionKey: 'terrain',
      title: 'Reality has feedback loops',
      tag: 'hunches',
      now: new Date('2026-06-30T12:00:00Z')
    });
    const untagged = await service.createNote({
      collectionKey: 'terrain',
      title: 'An unclear thought',
      now: new Date('2026-06-30T12:00:00Z')
    });

    expect(tagged.path).toBe('Reality has feedback loops.md');
    expect(contents.get(tagged.path)).toContain('tags:\n  - "hunches"');
    expect(untagged.path).toBe('An unclear thought.md');
    expect(contents.get(untagged.path)).not.toContain('tags:');
  });

  it('rejects duplicate root filenames and frontmatter slugs', async () => {
    const files = [makeFile('Existing.md')];
    const { app } = makeApp({
      files,
      frontmatter: { 'Existing.md': { slug: 'duplicate-entry' } }
    });
    const service = new WeatherDataService(app);

    await expect(
      service.createNote({ collectionKey: 'terrain', title: 'Existing' })
    ).rejects.toThrow('A terrain entry with that title already exists');
    await expect(
      service.createNote({ collectionKey: 'terrain', title: 'Duplicate Entry' })
    ).rejects.toThrow('A terrain entry with that slug already exists');
  });
});
