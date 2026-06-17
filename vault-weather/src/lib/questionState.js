export const getItemUpdatedDate = (item) =>
  item.lastmod ?? item.date ?? item.activity?.lastActivity ?? null;

export const getQuestionUpdatedDate = getItemUpdatedDate;

const compareDatesDesc = (a, b) => {
  const aTime = a ? new Date(a).getTime() : 0;
  const bTime = b ? new Date(b).getTime() : 0;
  return bTime - aTime;
};

const compareTitle = (a, b) => a.title.localeCompare(b.title);

export const activityTone = (level = 0) => {
  if (level >= 5) return 'electric';
  if (level >= 4) return 'bright';
  if (level >= 2) return 'warm';
  if (level >= 1) return 'stirring';
  return 'quiet';
};

const activityScore = (item) => item.activity?.score ?? 0;

export const sortWeatherItems = (items, mode = 'weather') =>
  [...items].sort((a, b) => {
    if (mode === 'title') return compareTitle(a, b);

    if (mode === 'updated') {
      return (
        compareDatesDesc(getItemUpdatedDate(a), getItemUpdatedDate(b)) ||
        compareTitle(a, b)
      );
    }

    return (
      activityScore(b) - activityScore(a) ||
      (b.activity?.recentUpdateCount ?? 0) - (a.activity?.recentUpdateCount ?? 0) ||
      compareDatesDesc(getItemUpdatedDate(a), getItemUpdatedDate(b)) ||
      compareTitle(a, b)
    );
  });

export const sortQuestions = sortWeatherItems;

const searchableText = (item) =>
  [
    item.title,
    item.excerpt,
    item.body,
    item.tags.join(' '),
    item.wikilinks.map((link) => `${link.target} ${link.label}`).join(' ')
  ]
    .join(' ')
    .toLowerCase();

export const filterWeatherItems = (items, { query = '' } = {}) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;
  return items.filter((item) =>
    searchableText(item).includes(normalizedQuery)
  );
};

export const filterQuestions = filterWeatherItems;
