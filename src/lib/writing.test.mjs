import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyWritingTags,
  canonicalWritingPath,
  compareNotes,
  comparePosts,
  validateLogParents
} from './writing.mjs';

test('classifies each writing group and allows same-group and ancillary tags', () => {
  assert.equal(classifyWritingTags(['projects']), 'post');
  assert.equal(classifyWritingTags(['posts']), 'post');
  assert.equal(classifyWritingTags(['posts', 'projects', 'neuroscience']), 'post');
  assert.equal(classifyWritingTags(['hunches']), 'note');
  assert.equal(classifyWritingTags(['questions', 'hunches', 'learning']), 'note');
});

test('renamed post tags preserve canonical post URLs', () => {
  assert.equal(
    canonicalWritingPath({ slug: 'a-small-thought', data: { tags: ['posts'] } }),
    '/posts/a-small-thought'
  );
  assert.throws(() => classifyWritingTags(['essays']), /must have at least one Post tag/);
});

test('sorts Posts by date and Notes by lastmod, with slug tie-breakers', () => {
  const post = (slug, date, lastmod) => ({ slug, data: { tags: ['projects'], date, lastmod } });
  const note = (slug, date, lastmod) => ({ slug, data: { tags: ['questions'], date, lastmod } });
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

test('rejects missing and cross-group classifications', () => {
  assert.throws(() => classifyWritingTags([]), /must have at least one Post tag/);
  assert.throws(
    () => classifyWritingTags(['posts', 'questions']),
    /both the Post group.*Note group/
  );
});

test('requires every log parent to be a Post', () => {
  const post = { slug: 'project', data: { tags: ['projects'] } };
  const note = { slug: 'question', data: { tags: ['questions'] } };
  assert.doesNotThrow(() =>
    validateLogParents([{ slug: 'project/day-1', data: { parent: 'project' } }], [post, note])
  );
  assert.throws(
    () => validateLogParents([{ slug: 'question/day-1', data: { parent: 'question' } }], [post, note]),
    /parent classified as a Post/
  );
});
