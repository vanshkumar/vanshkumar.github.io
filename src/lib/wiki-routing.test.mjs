import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeWikiTarget, urlForEntry } from './wiki-routing.mjs';

test('routes Poems entries through their dedicated public namespace', () => {
  assert.equal(urlForEntry('poems', 'small-hours'), '/poems/small-hours');
  assert.equal(normalizeWikiTarget('Poems/Small Hours.md'), 'poems/small-hours');
});
