import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(new URL(import.meta.url)));
const repoRoot = path.resolve(root, '..');
const vaultRoot = path.join(repoRoot, 'vault');
const collections = ['projects', 'questions', 'hunches'];

const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const titleFromFilename = (filename) =>
  filename.replace(/\.md$/i, '').trim() || 'Untitled';

const titleValue = (title) => JSON.stringify(title);

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

const slugFromRelativePath = (relativePath) =>
  relativePath
    .split('/')
    .map(slugify)
    .filter(Boolean)
    .join('/');

const normalizeFrontmatter = (text, { slug, title }) => {
  if (!text.startsWith('---\n')) {
    return `---\nslug: ${slug}\ntitle: ${titleValue(title)}\n---\n${text}`;
  }

  const end = text.indexOf('\n---', 4);
  if (end === -1) {
    return `---\nslug: ${slug}\ntitle: ${titleValue(title)}\n---\n${text}`;
  }

  const frontmatter = text.slice(4, end);
  const hasSlug = /^slug:/m.test(frontmatter);
  const hasTitle = /^title:/m.test(frontmatter);
  if (hasSlug && hasTitle) return text;

  const additions = [];
  if (!hasSlug) additions.push(`slug: ${slug}`);
  if (!hasTitle) additions.push(`title: ${titleValue(title)}`);

  return `---\n${additions.join('\n')}\n${text.slice(4)}`;
};

const changed = [];

collections.forEach((collection) => {
  const sourceDir = path.join(vaultRoot, collection);
  walkMarkdownFiles(sourceDir).forEach((filePath) => {
    const rel = path.relative(sourceDir, filePath).replace(/\\/g, '/');
    const slug = slugFromRelativePath(rel);
    if (!slug) return;

    const before = fs.readFileSync(filePath, 'utf8');
    const after = normalizeFrontmatter(before, {
      slug,
      title: titleFromFilename(path.basename(filePath))
    });

    if (after !== before) {
      fs.writeFileSync(filePath, after);
      changed.push(path.relative(repoRoot, filePath));
    }
  });
});

changed.forEach((file) => {
  console.log(file);
});
