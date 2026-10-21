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

export const validReadingInterval = ({ started, finished }) => {
  if (!started || !finished) return true;
  // Partial dates express uncertainty; reject only definitely reversed intervals.
  const first = started.padEnd(10, '-01').slice(0, 10);
  const last = finished.length === 4 ? `${finished}-12-31`
    : finished.length === 7 ? `${finished}-31` : finished;
  return first <= last;
};

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
  const isbn = (book.isbn ?? '').replace(/[\s-]/g, '').toUpperCase();
  if (!['digital', 'audio'].includes(book.format)) {
    if (/^\d{9}[\dX]$/.test(isbn)) {
      const sum = [...isbn].reduce((total, digit, i) => total + (digit === 'X' ? 10 : Number(digit)) * (10 - i), 0);
      if (sum % 11 === 0) return `https://www.amazon.com/dp/${isbn}`;
    }
    if (/^978\d{10}$/.test(isbn)) {
      const sum = [...isbn].reduce((total, digit, i) => total + Number(digit) * (i % 2 ? 3 : 1), 0);
      if (sum % 10 === 0) {
        const body = isbn.slice(3, 12);
        const check = (11 - [...body].reduce((total, digit, i) => total + Number(digit) * (10 - i), 0) % 11) % 11;
        return `https://www.amazon.com/dp/${body}${check === 10 ? 'X' : check}`;
      }
    }
  }
  // Kindle, audio, 979-prefix editions, and books without an ISBN need an ASIN
  // lookup. A title/author search remains useful until an explicit ASIN is set.
  return `https://www.amazon.com/s?k=${encodeURIComponent([book.title, ...book.authors].join(' '))}`;
};

// One event per completed read, including undated reads and rereads. Current
// status is independent: a book can be on the to-read list for a future reread.
export const getReadingLog = (books) => {
  const events = books.flatMap(({ slug, data }) => (data.reads ?? []).map((read, index) => {
    const finished = readingDateString(read.finished);
    if (finished !== null && !isReadingDate(finished)) {
      throw new Error(`Invalid completion date in ${slug}, read ${index + 1}`);
    }
    return { ...read, finished, id: `${slug}-${index + 1}`, book: data };
  }));
  events.sort((a, b) =>
    (b.finished ?? '').localeCompare(a.finished ?? '') ||
    a.book.title.localeCompare(b.book.title, 'en', { sensitivity: 'base' }) ||
    a.id.localeCompare(b.id, 'en')
  );
  return events;
};
