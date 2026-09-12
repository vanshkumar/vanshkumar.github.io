# Source manifest

Verified 2026-09-10 against the two local PDFs. These identifiers describe the
supplied files and the publication statements inside them; they do not certify
the files' distribution history. No outside edition was substituted.

## `baby-2021`

- Title: *The Montessori Baby: A Parent's Guide to Nurturing Your Baby with Love,
  Respect, and Understanding*.
- Authors: Simone Davies and Junnifa Uzodike, both credited on physical PDF page 3.
- Publisher: Workman Publishing, New York.
- Publication statement: copyright 2021, Jacaranda Tree Montessori and Junnifa
  Uzodike; eISBN **9781523514069**, physical PDF page 310. No numbered edition or
  printing statement was found on that copyright page; do not call it a verified
  first printing. Illustration credit: Sanny van Loon.
- Exact path:
  `/Users/vanshkumar/Documents/repos/vanshkumar.github.io/montessori-books/the-montessori-baby-a-parents-guide-to-nurturing-your-baby-with-love-respect-and-understanding-9781523514069.pdf`
- Physical PDF pages: **310**, counted from the first physical PDF page as page 1,
  including blank/image pages. Physical page 1 is visually blank; the image cover
  is physical page 2.
- File size: **10,117,663 bytes**.
- SHA-256: `517a095024dff9cc43d72fd2ba60516bc50ee6aba686ee8277d0e695b785f04f`.
- Format: all pages 612 x 792 points; metadata identifies calibre 3.32.0 as creator
  and producer. Its creation timestamp is a file-conversion timestamp, not the
  book's publication date. Metadata lists only Davies as author, so prefer the
  actual title page for authorship.
- Pagination: no PDF `/PageLabels` entry. This is a reflowed document without a
  dependable printed-page equivalent. **Cite PDF pages only.** Do not import print
  references from another edition, infer an offset, or treat internal chapter
  numbers as page numbers. Internal textual cross-references require locating
  the named destination in this file.
- Visual checks: title page 3, appendix boundary 294, copyright page 310. Additional
  visual and textual checks are recorded in `BABY_SOURCE_NOTES.md`.

## `toddler-2019`

- Title: *The Montessori Toddler: A Parent's Guide to Raising a Curious and
  Responsible Human Being*.
- Author: Simone Davies; illustrations by Hiyoko Imai, physical PDF page 2.
- Publisher: Workman Publishing, New York.
- Publication statement: copyright 2019, Jacaranda Tree Montessori; **First printing
  February 2019**; ISBN **978-1-5235-0689-7**, physical PDF page 3. This is the
  printing statement present in the supplied file, not a claim about every copy
  bearing the same title.
- Exact path:
  `/Users/vanshkumar/Documents/repos/vanshkumar.github.io/montessori-books/The Montessori Toddler - Simone Davies _Worldfreebooks.com_.pdf`
- Physical PDF pages: **257**, counted from the first physical PDF page as page 1,
  including front matter and image/blank pages.
- File size: **7,036,292 bytes**.
- SHA-256: `d4d66faa1169ae6c3623a4adaa23f611cb94c67625932b5dc53db48ffe91864b`.
- Format: pages approximately 477 x 675 points (some 477.12 x 675.12); Acrobat
  metadata. Use the publication page, not metadata dates, to identify the book.
- PDF viewer labels: physical page 1 = `Cover`; physical pages 2-9 = `i-viii`;
  physical pages 10-257 = `1-248`. These are the file's explicit `/PageLabels`.
- Printed folios sampled directly in rendered pages:

  | Physical PDF page | Visible printed folio |
  | --- | --- |
  | 11 | 2 |
  | 29 | 20 |
  | 187 | 178 |
  | 210 | 201 |
  | 245 | 236 |
  | 257 | 248 |

  These checks agree with **physical PDF page minus 9** in the numbered body.
  The offset is a navigation aid, not independent verification for every future
  citation. Physical page 10 is the introduction opener; its large `1` is the
  chapter number and it has no small printed folio. Do not call it a visually
  verified printed page 1 simply because the viewer label is `1`. Likewise, Roman
  viewer labels in front matter are not necessarily visible printed folios.
- Citation rule: record physical PDF pages for every reference. Add printed
  references only after inspecting the cited page(s), and record how they were
  verified. For an unnumbered opener use a PDF reference plus its section heading;
  do not fabricate a visible folio. Future researchers verify every cited span,
  including its continuation pages and tables.

## Citation and verification examples

- Reader reference: `The Montessori Baby, "Activities list for babies," PDF p. 294.`
- Reader reference: `The Montessori Toddler, "Individual development" and
  "Observation," p. 20 (PDF p. 29).`
- Structured references use `sourceId`, one-based inclusive `pdfPages`, the section
  heading, a precise local locator, and a separately verified printed-page field.
  The concrete contract is in `EVIDENCE_CONTRACT.md`.

`tmp/book-text/baby-pages.json` and `tmp/book-text/toddler-pages.json` are ignored
extraction aids supplied by the coordinator. Their `pdfPage` values are physical
pages. They are not visual evidence, full-read certifications, or deliverables.
The two original files remain the authority. Source text and page renders stay in
ignored `tmp/`; no PDFs, extracts, or copied book artwork go into `public/`.

If either file's fingerprint changes, stop carrying its old page references
forward until the edition, count, and affected locators have been reverified.
