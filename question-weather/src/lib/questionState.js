export const getQuestionUpdatedDate = (question) =>
  question.lastmod ?? question.date ?? question.activity?.lastActivity ?? null;

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

const activityScore = (question) => question.activity?.score ?? 0;

export const sortQuestions = (questions, mode = 'weather') =>
  [...questions].sort((a, b) => {
    if (mode === 'title') return compareTitle(a, b);

    if (mode === 'updated') {
      return (
        compareDatesDesc(getQuestionUpdatedDate(a), getQuestionUpdatedDate(b)) ||
        compareTitle(a, b)
      );
    }

    return (
      activityScore(b) - activityScore(a) ||
      (b.activity?.recentUpdateCount ?? 0) - (a.activity?.recentUpdateCount ?? 0) ||
      compareDatesDesc(getQuestionUpdatedDate(a), getQuestionUpdatedDate(b)) ||
      compareTitle(a, b)
    );
  });

const searchableText = (question) =>
  [
    question.title,
    question.excerpt,
    question.body,
    question.tags.join(' '),
    question.wikilinks.map((link) => `${link.target} ${link.label}`).join(' ')
  ]
    .join(' ')
    .toLowerCase();

export const filterQuestions = (questions, { query = '' } = {}) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return questions;
  return questions.filter((question) =>
    searchableText(question).includes(normalizedQuery)
  );
};
