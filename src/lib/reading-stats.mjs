import { getReadingLog } from './reading-log.mjs';

export const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const todayInNewYork = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
const exact = (d) => typeof d === 'string' && d.length === 10;
const lastDay = (d) => d.length === 4 ? `${d}-12-31` : d.length === 7
  ? `${d}-${new Date(Date.UTC(+d.slice(0,4), +d.slice(5,7), 0)).getUTCDate()}` : d;
const firstDay = (d) => d.length === 4 ? `${d}-01-01` : d.length === 7 ? `${d}-01` : d;
const sum = (xs, field) => xs.reduce((s, x) => s + (x[field] ?? 0), 0);

export function statsEvents(books) {
  return getReadingLog(books).map(e => ({ ...e, pages: e.book.pageCount ?? null }));
}

export function selectEvents(events, { year = 'all', month = '', through = '' } = {}) {
  return events.filter(e => {
    if (year === 'all') return true;
    if (!e.finished?.startsWith(String(year))) return false;
    if (month && e.finished.slice(5,7) !== String(month).padStart(2,'0')) return false;
    // A partial date participates only if its entire possible interval is in range.
    return !through || lastDay(e.finished) <= `${year}-${through}`;
  });
}

export function groupEvents(events, getKeys, includeUnknown = true) {
  const groups = new Map();
  for (const e of events) {
    const value = getKeys(e);
    let keys = [...new Set((Array.isArray(value) ? value : [value]).filter(v => v !== null && v !== undefined && v !== ''))];
    if (!keys.length && includeUnknown) keys = ['Unknown'];
    for (const key of keys) {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    }
  }
  return [...groups].map(([label, events]) => ({ label: String(label), events, count: events.length }))
    .sort((a,b) => (a.label === 'Unknown') - (b.label === 'Unknown') || b.count-a.count || a.label.localeCompare(b.label));
}

export function readingStats(allEvents, selection = {}) {
  const events = selectEvents(allEvents, selection);
  const dated = events.filter(e => exact(e.finished)).sort((a,b) => a.finished.localeCompare(b.finished) || a.id.localeCompare(b.id));
  const lengths = events.filter(e => e.pages !== null).sort((a,b) => a.pages-b.pages || a.id.localeCompare(b.id));
  const authors = groupEvents(events, e => e.book.authors);
  const newAuthors = authors.filter(({label}) => {
    const history = allEvents.filter(e => e.book.authors.includes(label));
    if (history.some(e => !e.finished)) return false;
    const earliestEnd = history.map(e=>lastDay(e.finished)).sort()[0];
    // Every possible first completion must fall inside the selected period.
    return history.filter(e=>firstDay(e.finished)<=earliestEnd).every(e=>events.includes(e));
  });
  const monthly = groupEvents(events.filter(e => e.finished?.length >= 7), e => e.finished.slice(0,7), false).sort((a,b)=>a.label.localeCompare(b.label));
  let timeline;
  if (!selection.year || selection.year === 'all') {
    timeline = groupEvents(events.filter(e => e.finished), e => e.finished.slice(0,4), false).sort((a,b)=>a.label.localeCompare(b.label));
    if (timeline.length) {
      const byYear = new Map(timeline.map(g=>[g.label,g]));
      timeline = Array.from({length:+timeline.at(-1).label-+timeline[0].label+1},(_,i)=>{
        const label=String(+timeline[0].label+i); return byYear.get(label) ?? {label,events:[],count:0};
      });
    }
  } else {
    timeline = monthNames.map((label,i) => {
      const members = events.filter(e=>e.finished?.slice(5,7) === String(i+1).padStart(2,'0'));
      return {label,events:members,count:members.length};
    }).filter((_,i)=>!selection.month || i+1===+selection.month);
  }
  timeline = timeline.map(g=>({...g,pages:sum(g.events,'pages'),pageCoverage:g.events.filter(e=>e.pages!==null).length}));
  const buckets = {
    genres: groupEvents(events,e=>e.book.genres), moods: groupEvents(events,e=>e.book.moods),
    pace: groupEvents(events,e=>e.book.pace), type: groupEvents(events,e=>e.book.bookType),
    length: groupEvents(events,e=>e.pages===null ? null : e.pages<300 ? '<300' : e.pages<500 ? '300–499' : '500+'),
    authors,
  };
  return {events, count:events.length, pages:sum(events,'pages'), pageCoverage:lengths.length,
    averagePages:lengths.length ? sum(lengths,'pages')/lengths.length : null,
    newAuthors,
    first:dated[0], last:dated.at(-1), shortest:lengths[0], longest:lengths.at(-1),
    busiest:[...monthly].sort((a,b)=>b.count-a.count || a.label.localeCompare(b.label))[0],
    timeline,buckets, scatter:dated.filter(e=>e.book.publicationYear),
    undated:events.filter(e=>!e.finished), partial:events.filter(e=>e.finished && e.finished.length<10)};
}

export function compareYears(events, a, b, mode = 'full', today = todayInNewYork()) {
  const through = mode === 'ytd' ? today.slice(5) : '';
  // Feb 29 clamps to Feb 28 in a non-leap comparison year.
  const selection = year => ({year:String(year), through:through === '02-29' && new Date(Date.UTC(+year,1,29)).getUTCMonth() !== 1 ? '02-28' : through});
  return [readingStats(events,selection(a)),readingStats(events,selection(b))];
}
