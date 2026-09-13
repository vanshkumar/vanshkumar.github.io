import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { titleFromSlug } from '../lib/content';
import {
  canonicalWritingPath,
  compareWriting,
  writingDateForEntry
} from '../lib/writing.mjs';
import { getSiteCopy } from '../lib/site-copy';

export async function GET(context) {
  const siteCopy = await getSiteCopy();
  const [terrain, poems] = await Promise.all([
    getCollection('terrain'),
    getCollection('poems')
  ]);
  const items = [
    ...terrain.sort(compareWriting).map((entry) => {
      const pubDate = writingDateForEntry(entry);
      return {
        title: entry.data.title ?? titleFromSlug(entry.slug),
        ...(pubDate ? { pubDate } : {}),
        description: entry.data.description ?? '',
        link: canonicalWritingPath(entry)
      };
    }),
    ...poems.map((entry) => {
      const pubDate = entry.data.date ?? entry.data.lastmod ?? null;
      return {
        title: entry.data.title ?? titleFromSlug(entry.slug),
        ...(pubDate ? { pubDate } : {}),
        description: entry.data.description ?? '',
        link: `/poems/${entry.slug}`
      };
    })
  ].sort((a, b) =>
    (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0) ||
    a.link.localeCompare(b.link)
  );

  return rss({
    title: siteCopy.rss.title,
    description: siteCopy.rss.description,
    site: context.site,
    items
  });
}
