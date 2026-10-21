import assert from 'node:assert/strict';
import test from 'node:test';
import { amazonBookUrl, formatReadingDate, getReadingLog, isReadingDate, readingDateString } from './reading-log.mjs';

test('Amazon links use explicit product IDs without losing leading zeros, otherwise search by title and author', () => {
  const book = { title: 'A Book & Another', authors: ['An Author'] };
  for (const amazonAsin of ['0747591059', '0671212095', '080701429X', 'B012345678']) {
    assert.equal(amazonBookUrl({ ...book, amazonAsin }), `https://www.amazon.com/dp/${amazonAsin}`);
  }
  for (const edition of [{}, { isbn: '9780747591054' }, { isbn: '0671212095' }]) {
    const url = new URL(amazonBookUrl({ ...book, ...edition }));
    assert.equal(url.pathname, '/s');
    assert.equal(url.searchParams.get('k'), 'A Book & Another An Author');
  }
});

test('calendar dates retain their precision and reject impossible dates', () => {
  for (const date of ['2024', '2024-02', '2024-02-29', '2000-02-29']) {
    assert.equal(isReadingDate(date), true, date);
  }
  for (const date of ['2025-02-29', '1900-02-29', '2026-04-31', '2026-13', '2026-00', '2026-10-00', '0000', '26', '2026/10/21', null, '']) {
    assert.equal(isReadingDate(date), false, String(date));
  }
  assert.equal(formatReadingDate('2026-01-01'), 'Jan 1, 2026');
  assert.equal(formatReadingDate('2026-02'), 'Feb 2026');
  assert.equal(formatReadingDate('2026'), '2026');
  assert.equal(readingDateString(new Date('2026-01-01T00:00:00Z')), '2026-01-01');
  assert.equal(readingDateString('2026-01'), '2026-01');
});

test('lists completed books newest first, preserving date precision and unknown dates', () => {
  const books = [
    { slug: 'alpha', data: { title: 'Alpha', status: 'to-read', finished: '2026-01-01' } },
    { slug: 'zebra', data: { title: 'Zebra', finished: '2026-01-01' } },
    { slug: 'older', data: { title: 'Older', finished: '2025-12-31' } },
    { slug: 'year', data: { title: 'Year', finished: '2026' } },
    { slug: 'month', data: { title: 'Month', finished: '2026-03' } },
    { slug: 'undated', data: { title: 'Undated', finished: null } },
    { slug: 'unread', data: { title: 'Unread', status: 'to-read' } },
    { slug: 'abandoned', data: { title: 'Abandoned', status: 'did-not-finish' } }
  ];
  const before = structuredClone(books);
  const events = getReadingLog(books);
  assert.deepEqual(events.map(({ id }) => id), ['month-1', 'alpha-1', 'zebra-1', 'year-1', 'older-1', 'undated-1']);
  assert.equal(events.at(-1).finished, null);
  assert.deepEqual(books, before, 'rendering must not mutate the source of truth');
  assert.deepEqual(getReadingLog([]), []);
  assert.equal(getReadingLog([{ slug: 'yaml-date', data: {
    title: 'Unquoted YAML date', finished: new Date('2026-01-01T00:00:00Z')
  } }])[0].finished, '2026-01-01');
  assert.throws(() => getReadingLog([{ slug: 'invalid', data: { title: 'Invalid', finished: '2026-02-30' } }]), /completion date/);
});
