import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COMMIT_MARKER = '__WORD_GARDEN_COMMIT__';
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WEEK_COUNT = 53;
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

// These are the current public sources plus every public collection name used
// before the Terrain consolidation. Keeping this as an allowlist prevents
// private vault folders from ever reaching the generated page.
export const PUBLIC_MARKDOWN_PATHS = [
  ':(glob)vault/*.md',
  ':(glob)vault/pages/**/*.md',
  ':(glob)vault/logs/**/*.md',
  ':(glob)vault/shelf/**/*.md',
  ':(glob)vault/probes/**/*.md',
  ':(glob)vault/questions/**/*.md',
  ':(glob)vault/attractors/**/*.md',
  ':(glob)vault/projects/**/*.md',
  ':(glob)vault/traces/**/*.md',
  ':(glob)vault/notes/**/*.md',
  ':(glob)vault/hunches/**/*.md'
];

const NON_PROSE_TOKENS = new Set([
  'aliases',
  'assetdir',
  'coverimage',
  'lastmod',
  'pagecount',
  'slug'
]);

const defaultRunGit = (args) =>
  execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });

const dateFromUtc = (date) => date.toISOString().slice(0, 10);

const parseUtcDate = (date) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const addDays = (date, amount) =>
  new Date(parseUtcDate(date).getTime() + amount * DAY_IN_MS);

const localDateInLosAngeles = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type)?.value;

  return `${get('year')}-${get('month')}-${get('day')}`;
};

const countWords = (text) => {
  const withoutUrls = text.replace(/(?:https?|mailto):\S+/giu, ' ');
  const words =
    withoutUrls.match(
      /\p{L}[\p{L}\p{M}\p{N}]*(?:[’'ʼ-][\p{L}\p{M}\p{N}]+)*/gu
    ) ?? [];

  return words.filter((word) => !NON_PROSE_TOKENS.has(word.toLowerCase())).length;
};

export const getActivityLevel = (touched) => {
  if (touched <= 0) return 0;
  if (touched < 50) return 1;
  if (touched < 250) return 2;
  if (touched < 1000) return 3;
  return 4;
};

/**
 * Parse one `git log -p --word-diff=porcelain` stream into daily activity.
 * Pairing additions and removals per file/commit makes replacements count once
 * as edits instead of once as an addition and again as a removal.
 */
export const parseWordDiffLog = (output) => {
  const activity = new Map();
  let currentDate = null;
  let fileStarted = false;
  let rawAdded = 0;
  let rawRemoved = 0;

  const finishFile = () => {
    if (!currentDate || !fileStarted) return;

    const edited = Math.min(rawAdded, rawRemoved);
    const day = activity.get(currentDate) ?? {
      date: currentDate,
      added: 0,
      edited: 0,
      removed: 0
    };
    day.added += rawAdded - edited;
    day.edited += edited;
    day.removed += rawRemoved - edited;
    activity.set(currentDate, day);

    fileStarted = false;
    rawAdded = 0;
    rawRemoved = 0;
  };

  for (const line of output.split('\n')) {
    if (line.startsWith(COMMIT_MARKER)) {
      finishFile();
      currentDate = line.slice(COMMIT_MARKER.length, COMMIT_MARKER.length + 10);
      continue;
    }

    if (line.startsWith('diff --git ')) {
      finishFile();
      fileStarted = true;
      continue;
    }

    if (!fileStarted) continue;

    if (line.startsWith('+') && !line.startsWith('+++')) {
      rawAdded += countWords(line.slice(1));
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      rawRemoved += countWords(line.slice(1));
    }
  }

  finishFile();
  return activity;
};

export const assertCompleteGitHistory = (runGit = defaultRunGit) => {
  const isShallow = runGit(['rev-parse', '--is-shallow-repository']).trim();
  if (isShallow === 'true') {
    throw new Error(
      'The Word Garden requires complete Git history. Checkout with fetch-depth: 0 before building.'
    );
  }
};

const formatDayLabel = (date) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(parseUtcDate(date));

export const buildCalendar = (
  activity,
  { today = localDateInLosAngeles(), weekCount = DEFAULT_WEEK_COUNT } = {}
) => {
  const todayDate = parseUtcDate(today);
  const currentWeekStart = new Date(
    todayDate.getTime() - todayDate.getUTCDay() * DAY_IN_MS
  );
  const startDate = dateFromUtc(
    new Date(currentWeekStart.getTime() - (weekCount - 1) * 7 * DAY_IN_MS)
  );
  const weeks = [];
  const totals = { added: 0, edited: 0, removed: 0, touched: 0 };
  let activeDays = 0;

  for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
    const days = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = dateFromUtc(addDays(startDate, weekIndex * 7 + dayIndex));
      const future = date > today;
      const counts = !future
        ? activity.get(date) ?? { added: 0, edited: 0, removed: 0 }
        : { added: 0, edited: 0, removed: 0 };
      const touched = counts.added + counts.edited + counts.removed;
      const removalHeavy = touched > 0 && counts.removed / touched >= 0.25;

      if (!future) {
        totals.added += counts.added;
        totals.edited += counts.edited;
        totals.removed += counts.removed;
        totals.touched += touched;
        if (touched > 0) activeDays += 1;
      }

      days.push({
        date,
        label: formatDayLabel(date),
        added: counts.added,
        edited: counts.edited,
        removed: counts.removed,
        touched,
        level: getActivityLevel(touched),
        removalHeavy,
        future,
        shape: (weekIndex * 7 + dayIndex) % 5
      });
    }

    const firstOfMonth = days.find(
      (day) => !day.future && parseUtcDate(day.date).getUTCDate() === 1
    );
    weeks.push({
      days,
      monthLabel: firstOfMonth
        ? new Intl.DateTimeFormat('en-US', {
            month: 'short',
            timeZone: 'UTC'
          }).format(parseUtcDate(firstOfMonth.date))
        : ''
    });
  }

  return {
    weeks,
    totals,
    activeDays,
    startDate,
    endDate: today
  };
};

export const getWordActivity = ({
  today = localDateInLosAngeles(),
  runGit = defaultRunGit
} = {}) => {
  assertCompleteGitHistory(runGit);

  const emptyCalendar = buildCalendar(new Map(), { today });
  const historyStart = dateFromUtc(addDays(emptyCalendar.startDate, -1));
  const output = runGit([
    'log',
    `--since=${historyStart}T00:00:00`,
    '--no-merges',
    '--root',
    '--format=' + COMMIT_MARKER + '%aI',
    '-p',
    '--find-renames=90%',
    '--word-diff=porcelain',
    '--no-ext-diff',
    '--no-color',
    '--',
    ...PUBLIC_MARKDOWN_PATHS
  ]);

  return buildCalendar(parseWordDiffLog(output), { today });
};
