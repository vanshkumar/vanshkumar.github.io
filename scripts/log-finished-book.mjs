import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { z } from 'astro/zod';
import matter from 'gray-matter';
import { exactReadingDateSchema, readingDateSchema, readingRecordSchema, serializeReadingRecord } from '../src/lib/reading-record.mjs';
import { todayInNewYork } from '../src/lib/reading-stats.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const safeTarget = z.string().regex(/^[a-z0-9][a-z0-9_-]*(?:\/[a-z0-9][a-z0-9_-]*)*\.md$/);
export const finishedBookInputSchema = z.object({
  record: readingRecordSchema.strict().extend({
    finished: exactReadingDateSchema,
    status: z.literal('read').default('read'),
    metadataSources: readingRecordSchema.shape.metadataSources.unwrap().min(1)
  }),
  provenance: z.string().trim().min(1),
  target: safeTarget.optional(),
  expectedSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  // Supply the old date (or null), only after the reader confirms replacement.
  replaceFinished: readingDateSchema.nullable().optional()
}).strict();

export const sha256 = text => createHash('sha256').update(text).digest('hex');
const normalized = value => value.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/\s+/g, ' ');
const sameAuthors = (a, b) => JSON.stringify(a.map(normalized).sort()) === JSON.stringify(b.map(normalized).sort());
const sameTitle = (a, b) => normalized(a) === normalized(b);
const slugify = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isbn13 = value => {
  const isbn = value?.replace(/[\s-]/g, '').toUpperCase();
  if (!isbn || isbn.length !== 10) return isbn;
  const prefix = `978${isbn.slice(0, 9)}`;
  if (!/^\d{12}$/.test(prefix)) return isbn;
  const sum = [...prefix].reduce((total, digit, i) => total + Number(digit) * (i % 2 ? 3 : 1), 0);
  return `${prefix}${(10 - sum % 10) % 10}`;
};
const sameIdentifier = (a, b) => Boolean(
  (a.isbn && b.isbn && isbn13(a.isbn) === isbn13(b.isbn)) ||
  (a.amazonAsin && b.amazonAsin && a.amazonAsin === b.amazonAsin)
);

function logDirectory(root) {
  const realRoot = fs.realpathSync(root);
  const directory = path.join(realRoot, 'vault', 'reading-log');
  for (const name of [path.join(realRoot, 'vault'), directory]) {
    if (fs.lstatSync(name).isSymbolicLink() || !fs.statSync(name).isDirectory()) {
      throw new Error('The vault and reading-log must be real directories, not symbolic links.');
    }
  }
  return directory;
}

export function inspectReadingLog(root = repoRoot) {
  const directory = logDirectory(root);
  const records = [];
  const walk = folder => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      if (entry.isSymbolicLink()) throw new Error(`Refusing symbolic link in reading-log: ${entry.name}`);
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        const raw = fs.readFileSync(file, 'utf8');
        const parsed = matter(raw);
        records.push({
          target: path.relative(directory, file).split(path.sep).join('/'),
          sha256: sha256(raw), record: readingRecordSchema.parse(parsed.data),
          // Keep original data and body when updating; inspection itself never rewrites.
          data: parsed.data, body: parsed.content
        });
      }
    }
  };
  walk(directory);
  return records.sort((a, b) => a.target.localeCompare(b.target));
}

function planRecord(input, records, today) {
  const incoming = input.record;
  if (incoming.finished > today) throw new Error('A finished date cannot be in the future (America/New_York).');
  const matches = records.filter(({ record }) =>
    (sameTitle(record.title, incoming.title) && sameAuthors(record.authors, incoming.authors)) ||
    sameIdentifier(record, incoming));
  let existing = input.target ? records.find(entry => entry.target === input.target) : undefined;
  const clarify = (reason, candidates = matches) => ({
    status: 'needs-clarification', reason,
    candidates: candidates.map(({ target, sha256, record }) => ({ target, sha256, record }))
  });
  if (input.target && !existing) throw new Error('target must name an existing reading-log record; omit it for a new book.');
  if (existing && !(sameAuthors(existing.record.authors, incoming.authors) &&
    (sameTitle(existing.record.title, incoming.title) || sameIdentifier(existing.record, incoming)))) {
    return clarify('The selected target has a different work identity. Resolve that mismatch before logging a completion.', [existing]);
  }
  if (existing && matches.some(entry => entry.target !== existing.target)) {
    return clarify('Another record also matches this work; resolve the duplicate before writing.');
  }
  if (!existing && matches.length > 1) return clarify('More than one record matches this work.');
  if (!existing && matches.length === 1) {
    const candidate = matches[0];
    if (!sameTitle(candidate.record.title, incoming.title) || !sameAuthors(candidate.record.authors, incoming.authors)) {
      return clarify('An identifier matches different title/author metadata. Verify the work before selecting a target.');
    }
    existing = candidate;
  }
  if (existing) {
    if (input.expectedSha256 && input.expectedSha256 !== existing.sha256) {
      throw new Error('Stale record: inspect the current file and re-evaluate the change.');
    }
    if (existing.record.finished === incoming.finished) {
      return { status: 'already-logged', target: existing.target, finished: incoming.finished };
    }
    if (existing.record.finished !== undefined && input.replaceFinished !== existing.record.finished) {
      return clarify('This book already has a completion. Ask which date to keep before replacing it.', [existing]);
    }
  } else if (input.expectedSha256 || input.replaceFinished !== undefined) {
    throw new Error('Replacement controls cannot be used for a new book.');
  }

  const record = { ...(existing?.data ?? {}), ...incoming };
  // Do not carry a length from the old reference edition onto a different ISBN.
  if (existing?.record.isbn && incoming.isbn && isbn13(existing.record.isbn) !== isbn13(incoming.isbn) && incoming.pageCount === undefined) {
    delete record.pageCount;
  }
  if (!existing && !record.dateAdded) record.dateAdded = today;
  const sources = [...(existing?.record.metadataSources ?? []), ...incoming.metadataSources];
  record.metadataSources = [...new Map(sources.map(source => [JSON.stringify(source), source])).values()];
  readingRecordSchema.strict().parse(record);
  const body = [existing?.body.trim(), input.provenance].filter(Boolean).join('\n\n') + '\n';
  const markdown = serializeReadingRecord(body, record);
  let target = existing?.target;
  if (!target) {
    const stem = slugify(record.title) || `book-${sha256(record.title).slice(0, 12)}`;
    target = `${stem}.md`;
    if (records.some(entry => entry.target === target)) {
      target = `${stem}-${slugify(record.authors[0]) || sha256(record.authors[0]).slice(0, 12)}.md`;
    }
    if (records.some(entry => entry.target === target)) return clarify('Filename collision; inspect the existing works before adding another record.', records.filter(entry => entry.target === target));
  }
  safeTarget.parse(target);
  return {
    status: 'ready', action: existing ? 'update' : 'create', target,
    expectedSha256: existing?.sha256 ?? null, contentSha256: sha256(markdown), markdown
  };
}

export function logFinishedBook(rawInput, { root = repoRoot, write = false, today = todayInNewYork() } = {}) {
  const input = finishedBookInputSchema.parse(rawInput);
  const directory = logDirectory(root);
  if (!write) return planRecord(input, inspectReadingLog(root), today);

  const lock = path.join(directory, '.capture.lock');
  // Serialize helper writers; the expected content digest also catches edits
  // made since inspection. Git branch concurrency is checked at publication.
  const fd = fs.openSync(lock, 'wx');
  let temporary;
  try {
    const plan = planRecord(input, inspectReadingLog(root), today);
    if (plan.status !== 'ready') return plan;
    if (plan.action === 'update' && input.expectedSha256 !== plan.expectedSha256) {
      throw new Error('Updates require expectedSha256 from a fresh dry run or --list.');
    }
    const destination = path.join(directory, plan.target);
    temporary = path.join(path.dirname(destination), `.capture-${randomUUID()}.tmp`);
    fs.writeFileSync(temporary, plan.markdown, { flag: 'wx' });
    if (plan.action === 'create') {
      // Link the complete file atomically, refusing an existing destination.
      fs.linkSync(temporary, destination);
    } else {
      if (fs.lstatSync(destination).isSymbolicLink() || sha256(fs.readFileSync(destination, 'utf8')) !== plan.expectedSha256) {
        throw new Error('Record changed during capture; nothing was replaced.');
      }
      fs.renameSync(temporary, destination);
    }
    return { ...plan, status: 'written' };
  } finally {
    if (temporary && fs.existsSync(temporary)) fs.unlinkSync(temporary);
    fs.closeSync(fd);
    fs.unlinkSync(lock);
  }
}

export function main(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: {
    input: { type: 'string' }, list: { type: 'boolean' },
    write: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, help: { type: 'boolean' }
  } });
  if (values.help) {
    console.log('Usage: node scripts/log-finished-book.mjs --list | --input <enriched.json> [--dry-run | --write]\nDefault: dry run. No network, commit, push, or model calls.');
    return 0;
  }
  if (values.list) {
    if (values.input || values.write || values['dry-run']) throw new Error('--list cannot be combined with writing options.');
    console.log(JSON.stringify(inspectReadingLog().map(({ data, ...entry }) => entry), null, 2));
    return 0;
  }
  if (!values.input || (values.write && values['dry-run'])) throw new Error('Supply --input and at most one of --dry-run or --write.');
  const input = JSON.parse(fs.readFileSync(values.input, 'utf8'));
  const result = logFinishedBook(input, { write: values.write });
  console.log(JSON.stringify(result, null, 2));
  return result.status === 'needs-clarification' ? 2 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(); }
  catch (error) {
    console.error(JSON.stringify({ status: 'error', message: error.message }));
    process.exitCode = 1;
  }
}
