import { getCollection } from 'astro:content';
import { titleFromSlug } from './content';

const WIKILINK_RE =
  /!?\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;

const collectionOrder = ['probes', 'attractors', 'traces', 'logs', 'pages'];

const urlFor = (collection: string, slug: string) => {
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

const normalizeTarget = (value: string) => {
  const trimmed = value.trim().replace(/\.md$/i, '').replace(/\\/g, '/');
  const segments = trimmed.split('/').filter(Boolean);
  const normalized = segments
    .map((segment) =>
      segment
        .trim()
        .toLowerCase()
        .replace(/[\s]+/g, '-')
        .replace(/[^a-z0-9-_]/g, '')
    )
    .join('/');
  return normalized;
};

type WikiEntry = {
  key: string;
  collection: string;
  slug: string;
  title: string;
  url: string;
  aliases: string[];
  body: string;
};

const entryTitle = (collection: string, entry: any) => {
  if (collection !== 'logs') {
    return entry.data.title ?? titleFromSlug(entry.slug);
  }
  const date = entry.data.date
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(entry.data.date)
    : '';
  return entry.data.title ?? entry.data.day ?? date ?? entry.slug;
};

const extractTargets = (body: string) => {
  const targets: string[] = [];
  if (!body) return targets;
  for (const match of body.matchAll(WIKILINK_RE)) {
    if (!match[1]) continue;
    targets.push(match[1]);
  }
  return targets;
};

const buildEntries = async () => {
  const [probes, attractors, traces, logs, pages] = await Promise.all([
    getCollection('probes'),
    getCollection('attractors'),
    getCollection('traces'),
    getCollection('logs'),
    getCollection('pages')
  ]);

  const entries: WikiEntry[] = [];
  const pushEntries = (collection: string, list: any[]) => {
    list.forEach((entry) => {
      entries.push({
        key: `${collection}:${entry.slug}`,
        collection,
        slug: entry.slug,
        title: entryTitle(collection, entry),
        url: urlFor(collection, entry.slug),
        aliases: Array.isArray(entry.data.aliases) ? entry.data.aliases : [],
        body: entry.body ?? ''
      });
    });
  };

  pushEntries('probes', probes);
  pushEntries('attractors', attractors);
  pushEntries('traces', traces);
  pushEntries('logs', logs);
  pushEntries('pages', pages);

  return entries;
};

let cachedEntries: WikiEntry[] | null = null;
let cachedBacklinks: Map<string, WikiEntry[]> | null = null;

const ensureEntries = async () => {
  if (!cachedEntries) {
    cachedEntries = await buildEntries();
  }
  return cachedEntries;
};

const buildLookup = (entries: WikiEntry[]) => {
  const lookup = new Map<string, WikiEntry>();
  const addIfMissing = (key: string, entry: WikiEntry) => {
    if (!lookup.has(key)) {
      lookup.set(key, entry);
    }
  };

  const orderedEntries = [...entries].sort(
    (a, b) => collectionOrder.indexOf(a.collection) - collectionOrder.indexOf(b.collection)
  );

  orderedEntries.forEach((entry) => {
    const slugKey = normalizeTarget(entry.slug);
    addIfMissing(slugKey, entry);
    if (entry.collection !== 'pages') {
      addIfMissing(normalizeTarget(`${entry.collection}/${entry.slug}`), entry);
    }
    entry.aliases.forEach((alias) => {
      addIfMissing(normalizeTarget(alias), entry);
    });
  });

  return lookup;
};

const buildBacklinks = async () => {
  if (cachedBacklinks) return cachedBacklinks;
  const entries = await ensureEntries();
  const lookup = buildLookup(entries);
  const backlinks = new Map<string, WikiEntry[]>();

  entries.forEach((entry) => {
    const targets = extractTargets(entry.body);
    targets.forEach((target) => {
      const resolved = lookup.get(normalizeTarget(target));
      if (!resolved || resolved.key === entry.key) return;
      const list = backlinks.get(resolved.key) ?? [];
      list.push(entry);
      backlinks.set(resolved.key, list);
    });
  });

  backlinks.forEach((list, key) => {
    const deduped: WikiEntry[] = [];
    const seen = new Set<string>();
    list.forEach((entry) => {
      if (seen.has(entry.key)) return;
      seen.add(entry.key);
      deduped.push(entry);
    });
    deduped.sort((a, b) => a.title.localeCompare(b.title));
    backlinks.set(key, deduped);
  });

  cachedBacklinks = backlinks;
  return backlinks;
};

export const getBacklinksForEntry = async (collection: string, slug: string) => {
  const backlinks = await buildBacklinks();
  return backlinks.get(`${collection}:${slug}`) ?? [];
};
