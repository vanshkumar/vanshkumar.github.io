import { defineCollection, z } from 'astro:content';
import { writingClassificationIssue } from './lib/writing.mjs';
import { isReadingDate, readingDateString, validReadingInterval } from './lib/reading-log.mjs';

const optionalText = z.string().optional().nullable();

const link = z.object({
  label: z.string(),
  href: z.string(),
  external: z.boolean().optional(),
  rel: z.string().optional()
});

const siteCopy = z.object({
  name: z.string(),
  brandSubtitle: z.string(),
  skipLinkLabel: z.string(),
  footerLabel: z.string(),
  footerLinks: z.array(link),
  subscription: z.object({
    src: z.string().url(),
    title: z.string()
  }),
  content: z.object({
    backlinksTitle: z.string(),
    lastUpdatedTemplate: z.string()
  }),
  writing: z.object({
    postLabel: z.string(),
    noteLabel: z.string(),
    poemLabel: z.string(),
    logsTitle: z.string(),
    previousLabel: z.string(),
    nextLabel: z.string(),
    backToTemplate: z.string(),
    logNavigationLabel: z.string()
  }),
  comicReader: z.object({
    readerLabelTemplate: z.string(),
    coverAltTemplate: z.string(),
    pageAltTemplate: z.string(),
    openLabelTemplate: z.string(),
    previousLabel: z.string(),
    nextLabel: z.string(),
    coverLabel: z.string(),
    pageLabelTemplate: z.string(),
    pagesLabelTemplate: z.string(),
    statusTemplate: z.string()
  }),
  redirects: z.object({
    destinationConnector: z.string(),
    titles: z.object({
      guesses: z.string(),
      hunches: z.string(),
      projects: z.string(),
      questions: z.string()
    }),
    messages: z.object({
      pageMoved: z.string(),
      postMoved: z.string(),
      projectLogMoved: z.string(),
      writingMoved: z.string(),
      taggedPathMoved: z.string(),
      writingNowPost: z.string(),
      writingNowNote: z.string(),
      guessesNowNotes: z.string(),
      hunchesNowNotes: z.string(),
      projectsNowPosts: z.string(),
      questionsNowNotes: z.string()
    })
  }),
  rss: z.object({
    title: z.string(),
    description: z.string()
  })
});

const homeCopy = z.object({
  comic: z.object({
    src: z.string(),
    alt: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive()
  }),
  selected: z.object({
    title: z.string(),
    slugs: z.array(z.string()).refine(
      (slugs) => new Set(slugs).size === slugs.length,
      'Selected post slugs must be unique'
    )
  })
});

const shelfCopy = z.object({
  bylineTemplate: z.string(),
  reviewLinkLabel: z.string(),
  coverAltTemplate: z.string(),
  readingLog: z.object({
    unknownDateLabel: z.string(),
    notesLinkLabel: z.string(),
    entryCountSingularTemplate: z.string(),
    entryCountPluralTemplate: z.string(),
    updatedLabel: z.string()
  })
});

const terrainCopy = z.object({
  projectsTitle: z.string(),
  noProjectsMessage: z.string(),
  questionsTitle: z.string(),
  noQuestionsMessage: z.string(),
  hunchesTitle: z.string(),
  noHunchesMessage: z.string(),
  updatedTemplate: z.string()
});

const wordGardenCopy = z.object({
  sectionLabel: z.string(),
  rangeDescriptionTemplate: z.string(),
  calendarLabel: z.string(),
  legendLabel: z.string(),
  quietLabel: z.string(),
  flourishingLabel: z.string(),
  touchedSingularTemplate: z.string(),
  touchedPluralTemplate: z.string(),
  cellLabelTemplate: z.string(),
  weekdayLabels: z.array(z.string()).length(7)
});

const terrain = defineCollection({
  type: 'content',
  schema: z.object({
    title: optionalText,
    description: optionalText,
    date: z.coerce.date().optional(),
    lastmod: z.coerce.date().optional(),
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
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
  }).superRefine((entry, ctx) => {
    const issue = writingClassificationIssue(entry.tags);
    if (issue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tags'],
        message: `Terrain entry ${issue}.`
      });
    }
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

const shelfBook = z.object({
  title: optionalText,
  author: z.string(),
  description: optionalText,
  date: z.coerce.date().optional(),
  lastmod: z.coerce.date().optional(),
  coverImage: z.string().startsWith('/assets/').optional(),
  aliases: z.array(z.string()).optional(),
  rating: z.never().optional()
});

const shelf = defineCollection({
  type: 'content',
  schema: shelfBook.extend({
    status: z.enum(['reading', 'recommended'])
  })
});

const readingDate = z.preprocess(readingDateString, z.string().refine(isReadingDate, {
  message: 'Use a valid YYYY-MM-DD, YYYY-MM, or YYYY calendar date'
}));

const readingLog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    authors: z.array(z.string().min(1)).min(1),
    // An explicit null completion date means a completed read with no known date.
    reads: z.array(z.object({
      started: readingDate.optional(),
      finished: readingDate.nullable()
    }).refine(validReadingInterval, 'A read cannot finish before it starts')).default([]),
    status: z.enum(['read', 'currently-reading', 'to-read', 'did-not-finish']).optional(),
    isbn: z.string().optional(),
    amazonAsin: z.string().regex(/^[A-Z0-9]{10}$/).optional(),
    contributors: z.string().optional(),
    format: z.string().optional(),
    dateAdded: readingDate.optional(),
    owned: z.boolean().optional(),
    shelfSlug: z.string().regex(/^[a-z0-9-]+$/).optional()
  })
});

const poems = defineCollection({
  type: 'content',
  schema: z.object({
    title: optionalText,
    description: optionalText,
    date: z.coerce.date().optional(),
    lastmod: z.coerce.date().optional(),
    aliases: z.array(z.string()).optional()
  })
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: optionalText,
    description: optionalText,
    date: z.coerce.date().optional(),
    lastmod: z.coerce.date().optional(),
    aliases: z.array(z.string()).optional(),
    heroTitle: z.string().optional(),
    heroAccent: z.string().optional(),
    site: siteCopy.optional(),
    home: homeCopy.optional(),
    shelf: shelfCopy.optional(),
    terrain: terrainCopy.optional(),
    wordGarden: wordGardenCopy.optional()
  })
});

export const collections = {
  terrain,
  logs,
  shelf,
  'reading-log': readingLog,
  poems,
  pages
};
