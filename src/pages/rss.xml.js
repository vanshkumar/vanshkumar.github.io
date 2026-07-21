import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { titleFromSlug } from '../lib/content';

export async function GET(context) {
  const terrain = await getCollection('terrain');
  const items = terrain
    .map((entry) => {
      const pubDate = entry.data.lastmod ?? entry.data.date;
      return {
        title: entry.data.title ?? titleFromSlug(entry.slug),
        ...(pubDate ? { pubDate } : {}),
        description: entry.data.description ?? '',
        link: `/terrain/${entry.slug}`
      };
    })
    .sort(
      (a, b) =>
        (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0)
    );

  return rss({
    title: 'Vansh Kumar - Terrain',
    description: 'Recently tended writing from Vansh Kumar.',
    site: context.site,
    items
  });
}
