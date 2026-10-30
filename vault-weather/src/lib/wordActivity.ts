import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { buildCalendar, countWords, parseWordDiffLog, PUBLIC_MARKDOWN_PATHS, type WordCounts } from '../../../src/lib/word-activity-core.mjs';

const exec = promisify(execFile);
const marker = '__WORD_GARDEN_COMMIT__';
export const localDay = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

export function combineActivity(history: Map<string, WordCounts>, diff: string, newFiles: string[], today: string) {
  const activity = new Map(history);
  const saved = parseWordDiffLog(`${marker}${today}\n${diff}`).get(today) ?? { added: 0, edited: 0, removed: 0 };
  const committed = activity.get(today) ?? { added: 0, edited: 0, removed: 0 };
  activity.set(today, {
    added: committed.added + saved.added + newFiles.reduce((total, text) => total + countWords(text), 0),
    edited: committed.edited + saved.edited,
    removed: committed.removed + saved.removed
  });
  return buildCalendar(activity, { today });
}

export class WordActivityService {
  private cache: { key: string; history: Map<string, WordCounts> } | null = null;
  constructor(private readonly vaultPath: string) {}

  private async git(args: string[], cwd = this.vaultPath): Promise<string> {
    const { stdout } = await exec('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30000 });
    return stdout;
  }

  async load(now = new Date()) {
    const today = localDay(now);
    const root = (await this.git(['rev-parse', '--show-toplevel'])).trim();
    const head = (await this.git(['rev-parse', 'HEAD'], root)).trim();
    const key = `${head}:${today}`;
    if (this.cache?.key !== key) {
      const calendarStart = buildCalendar(new Map(), { today }).startDate;
      const start = new Date(Date.parse(`${calendarStart}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
      const log = await this.git(['log', head, `--since=${start}T00:00:00`, '--no-merges', '--root', `--format=${marker}%aI`, '-p', '--find-renames=90%', '--word-diff=porcelain', '--no-ext-diff', '--no-color', '--', ...PUBLIC_MARKDOWN_PATHS], root);
      this.cache = { key, history: parseWordDiffLog(log) };
    }
    const history = this.cache.history;
    const diff = await this.git(['diff', head, '--find-renames=90%', '--word-diff=porcelain', '--no-ext-diff', '--no-color', '--', ...PUBLIC_MARKDOWN_PATHS], root);
    const untracked = await this.git(['ls-files', '--others', '--exclude-standard', '-z', '--', ...PUBLIC_MARKDOWN_PATHS], root);
    const newFiles = await Promise.all(untracked.split('\0').filter(Boolean).map(file => readFile(path.join(root, file), 'utf8')));
    return combineActivity(history, diff, newFiles, today);
  }
}
