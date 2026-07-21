import { defineCollection, z } from 'astro:content';

const optionalText = z.string().optional().nullable();

const terrain = defineCollection({
  type: 'content',
  schema: z.object({
    title: optionalText,
    description: optionalText,
    date: z.coerce.date().optional(),
    lastmod: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    coverImage: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    comic: z
      .object({
        assetDir: z.string(),
        pageCount: z.number().int().positive(),
        width: z.number().int().positive(),
        height: z.number().int().positive()
      })
      .optional()
  })
});

const logs = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.coerce.date(),
    lastmod: z.coerce.date().optional(),
    parent: z.string(),
    day: z.string().optional(),
    title: z.string().optional(),
    aliases: z.array(z.string()).optional()
  })
});

const shelf = defineCollection({
  type: 'content',
  schema: z.object({
    title: optionalText,
    description: optionalText,
    date: z.coerce.date().optional(),
    lastmod: z.coerce.date().optional(),
    rating: z.number().int().min(0).max(5),
    coverImage: z.string().startsWith('/assets/').optional(),
    aliases: z.array(z.string()).optional()
  })
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: optionalText,
    description: optionalText,
    lastmod: z.coerce.date().optional(),
    aliases: z.array(z.string()).optional(),
    heroTitle: z.string().optional(),
    heroAccent: z.string().optional(),
    brandSubtitle: z.string().optional()
  })
});

export const collections = {
  terrain,
  logs,
  shelf,
  pages
};
