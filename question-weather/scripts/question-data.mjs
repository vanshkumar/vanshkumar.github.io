import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

export const appRoot = path.resolve(scriptDir, '..');
export const repoRoot = path.resolve(appRoot, '..');
export const defaultQuestionsDir = path.join(repoRoot, 'vault', 'questions');
export const defaultOutputPath = path.join(
  appRoot,
  'src',
  'data',
  'questions.generated.json'
);
export const ACTIVITY_WINDOW_DAYS = 30;

export const slugify = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const slugifyPath = (value) =>
  String(value)
    .split('/')
    .map(slugify)
    .filter(Boolean)
    .join('/');

export const titleFromFilename = (filename) =>
  filename.replace(/\.md$/i, '').trim() || 'Untitled';

const toUnixPath = (value) => value.replace(/\\/g, '/');

const dateToIsoDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const daysBetween = (later, earlier) =>
  Math.max(0, (later.getTime() - earlier.getTime()) / 86_400_000);

export const activityWeightForAge = (ageInDays) =>
  1 / (Math.max(0, ageInDays) + 1) ** 2;

export const stripMarkdown = (value) =>
  String(value)
    .replace(/^---[\s\S]*?---\s*/, '')
    .replace(/^>\s*\[![^\]]+\]\s*/gm, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_, target, label) => label ?? target)
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\[\^[^\]]+\]/g, '')
    .replace(/[#*_>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const excerptFromMarkdown = (value, maxLength = 220) => {
  const text = stripMarkdown(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

export const extractHeadings = (content) => {
  const headings = [];
  const headingPattern = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = headingPattern.exec(content)) !== null) {
    const text = stripMarkdown(match[2]);
    headings.push({
      level: match[1].length,
      text,
      id: slugify(text)
    });
  }
  return headings;
};

export const extractWikilinks = (content) => {
  const links = [];
  const seen = new Set();
  const wikiPattern = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g;
  let match;
  while ((match = wikiPattern.exec(content)) !== null) {
    const target = match[1].trim();
    const label = (match[2] ?? target).trim();
    const normalizedTarget = slugifyPath(target);
    const key = `${normalizedTarget}:${label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({
      target,
      normalizedTarget,
      label,
      resolvedSlug: null
    });
  }
  return links;
};

const wordCount = (content) => {
  const text = stripMarkdown(content);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
};

const listMarkdownFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => a.localeCompare(b));
};

const buildObsidianUrl = (absolutePath) =>
  `obsidian://open?path=${encodeURIComponent(absolutePath)}`;

const uniqueIsoDates = (dates) =>
  Array.from(
    new Set(
      dates
        .map((value) => new Date(value))
        .filter((date) => !Number.isNaN(date.getTime()))
        .map((date) => date.toISOString())
    )
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

const gitOutput = (projectRoot, args) =>
  execFileSync('git', ['-C', projectRoot, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  }).trim();

export const readGitActivityEvents = ({
  projectRoot,
  repoPath,
  now = new Date(),
  windowDays = ACTIVITY_WINDOW_DAYS
}) => {
  const since = new Date(now.getTime() - windowDays * 86_400_000).toISOString();
  try {
    const log = gitOutput(projectRoot, [
      'log',
      '--follow',
      '--format=%cI',
      `--since=${since}`,
      '--',
      repoPath
    ]);
    const events = log ? log.split('\n') : [];
    const status = gitOutput(projectRoot, ['status', '--porcelain', '--', repoPath]);
    if (status) {
      events.unshift(now.toISOString());
    }
    return uniqueIsoDates(events);
  } catch {
    return [];
  }
};

export const buildActivity = ({
  events,
  now = new Date(),
  windowDays = ACTIVITY_WINDOW_DAYS,
  level = 0
}) => {
  const updateEvents = uniqueIsoDates(events).filter((value) => {
    const ageInDays = daysBetween(now, new Date(value));
    return ageInDays <= windowDays;
  });
  const score = updateEvents.reduce((total, value) => {
    const ageInDays = daysBetween(now, new Date(value));
    if (ageInDays > windowDays) return total;
    return total + activityWeightForAge(ageInDays);
  }, 0);

  return {
    windowDays,
    recentUpdateCount: updateEvents.length,
    score: Number(score.toFixed(4)),
    level,
    lastActivity: updateEvents[0]?.slice(0, 10) ?? null,
    events: updateEvents.map((value) => value.slice(0, 10))
  };
};

const buildQuestionIndex = (questions) => {
  const index = new Map();
  questions.forEach((question) => {
    index.set(slugifyPath(question.slug), question.slug);
    index.set(slugifyPath(question.title), question.slug);
    index.set(slugifyPath(question.vaultPath.replace(/\.md$/i, '')), question.slug);
    question.aliases.forEach((alias) => {
      index.set(slugifyPath(alias), question.slug);
    });
  });
  return index;
};

export const buildQuestionData = ({
  questionsDir = defaultQuestionsDir,
  projectRoot = repoRoot,
  now = new Date(),
  activityEventsByPath = null
} = {}) => {
  const files = listMarkdownFiles(questionsDir);
  const questions = files.map((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    const filename = path.basename(filePath);
    const slug = parsed.data.slug ? slugifyPath(parsed.data.slug) : slugify(filename);
    const title = parsed.data.title ?? titleFromFilename(filename);
    const content = parsed.content.trim();
    const relativeVaultPath = toUnixPath(path.relative(path.join(projectRoot, 'vault'), filePath));
    const relativeRepoPath = toUnixPath(path.relative(projectRoot, filePath));
    const activityEvents =
      activityEventsByPath?.[relativeRepoPath] ??
      activityEventsByPath?.[relativeVaultPath] ??
      readGitActivityEvents({
        projectRoot,
        repoPath: relativeRepoPath,
        now
      });

    return {
      slug,
      title,
      date: dateToIsoDate(parsed.data.date),
      lastmod: dateToIsoDate(parsed.data.lastmod),
      tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [],
      aliases: Array.isArray(parsed.data.aliases) ? parsed.data.aliases.map(String) : [],
      excerpt: parsed.data.description ?? excerptFromMarkdown(content),
      body: content,
      headings: extractHeadings(content),
      wikilinks: extractWikilinks(content),
      wordCount: wordCount(content),
      vaultPath: relativeVaultPath,
      repoPath: relativeRepoPath,
      obsidianUrl: buildObsidianUrl(filePath),
      sitePath: `/questions/${slug}`,
      activity: buildActivity({ events: activityEvents, now })
    };
  });

  const maxScore = Math.max(...questions.map((question) => question.activity.score), 0);
  questions.forEach((question) => {
    const normalized = maxScore > 0 ? question.activity.score / maxScore : 0;
    question.activity.normalized = Number(normalized.toFixed(4));
    question.activity.level = normalized > 0 ? Math.max(1, Math.ceil(normalized * 5)) : 0;
  });

  const questionIndex = buildQuestionIndex(questions);
  questions.forEach((question) => {
    question.wikilinks = question.wikilinks.map((link) => ({
      ...link,
      resolvedSlug: questionIndex.get(link.normalizedTarget) ?? null
    }));
  });

  return {
    generatedAt: new Date().toISOString(),
    source: toUnixPath(path.relative(projectRoot, questionsDir)),
    count: questions.length,
    questions
  };
};

export const writeQuestionData = ({
  questionsDir = defaultQuestionsDir,
  outputPath = defaultOutputPath,
  projectRoot = repoRoot
} = {}) => {
  const data = buildQuestionData({ questionsDir, projectRoot });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`);
  return data;
};
