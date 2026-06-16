export const WIKI_INDEX_COLLECTIONS = [
  'projects',
  'questions',
  'notes',
  'logs',
  'pages',
  'shelf'
];

export const WIKI_LOOKUP_ORDER = [
  'projects',
  'questions',
  'notes',
  'shelf',
  'logs',
  'pages'
];

const LEGACY_COLLECTION_ALIASES = {
  projects: 'attractors',
  questions: 'probes',
  notes: 'traces'
};

export const legacyCollectionFor = (collection) =>
  LEGACY_COLLECTION_ALIASES[collection];

export const normalizeWikiTarget = (value) => {
  const trimmed = String(value).trim().replace(/\.md$/i, '').replace(/\\/g, '/');
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

export const normalizeWikiHeading = (value) =>
  normalizeWikiTarget(value).replace(/\//g, '-');

export const isWikiAssetTarget = (value) =>
  /\.(png|jpe?g|gif|svg|webp|bmp|ico|apng|pdf)$/i.test(String(value));

export const urlForEntry = (collection, slug) => {
  if (collection === 'pages') {
    return slug === 'home' ? '/' : `/${slug}`;
  }
  if (collection === 'projects') {
    return `/projects/${slug}`;
  }
  if (collection === 'questions') {
    return `/questions/${slug}`;
  }
  if (collection === 'notes') {
    return `/notes/${slug}`;
  }
  if (collection === 'shelf') {
    return `/shelf/${slug}`;
  }
  const [project, ...rest] = slug.split('/');
  return `/projects/${project}/logs/${rest.join('/')}`;
};
