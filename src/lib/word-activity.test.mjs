import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PUBLIC_MARKDOWN_PATHS,
  assertCompleteGitHistory,
  buildCalendar,
  getActivityLevel,
  parseWordDiffLog
} from './word-activity.mjs';

test('pairs additions and removals as edits per file and day', () => {
  const activity = parseWordDiffLog(`
__WORD_GARDEN_COMMIT__2026-08-18T10:00:00-07:00
diff --git a/vault/pages/about.md b/vault/pages/about.md
--- a/vault/pages/about.md
+++ b/vault/pages/about.md
-old small phrase
+new small phrase with growth
~
diff --git a/vault/pages/contact.md b/vault/pages/contact.md
--- a/vault/pages/contact.md
+++ b/vault/pages/contact.md
-three words leave
~
__WORD_GARDEN_COMMIT__2026-08-18T18:00:00-07:00
diff --git a/vault/notes/example.md b/vault/notes/example.md
--- /dev/null
+++ b/vault/notes/example.md
+two words
~
`);

  assert.deepEqual(activity.get('2026-08-18'), {
    date: '2026-08-18',
    added: 4,
    edited: 3,
    removed: 3
  });
});

test('ignores pure renames, numeric metadata, URLs, and diff metadata', () => {
  const activity = parseWordDiffLog(`
__WORD_GARDEN_COMMIT__2026-08-19T09:00:00-07:00
diff --git a/vault/traces/old.md b/vault/notes/new.md
similarity index 100%
rename from vault/traces/old.md
rename to vault/notes/new.md
diff --git a/vault/pages/about.md b/vault/pages/about.md
--- a/vault/pages/about.md
+++ b/vault/pages/about.md
-2026-08-18
+2026-08-19
-https://example.com/old-page
+https://example.com/new-page
~
`);

  assert.deepEqual(activity.get('2026-08-19'), {
    date: '2026-08-19',
    added: 0,
    edited: 0,
    removed: 0
  });
});

test('uses stable activity levels and marks removal-heavy days', () => {
  assert.deepEqual(
    [0, 1, 49, 50, 249, 250, 999, 1000].map(getActivityLevel),
    [0, 1, 1, 2, 2, 3, 3, 4]
  );

  const calendar = buildCalendar(
    new Map([
      [
        '2026-08-19',
        { date: '2026-08-19', added: 4, edited: 2, removed: 2 }
      ]
    ]),
    { today: '2026-08-19' }
  );
  const day = calendar.weeks
    .flatMap((week) => week.days)
    .find((entry) => entry.date === '2026-08-19');

  assert.equal(calendar.weeks.length, 53);
  assert.equal(calendar.activeDays, 1);
  assert.deepEqual(calendar.totals, {
    added: 4,
    edited: 2,
    removed: 2,
    touched: 8
  });
  assert.equal(day.removalHeavy, true);
  assert.equal(day.level, 1);
});

test('keeps public history allowlisted and rejects shallow clones', () => {
  assert.ok(PUBLIC_MARKDOWN_PATHS.some((path) => path.includes('vault/*.md')));
  assert.ok(PUBLIC_MARKDOWN_PATHS.some((path) => path.includes('vault/traces')));
  assert.ok(PUBLIC_MARKDOWN_PATHS.some((path) => path.includes('vault/hunches')));
  assert.ok(PUBLIC_MARKDOWN_PATHS.every((path) => !path.includes('writing inbox')));
  assert.ok(PUBLIC_MARKDOWN_PATHS.every((path) => !path.includes('scratch')));
  assert.throws(
    () => assertCompleteGitHistory(() => 'true\n'),
    /fetch-depth: 0/
  );
  assert.doesNotThrow(() => assertCompleteGitHistory(() => 'false\n'));
});
