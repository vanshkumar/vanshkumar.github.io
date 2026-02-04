import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { titleFromSlug } from '../lib/content';

export async function GET(context) {
  const attractors = await getCollection('attractors');
  const items = attractors
    .filter((entry) => entry.data.date)
    .map((entry) => ({
      title: entry.data.title ?? titleFromSlug(entry.slug),
      pubDate: entry.data.date,
      description: entry.data.description ?? '',
      link: `/attractors/${entry.slug}`
    }))
    .sort((a, b) => b.pubDate - a.pubDate);

  return rss({
    title: 'Vansh Kumar — Attractors',
    description: 'New attractors and essays.',
    site: context.site,
    items
  });
}
