import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { WordActivityService, localDay } from '../lib/wordActivity';

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

describe('saved writing activity', () => {
  it('includes staged, unstaged and new prose once, excludes private files, and remains stable after committing', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'weather-words-'));
    roots.push(root);
    const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_DATE: '2026-10-30T12:00:00-04:00', GIT_COMMITTER_DATE: '2026-10-30T12:00:00-04:00' } });
    await mkdir(path.join(root, 'vault/scratch'), { recursive: true });
    git('init', '-q'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.com');
    await writeFile(path.join(root, 'vault/note.md'), 'old words here\n');
    git('add', '.'); git('commit', '-m', 'initial');
    const service = new WordActivityService(path.join(root, 'vault'));
    const now = new Date(2026, 9, 30, 12);
    expect((await service.load(now)).totals.touched).toBe(3);
    await writeFile(path.join(root, 'vault/note.md'), 'clear words here\n');
    git('add', 'vault/note.md');
    await writeFile(path.join(root, 'vault/note.md'), 'clear words here today\n');
    await writeFile(path.join(root, 'vault/new.md'), 'another thought\n');
    await writeFile(path.join(root, 'vault/scratch/private.md'), 'private words never counted\n');
    const saved = await service.load(now);
    expect(saved.totals).toEqual({ added: 6, edited: 1, removed: 0, touched: 7 });
    expect((await service.load(now)).totals).toEqual(saved.totals);
    git('add', '.'); git('commit', '-m', 'revised');
    expect((await service.load(now)).totals).toEqual(saved.totals);
    await writeFile(path.join(root, 'vault/note.md'), 'clear words\n');
    expect((await service.load(now)).totals.removed).toBe(2);
  });
  it('uses the local calendar day', () => {
    expect(localDay(new Date(2026, 9, 30, 23, 59))).toBe('2026-10-30');
    expect(localDay(new Date(2026, 9, 31, 0, 1))).toBe('2026-10-31');
  });
});
