import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const root = path.dirname(fileURLToPath(new URL(import.meta.url)));
const repoRoot = path.resolve(root, '..');
const vaultRoot = path.join(repoRoot, 'vault');
const contentRoot = path.join(repoRoot, 'src', 'content');

const collections = ['probes', 'attractors', 'traces', 'logs', 'pages'];

const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const titleFromFilename = (filename) => {
  const base = filename.replace(/\.md$/i, '').trim();
  return base || 'Untitled';
};


const walkMarkdownFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  entries.forEach((entry) => {
    if (entry.name.startsWith('.')) return;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  });
  return files;
};

const clearDir = (dir) => {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
};

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const syncCollection = (collection) => {
  const sourceDir = path.join(vaultRoot, collection);
  const targetDir = path.join(contentRoot, collection);
  clearDir(targetDir);
  ensureDir(targetDir);

  const files = walkMarkdownFiles(sourceDir);
  const used = new Set();

  files.forEach((filePath) => {
    const rel = path.relative(sourceDir, filePath).replace(/\\/g, '/');
    const segments = rel.split('/');
    const filename = segments.pop();
    if (!filename) return;
    const cleanSegments = segments.map(slugify).filter(Boolean);
    const cleanName = slugify(filename);
    if (!cleanName) return;

    const cleanRel = [...cleanSegments, cleanName].join('/');
    if (used.has(cleanRel)) {
      throw new Error(
        `Duplicate slug after sanitizing: ${cleanRel} (from ${rel})`
      );
    }
    used.add(cleanRel);

    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    const data = { ...parsed.data };

    if (collection === 'logs' && !data.parent) {
      const parentSlug = cleanSegments[0];
      if (!parentSlug) {
        throw new Error(
          `Log entry is missing parent and is not inside a folder: ${rel}`
        );
      }
      data.parent = parentSlug;
    }

    const title = data.title ?? titleFromFilename(filename);
    if (!data.title) {
      data.title = title;
    }
    const output = matter.stringify(parsed.content, data);
    const targetPath = path.join(targetDir, `${cleanRel}.md`);
    ensureDir(path.dirname(targetPath));
    fs.writeFileSync(targetPath, output);
  });
};

if (!fs.existsSync(vaultRoot)) {
  process.exit(0);
}

collections.forEach(syncCollection);
