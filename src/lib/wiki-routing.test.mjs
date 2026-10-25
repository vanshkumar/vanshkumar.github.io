import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeWikiTarget, urlForEntry } from './wiki-routing.mjs';

test('routes Poems entries through their dedicated public namespace', () => {
  assert.equal(urlForEntry('poems', 'small-hours'), '/poems/small-hours');
  assert.equal(normalizeWikiTarget('Poems/Small Hours.md'), 'poems/small-hours');
});

test('routes writing by type with optional topic tags', () => {
  assert.equal(urlForEntry('terrain', 'story', { type: 'post', tags: ['fiction'] }), '/posts/story');
  assert.equal(urlForEntry('terrain', 'idea', { type: 'note' }), '/notes/idea');
});
