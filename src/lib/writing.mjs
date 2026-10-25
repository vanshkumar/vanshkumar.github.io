export const WRITING_TYPES = Object.freeze(['post', 'note']);

export const classifyWritingType = (type, identifier = 'Writing entry') => {
  if (!WRITING_TYPES.includes(type)) {
    throw new Error(`${identifier} must have type: post or type: note.`);
  }
  return type;
};

export const classifyWritingEntry = (entry) =>
  classifyWritingType(entry?.data?.type, `terrain/${entry?.slug ?? 'unknown'}`);

// Keep formerly published tag-qualified URLs working after retiring subtype tags.
export const writingRedirectTags = (data) => [
  ...(data.tags ?? []),
  ...(classifyWritingType(data.type) === 'post'
    ? ['posts', 'projects', 'essays']
    : ['notes', 'hunches', 'questions'])
];

export const isDraftPost = (data, identifier = 'Writing entry') => {
  if (data.draft !== undefined && typeof data.draft !== 'boolean') {
    throw new Error(`${identifier}: draft must be true or false (a YAML boolean).`);
  }
  if (data.draft !== true) return false;
  if (classifyWritingType(data.type, identifier) !== 'post') {
    throw new Error(`${identifier}: draft is currently supported only for Posts.`);
  }
  return true;
};

export const canonicalWritingPath = (entry) =>
  `/${classifyWritingEntry(entry) === 'post' ? 'posts' : 'notes'}/${entry.slug}`;

export const canonicalWritingPathFrom = (slug, type) =>
  `/${classifyWritingType(type, `terrain/${slug}`) === 'post' ? 'posts' : 'notes'}/${slug}`;

export const canonicalLogPath = (parentSlug, logSlug) =>
  `/posts/${parentSlug}/logs/${logSlug.split('/').filter(Boolean).pop()}`;

const timeFor = (entry, kind) => {
  const value =
    kind === 'post'
      ? entry.data.date ?? entry.data.lastmod
      : entry.data.lastmod ?? entry.data.date;
  return value instanceof Date ? value.getTime() : value ? new Date(value).getTime() : 0;
};

export const writingDateForEntry = (entry) => {
  const kind = classifyWritingEntry(entry);
  return kind === 'post'
    ? entry.data.date ?? entry.data.lastmod ?? null
    : entry.data.lastmod ?? entry.data.date ?? null;
};

const compareByKind = (kind) => (a, b) => {
  const difference = timeFor(b, kind) - timeFor(a, kind);
  return difference || a.slug.localeCompare(b.slug);
};

export const comparePosts = compareByKind('post');
export const compareNotes = compareByKind('note');

export const partitionWriting = (entries) => {
  const posts = [];
  const notes = [];
  entries.forEach((entry) => {
    (classifyWritingEntry(entry) === 'post' ? posts : notes).push(entry);
  });
  return {
    posts: posts.sort(comparePosts),
    notes: notes.sort(compareNotes)
  };
};

export const compareWriting = (a, b) => {
  const aKind = classifyWritingEntry(a);
  const bKind = classifyWritingEntry(b);
  const difference = timeFor(b, bKind) - timeFor(a, aKind);
  return difference || a.slug.localeCompare(b.slug);
};

export const validateLogParents = (logs, writingEntries) => {
  const parents = new Map(writingEntries.map((entry) => [entry.slug, entry]));
  logs.forEach((log) => {
    const parent = parents.get(log.data.parent);
    if (!parent) {
      throw new Error(`logs/${log.slug} references missing terrain parent "${log.data.parent}".`);
    }
    if (classifyWritingEntry(parent) !== 'post') {
      throw new Error(`logs/${log.slug} must have a parent classified as a Post.`);
    }
  });
};
