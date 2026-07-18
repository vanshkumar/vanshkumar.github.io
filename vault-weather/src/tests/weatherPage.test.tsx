import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { TFile } from 'obsidian';
import { WeatherPage } from '../App';
import type {
  Activity,
  CollectionKey,
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
  const title = key === 'shelf' ? 'A Book' : key === 'hunches' ? 'A Hunch' : 'A Question';
  const vaultPath = `${key}/${title}.md`;
  return {
    file: { path: vaultPath } as TFile,
    slug: title.toLowerCase().replace(/ /g, '-'),
    title,
    vaultPath,
    date: '2026-07-01',
    lastmod: '2026-07-17',
    rating: key === 'shelf' ? 5 : null,
    coverImage: key === 'shelf' ? '/assets/shelf/book.webp' : null,
    coverUrl: key === 'shelf' ? 'app://vault/assets/shelf/book.webp' : null,
    activity
  };
};

const renderSurface = (key: CollectionKey): string => {
  const data: WeatherCollectionData = {
    key,
    refreshedAt: '2026-07-17T12:00:00.000Z',
    items: [itemFor(key)]
  };
  return renderToStaticMarkup(
    <WeatherPage
      collectionKey={key}
      data={data}
      error=""
      changeCollection={vi.fn()}
      createNote={vi.fn()}
      openFile={vi.fn()}
    />
  );
};

describe('sandboxed WeatherPage rendering', () => {
  it.each([
    ['questions', 'Question Weather', 'A Question', 'question-stack'],
    ['hunches', 'Hunch Weather', 'A Hunch', 'hunch-stack'],
    ['shelf', 'Shelf Weather', 'A Book', 'shelf-stack']
  ] as const)('renders the %s surface', (key, heading, itemTitle, stackClass) => {
    const html = renderSurface(key);
    expect(html).toContain(`<h1>${heading}</h1>`);
    expect(html).toContain(itemTitle);
    expect(html).toContain(stackClass);
    expect(html).not.toContain('Refresh');
    expect(html).toContain('Add ');
    expect(html).toContain('aria-current="page"');
  });

  it('renders a resolved shelf cover resource', () => {
    const html = renderSurface('shelf');
    expect(html).toContain('src="app://vault/assets/shelf/book.webp"');
    expect(html).toContain('has-cover');
  });
});
