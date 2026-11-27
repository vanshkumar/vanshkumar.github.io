const COMMIT_MARKER = '__WORD_GARDEN_COMMIT__';
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WEEK_COUNT = 53;
// These are the current public sources plus every public collection name used
// before the Terrain consolidation. Keeping this as an allowlist prevents
// private vault folders from ever reaching the generated page.
export const PUBLIC_MARKDOWN_PATHS = [
  ':(glob)vault/*.md',
  ':(glob)vault/pages/**/*.md',
  ':(glob)vault/logs/**/*.md',
  ':(glob)vault/shelf/**/*.md',
  ':(glob)vault/poems/**/*.md',
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

export const countWords = (text) => {
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

// Full-file context lets the parser recognize the entire frontmatter block,
// even when an edit is deep inside a long YAML value or far into the body.
export const WORD_DIFF_ARGS = [
  '--find-renames=90%', '--full-index', '--word-diff=porcelain', '--unified=2147483647',
  '--no-ext-diff', '--no-textconv', '--no-color'
];

const createBodyCounter = () => {
  let section = 'start';
  let parts = [];
  let total = 0;
  const finishLine = () => {
    if (!parts.length) return;
    const line = parts.map(part => part.text).join('').replace(/^\uFEFF/, '').trimEnd();
    if (section === 'start') {
      section = line === '---' ? 'frontmatter' : 'body';
    } else if (section === 'frontmatter' && /^(---|\.\.\.)$/.test(line)) {
      section = 'body';
      parts = [];
      return;
    }
    if (section === 'body') {
      total += parts.reduce((sum, part) => sum + (part.changed ? countWords(part.text) : 0), 0);
    }
    parts = [];
  };
  return {
    append(text, changed) { parts.push({ text, changed }); },
    finishLine,
    count() { finishLine(); return total; }
  };
};

export const countMarkdownWords = (text) => {
  const counter = createBodyCounter();
  for (const line of text.split('\n')) {
    counter.append(line, true);
    counter.finishLine();
  }
  return counter.count();
};

/**
 * Parse newest-first, full-context `git log -p --word-diff=porcelain` output. Only changed
 * body text inside hunks counts; Git headers and YAML frontmatter do not.
 * Pair replacements per file/commit so an edit counts once.
 */
export const parseWordDiffChanges = (output) => {
  const changes = [];
  let currentDate = null;
  let fileStarted = false;
  let inHunk = false;
  let before = createBodyCounter();
  let after = createBodyCounter();
  let identity = {};

  // Keep Git's escaped path representation intact; strip only the a/b prefix
  // and optional timestamp separator. This also handles spaces and Unicode.
  const readPath = (line) => {
    const value = line.slice(4).split('\t')[0];
    if (value === '/dev/null') return null;
    return value.startsWith('"') ? `"${value.slice(3)}` : value.slice(2);
  };

  const finishFile = () => {
    if (!currentDate || !fileStarted) return;
    const rawAdded = after.count();
    const rawRemoved = before.count();
    const edited = Math.min(rawAdded, rawRemoved);
    changes.push({
      ...identity, date: currentDate,
      added: rawAdded - edited, edited, removed: rawRemoved - edited
    });
    fileStarted = false;
    inHunk = false;
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
      before = createBodyCounter();
      after = createBodyCounter();
      identity = {};
      continue;
    }
    if (!fileStarted) continue;
    if (line.startsWith('@@ ')) {
      inHunk = true;
      continue;
    }
    if (!inHunk) {
      const blobs = /^index ([0-9a-f]+)\.\.([0-9a-f]+)/.exec(line);
      if (blobs) {
        identity.beforeBlob = blobs[1];
        identity.afterBlob = blobs[2];
      } else if (line.startsWith('--- ')) {
        identity.beforePath = readPath(line);
      } else if (line.startsWith('+++ ')) {
        identity.afterPath = readPath(line);
      } else if (line.startsWith('rename from ')) {
        identity.beforePath = line.slice('rename from '.length);
      } else if (line.startsWith('rename to ')) {
        identity.afterPath = line.slice('rename to '.length);
      }
      continue;
    }
    if (line === '~') {
      before.finishLine();
      after.finishLine();
    } else if (line.startsWith('+')) {
      after.append(line.slice(1), true);
    } else if (line.startsWith('-')) {
      before.append(line.slice(1), true);
    } else if (line.startsWith(' ')) {
      before.append(line.slice(1), false);
      after.append(line.slice(1), false);
    }
  }
  finishFile();
  return changes;
};

/** Ignore exact same-path deletion/restoration pairs, without mutating cached changes. */
export const aggregateWordActivity = (changes) => {
  const pendingDeletions = new Map();
  const ignored = new Set();
  // Process oldest first, so only a subsequent recreation can undo a deletion.
  for (const change of [...changes].reverse()) {
    if (change.afterPath === null && change.beforePath && change.beforeBlob) {
      pendingDeletions.set(change.beforePath, change);
    } else if (change.beforePath === null && change.afterPath) {
      const deletion = pendingDeletions.get(change.afterPath);
      if (deletion && deletion.beforeBlob === change.afterBlob) {
        ignored.add(deletion);
        ignored.add(change);
      }
      // A different recreation ends the previous file's lifetime too.
      pendingDeletions.delete(change.afterPath);
    } else {
      pendingDeletions.delete(change.beforePath);
      pendingDeletions.delete(change.afterPath);
    }
  }

  const activity = new Map();
  for (const change of changes) {
    const day = activity.get(change.date) ?? {
      date: change.date, added: 0, edited: 0, removed: 0
    };
    if (!ignored.has(change)) {
      day.added += change.added;
      day.edited += change.edited;
      day.removed += change.removed;
    }
    activity.set(change.date, day);
  }
  return activity;
};

export const parseWordDiffLog = (output) => aggregateWordActivity(parseWordDiffChanges(output));

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
        future
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

