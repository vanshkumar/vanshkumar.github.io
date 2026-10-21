import assert from 'node:assert/strict';
import test from 'node:test';
import { amazonBookUrl, formatReadingDate, groupReadingLog, isReadingDate, readingDateString, validReadingInterval } from './reading-log.mjs';

test('Amazon links convert print ISBNs without losing leading zeros and fall back for other editions', () => {
  const book = { title: 'A Book & Another', authors: ['An Author'] };
  assert.equal(amazonBookUrl({ ...book, isbn: '978-0747591054' }), 'https://www.amazon.com/dp/0747591059');
  assert.equal(amazonBookUrl({ ...book, isbn: '0671212095' }), 'https://www.amazon.com/dp/0671212095');
  assert.equal(amazonBookUrl({ ...book, isbn: '9780807014295' }), 'https://www.amazon.com/dp/080701429X');
  for (const edition of [{}, { isbn: '9780747591055' }, { isbn: '0671212094' }, { isbn: '9798993566214' }, { isbn: '9780747591054', format: 'digital' }, { isbn: '9780747591054', format: 'audio' }]) {
    const url = new URL(amazonBookUrl({ ...book, ...edition }));
    assert.equal(url.pathname, '/s');
    assert.equal(url.searchParams.get('k'), 'A Book & Another An Author');
  }
  assert.equal(amazonBookUrl({ ...book, amazonAsin: 'B012345678', format: 'digital' }), 'https://www.amazon.com/dp/B012345678');
});

test('calendar dates retain their precision and reject impossible dates', () => {
  for (const date of ['2024', '2024-02', '2024-02-29', '2000-02-29']) {
    assert.equal(isReadingDate(date), true, date);
  }
  for (const date of ['2025-02-29', '1900-02-29', '2026-04-31', '2026-13', '2026-00', '2026-10-00', '0000', '26', '2026/10/21', null, '']) {
    assert.equal(isReadingDate(date), false, String(date));
  }
  assert.equal(formatReadingDate('2026-01-01'), 'Jan 1');
  assert.equal(formatReadingDate('2026-02'), 'Feb');
  assert.equal(formatReadingDate('2026'), '2026');
  assert.equal(readingDateString(new Date('2026-01-01T00:00:00Z')), '2026-01-01');
  assert.equal(readingDateString('2026-01'), '2026-01');
  assert.equal(validReadingInterval({ started: '2026-02-01', finished: '2026-01-31' }), false);
  assert.equal(validReadingInterval({ started: '2026-02-01', finished: '2026-02' }), true);
  assert.equal(validReadingInterval({ started: '2026', finished: '2026-01-01' }), true);
});

test('groups completed reads newest first, preserving rereads and undated history', () => {
  const books = [
    { slug: 'again', data: { title: 'Again', status: 'to-read', reads: [{ finished: null }, { finished: '2026-01-01' }] } },
    { slug: 'zebra', data: { title: 'Zebra', reads: [{ finished: '2026-01-01' }, { finished: '2025-12-31' }] } },
    { slug: 'partial', data: { title: 'Partial', reads: [{ finished: '2026' }, { finished: '2026-03' }] } },
    { slug: 'unread', data: { title: 'Unread', status: 'to-read', reads: [] } },
    { slug: 'abandoned', data: { title: 'Abandoned', status: 'did-not-finish' } }
  ];
  const before = structuredClone(books);
  const groups = groupReadingLog(books);
  assert.deepEqual(groups.map(({ year }) => year), ['2026', '2025', 'undated']);
  assert.deepEqual(groups[0].reads.map(({ id }) => id), ['partial-2', 'again-2', 'zebra-1', 'partial-1']);
  assert.equal(groups.flatMap(({ reads }) => reads).length, 6);
  assert.equal(groups[2].reads[0].finished, null);
  assert.deepEqual(books, before, 'rendering must not mutate the source of truth');
  assert.deepEqual(groupReadingLog([]), []);
  assert.equal(groupReadingLog([{ slug: 'yaml-date', data: {
    title: 'Unquoted YAML date', reads: [{ finished: new Date('2026-01-01T00:00:00Z') }]
  } }])[0].reads[0].finished, '2026-01-01');
  assert.throws(() => groupReadingLog([{ slug: 'invalid', data: { title: 'Invalid', reads: [{}] } }]), /completion date/);
});
