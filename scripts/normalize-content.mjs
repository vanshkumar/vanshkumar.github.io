import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(new URL(import.meta.url)));
const repoRoot = path.resolve(root, '..');
const vaultRoot = path.join(repoRoot, 'vault');

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

const rootMarkdownFiles = () =>
  fs
    .readdirSync(vaultRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(vaultRoot, entry.name));

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

rootMarkdownFiles().forEach((filePath) => {
  const slug = slugify(path.basename(filePath));
  if (!slug) {
    throw new Error(
      `Could not derive a public Terrain slug from ${path.relative(repoRoot, filePath)}`
    );
  }

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

changed.forEach((file) => {
  console.log(file);
});
