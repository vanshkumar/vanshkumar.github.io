import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import matter from 'gray-matter';
import { syncContent } from '../../scripts/sync-content.mjs';

const fixture = (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'draft-content-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return {
    sync: () => syncContent(root),
    write: (name, data, body = '') => {
      const file = path.join(root, 'vault', name);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, matter.stringify(body, data));
    },
    exists: (name) => fs.existsSync(path.join(root, 'src/content', name)),
    read: (name, generated = true) => matter(fs.readFileSync(
      path.join(root, generated ? 'src/content' : 'vault', name), 'utf8'
    ))
  };
};

test('drafts omit Posts and logs, retain local source, and return when published', (t) => {
  const vault = fixture(t);
  const post = { slug: 'stable-post', type: 'post', date: '2026-01-01' };
  vault.write('Working Title.md', post, 'Work in progress.');
  vault.write('Ordinary Post.md', { type: 'post' });
  vault.write('Ordinary Note.md', { type: 'note' });
  vault.write('logs/stable-post/Day One.md', { parent: 'stable-post', date: '2026-01-02' });
  const home = { home: { selected: { slugs: ['stable-post', 'ordinary-post'] } } };
  vault.write('pages/home.md', home);

  vault.sync();
  assert.equal(vault.exists('terrain/stable-post.md'), true);
  assert.equal(vault.exists('logs/stable-post/day-one.md'), true);

  vault.write('Working Title.md', { ...post, draft: true }, 'Work in progress.');
  vault.sync();
  assert.equal(vault.exists('terrain/stable-post.md'), false);
  assert.equal(vault.exists('logs/stable-post/day-one.md'), false);
  assert.equal(vault.exists('terrain/ordinary-post.md'), true);
  assert.equal(vault.exists('terrain/ordinary-note.md'), true);
  assert.deepEqual(vault.read('pages/home.md').data.home.selected.slugs, ['ordinary-post']);
  assert.deepEqual(vault.read('pages/home.md', false).data, home);
  assert.match(vault.read('Working Title.md', false).content, /Work in progress/);

  for (const data of [{ ...post, draft: false }, post]) {
    vault.write('Working Title.md', data);
    vault.sync();
    assert.equal(vault.exists('terrain/stable-post.md'), true);
    assert.equal(vault.exists('logs/stable-post/day-one.md'), true);
    assert.deepEqual(vault.read('pages/home.md').data.home.selected.slugs, home.home.selected.slugs);
  }
});

test('reading history sync preserves leading-zero edition identifiers and undated completions', (t) => {
  const vault = fixture(t);
  const book = {
    title: 'A Book', authors: ['An Author'], isbn: '0671212095',
    amazonAsin: '0671212095', finished: null
  };
  vault.write('reading-log/A Book.md', book);
  vault.sync();
  const synced = vault.read('reading-log/a-book.md');
  assert.deepEqual(synced.data, book);
  assert.match(synced.matter, /isbn: "0671212095"/, 'ISBN must remain quoted for YAML 1.2 readers');
  assert.match(synced.matter, /amazonAsin: "0671212095"/, 'ASIN must remain quoted for YAML 1.2 readers');
  assert.equal(vault.exists('terrain/a-book.md'), false);
});

test('draft sync rejects ambiguous flags and unsupported Note drafts', (t) => {
  const vault = fixture(t);
  for (const draft of ['true', 'false', null, 1]) {
    vault.write('Entry.md', { type: 'post', draft });
    assert.throws(vault.sync, /draft must be true or false/);
  }
  vault.write('Entry.md', { type: 'note', draft: true });
  assert.throws(vault.sync, /supported only for Posts/);
  vault.write('Entry.md', { type: 'question', draft: true });
  assert.throws(vault.sync, /must have type: post or type: note/);
});

test('drafts reserve their slugs and do not hide missing-parent errors', (t) => {
  const vault = fixture(t);
  vault.write('Draft.md', { slug: 'reserved', type: 'post', draft: true });
  vault.write('Published.md', { slug: 'reserved', type: 'post' });
  assert.throws(vault.sync, /Duplicate slug/);
  vault.write('Published.md', { type: 'post' });
  vault.write('logs/missing/day.md', { parent: 'missing' });
  assert.throws(vault.sync, /Log parent does not match a Terrain entry/);
});

test('all selected posts can be drafts without changing authored selections', (t) => {
  const vault = fixture(t);
  vault.write('Draft.md', { type: 'post', draft: true });
  vault.write('pages/home.md', { home: { selected: { slugs: ['draft'] } } });
  vault.sync();
  assert.deepEqual(vault.read('pages/home.md').data.home.selected.slugs, []);
  assert.deepEqual(vault.read('pages/home.md', false).data.home.selected.slugs, ['draft']);
});
