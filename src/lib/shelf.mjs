export const hasShelfReview = (entry) =>
  typeof entry?.body === 'string' && entry.body.trim().length > 0;
