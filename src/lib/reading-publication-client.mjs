import { formatReadingDate } from './reading-log.mjs';
import { formatPublicationYear } from './reading-publication.mjs';

export function bindPublicationChart(root, events) {
  const books = new Map(events.map(event => [event.id, event]));
  function select(point) {
    const chart = point.closest('[data-publication-chart]');
    const event = books.get(point.dataset.bookId);
    if (!chart || !event) return;
    if (point.getAttribute('aria-pressed') === 'true') return;
    for (const other of chart.querySelectorAll('[data-book-id]')) {
      const selected = other === point;
      other.classList.toggle('is-selected', selected);
      other.setAttribute('aria-pressed', String(selected));
      other.tabIndex = selected ? 0 : -1;
    }
    chart.style.setProperty('--selected-x', point.style.left);
    chart.style.setProperty('--selected-y', point.style.bottom);
    chart.querySelector('[data-publication-year]').textContent = formatPublicationYear(event.book.publicationYear, { approximate: event.book.publicationYearApproximate });
    chart.querySelector('[data-publication-title]').textContent = event.book.title;
    chart.querySelector('[data-publication-authors]').textContent = event.book.authors.join(', ');
    const finished = chart.querySelector('[data-publication-finished]');
    finished.textContent = formatReadingDate(event.finished);
    finished.dateTime = event.finished;
  }
  const pointFor = event => event.target instanceof Element ? event.target.closest('[data-book-id]') : null;
  // Enlarged hit targets overlap in dense clusters. Resolve pointer selection
  // by marker distance, rather than whichever button happens to be on top.
  function nearestPoint(event) {
    const plot = event.target instanceof Element ? event.target.closest('.publication-plot') : null;
    let nearest = null, distance = 20;
    for (const point of plot?.querySelectorAll('[data-book-id]') ?? []) {
      const box = point.getBoundingClientRect();
      const d = Math.hypot(event.clientX-box.x-box.width/2, event.clientY-box.y-box.height/2);
      if (d < distance) { nearest = point; distance = d; }
    }
    return nearest;
  }
  // Only physical pointer movement changes hover selection; raising a focused
  // marker above its neighbor must not undo keyboard navigation.
  root.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const point = nearestPoint(event);
    if (point) select(point);
  });
  root.addEventListener('click', event => {
    const point = event.detail === 0 ? pointFor(event) : nearestPoint(event);
    if (point) { select(point); point.focus({preventScroll: true}); }
  });
  root.addEventListener('focusin', event => {
    const point = pointFor(event);
    if (point) select(point);
  });
  root.addEventListener('keydown', event => {
    const point = pointFor(event);
    if (!point || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const points = [...point.closest('[data-publication-chart]').querySelectorAll('[data-book-id]')];
    const index = points.indexOf(point);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? points.length-1
      : (index+(['ArrowLeft','ArrowDown'].includes(event.key) ? -1 : 1)+points.length)%points.length;
    points[next].focus({preventScroll: true});
  });
}
