import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { titleFromSlug } from '../lib/content';

export async function GET(context) {
  const projects = await getCollection('projects');
  const items = projects
    .filter((entry) => entry.data.date)
    .map((entry) => ({
      title: entry.data.title ?? titleFromSlug(entry.slug),
      pubDate: entry.data.date,
      description: entry.data.description ?? '',
      link: `/projects/${entry.slug}`
    }))
    .sort((a, b) => b.pubDate - a.pubDate);

  return rss({
    title: 'Vansh Kumar - Projects and Essays',
    description: 'New projects and essays.',
    site: context.site,
    items
  });
}
