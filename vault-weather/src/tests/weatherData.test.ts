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

const makeFile = (path: string, parentPath?: string): FakeFile => {
  const name = path.split('/').at(-1) ?? path;
  const extension = name.includes('.') ? name.split('.').at(-1) ?? '' : '';
  return {
    path,
    name,
    basename: extension ? name.slice(0, -(extension.length + 1)) : name,
    extension,
    parent: { path: parentPath ?? path.split('/').slice(0, -1).join('/') }
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
  it('keeps draft posts visible locally and refreshes their publication state from metadata', async () => {
    const frontmatter = {
      'Draft.md': { type: 'post', draft: true, lastmod: '2026-10-19' },
      'Second post.md': { type: 'post', draft: true },
      'Published.md': { type: 'post', draft: false },
      'Legacy.md': { type: 'post' },
      'Note.md': { type: 'note', draft: true }
    };
    const { app } = makeApp({ files: Object.keys(frontmatter).map((name) => makeFile(name)), frontmatter });
    const service = new WeatherDataService(app);
    const data = await service.buildCollection('terrain', { mode: 'group', group: 'posts' }, new Date('2026-10-19T12:00:00Z'));
    expect(data.items.map(({ title, draft }) => ({ title, draft }))).toEqual([
      { title: 'Draft', draft: true },
      { title: 'Legacy', draft: false },
      { title: 'Published', draft: false },
      { title: 'Second post', draft: true }
    ]);
    expect(data.items[0].activity.recentUpdateCount).toBe(1);
    frontmatter['Draft.md'].draft = false;
    const refreshed = await service.buildCollection('terrain');
    expect(refreshed.items.find((item) => item.title === 'Draft')?.draft).toBe(false);
    expect(refreshed.items.find((item) => item.title === 'Note')?.draft).toBe(false);
  });

  it('reads poems independently of Writing filters and other vault folders', async () => {
    const { app } = makeApp({
      files: [
        makeFile('poems/Arachnid.md'),
        makeFile('poems/Outside In.md'),
        makeFile('poems/drafts/Hidden.md'),
        makeFile('pages/poems.md'),
        makeFile('Root.md', '/'),
        makeFile('shelf/Book.md')
      ],
      frontmatter: {
        'poems/Arachnid.md': { title: 'Arachnid', lastmod: '2026-09-13' },
        'poems/Outside In.md': { lastMod: '2024-12-31' }
      }
    });
    const data = await new WeatherDataService(app).buildCollection(
      'poems',
      { mode: 'group', group: 'posts' },
      new Date('2026-09-13T12:00:00Z')
    );

    expect(data.items.map((item) => item.vaultPath)).toEqual([
      'poems/Arachnid.md', 'poems/Outside In.md'
    ]);
    expect(data.items[0].activity).toMatchObject({ recentUpdateCount: 1, level: 5 });
    expect(data.items[1]).toMatchObject({ title: 'Outside In', activity: { level: 0 } });
  });

  it('creates poems with minimal frontmatter and prevents duplicates', async () => {
    const { app, contents, folders } = makeApp({ files: [] });
    const service = new WeatherDataService(app);
    const file = await service.createNote({
      collectionKey: 'poems',
      title: 'New Poem',
      now: new Date('2026-09-13T12:00:00Z')
    });

    expect(file.path).toBe('poems/New Poem.md');
    expect(folders.has('poems')).toBe(true);
    expect(contents.get(file.path)).toBe('---\ndate: 2026-09-13\nlastmod: 2026-09-13\n---\n\n');
    await expect(service.createNote({ collectionKey: 'poems', title: 'New Poem' }))
      .rejects.toThrow('A poem with that title already exists');
  });

  it('builds root Terrain data and ignores nested Markdown files', async () => {
    const files = [
      makeFile('A Question.md', '/'),
      makeFile('writing inbox/Ignore.md', 'writing inbox')
    ];
    const { app } = makeApp({
      files,
      frontmatter: {
        'A Question.md': {
          title: 'Custom title',
          date: '2026-06-01',
          lastMod: '2026-06-14',
          slug: 'custom-question',
          type: 'note'
        }
      }
    });

    const data = await new WeatherDataService(app).buildCollection(
      'terrain',
      { mode: 'all' },
      new Date('2026-06-15T12:00:00Z')
    );

    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      title: 'Custom title',
      slug: 'custom-question',
      type: 'note',
      vaultPath: 'A Question.md',
      activity: { recentUpdateCount: 1, level: 5, lastActivity: '2026-06-14' }
    });
  });

  it('filters Posts and Notes before assigning activity levels', async () => {
    const files = [makeFile('Recent note.md'), makeFile('Older note.md'), makeFile('Second post.md'), makeFile('Post.md')];
    const { app } = makeApp({
      files,
      frontmatter: {
        'Recent note.md': { type: 'note', lastmod: '2026-06-15' },
        'Older note.md': { type: 'note', lastmod: '2026-06-13' },
        'Second post.md': { type: 'post', lastmod: '2026-06-14' },
        'Post.md': { type: 'post', lastmod: '2026-06-14' }
      }
    });
    const service = new WeatherDataService(app);

    const notes = await service.buildCollection(
      'terrain',
      { mode: 'group', group: 'notes' },
      new Date('2026-06-15T12:00:00Z')
    );
    const posts = await service.buildCollection(
      'terrain',
      { mode: 'group', group: 'posts' },
      new Date('2026-06-15T12:00:00Z')
    );

    expect(notes.items.map((item) => item.title)).toEqual(['Older note', 'Recent note']);
    expect(notes.items[0].activity.level).toBeLessThan(5);
    expect(notes.items[1].activity.level).toBe(5);
    expect(posts.items.map((item) => item.title)).toEqual(['Post', 'Second post']);
    expect(posts.items[0].activity.level).toBe(5);
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

  it('creates classified Writing entries at the vault root', async () => {
    const files: FakeFile[] = [];
    const { app, contents } = makeApp({ files });
    const service = new WeatherDataService(app);

    const note = await service.createNote({
      collectionKey: 'terrain',
      title: 'Reality has feedback loops',
      type: 'note',
      now: new Date('2026-06-30T12:00:00Z')
    });
    const post = await service.createNote({
      collectionKey: 'terrain',
      title: 'A new post',
      type: 'post',
      now: new Date('2026-06-30T12:00:00Z')
    });

    expect(post.path).toBe('A new post.md');
    expect(contents.get(post.path)).toContain('type: post');
    expect(note.path).toBe('Reality has feedback loops.md');
    expect(contents.get(note.path)).toContain('type: note');
    expect(contents.get(post.path)).not.toContain('tags:');
    expect(contents.get(note.path)).not.toContain('tags:');
  });

  it('rejects duplicate root filenames and frontmatter slugs', async () => {
    const files = [makeFile('Existing.md')];
    const { app } = makeApp({
      files,
      frontmatter: { 'Existing.md': { slug: 'duplicate-entry' } }
    });
    const service = new WeatherDataService(app);

    await expect(
      service.createNote({ collectionKey: 'terrain', title: 'Existing', type: 'note' })
    ).rejects.toThrow('A writing entry with that title already exists');
    await expect(
      service.createNote({ collectionKey: 'terrain', title: 'Duplicate Entry', type: 'note' })
    ).rejects.toThrow('A writing entry with that slug already exists');
  });
});
