import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import wikiLinkPlugin from '@flowershow/remark-wiki-link';
import rehypeExternalLinks from 'rehype-external-links';
import { rehypeObsidianCallouts } from './src/lib/callouts.mjs';
import { remarkImageCaptions } from './src/lib/image-captions.mjs';
import {
  WIKI_INDEX_COLLECTIONS,
  isWikiAssetTarget,
  legacyCollectionsFor,
  normalizeWikiHeading,
  normalizeWikiTarget,
  urlForEntry
} from './src/lib/wiki-routing.mjs';

const CONTENT_ROOT = fileURLToPath(new URL('./src/content', import.meta.url));
const VAULT_ROOT = fileURLToPath(new URL('./vault', import.meta.url));
const ASSETS_DIR = fs.existsSync(path.join(VAULT_ROOT, 'assets'))
  ? path.join(VAULT_ROOT, 'assets')
  : path.join(CONTENT_ROOT, 'assets');

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

  WIKI_INDEX_COLLECTIONS.forEach((collection) => {
    const collectionDir = path.join(CONTENT_ROOT, collection);
    if (!fs.existsSync(collectionDir)) return;
    const files = walkMarkdownFiles(collectionDir);
    files.forEach((filePath) => {
      const rel = path
        .relative(collectionDir, filePath)
        .replace(/\\/g, '/')
        .replace(/\.md$/, '');
      const slug = rel;
      const url = urlForEntry(collection, slug);
      permalinks.add(url);
      addIfMissing(normalizeWikiTarget(slug), url);
      if (collection === 'logs') {
        addIfMissing(normalizeWikiTarget(path.basename(slug)), url);
      }
      if (collection !== 'pages') {
        addIfMissing(normalizeWikiTarget(`${collection}/${slug}`), url);
        legacyCollectionsFor(collection).forEach((legacyCollection) => {
          addIfMissing(normalizeWikiTarget(`${legacyCollection}/${slug}`), url);
        });
      }

      const file = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(file);
      const aliases = Array.isArray(data.aliases)
        ? data.aliases
        : data.aliases
          ? [data.aliases]
          : [];
      aliases.forEach((alias) => {
        addIfMissing(normalizeWikiTarget(String(alias)), url);
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
  const normalized = normalizeWikiTarget(raw);
  if (isWikiAssetTarget(raw)) {
    const cleaned = raw.replace(/^assets\//i, '');
    return `/assets/${cleaned}`;
  }
  const resolved = wikiIndex.lookup.get(normalized) ?? normalized;
  if (!hash) return resolved;
  return `${resolved}#${normalizeWikiHeading(hash)}`;
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
      ],
      remarkImageCaptions
    ],
    rehypePlugins: [
      rehypeObsidianCallouts,
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['noopener', 'noreferrer'],
          properties: { className: ['external-link'] }
        }
      ]
    ]
  }
});
