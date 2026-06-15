import { describe, expect, it } from 'vitest';
import {
  activityTone,
  filterQuestions,
  sortQuestions
} from '../lib/questionState';

const questions = [
  {
    slug: 'alpha',
    title: 'Alpha',
    excerpt: 'First question',
    body: 'Learning and agency',
    tags: [],
    wikilinks: [],
    date: '2026-06-01',
    lastmod: '2026-06-10',
    activity: { score: 0.5, recentUpdateCount: 2, level: 3 }
  },
  {
    slug: 'beta',
    title: 'Beta',
    excerpt: 'Second question',
    body: 'Rest and attention',
    tags: ['rest'],
    wikilinks: [{ target: 'Alpha', label: 'Alpha' }],
    date: '2026-06-02',
    lastmod: '2026-06-12',
    activity: { score: 1.2, recentUpdateCount: 1, level: 5 }
  },
  {
    slug: 'gamma',
    title: 'Gamma',
    excerpt: 'Third question',
    body: 'Education',
    tags: [],
    wikilinks: [],
    date: '2026-06-03',
    lastmod: '2026-06-09',
    activity: { score: 0, recentUpdateCount: 0, level: 0 }
  }
];

describe('question weather helpers', () => {
  it('sorts by computed weather activity by default', () => {
    expect(sortQuestions(questions).map((question) => question.slug)).toEqual([
      'beta',
      'alpha',
      'gamma'
    ]);
  });

  it('filters by searchable text', () => {
    expect(filterQuestions(questions, { query: 'rest' }).map((q) => q.slug)).toEqual([
      'beta'
    ]);
    expect(filterQuestions(questions, { query: 'alpha' }).map((q) => q.slug)).toEqual([
      'alpha',
      'beta'
    ]);
  });

  it('maps activity levels to visual tones', () => {
    expect(activityTone(5)).toBe('electric');
    expect(activityTone(3)).toBe('warm');
    expect(activityTone(0)).toBe('quiet');
  });
});
