import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { aggregateWordActivity, buildCalendar, WORD_DIFF_ARGS, parseWordDiffChanges, PUBLIC_MARKDOWN_PATHS, type WordChange } from '../../../src/lib/word-activity-core.mjs';

const exec = promisify(execFile);
const marker = '__WORD_GARDEN_COMMIT__';
export const localDay = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

export function combineActivity(history: WordChange[], diff: string, today: string) {
  const saved = parseWordDiffChanges(`${marker}${today}\n${diff}`);
  const activity = aggregateWordActivity([...saved, ...history]);
  return buildCalendar(activity, { today });
}

export class WordActivityService {
  private cache: { key: string; history: WordChange[] } | null = null;
  constructor(private readonly vaultPath: string) {}

  private async git(args: string[], cwd = this.vaultPath, env = process.env): Promise<string> {
    const { stdout } = await exec('git', args, { cwd, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30000 });
    return stdout;
  }

  private async savedDiff(root: string, head: string): Promise<string> {
    // Git cannot detect an unstaged rename when its destination is untracked.
    // Snapshot all saved public files together in an isolated index/object store
    // so rename detection sees both sides without staging the user's changes.
    const objects = (await this.git(['rev-parse', '--path-format=absolute', '--git-path', 'objects'], root)).trim();
    const temporary = await mkdtemp(path.join(tmpdir(), 'vault-weather-words-'));
    const env = {
      ...process.env,
      GIT_INDEX_FILE: path.join(temporary, 'index'),
      GIT_OBJECT_DIRECTORY: path.join(temporary, 'objects'),
      GIT_ALTERNATE_OBJECT_DIRECTORIES: JSON.stringify(objects)
    };
    try {
      await mkdir(env.GIT_OBJECT_DIRECTORY);
      await this.git(['read-tree', head], root, env);
      const files = (await this.git(['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', ...PUBLIC_MARKDOWN_PATHS], root, env)).split('\0').filter(Boolean);
      if (files.length) await this.git(['--literal-pathspecs', 'add', '-A', '--', ...files], root, env);
      return await this.git(['diff', '--cached', head, ...WORD_DIFF_ARGS, '--', ...PUBLIC_MARKDOWN_PATHS], root, env);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }

  async load(now = new Date()) {
    const today = localDay(now);
    const root = (await this.git(['rev-parse', '--show-toplevel'])).trim();
    const head = (await this.git(['rev-parse', 'HEAD'], root)).trim();
    const key = `${head}:${today}`;
    if (this.cache?.key !== key) {
      const log = await this.git(['log', head, '--topo-order', '--no-merges', '--root', `--format=${marker}%aI`, '-p', ...WORD_DIFF_ARGS, '--', ...PUBLIC_MARKDOWN_PATHS], root);
      this.cache = { key, history: parseWordDiffChanges(log) };
    }
    const history = this.cache.history;
    const diff = await this.savedDiff(root, head);
    return combineActivity(history, diff, today);
  }
}
