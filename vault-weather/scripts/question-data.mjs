import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

export const appRoot = path.resolve(scriptDir, '..');
export const repoRoot = path.resolve(appRoot, '..');
export const defaultVaultDir = path.join(repoRoot, 'vault');
export const defaultQuestionsDir = path.join(defaultVaultDir, 'questions');
export const defaultHunchesDir = path.join(defaultVaultDir, 'hunches');
export const defaultShelfDir = path.join(defaultVaultDir, 'shelf');
export const defaultOutputPath = path.join(
  appRoot,
  'src',
  'data',
  'questions.generated.json'
);
export const defaultHunchesOutputPath = path.join(
  appRoot,
  'src',
  'data',
  'hunches.generated.json'
);
export const defaultShelfOutputPath = path.join(
  appRoot,
  'src',
  'data',
  'shelf.generated.json'
);
export const ACTIVITY_WINDOW_DAYS = 30;
export const vaultAssetUrlPrefix = '/__vault-weather-asset/';

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

const daysBetweenIsoDates = (laterDate, earlierDate) =>
  Math.max(
    0,
    (new Date(`${laterDate}T00:00:00.000Z`).getTime() -
      new Date(`${earlierDate}T00:00:00.000Z`).getTime()) /
      86_400_000
  );

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

export const buildObsidianUrl = (absolutePath) =>
  `obsidian://open?path=${encodeURIComponent(absolutePath)}`;

export class QuestionCreateError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'QuestionCreateError';
    this.statusCode = statusCode;
  }
}

export class HunchCreateError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'HunchCreateError';
    this.statusCode = statusCode;
  }
}

export class ShelfCreateError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ShelfCreateError';
    this.statusCode = statusCode;
  }
}

export const normalizeNoteTitle = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.md$/i, '')
    .trim();

export const normalizeQuestionTitle = normalizeNoteTitle;

const withoutControlCharacters = (value) =>
  Array.from(value)
    .filter((character) => character.charCodeAt(0) >= 32)
    .join('');

export const noteFilenameFromTitle = (value) => {
  const title = normalizeNoteTitle(value);
  const filenameBase = withoutControlCharacters(title)
    .replace(/[\\/]/g, '-')
    .replace(/:/g, ' -')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .trim();

  return filenameBase ? `${filenameBase}.md` : null;
};

export const questionFilenameFromTitle = noteFilenameFromTitle;

const defaultFrontmatterFields = ({ date }) => [
  ['date', date],
  ['lastmod', date]
];

const normalizeRating = (value, ErrorClass) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    throw new ErrorClass('Shelf rating is required');
  }

  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
    throw new ErrorClass('Shelf rating must be an integer from 0 to 5');
  }

  return rating;
};

const existingNoteSlugs = (notesDir) =>
  new Set(
    listMarkdownFiles(notesDir).map((filePath) => {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = matter(raw);
      const filename = path.basename(filePath);
      return parsed.data.slug ? slugifyPath(parsed.data.slug) : slugify(filename);
    })
  );

const createMarkdownNote = ({
  title,
  notesDir,
  projectRoot,
  now,
  ErrorClass,
  titleLabel,
  itemLabel,
  frontmatterFields = defaultFrontmatterFields
}) => {
  const cleanTitle = normalizeNoteTitle(title);
  if (!cleanTitle) {
    throw new ErrorClass(`${titleLabel} is required`);
  }

  const filename = noteFilenameFromTitle(cleanTitle);
  if (!filename) {
    throw new ErrorClass(`${titleLabel} must include letters or numbers`);
  }

  const slug = slugify(filename);
  if (!slug) {
    throw new ErrorClass(`${titleLabel} must include letters or numbers`);
  }

  const filePath = path.join(notesDir, filename);
  const relativeToNotes = path.relative(notesDir, filePath);
  if (relativeToNotes.startsWith('..') || path.isAbsolute(relativeToNotes)) {
    throw new ErrorClass(`${titleLabel} cannot create paths`);
  }

  if (fs.existsSync(filePath)) {
    throw new ErrorClass(`A ${itemLabel} with that title already exists`, 409);
  }

  if (existingNoteSlugs(notesDir).has(slug)) {
    throw new ErrorClass(`A ${itemLabel} with that slug already exists`, 409);
  }

  const date = dateToIsoDate(now) ?? dateToIsoDate(new Date());
  const fields = frontmatterFields({ cleanTitle, slug, date });
  const markdown = [
    '---',
    ...fields.map(([key, value]) => `${key}: ${value}`),
    '---',
    '',
    ''
  ].join('\n');

  fs.mkdirSync(notesDir, { recursive: true });
  fs.writeFileSync(filePath, markdown, 'utf8');

  return {
    title: cleanTitle,
    slug,
    filename,
    vaultPath: toUnixPath(path.relative(path.join(projectRoot, 'vault'), filePath)),
    repoPath: toUnixPath(path.relative(projectRoot, filePath)),
    absolutePath: filePath,
    obsidianUrl: buildObsidianUrl(filePath)
  };
};

export const createQuestionNote = ({
  title,
  questionsDir = defaultQuestionsDir,
  projectRoot = repoRoot,
  now = new Date()
} = {}) => {
  return createMarkdownNote({
    title,
    notesDir: questionsDir,
    projectRoot,
    now,
    ErrorClass: QuestionCreateError,
    titleLabel: 'Question title',
    itemLabel: 'question'
  });
};

export const createHunchNote = ({
  title,
  hunchesDir = defaultHunchesDir,
  projectRoot = repoRoot,
  now = new Date()
} = {}) => {
  return createMarkdownNote({
    title,
    notesDir: hunchesDir,
    projectRoot,
    now,
    ErrorClass: HunchCreateError,
    titleLabel: 'Hunch title',
    itemLabel: 'hunch'
  });
};

export const createShelfNote = ({
  title,
  rating,
  shelfDir = defaultShelfDir,
  projectRoot = repoRoot,
  now = new Date()
} = {}) => {
  return createMarkdownNote({
    title,
    notesDir: shelfDir,
    projectRoot,
    now,
    ErrorClass: ShelfCreateError,
    titleLabel: 'Shelf title',
    itemLabel: 'shelf item',
    frontmatterFields: ({ date }) => [
      ['date', date],
      ['lastmod', date],
      ['rating', normalizeRating(rating, ShelfCreateError)]
    ]
  });
};

const frontmatterLastmod = (data) => dateToIsoDate(data.lastmod ?? data.lastMod);

const uniqueIsoDates = (dates) =>
  Array.from(
    new Set(
      dates
        .map(dateToIsoDate)
        .filter(Boolean)
    )
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

export const buildActivity = ({
  events = [],
  now = new Date(),
  windowDays = ACTIVITY_WINDOW_DAYS,
  level = 0
}) => {
  const today = dateToIsoDate(now);
  const updateEvents = uniqueIsoDates(events).filter((value) => {
    const ageInDays = daysBetweenIsoDates(today, value);
    return ageInDays <= windowDays;
  });
  const score = updateEvents.reduce((total, value) => {
    const ageInDays = daysBetweenIsoDates(today, value);
    if (ageInDays > windowDays) return total;
    return total + activityWeightForAge(ageInDays);
  }, 0);

  return {
    windowDays,
    recentUpdateCount: updateEvents.length,
    score: Number(score.toFixed(4)),
    level,
    lastActivity: updateEvents[0] ?? null,
    events: updateEvents
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

const assignActivityLevels = (items) => {
  const maxScore = Math.max(...items.map((item) => item.activity.score), 0);
  items.forEach((item) => {
    const normalized = maxScore > 0 ? item.activity.score / maxScore : 0;
    item.activity.normalized = Number(normalized.toFixed(4));
    item.activity.level = normalized > 0 ? Math.max(1, Math.ceil(normalized * 5)) : 0;
  });
};

export const normalizeVaultAssetPath = (value) => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;

  const withoutLeadingSlash = trimmed.replace(/^\/+/, '');
  const normalized = path.posix.normalize(withoutLeadingSlash);
  if (
    !normalized ||
    normalized === '.' ||
    normalized.startsWith('../') ||
    normalized.includes('/../')
  ) {
    return null;
  }

  return normalized;
};

export const resolveVaultAsset = ({
  assetPath,
  vaultDir = defaultVaultDir
} = {}) => {
  const normalizedPath = normalizeVaultAssetPath(assetPath);
  if (!normalizedPath) return null;

  const absolutePath = path.resolve(vaultDir, normalizedPath);
  const relativeToVault = path.relative(vaultDir, absolutePath);
  if (relativeToVault.startsWith('..') || path.isAbsolute(relativeToVault)) {
    return null;
  }

  try {
    const vaultRealPath = fs.realpathSync(vaultDir);
    const assetRealPath = fs.realpathSync(absolutePath);
    const realRelativeToVault = path.relative(vaultRealPath, assetRealPath);
    const stats = fs.statSync(assetRealPath);
    if (
      realRelativeToVault.startsWith('..') ||
      path.isAbsolute(realRelativeToVault) ||
      !stats.isFile()
    ) {
      return null;
    }

    return {
      original: assetPath,
      vaultPath: toUnixPath(normalizedPath),
      absolutePath: assetRealPath,
      url: `${vaultAssetUrlPrefix}${encodeURIComponent(toUnixPath(normalizedPath))}`
    };
  } catch {
    return null;
  }
};

export const buildQuestionData = ({
  questionsDir = defaultQuestionsDir,
  projectRoot = repoRoot,
  now = new Date()
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
    const lastmod = frontmatterLastmod(parsed.data);

    return {
      slug,
      title,
      date: dateToIsoDate(parsed.data.date),
      lastmod,
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
      activity: buildActivity({ events: [lastmod], now })
    };
  });

  assignActivityLevels(questions);

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

export const buildHunchData = ({
  hunchesDir = defaultHunchesDir,
  projectRoot = repoRoot,
  now = new Date()
} = {}) => {
  const files = listMarkdownFiles(hunchesDir);
  const hunches = files.map((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    const filename = path.basename(filePath);
    const slug = parsed.data.slug ? slugifyPath(parsed.data.slug) : slugify(filename);
    const title = parsed.data.title ?? titleFromFilename(filename);
    const content = parsed.content.trim();
    const relativeVaultPath = toUnixPath(path.relative(path.join(projectRoot, 'vault'), filePath));
    const relativeRepoPath = toUnixPath(path.relative(projectRoot, filePath));
    const lastmod = frontmatterLastmod(parsed.data);

    return {
      slug,
      title,
      date: dateToIsoDate(parsed.data.date),
      lastmod,
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
      sitePath: `/hunches/${slug}`,
      activity: buildActivity({ events: [lastmod], now })
    };
  });

  assignActivityLevels(hunches);

  return {
    generatedAt: new Date().toISOString(),
    source: toUnixPath(path.relative(projectRoot, hunchesDir)),
    count: hunches.length,
    hunches
  };
};

export const buildShelfData = ({
  shelfDir = defaultShelfDir,
  projectRoot = repoRoot,
  now = new Date()
} = {}) => {
  const vaultDir = path.join(projectRoot, 'vault');
  const files = listMarkdownFiles(shelfDir);
  const items = files.map((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    const filename = path.basename(filePath);
    const slug = parsed.data.slug ? slugifyPath(parsed.data.slug) : slugify(filename);
    const title = parsed.data.title ?? titleFromFilename(filename);
    const content = parsed.content.trim();
    const relativeVaultPath = toUnixPath(path.relative(vaultDir, filePath));
    const relativeRepoPath = toUnixPath(path.relative(projectRoot, filePath));
    const lastmod = frontmatterLastmod(parsed.data);
    const cover = resolveVaultAsset({
      assetPath: parsed.data.coverImage,
      vaultDir
    });

    return {
      slug,
      title,
      coverImage:
        typeof parsed.data.coverImage === 'string' && parsed.data.coverImage.trim()
          ? parsed.data.coverImage.trim()
          : null,
      coverUrl: cover?.url ?? null,
      date: dateToIsoDate(parsed.data.date),
      lastmod,
      tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [],
      rating: parsed.data.rating ?? null,
      excerpt: parsed.data.description ?? excerptFromMarkdown(content),
      body: content,
      headings: extractHeadings(content),
      wikilinks: extractWikilinks(content),
      wordCount: wordCount(content),
      vaultPath: relativeVaultPath,
      repoPath: relativeRepoPath,
      obsidianUrl: buildObsidianUrl(filePath),
      sitePath: `/shelf/${slug}`,
      activity: buildActivity({ events: [lastmod], now })
    };
  });

  assignActivityLevels(items);

  return {
    generatedAt: new Date().toISOString(),
    source: toUnixPath(path.relative(projectRoot, shelfDir)),
    count: items.length,
    items
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

export const writeShelfData = ({
  shelfDir = defaultShelfDir,
  outputPath = defaultShelfOutputPath,
  projectRoot = repoRoot
} = {}) => {
  const data = buildShelfData({ shelfDir, projectRoot });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`);
  return data;
};

export const writeHunchData = ({
  hunchesDir = defaultHunchesDir,
  outputPath = defaultHunchesOutputPath,
  projectRoot = repoRoot
} = {}) => {
  const data = buildHunchData({ hunchesDir, projectRoot });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`);
  return data;
};

export const writeVaultWeatherData = ({
  questionsDir = defaultQuestionsDir,
  hunchesDir = defaultHunchesDir,
  shelfDir = defaultShelfDir,
  questionOutputPath = defaultOutputPath,
  hunchOutputPath = defaultHunchesOutputPath,
  shelfOutputPath = defaultShelfOutputPath,
  projectRoot = repoRoot
} = {}) => ({
  questions: writeQuestionData({
    questionsDir,
    outputPath: questionOutputPath,
    projectRoot
  }),
  hunches: writeHunchData({
    hunchesDir,
    outputPath: hunchOutputPath,
    projectRoot
  }),
  shelf: writeShelfData({
    shelfDir,
    outputPath: shelfOutputPath,
    projectRoot
  })
});
