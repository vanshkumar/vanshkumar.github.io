import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCalendar, parseWordDiffLog, PUBLIC_MARKDOWN_PATHS, WORD_DIFF_ARGS } from './word-activity-core.mjs';
export { buildCalendar, parseWordDiffLog, getActivityLevel, PUBLIC_MARKDOWN_PATHS } from './word-activity-core.mjs';
const COMMIT_MARKER = '__WORD_GARDEN_COMMIT__';
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

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

const defaultRunGit = (args) =>
  execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });

export const assertCompleteGitHistory = (runGit = defaultRunGit) => {
  const isShallow = runGit(['rev-parse', '--is-shallow-repository']).trim();
  if (isShallow === 'true') {
    throw new Error(
      'The Word Garden requires complete Git history. Checkout with fetch-depth: 0 before building.'
    );
  }
};

export const getWordActivity = ({
  today = localDateInLosAngeles(),
  runGit = defaultRunGit
} = {}) => {
  assertCompleteGitHistory(runGit);

  // A restoration in the visible year may undo a deletion before that year.
  // Match lifetimes against all public history, then trim with buildCalendar.
  const output = runGit([
    'log',
    '--topo-order',
    '--no-merges',
    '--root',
    '--format=' + COMMIT_MARKER + '%aI',
    '-p',
    ...WORD_DIFF_ARGS,
    '--',
    ...PUBLIC_MARKDOWN_PATHS
  ]);

  return buildCalendar(parseWordDiffLog(output), { today });
};
