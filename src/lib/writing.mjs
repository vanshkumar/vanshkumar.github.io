export const POST_TAGS = Object.freeze(['projects', 'essays']);
export const NOTE_TAGS = Object.freeze(['hunches', 'questions']);

const normalizedTags = (tags) =>
  Array.isArray(tags)
    ? tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
    : [];

export const writingClassificationIssue = (tags) => {
  const values = normalizedTags(tags);
  const hasPostTag = values.some((tag) => POST_TAGS.includes(tag));
  const hasNoteTag = values.some((tag) => NOTE_TAGS.includes(tag));

  if (hasPostTag && hasNoteTag) {
    return 'has tags from both the Post group (projects/essays) and Note group (hunches/questions)';
  }
  if (!hasPostTag && !hasNoteTag) {
    return 'must have at least one Post tag (projects/essays) or Note tag (hunches/questions)';
  }
  return null;
};

export const classifyWritingTags = (tags, identifier = 'Writing entry') => {
  const issue = writingClassificationIssue(tags);
  if (issue) throw new Error(`${identifier} ${issue}.`);
  const values = normalizedTags(tags);
  return values.some((tag) => POST_TAGS.includes(tag)) ? 'post' : 'note';
};

export const classifyWritingEntry = (entry) =>
  classifyWritingTags(entry?.data?.tags, `terrain/${entry?.slug ?? 'unknown'}`);

export const canonicalWritingPath = (entry) =>
  `/${classifyWritingEntry(entry) === 'post' ? 'posts' : 'notes'}/${entry.slug}`;

export const canonicalWritingPathFrom = (slug, tags) =>
  `/${classifyWritingTags(tags, `terrain/${slug}`) === 'post' ? 'posts' : 'notes'}/${slug}`;

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
