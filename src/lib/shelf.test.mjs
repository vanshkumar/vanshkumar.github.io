import assert from 'node:assert/strict';
import test from 'node:test';
import { hasShelfReview } from './shelf.mjs';

test('derives review availability from the Markdown body', () => {
  assert.equal(hasShelfReview({ body: 'A recommendation.' }), true);
  assert.equal(hasShelfReview({ body: '  \n\t' }), false);
  assert.equal(hasShelfReview({}), false);
});
