// Reader-facing metadata only. Source fingerprints and review logs live outside src/.
export const topics = [
  { id: 'play-discovery', label: 'Play & discovery' },
  { id: 'everyday-care', label: 'Everyday care' },
  { id: 'connection-feelings', label: 'Connection & feelings' },
  { id: 'home-that-helps', label: 'A home that helps' },
  { id: 'you-family', label: 'For you & your family' },
];

export const books = {
  'baby-2021': { title: 'The Montessori Baby', authors: 'Simone Davies and Junnifa Uzodike' },
  'toddler-2019': { title: 'The Montessori Toddler', authors: 'Simone Davies' },
};

export const kindLabels = {
  invitation: 'A small invitation',
  perspective: 'A perspective',
  'everyday-situation': 'An everyday situation',
};

export function pageLabel(reference) {
  // The unchanged prototype citations are not newly verified structured references.
  if (reference.legacyPageLabel) return reference.legacyPageLabel;
  const ranges = reference.pdfPages.map(({ start, end }) => start === end ? `${start}` : `${start}–${end}`);
  const pdf = `PDF ${reference.pdfPages.length === 1 && reference.pdfPages[0].start === reference.pdfPages[0].end ? 'p.' : 'pp.'} ${ranges.join(', ')}`;
  if (!reference.printedPages?.length) return pdf;
  return `Printed ${reference.printedPages.length === 1 ? 'p.' : 'pp.'} ${reference.printedPages.map(page => page.printedPage).join(', ')} (${pdf})`;
}
