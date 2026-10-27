import { z } from 'astro/zod';
import matter from 'gray-matter';
import { isReadingDate, readingDateString } from './reading-log.mjs';

export const readingDateSchema = z.preprocess(readingDateString, z.string().refine(isReadingDate, {
  message: 'Use a valid YYYY-MM-DD, YYYY-MM, or YYYY calendar date'
}));

export const exactReadingDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isReadingDate, {
  message: 'Use a valid YYYY-MM-DD calendar date'
});

export const metadataSourceSchema = z.object({
  url: z.string().url(),
  retrieved: z.preprocess(readingDateString, exactReadingDateSchema),
  fields: z.array(z.string()).optional()
});

// Shared by Astro and the capture writer. Historical partial/unknown dates remain valid.
export const readingRecordSchema = z.object({
  title: z.string().trim().min(1),
  authors: z.array(z.string().trim().min(1)).min(1),
  finished: readingDateSchema.nullable().optional(),
  status: z.enum(['read', 'currently-reading', 'to-read', 'did-not-finish']).optional(),
  isbn: z.string().optional(),
  amazonAsin: z.string().regex(/^[A-Z0-9]{10}$/).optional(),
  contributors: z.string().optional(),
  pageCount: z.number().int().positive().optional(),
  bookType: z.enum(['fiction', 'nonfiction']).optional(),
  genres: z.array(z.string().min(1)).optional(),
  moods: z.array(z.string().min(1)).optional(),
  pace: z.enum(['slow', 'medium', 'fast']).optional(),
  // Negative years denote BCE; the historical calendar has no year zero.
  publicationYear: z.number().int().min(-9999).max(9999).refine(year => year !== 0, {
    message: 'Use a negative year for BCE or a positive year for CE; there is no year zero'
  }).optional(),
  publicationYearApproximate: z.boolean().optional(),
  metadataSources: z.array(metadataSourceSchema).optional(),
  dateAdded: readingDateSchema.optional(),
  owned: z.boolean().optional(),
  shelfSlug: z.string().regex(/^[a-z0-9-]+$/).optional()
});

export function serializeReadingRecord(body, record) {
  const data = { ...record };
  for (const key of ['finished', 'dateAdded']) {
    if (data[key] !== undefined && data[key] !== null) data[key] = readingDateString(data[key]);
  }
  if (data.metadataSources) {
    data.metadataSources = data.metadataSources.map(source => ({
      ...source, retrieved: readingDateString(source.retrieved)
    }));
  }
  let output = matter.stringify(body, data);
  // gray-matter's YAML 1.1 writer can emit numeric-looking strings bare. Astro
  // reads YAML 1.2, so preserve identifiers and calendar dates explicitly.
  for (const key of ['isbn', 'amazonAsin', 'finished', 'dateAdded']) {
    if (typeof data[key] === 'string') {
      output = output.replace(new RegExp(`^${key}:.*$`, 'm'), `${key}: ${JSON.stringify(data[key])}`);
    }
  }
  return output;
}
