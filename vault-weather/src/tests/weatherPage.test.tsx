import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { TFile } from 'obsidian';
import { WeatherPage } from '../App';
import type {
  Activity,
  CollectionKey,
  TerrainFilter,
  WeatherCollectionData,
  WeatherItem
} from '../lib/weatherTypes';

const activity: Activity = {
  windowDays: 30,
  recentUpdateCount: 1,
  score: 1,
  level: 5,
  normalized: 1,
  lastActivity: '2026-07-17',
  events: ['2026-07-17']
};

const itemFor = (key: CollectionKey): WeatherItem => {
  const title = key === 'shelf' ? 'A Book' : 'A Terrain Note';
  const vaultPath = key === 'shelf' ? `shelf/${title}.md` : `${title}.md`;
  return {
    file: { path: vaultPath } as TFile,
    slug: title.toLowerCase().replace(/ /g, '-'),
    title,
    vaultPath,
    date: '2026-07-01',
    lastmod: '2026-07-17',
    tags: key === 'terrain' ? ['questions'] : [],
    rating: key === 'shelf' ? 5 : null,
    coverImage: key === 'shelf' ? '/assets/shelf/book.webp' : null,
    coverUrl: key === 'shelf' ? 'app://vault/assets/shelf/book.webp' : null,
    activity
  };
};

const renderSurface = (
  key: CollectionKey,
  terrainFilter: TerrainFilter = { mode: 'all' }
): string => {
  const data: WeatherCollectionData = {
    key,
    filter: terrainFilter,
    availableTags: key === 'terrain' ? ['hunches', 'questions'] : [],
    refreshedAt: '2026-07-17T12:00:00.000Z',
    items: [itemFor(key)]
  };
  return renderToStaticMarkup(
    <WeatherPage
      collectionKey={key}
      terrainFilter={terrainFilter}
      data={data}
      error=""
      changeCollection={vi.fn()}
      changeTerrainFilter={vi.fn()}
      createNote={vi.fn()}
      openFile={vi.fn()}
    />
  );
};

describe('sandboxed WeatherPage rendering', () => {
  it.each([
    ['terrain', 'Terrain Weather', 'A Terrain Note', 'terrain-stack'],
    ['shelf', 'Shelf Weather', 'A Book', 'shelf-stack']
  ] as const)('renders the %s surface', (key, heading, itemTitle, stackClass) => {
    const html = renderSurface(key);
    expect(html).toContain(`<h1>${heading}</h1>`);
    expect(html).toContain(itemTitle);
    expect(html).toContain(stackClass);
    expect(html).not.toContain('Refresh');
    expect(html).toContain('aria-label="Add ');
    expect(html).toContain('aria-current="page"');
  });

  it('renders All, Untagged, and discovered tag views for Terrain', () => {
    const html = renderSurface('terrain', { mode: 'tag', tag: 'questions' });
    expect(html).toContain('<h1>Questions Weather</h1>');
    expect(html).toContain('>All</button>');
    expect(html).toContain('>Untagged</button>');
    expect(html).toContain('>Hunches</button>');
    expect(html).toContain('aria-current="page">Questions</button>');
    expect(html).toContain('aria-label="Add questions entry"');
  });

  it('renders a resolved shelf cover resource', () => {
    const html = renderSurface('shelf');
    expect(html).toContain('src="app://vault/assets/shelf/book.webp"');
    expect(html).toContain('has-cover');
    expect(html).not.toContain('terrain-filter-tabs');
  });
});
