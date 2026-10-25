import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyWritingType,
  canonicalWritingPath,
  compareNotes,
  comparePosts,
  validateLogParents,
  writingRedirectTags
} from './writing.mjs';

test('classifies Posts and Notes independently of topic tags', () => {
  assert.equal(classifyWritingType('post'), 'post');
  assert.equal(classifyWritingType('note'), 'note');
  assert.equal(
    canonicalWritingPath({ slug: 'a-small-thought', data: { type: 'post', tags: ['fiction'] } }),
    '/posts/a-small-thought'
  );
  assert.equal(
    canonicalWritingPath({ slug: 'an-evolving-note', data: { type: 'note' } }),
    '/notes/an-evolving-note'
  );
});

test('preserves retired subtype and topic tag URLs', () => {
  assert.deepEqual(writingRedirectTags({ type: 'post', tags: ['fiction'] }),
    ['fiction', 'posts', 'projects', 'essays']);
  assert.deepEqual(writingRedirectTags({ type: 'note' }), ['notes', 'hunches', 'questions']);
});

test('sorts Posts by date and Notes by lastmod, with slug tie-breakers', () => {
  const post = (slug, date, lastmod) => ({ slug, data: { type: 'post', date, lastmod } });
  const note = (slug, date, lastmod) => ({ slug, data: { type: 'note', date, lastmod } });
  assert.deepEqual(
    [post('older-date', new Date('2024-01-01'), new Date('2026-01-01')), post('newer-date', new Date('2025-01-01'), new Date('2025-01-01'))].sort(comparePosts).map(({ slug }) => slug),
    ['newer-date', 'older-date']
  );
  assert.deepEqual(
    [note('older-update', new Date('2026-01-01'), new Date('2024-01-01')), note('newer-update', new Date('2025-01-01'), new Date('2025-01-01'))].sort(compareNotes).map(({ slug }) => slug),
    ['newer-update', 'older-update']
  );
  assert.deepEqual(
    [note('zeta', null, new Date('2025-01-01')), note('alpha', null, new Date('2025-01-01'))].sort(compareNotes).map(({ slug }) => slug),
    ['alpha', 'zeta']
  );
});

test('rejects missing types and retired subtype names', () => {
  for (const type of [undefined, null, '', 'projects', 'posts', 'hunches', 'questions', ['post', 'note']]) {
    assert.throws(() => classifyWritingType(type), /must have type: post or type: note/);
  }
});

test('requires every log parent to be a Post', () => {
  const post = { slug: 'project', data: { type: 'post' } };
  const note = { slug: 'question', data: { type: 'note' } };
  assert.doesNotThrow(() =>
    validateLogParents([{ slug: 'project/day-1', data: { parent: 'project' } }], [post, note])
  );
  assert.throws(
    () => validateLogParents([{ slug: 'question/day-1', data: { parent: 'question' } }], [post, note]),
    /parent classified as a Post/
  );
});
