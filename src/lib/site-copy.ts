import { getEntry } from 'astro:content';

export const getSiteCopy = async () => {
  const entry = await getEntry('pages', 'site');
  if (!entry?.data.site) {
    throw new Error('Missing site copy in vault/pages/site.md');
  }
  return entry.data.site;
};

export const formatCopy = (
  template: string,
  values: Record<string, string | number>
) =>
  template.replace(/\{([^}]+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
