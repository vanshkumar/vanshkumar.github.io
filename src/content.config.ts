import { defineCollection, z } from 'astro:content';

const optionalText = z.string().optional().nullable();

const questions = defineCollection({
  type: 'content',
  schema: z.object({
    title: optionalText,
    description: optionalText,
    date: z.coerce.date().optional(),
    lastmod: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    aliases: z.array(z.string()).optional()
  })
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: optionalText,
    description: optionalText,
    date: z.coerce.date().optional(),
    lastmod: z.coerce.date().optional(),
    kind: z.enum(['project', 'essay']),
    tags: z.array(z.string()).optional(),
    coverImage: z.string().optional(),
    aliases: z.array(z.string()).optional()
  })
});

const logs = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.coerce.date(),
    lastmod: z.coerce.date().optional(),
    parent: z.string(),
    day: z.string().optional(),
    title: z.string().optional()
  })
});

const notes = defineCollection({
  type: 'content',
  schema: z.object({
    title: optionalText,
    description: optionalText,
    date: z.coerce.date().optional(),
    lastmod: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
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
  questions,
  projects,
  logs,
  notes,
  pages
};
