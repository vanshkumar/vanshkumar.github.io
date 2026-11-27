import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  PUBLIC_MARKDOWN_PATHS,
  assertCompleteGitHistory,
  buildCalendar,
  getActivityLevel,
  getWordActivity,
  parseWordDiffLog
} from './word-activity.mjs';

const historyFixture = (t) => {
  const root = mkdtempSync(join(tmpdir(), 'site-word-lifetimes-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  let date = '2026-11-01';
  const git = (args) => execFileSync('git', args, {
    cwd: root, encoding: 'utf8',
    env: { ...process.env, GIT_AUTHOR_DATE: `${date}T12:00:00-08:00`, GIT_COMMITTER_DATE: `${date}T12:00:00-08:00` }
  });
  mkdirSync(join(root, 'vault'));
  git(['init', '-q']);
  git(['config', 'user.name', 'Test']);
  git(['config', 'user.email', 'test@example.com']);
  return {
    write: (name, text) => writeFileSync(join(root, 'vault', name), text),
    remove: (name) => rmSync(join(root, 'vault', name)),
    commit(day) { date = day; git(['add', '-A']); git(['commit', '-qm', 'writing']); },
    calendar: () => getWordActivity({ today: '2026-11-07', runGit: git })
  };
};

test('ignores exact restorations across days but preserves neighboring edits and repeated lifetimes', (t) => {
  const fixture = historyFixture(t);
  const name = 'A note é "quoted".md';
  const original = '---\ntitle: Original\ntype: note\n---\nthree original words\n';
  fixture.write(name, original);
  fixture.write('other.md', 'another thought\n');
  fixture.commit('2026-11-01');
  fixture.remove(name);
  fixture.write('other.md', 'another idea\n');
  fixture.commit('2026-11-02');
  assert.equal(fixture.calendar().totals.removed, 3);
  fixture.write(name, original);
  fixture.commit('2026-11-03');
  let days = fixture.calendar().weeks.flatMap(week => week.days);
  assert.equal(days.find(day => day.date === '2026-11-02').touched, 1);
  assert.equal(days.find(day => day.date === '2026-11-03').touched, 0);
  assert.deepEqual(fixture.calendar().totals, { added: 5, edited: 1, removed: 0, touched: 6 });
  fixture.write(name, original.replace('original words', 'revised words'));
  fixture.commit('2026-11-04');
  fixture.remove(name);
  fixture.commit('2026-11-05');
  fixture.write(name, original.replace('original words', 'revised words'));
  fixture.commit('2026-11-06');
  assert.deepEqual(fixture.calendar().totals, { added: 5, edited: 2, removed: 0, touched: 7 });
  fixture.remove(name);
  fixture.commit('2026-11-07');
  assert.equal(fixture.calendar().totals.removed, 3);
});

test('counts different-path copies and different-content recreations without matching older lifetimes', (t) => {
  const fixture = historyFixture(t);
  fixture.write('note.md', 'old words\n');
  fixture.commit('2026-11-01');
  fixture.remove('note.md');
  fixture.commit('2026-11-02');
  fixture.write('copy.md', 'old words\n');
  fixture.write('note.md', 'different words\n');
  fixture.commit('2026-11-03');
  fixture.remove('note.md');
  fixture.commit('2026-11-04');
  fixture.write('note.md', 'old words\n');
  fixture.commit('2026-11-05');
  assert.deepEqual(fixture.calendar().totals, { added: 8, edited: 0, removed: 4, touched: 12 });
});

test('matches a restoration whose deletion predates the visible calendar', (t) => {
  const fixture = historyFixture(t);
  fixture.write('note.md', 'old words\n');
  fixture.commit('2024-11-01');
  fixture.remove('note.md');
  fixture.commit('2024-11-02');
  fixture.write('note.md', 'old words\n');
  fixture.commit('2026-11-07');
  assert.equal(fixture.calendar().totals.touched, 0);
});

test('pairs additions and removals as edits per file and day', () => {
  const activity = parseWordDiffLog(`
__WORD_GARDEN_COMMIT__2026-08-18T10:00:00-07:00
diff --git a/vault/pages/about.md b/vault/pages/about.md
--- a/vault/pages/about.md
+++ b/vault/pages/about.md
@@ -1,10 +1,10 @@
-old small phrase
+new small phrase with growth
~
diff --git a/vault/pages/now.md b/vault/pages/now.md
--- a/vault/pages/now.md
+++ b/vault/pages/now.md
@@ -1,10 +1,10 @@
-three words leave
~
__WORD_GARDEN_COMMIT__2026-08-18T18:00:00-07:00
diff --git a/vault/notes/example.md b/vault/notes/example.md
--- /dev/null
+++ b/vault/notes/example.md
@@ -1,10 +1,10 @@
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
@@ -1,10 +1,10 @@
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

test('uses stable activity levels and aggregates daily totals', () => {
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
  assert.equal(day.level, 1);
});

test('keeps public history allowlisted and rejects shallow clones', () => {
  assert.ok(PUBLIC_MARKDOWN_PATHS.some((path) => path.includes('vault/*.md')));
  assert.ok(PUBLIC_MARKDOWN_PATHS.some((path) => path.includes('vault/traces')));
  assert.ok(PUBLIC_MARKDOWN_PATHS.some((path) => path.includes('vault/hunches')));
  assert.ok(PUBLIC_MARKDOWN_PATHS.some((path) => path.includes('vault/poems')));
  assert.ok(PUBLIC_MARKDOWN_PATHS.every((path) => !path.includes('writing inbox')));
  assert.ok(PUBLIC_MARKDOWN_PATHS.every((path) => !path.includes('scratch')));
  assert.throws(
    () => assertCompleteGitHistory(() => 'true\n'),
    /fetch-depth: 0/
  );
  assert.doesNotThrow(() => assertCompleteGitHistory(() => 'false\n'));
});

test('counts body edits but not frontmatter or commit messages in real Git history', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const { getWordActivity } = await import('./word-activity.mjs');
  const { countMarkdownWords } = await import('./word-activity-core.mjs');
  const root = mkdtempSync(join(tmpdir(), 'site-word-activity-'));
  let date = '2026-11-06T12:00:00-05:00';
  const git = (args) => execFileSync('git', args, {
    cwd: root, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date }
  });
  const activity = () => getWordActivity({ today: '2026-11-07', runGit: git });
  const commit = (message) => { git(['add', '.']); git(['commit', '-m', message]); };
  const note = join(root, 'vault/note.md');
  const body = 'clear words here\n\n---\n\nmore prose below\n';
  const metadata = (title) => `---\ntitle: ${title}\ndescription: |\n${'  long metadata text\n'.repeat(40)}type: note\nexclude_modified_update: false\n---\n`;
  try {
    mkdirSync(join(root, 'vault'));
    git(['init', '-q']);
    git(['config', 'user.name', 'Test']); git(['config', 'user.email', 'test@example.com']);
    writeFileSync(note, metadata('Original title') + body);
    commit('A long commit message must never contribute any writing activity');
    assert.equal(activity().totals.touched, 6);
    assert.equal(countMarkdownWords(metadata('New note') + body), 6);
    assert.equal(countMarkdownWords('---\ntitle: Only metadata\n---\n'), 0);
    date = '2026-11-07T12:00:00-05:00';
    writeFileSync(note, metadata('Updated title').replace('false', 'true') + body);
    commit('Metadata only\n\n+ These words are not a diff\n- These are not deleted prose either');
    git(['commit', '--allow-empty', '-m', 'An empty commit also contributes nothing']);
    const today = activity().weeks.flatMap(week => week.days).find(day => day.date === '2026-11-07');
    assert.equal(today.touched, 0);
    assert.equal(activity().totals.touched, 6);
    // Removing and adding a header must not count it as deleted or new writing.
    writeFileSync(note, body); commit('Remove metadata');
    assert.equal(activity().totals.touched, 6);
    writeFileSync(note, metadata('Restored title') + body); commit('Restore metadata');
    assert.equal(activity().totals.touched, 6);
    // A long unchanged header must still be excluded when the body changes.
    writeFileSync(note, metadata('Changed again') + body.replace('clear', 'better'));
    commit('Revise prose and metadata');
    assert.equal(activity().totals.edited, 1);
    assert.equal(activity().totals.touched, 7);
    // File deletion counts body words only.
    rmSync(note); commit('Delete the note');
    assert.equal(activity().totals.removed, 6);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
