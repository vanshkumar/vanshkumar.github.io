import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  activityWeightForAge,
  buildActivity,
  buildQuestionData,
  buildShelfData,
  createQuestionNote,
  createShelfNote,
  excerptFromMarkdown,
  extractWikilinks,
  normalizeVaultAssetPath,
  questionFilenameFromTitle,
  slugifyPath
} from '../../scripts/question-data.mjs';

const tempDirs = [];

const makeTempVault = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'question-weather-'));
  const vaultDir = path.join(root, 'vault');
  const questionsDir = path.join(vaultDir, 'questions');
  const shelfDir = path.join(vaultDir, 'shelf');
  const shelfAssetsDir = path.join(vaultDir, 'assets', 'shelf');
  fs.mkdirSync(questionsDir, { recursive: true });
  fs.mkdirSync(shelfDir, { recursive: true });
  fs.mkdirSync(shelfAssetsDir, { recursive: true });
  tempDirs.push(root);
  return { root, questionsDir, shelfDir, shelfAssetsDir };
};

const writeQuestion = (dir, filename, content) => {
  fs.writeFileSync(path.join(dir, filename), content);
};

afterEach(() => {
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
  }
});

describe('question data generator', () => {
  it('uses custom slugs and parses frontmatter fields', () => {
    const { root, questionsDir } = makeTempVault();
    writeQuestion(
      questionsDir,
      'A Question.md',
      `---
slug: custom-question
title: Custom title
date: 2026-06-01
lastmod: 2026-06-14
tags:
  - learning
aliases:
  - Other name
---
# Opening

Body with [[Second Question]] and [a link](https://example.com).
`
    );
    writeQuestion(
      questionsDir,
      'Second Question.md',
      `---
title: Second Question
---
Related back to [[Custom title]].
`
    );

    const data = buildQuestionData({
      questionsDir,
      projectRoot: root,
      now: new Date('2026-06-15T12:00:00Z'),
      activityEventsByPath: {
        'vault/questions/A Question.md': [
          '2026-06-15T12:00:00Z',
          '2026-06-10T12:00:00Z'
        ]
      }
    });
    const first = data.questions.find((question) => question.slug === 'custom-question');

    expect(data.count).toBe(2);
    expect(first.title).toBe('Custom title');
    expect(first.date).toBe('2026-06-01');
    expect(first.lastmod).toBe('2026-06-14');
    expect(first.tags).toEqual(['learning']);
    expect(first.aliases).toEqual(['Other name']);
    expect(first.headings).toEqual([{ level: 1, text: 'Opening', id: 'opening' }]);
    expect(first.wikilinks[0]).toMatchObject({
      target: 'Second Question',
      normalizedTarget: 'second-question',
      resolvedSlug: 'second-question'
    });
    expect(first.wordCount).toBeGreaterThan(0);
    expect(first.vaultPath).toBe('questions/A Question.md');
    expect(first.obsidianUrl).toContain('obsidian://open?path=');
    expect(first.activity).toMatchObject({
      windowDays: 30,
      recentUpdateCount: 2,
      lastActivity: '2026-06-15',
      level: 5,
      normalized: 1
    });
  });

  it('creates readable excerpts and wikilink metadata', () => {
    const excerpt = excerptFromMarkdown(
      'A paragraph about [[Some Question|a visible label]] with **bold** and [external text](https://example.com).',
      80
    );
    const wikilinks = extractWikilinks(
      'First [[Some Question|a visible label]], then [[notes/Other#Part]].'
    );

    expect(excerpt).toBe(
      'A paragraph about a visible label with bold and external text.'
    );
    expect(wikilinks).toEqual([
      {
        target: 'Some Question',
        normalizedTarget: 'some-question',
        label: 'a visible label',
        resolvedSlug: null
      },
      {
        target: 'notes/Other',
        normalizedTarget: 'notes/other',
        label: 'notes/Other',
        resolvedSlug: null
      }
    ]);
    expect(slugifyPath('Questions/Some Question.md')).toBe('questions/some-question');
  });

  it('computes quadratic activity weights inside the recency window', () => {
    const activity = buildActivity({
      now: new Date('2026-06-15T00:00:00Z'),
      events: [
        '2026-06-15T00:00:00Z',
        '2026-06-14T00:00:00Z',
        '2026-05-01T00:00:00Z'
      ]
    });

    expect(activity.recentUpdateCount).toBe(2);
    expect(activity.score).toBe(
      Number((activityWeightForAge(0) + activityWeightForAge(1)).toFixed(4))
    );
    expect(activity.events).toEqual(['2026-06-15', '2026-06-14']);
  });

  it('creates a new question note with frontmatter and an Obsidian URL', () => {
    const { root, questionsDir } = makeTempVault();
    const created = createQuestionNote({
      questionsDir,
      projectRoot: root,
      title: 'How do I choose?',
      now: new Date('2026-06-15T12:00:00Z')
    });
    const filePath = path.join(questionsDir, 'How do I choose?.md');

    expect(created).toMatchObject({
      title: 'How do I choose?',
      slug: 'how-do-i-choose',
      filename: 'How do I choose?.md',
      vaultPath: 'questions/How do I choose?.md',
      repoPath: 'vault/questions/How do I choose?.md'
    });
    expect(created.obsidianUrl).toBe(
      `obsidian://open?path=${encodeURIComponent(filePath)}`
    );
    expect(fs.readFileSync(filePath, 'utf8')).toBe(
      `---\ndate: 2026-06-15\nlastmod: 2026-06-15\n---\n\n`
    );
  });

  it('sanitizes generated filenames and rejects duplicate question slugs', () => {
    const { root, questionsDir } = makeTempVault();
    writeQuestion(
      questionsDir,
      'Existing.md',
      `---
slug: duplicate-question
title: Existing
---
`
    );

    expect(questionFilenameFromTitle('One/two: three.md')).toBe(
      'One-two - three.md'
    );
    expect(() =>
      createQuestionNote({ questionsDir, projectRoot: root, title: 'Existing' })
    ).toThrow('A question with that title already exists');
    expect(() =>
      createQuestionNote({
        questionsDir,
        projectRoot: root,
        title: 'Duplicate Question'
      })
    ).toThrow('A question with that slug already exists');
  });

  it('builds shelf data with valid cover URLs', () => {
    const { root, shelfDir, shelfAssetsDir } = makeTempVault();
    fs.writeFileSync(path.join(shelfAssetsDir, 'book.webp'), 'fake image');
    writeQuestion(
      shelfDir,
      'Book Review.md',
      `---
title: Book Review
date: 2026-06-01
lastmod: 2026-06-17
rating: 5
coverImage: /assets/shelf/book.webp
---
# Notes

Body with [[A Question]].
`
    );

    const data = buildShelfData({
      shelfDir,
      projectRoot: root,
      now: new Date('2026-06-17T12:00:00Z'),
      activityEventsByPath: {
        'vault/shelf/Book Review.md': ['2026-06-17T12:00:00Z']
      }
    });
    const item = data.items[0];

    expect(data.count).toBe(1);
    expect(item).toMatchObject({
      slug: 'book-review',
      title: 'Book Review',
      coverImage: '/assets/shelf/book.webp',
      date: '2026-06-01',
      lastmod: '2026-06-17',
      rating: 5,
      vaultPath: 'shelf/Book Review.md',
      repoPath: 'vault/shelf/Book Review.md'
    });
    expect(decodeURIComponent(item.coverUrl)).toBe(
      '/__vault-weather-asset/assets/shelf/book.webp'
    );
    expect(item.activity).toMatchObject({
      recentUpdateCount: 1,
      lastActivity: '2026-06-17',
      level: 5
    });
  });

  it('falls back when shelf covers are missing or invalid', () => {
    const { root, shelfDir } = makeTempVault();
    writeQuestion(
      shelfDir,
      'Missing Cover.md',
      `---
coverImage: /assets/shelf/missing.webp
---
`
    );
    writeQuestion(
      shelfDir,
      'Unsafe Cover.md',
      `---
coverImage: ../outside.webp
---
`
    );

    const data = buildShelfData({
      shelfDir,
      projectRoot: root,
      now: new Date('2026-06-17T12:00:00Z'),
      activityEventsByPath: {}
    });

    expect(normalizeVaultAssetPath('/assets/shelf/book.webp')).toBe(
      'assets/shelf/book.webp'
    );
    expect(normalizeVaultAssetPath('../outside.webp')).toBeNull();
    expect(data.items.map((item) => item.coverUrl)).toEqual([null, null]);
  });

  it('creates a new shelf note with frontmatter and an Obsidian URL', () => {
    const { root, shelfDir } = makeTempVault();
    const created = createShelfNote({
      shelfDir,
      projectRoot: root,
      title: 'A New Book',
      rating: 4,
      now: new Date('2026-06-17T12:00:00Z')
    });
    const filePath = path.join(shelfDir, 'A New Book.md');

    expect(created).toMatchObject({
      title: 'A New Book',
      slug: 'a-new-book',
      filename: 'A New Book.md',
      vaultPath: 'shelf/A New Book.md',
      repoPath: 'vault/shelf/A New Book.md'
    });
    expect(created.obsidianUrl).toBe(
      `obsidian://open?path=${encodeURIComponent(filePath)}`
    );
    expect(fs.readFileSync(filePath, 'utf8')).toBe(
      `---\ndate: 2026-06-17\nlastmod: 2026-06-17\nrating: 4\n---\n\n`
    );
  });

  it('requires an explicit shelf rating when creating shelf notes', () => {
    const { root, shelfDir } = makeTempVault();

    expect(() =>
      createShelfNote({ shelfDir, projectRoot: root, title: 'A New Book' })
    ).toThrow('Shelf rating is required');
    expect(() =>
      createShelfNote({
        shelfDir,
        projectRoot: root,
        title: 'A New Book',
        rating: 6
      })
    ).toThrow('Shelf rating must be an integer from 0 to 5');
  });
});
