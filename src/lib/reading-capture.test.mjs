import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';
import { readingRecordSchema, serializeReadingRecord } from './reading-record.mjs';
import { inspectReadingLog, logFinishedBook, sha256 } from '../../scripts/log-finished-book.mjs';
import { syncContent } from '../../scripts/sync-content.mjs';

const today = '2026-10-21';
const candidate = (record = {}, extra = {}) => ({
  record: {
    title: 'A Test Book', authors: ['One Author', 'Another Author'], finished: '2026-10-20',
    metadataSources: [{ url: 'https://publisher.example/book', retrieved: today, fields: ['title', 'authors'] }],
    ...record
  },
  provenance: 'Publisher verifies the work. No print edition was verified; page count is unknown.',
  ...extra
});
function fixture(t, entries = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'reading-capture-'));
  fs.mkdirSync(path.join(root, 'vault', 'reading-log'), { recursive: true });
  for (const [name, text] of Object.entries(entries)) {
    fs.writeFileSync(path.join(root, 'vault', 'reading-log', name), text);
  }
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
const read = (root, target) => fs.readFileSync(path.join(root, 'vault', 'reading-log', target), 'utf8');
const options = (root, write = false) => ({ root, write, today });

test('dry run does not insert a record; writing preserves quoted IDs, exact dates, and multiple authors through sync', t => {
  const root = fixture(t);
  const input = candidate({ isbn: '0671212095', amazonAsin: '0671212095', pageCount: 200, publicationYear: 1972 });
  const preview = logFinishedBook(input, options(root));
  assert.equal(preview.status, 'ready');
  assert.deepEqual(fs.readdirSync(path.join(root, 'vault', 'reading-log')), []);
  const result = logFinishedBook(input, options(root, true));
  assert.equal(result.status, 'written');
  assert.equal(result.markdown, preview.markdown);
  const raw = read(root, result.target);
  assert.match(raw, /^isbn: "0671212095"$/m);
  assert.match(raw, /^amazonAsin: "0671212095"$/m);
  assert.match(raw, /^finished: "2026-10-20"$/m);
  syncContent(root);
  const generated = matter(fs.readFileSync(path.join(root, 'src', 'content', 'reading-log', result.target), 'utf8'));
  assert.deepEqual(readingRecordSchema.parse(generated.data).authors, input.record.authors);
  assert.equal(generated.data.isbn, '0671212095');
  assert.equal(generated.data.finished, '2026-10-20');
});

test('new capture rejects incomplete records, retired fields, invalid/future dates, and missing provenance', t => {
  const root = fixture(t);
  for (const record of [
    { title: '' }, { title: '  ' }, { authors: [] }, { authors: [' '] },
    { finished: null }, { finished: '2026' }, { finished: '2026-02-29' },
    { finished: '2027-01-01' }, { isbn: 671212095 }, { pageCount: 0 },
    { format: 'audio' }, { languages: ['English'] }, { reads: [] }, { metadataSources: [] }
  ]) assert.throws(() => logFinishedBook(candidate(record), options(root, true)));
  assert.throws(() => logFinishedBook(candidate({}, { provenance: '' }), options(root, true)));
  assert.deepEqual(inspectReadingLog(root), []);
  // Historical records retain their existing optional, partial, and null dates.
  for (const finished of [undefined, null, '2026', '2026-02']) {
    assert.equal(readingRecordSchema.parse({ title: 'History', authors: ['Author'], finished }).finished, finished);
  }
});

test('unknown print page counts remain absent and duplicate submissions do not rewrite', t => {
  const root = fixture(t);
  const input = candidate();
  const added = logFinishedBook(input, options(root, true));
  const before = read(root, added.target);
  assert.equal(matter(before).data.pageCount, undefined);
  const repeat = logFinishedBook(candidate({ title: 'a test book', authors: ['Another Author', 'One Author'] }), options(root, true));
  assert.equal(repeat.status, 'already-logged');
  assert.equal(read(root, added.target), before);
  assert.equal(inspectReadingLog(root).length, 1);
});

test('completion of an unfinished book preserves notes, existing metadata, and Shelf links', t => {
  const old = serializeReadingRecord('Existing note.\n', {
    title: 'A Test Book', authors: ['One Author', 'Another Author'], status: 'to-read',
    owned: true, shelfSlug: 'existing-notes', dateAdded: '2020-01-01', pageCount: 123
  });
  const root = fixture(t, { 'a-test-book.md': old });
  const input = candidate();
  const plan = logFinishedBook(input, options(root));
  assert.equal(plan.action, 'update');
  assert.throws(() => logFinishedBook(input, options(root, true)), /expectedSha256/);
  const result = logFinishedBook({ ...input, target: plan.target, expectedSha256: plan.expectedSha256 }, options(root, true));
  const parsed = matter(read(root, result.target));
  assert.equal(parsed.data.owned, true);
  assert.equal(parsed.data.shelfSlug, 'existing-notes');
  assert.equal(parsed.data.dateAdded, '2020-01-01');
  assert.equal(parsed.data.pageCount, 123);
  assert.equal(parsed.data.status, 'read');
  assert.match(parsed.content, /Existing note\./);
  assert.match(parsed.content, /No print edition/);
});

test('replacing an existing completion requires the precise old date and a fresh digest', t => {
  for (const finished of ['2020-01-01', null]) {
    const raw = serializeReadingRecord('', { title: 'A Test Book', authors: ['One Author', 'Another Author'], finished });
    const root = fixture(t, { 'a-test-book.md': raw });
    const input = candidate({}, { target: 'a-test-book.md', expectedSha256: sha256(raw) });
    assert.equal(logFinishedBook(input, options(root, true)).status, 'needs-clarification');
    assert.equal(read(root, input.target), raw);
    assert.equal(logFinishedBook({ ...input, replaceFinished: finished }, options(root, true)).status, 'written');
  }
});

test('stale updates and concurrent helper writes fail without losing edits or locks', t => {
  const raw = serializeReadingRecord('', { title: 'A Test Book', authors: ['One Author', 'Another Author'] });
  const root = fixture(t, { 'a-test-book.md': raw });
  const input = candidate({}, { target: 'a-test-book.md', expectedSha256: sha256(raw) });
  fs.appendFileSync(path.join(root, 'vault', 'reading-log', input.target), '\nConcurrent note.\n');
  assert.throws(() => logFinishedBook(input, options(root, true)), /Stale record/);
  assert.match(read(root, input.target), /Concurrent note/);
  const lock = path.join(root, 'vault', 'reading-log', '.capture.lock');
  assert.equal(fs.existsSync(lock), false);
  fs.writeFileSync(lock, 'Another writer');
  assert.throws(() => logFinishedBook(candidate(), options(root, true)), /EEXIST/);
  assert.equal(fs.readFileSync(lock, 'utf8'), 'Another writer');
});

test('conflicting identifiers and an unrelated explicit target never silently overwrite a book', t => {
  const raw = serializeReadingRecord('', { title: 'Different Work', authors: ['Other Author'], isbn: '0671212095' });
  const root = fixture(t, { 'different-work.md': raw });
  for (const input of [
    candidate({ isbn: '9780671212094' }),
    candidate({}, { target: 'different-work.md', expectedSha256: sha256(raw) })
  ]) assert.equal(logFinishedBook(input, options(root, true)).status, 'needs-clarification');
  assert.equal(read(root, 'different-work.md'), raw);
});

test('changing a reference ISBN without a verified length does not carry old pages forward', t => {
  const raw = serializeReadingRecord('', { title: 'A Test Book', authors: ['One Author', 'Another Author'], isbn: '0671212095', pageCount: 123 });
  const root = fixture(t, { 'a-test-book.md': raw });
  const result = logFinishedBook(candidate({ isbn: '9780140000001' }, {
    target: 'a-test-book.md', expectedSha256: sha256(raw)
  }), options(root, true));
  assert.equal(matter(result.markdown).data.pageCount, undefined);
});

test('multiple matching records require resolution; distinct authors with the same title get distinct filenames', t => {
  const raw = serializeReadingRecord('', { title: 'A Test Book', authors: ['One Author', 'Another Author'] });
  const root = fixture(t, { 'one.md': raw, 'two.md': raw });
  assert.equal(logFinishedBook(candidate(), options(root, true)).status, 'needs-clarification');
  const separate = fixture(t);
  logFinishedBook(candidate(), options(separate, true));
  const result = logFinishedBook(candidate({ authors: ['A Different Author'] }), options(separate, true));
  assert.equal(result.target, 'a-test-book-a-different-author.md');
  assert.equal(inspectReadingLog(separate).length, 2);
});

test('path traversal and symlink destinations cannot escape the canonical collection', t => {
  const root = fixture(t);
  for (const target of ['../outside.md', '/tmp/outside.md', 'folder/../../outside.md', 'UPPER.md', 'x\\y.md']) {
    assert.throws(() => logFinishedBook(candidate({}, { target }), options(root, true)));
  }
  const outside = path.join(root, 'untouched.md');
  fs.writeFileSync(outside, 'untouched');
  fs.symlinkSync(outside, path.join(root, 'vault', 'reading-log', 'a-test-book.md'));
  assert.throws(() => logFinishedBook(candidate(), options(root, true)), /symbolic link/);
  assert.equal(fs.readFileSync(outside, 'utf8'), 'untouched');
});
