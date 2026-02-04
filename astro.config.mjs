import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import wikiLinkPlugin from '@flowershow/remark-wiki-link';

const CONTENT_ROOT = fileURLToPath(new URL('./src/content', import.meta.url));
const VAULT_ROOT = fileURLToPath(new URL('./vault', import.meta.url));
const COLLECTIONS = ['probes', 'attractors', 'traces', 'logs', 'pages'];
const ASSETS_DIR = fs.existsSync(path.join(VAULT_ROOT, 'assets'))
  ? path.join(VAULT_ROOT, 'assets')
  : path.join(CONTENT_ROOT, 'assets');

const normalizeTarget = (value) => {
  const trimmed = value.trim().replace(/\.md$/i, '').replace(/\\/g, '/');
  const segments = trimmed.split('/').filter(Boolean);
  return segments
    .map((segment) =>
      segment
        .trim()
        .toLowerCase()
        .replace(/[\s]+/g, '-')
        .replace(/[^a-z0-9-_]/g, '')
    )
    .join('/');
};

const normalizeHeading = (value) => normalizeTarget(value).replace(/\//g, '-');
const isAsset = (value) =>
  /\.(png|jpe?g|gif|svg|webp|bmp|ico|apng|pdf)$/i.test(value);

const urlFor = (collection, slug) => {
  if (collection === 'pages') {
    return slug === 'home' ? '/' : `/${slug}`;
  }
  if (collection === 'probes') {
    return `/probes/${slug}`;
  }
  if (collection === 'attractors') {
    return `/attractors/${slug}`;
  }
  if (collection === 'traces') {
    return `/traces/${slug}`;
  }
  return `/logs/${slug}`;
};

const walkMarkdownFiles = (dir) => {
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

const walkFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  entries.forEach((entry) => {
    if (entry.name.startsWith('.')) return;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  });
  return files;
};

const buildWikiIndex = () => {
  const lookup = new Map();
  const permalinks = new Set();

  const addIfMissing = (key, url) => {
    if (!lookup.has(key)) {
      lookup.set(key, url);
    }
  };

  COLLECTIONS.forEach((collection) => {
    const collectionDir = path.join(CONTENT_ROOT, collection);
    if (!fs.existsSync(collectionDir)) return;
    const files = walkMarkdownFiles(collectionDir);
    files.forEach((filePath) => {
      const rel = path
        .relative(collectionDir, filePath)
        .replace(/\\/g, '/')
        .replace(/\.md$/, '');
      const slug = rel;
      const url = urlFor(collection, slug);
      permalinks.add(url);
      addIfMissing(normalizeTarget(slug), url);
      if (collection !== 'pages') {
        addIfMissing(normalizeTarget(`${collection}/${slug}`), url);
      }

      const file = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(file);
      const aliases = Array.isArray(data.aliases)
        ? data.aliases
        : data.aliases
          ? [data.aliases]
          : [];
      aliases.forEach((alias) => {
        addIfMissing(normalizeTarget(String(alias)), url);
      });
    });
  });

  if (fs.existsSync(ASSETS_DIR)) {
    const assets = walkFiles(ASSETS_DIR);
    assets.forEach((filePath) => {
      const rel = path.relative(ASSETS_DIR, filePath).replace(/\\/g, '/');
      if (!rel) return;
      permalinks.add(`/assets/${rel}`);
    });
  }

  return {
    lookup,
    permalinks: Array.from(permalinks)
  };
};

const wikiIndex = buildWikiIndex();
const urlResolver = (name) => {
  const [raw, hash] = String(name).split('#');
  const normalized = normalizeTarget(raw);
  if (isAsset(raw)) {
    const cleaned = raw.replace(/^assets\//i, '');
    return `/assets/${cleaned}`;
  }
  const resolved = wikiIndex.lookup.get(normalized) ?? normalized;
  if (!hash) return resolved;
  return `${resolved}#${normalizeHeading(hash)}`;
};

export default defineConfig({
  site: 'https://vanshkumar.net',
  output: 'static',
  trailingSlash: 'never',
  markdown: {
    remarkPlugins: [
      [
        wikiLinkPlugin,
        {
          urlResolver,
          permalinks: wikiIndex.permalinks,
          newClassName: 'wikilink-missing'
        }
      ]
    ]
  }
});
