export const titleFromSlug = (slug: string) => {
  const last = slug.split('/').filter(Boolean).pop() ?? slug;
  const cleaned = last
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return slug;
  return cleaned
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
};
