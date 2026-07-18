import { describe, expect, it } from 'vitest';
import type { TFile } from 'obsidian';
import {
  activityTone,
  activityWeightForAge,
  assignActivityLevels,
  buildActivity,
  createNoteDraft,
  normalizeVaultAssetPath,
  noteFilenameFromTitle,
  sortWeatherItems
} from '../lib/weatherCore';
import type { WeatherItem } from '../lib/weatherTypes';

const fakeFile = (path: string): TFile => ({ path } as TFile);

describe('weather core', () => {
  it('computes quadratic activity by calendar day inside the recency window', () => {
    const activity = buildActivity({
      now: new Date('2026-06-15T12:00:00Z'),
      events: ['2026-06-15', '2026-06-14', '2026-05-01']
    });

    expect(activity.recentUpdateCount).toBe(2);
    expect(activity.score).toBe(
      Number((activityWeightForAge(0) + activityWeightForAge(1)).toFixed(4))
    );
    expect(activity.events).toEqual(['2026-06-15', '2026-06-14']);
  });

  it('assigns activity levels relative to one collection', () => {
    const items = assignActivityLevels([
      { activity: buildActivity({ events: ['2026-06-15'], now: new Date('2026-06-15') }) },
      { activity: buildActivity({ events: ['2026-06-14'], now: new Date('2026-06-15') }) },
      { activity: buildActivity({ events: [], now: new Date('2026-06-15') }) }
    ]);

    expect(items.map((item) => item.activity.level)).toEqual([5, 2, 0]);
    expect(items.map((item) => item.activity.normalized)).toEqual([1, 0.25, 0]);
  });

  it('keeps the existing activity tones and weather sorting', () => {
    const makeItem = (title: string, score: number, level: number): WeatherItem => ({
      file: fakeFile(`${title}.md`),
      slug: title.toLowerCase(),
      title,
      vaultPath: `${title}.md`,
      date: '2026-06-01',
      lastmod: '2026-06-10',
      rating: null,
      coverImage: null,
      coverUrl: null,
      activity: {
        windowDays: 30,
        recentUpdateCount: score > 0 ? 1 : 0,
        score,
        level,
        lastActivity: '2026-06-10',
        events: ['2026-06-10']
      }
    });
    const items = [makeItem('Alpha', 0.5, 3), makeItem('Beta', 1, 5), makeItem('Gamma', 0, 0)];

    expect(sortWeatherItems(items).map((item) => item.title)).toEqual([
      'Beta',
      'Alpha',
      'Gamma'
    ]);
    expect([activityTone(5), activityTone(3), activityTone(0)]).toEqual([
      'electric',
      'warm',
      'quiet'
    ]);
  });

  it('creates minimal note drafts and sanitizes filenames', () => {
    expect(noteFilenameFromTitle('One/two: three.md')).toBe('One-two - three.md');
    expect(
      createNoteDraft({
        collectionKey: 'questions',
        title: 'How do I choose?',
        now: new Date('2026-06-15T12:00:00Z')
      })
    ).toEqual({
      title: 'How do I choose?',
      slug: 'how-do-i-choose',
      filename: 'How do I choose?.md',
      vaultPath: 'questions/How do I choose?.md',
      markdown: '---\ndate: 2026-06-15\nlastmod: 2026-06-15\n---\n\n'
    });
    expect(
      createNoteDraft({
        collectionKey: 'shelf',
        title: 'A New Book',
        rating: 4,
        now: new Date('2026-06-17T12:00:00Z')
      }).markdown
    ).toBe('---\ndate: 2026-06-17\nlastmod: 2026-06-17\nrating: 4\n---\n\n');
  });

  it('validates required titles and shelf ratings', () => {
    expect(() => createNoteDraft({ collectionKey: 'questions', title: '' })).toThrow(
      'Question title is required'
    );
    expect(() => createNoteDraft({ collectionKey: 'shelf', title: 'Book' })).toThrow(
      'Shelf rating is required'
    );
    expect(() =>
      createNoteDraft({ collectionKey: 'shelf', title: 'Book', rating: 6 })
    ).toThrow('Shelf rating must be an integer from 0 to 5');
  });

  it('normalizes safe vault cover paths', () => {
    expect(normalizeVaultAssetPath('/assets/shelf/book.webp')).toBe('assets/shelf/book.webp');
    expect(normalizeVaultAssetPath('../outside.webp')).toBeNull();
    expect(normalizeVaultAssetPath('https://example.com/book.webp')).toBeNull();
  });
});
