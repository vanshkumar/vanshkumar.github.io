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
  const terrain = await getCollection('terrain');
  const items = terrain
    .sort(compareWriting)
    .map((entry) => {
      const pubDate = writingDateForEntry(entry);
      return {
        title: entry.data.title ?? titleFromSlug(entry.slug),
        ...(pubDate ? { pubDate } : {}),
        description: entry.data.description ?? '',
        link: canonicalWritingPath(entry)
      };
    });

  return rss({
    title: siteCopy.rss.title,
    description: siteCopy.rss.description,
    site: context.site,
    items
  });
}
