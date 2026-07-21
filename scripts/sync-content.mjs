import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const root = path.dirname(fileURLToPath(new URL(import.meta.url)));
const repoRoot = path.resolve(root, '..');
const vaultRoot = path.join(repoRoot, 'vault');
const contentRoot = path.join(repoRoot, 'src', 'content');

const collections = ['terrain', 'logs', 'pages', 'shelf'];
const retiredCollections = ['projects', 'questions', 'hunches'];
const customSlugCollections = new Set(['terrain']);

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

const walkMarkdownFiles = (dir, recursive = true) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  entries.forEach((entry) => {
    if (entry.name.startsWith('.')) return;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && recursive) {
      files.push(...walkMarkdownFiles(fullPath, recursive));
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
  const sourceDir = collection === 'terrain' ? vaultRoot : path.join(vaultRoot, collection);
  const targetDir = path.join(contentRoot, collection);
  clearDir(targetDir);
  ensureDir(targetDir);

  const files = walkMarkdownFiles(sourceDir, collection !== 'terrain');
  const used = new Set();

  files.forEach((filePath) => {
    const rel = path.relative(sourceDir, filePath).replace(/\\/g, '/');
    const segments = rel.split('/');
    const filename = segments.pop();
    if (!filename) return;
    const cleanSegments = segments.map(slugify).filter(Boolean);
    const cleanName = slugify(filename);
    if (!cleanName) {
      throw new Error(`Could not derive a slug for ${collection}/${rel}`);
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    const data = { ...parsed.data };
    const hasNestedCustomSlug =
      customSlugCollections.has(collection) &&
      typeof data.slug === 'string' &&
      /[\\/]/.test(data.slug);
    if (hasNestedCustomSlug) {
      throw new Error(`Terrain slugs must be a single path segment in ${rel}: ${data.slug}`);
    }
    const customSlug =
      customSlugCollections.has(collection) && typeof data.slug === 'string'
        ? slugify(data.slug)
        : '';
    if (data.slug != null && !customSlug) {
      throw new Error(`Invalid slug frontmatter in ${rel}: ${data.slug}`);
    }
    delete data.slug;

    if (collection === 'logs') {
      const parentSlug = cleanSegments[0];
      if (!parentSlug) {
        throw new Error(`Log entry is not inside a project folder: ${rel}`);
      }
      if (typeof data.parent !== 'string' || !data.parent.trim()) {
        throw new Error(`Log entry is missing required parent frontmatter: ${rel}`);
      }
      if (slugify(data.parent) !== parentSlug) {
        throw new Error(
          `Log parent does not match its project folder in ${rel}: ${data.parent}`
        );
      }
      data.parent = parentSlug;
    }

    const title = data.title ?? titleFromFilename(filename);
    if (!data.title) {
      data.title = title;
    }
    const cleanRel = customSlug || [...cleanSegments, cleanName].join('/');
    if (used.has(cleanRel)) {
      throw new Error(
        `Duplicate slug after sanitizing: ${cleanRel} (from ${rel})`
      );
    }
    used.add(cleanRel);

    const output = matter.stringify(parsed.content, data);
    const targetPath = path.join(targetDir, `${cleanRel}.md`);
    ensureDir(path.dirname(targetPath));
    fs.writeFileSync(targetPath, output);
  });
};

const validateLogParents = () => {
  const terrainDir = path.join(contentRoot, 'terrain');
  const logDir = path.join(contentRoot, 'logs');
  const terrainSlugs = new Set(
    walkMarkdownFiles(terrainDir, false).map((filePath) =>
      path.basename(filePath, path.extname(filePath))
    )
  );

  walkMarkdownFiles(logDir).forEach((filePath) => {
    const { data } = matter(fs.readFileSync(filePath, 'utf8'));
    if (!terrainSlugs.has(data.parent)) {
      throw new Error(
        `Log parent does not match a Terrain entry in ${path.relative(contentRoot, filePath)}: ${data.parent}`
      );
    }
  });
};

if (!fs.existsSync(vaultRoot)) {
  process.exit(0);
}

collections.forEach(syncCollection);
validateLogParents();
retiredCollections.forEach((collection) => clearDir(path.join(contentRoot, collection)));
