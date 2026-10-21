// Calendar dates stay as strings so time zones never move a read to another day.
export const isReadingDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) return false;
  const [year, month = 1, day = 1] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
};

export const readingDateString = (value) =>
  value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toISOString().slice(0, 10)
    : value;

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
export const formatReadingDate = (date) => {
  if (!isReadingDate(date)) throw new Error(`Invalid reading date: ${date}`);
  if (date.length === 4) return date;
  const [year, month, day] = date.split('-').map(Number);
  const label = monthFormatter.format(new Date(Date.UTC(2000, month - 1, 1)));
  return day ? `${label} ${day}, ${year}` : `${label} ${year}`;
};

export const amazonBookUrl = (book) => {
  if (book.amazonAsin) return `https://www.amazon.com/dp/${book.amazonAsin}`;
  // A reference ISBN alone does not establish the correct Amazon product.
  // Existing product destinations are retained as explicit ASINs in the records.
  return `https://www.amazon.com/s?k=${encodeURIComponent([book.title, ...book.authors].join(' '))}`;
};

// One completion per book. Completion date and current shelf status are independent.
export const getReadingLog = (books) => {
  const events = books.filter(({ data }) => data.finished !== undefined).map(({ slug, data }) => {
    const finished = readingDateString(data.finished);
    if (finished !== null && !isReadingDate(finished)) {
      throw new Error(`Invalid completion date in ${slug}`);
    }
    return { finished, id: `${slug}-1`, book: data };
  });
  events.sort((a, b) =>
    (b.finished ?? '').localeCompare(a.finished ?? '') ||
    a.book.title.localeCompare(b.book.title, 'en', { sensitivity: 'base' }) ||
    a.id.localeCompare(b.id, 'en')
  );
  return events;
};
