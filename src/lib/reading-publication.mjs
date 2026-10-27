const day = 86400000;
const utcDate = (year, month = 1, date = 1) => {
  const value = new Date(0);
  value.setUTCFullYear(year, month-1, date);
  return value.getTime();
};
const monthLabel = new Intl.DateTimeFormat('en-US', {month: 'short', timeZone: 'UTC'});

export function formatPublicationYear(year, { approximate = false } = {}) {
  const label = year < 0 ? `${Math.abs(year)} BCE` : String(year);
  return `${approximate ? 'c. ' : ''}${label}`;
}

// Adjacent historical years 1 BCE and 1 CE are one year apart, not two.
const yearValue = year => year < 0 ? year + 1 : year;
const tickSteps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
function yearSegment(years, bottom, top, singleTick = false) {
  const low = Math.min(...years), high = Math.max(...years);
  if (singleTick && low === high) {
    return { min: low, max: high, position: () => (bottom + top) / 2,
      ticks: [{ label: formatPublicationYear(low), position: (bottom + top) / 2 }] };
  }
  const intervals = Math.max(1, Math.round((top - bottom) / 16));
  const step = tickSteps.find(n => n >= (high - low) / Math.min(5, intervals)) ?? 5000;
  let min = Math.floor(low / step) * step;
  let max = Math.max(min + step, Math.ceil(high / step) * step);
  if (min === 0) min = 1;
  if (max === 0) max = -1;
  // A single 1 BCE point would otherwise have equal bounds after removing zero.
  if (min === max) min -= step;
  const position = year => bottom + (top - bottom) * (yearValue(year) - yearValue(min)) / (yearValue(max) - yearValue(min));
  const tickYears = [];
  for (let year = Math.ceil(min / step) * step; year <= max; year += step) {
    if (year !== 0) tickYears.push(year);
  }
  if (min === 1 && !tickYears.includes(1)) tickYears.unshift(1);
  if (max === -1 && !tickYears.includes(-1)) tickYears.push(-1);
  return { min, max, position, ticks: tickYears.map(year => ({
    label: formatPublicationYear(year), position: position(year)
  })) };
}

function publicationScale(years) {
  const ordered = [...new Set(years)].sort((a, b) => a - b);
  let split = 0, gap = 0;
  for (let i = 1; i < ordered.length; i++) {
    const distance = yearValue(ordered[i]) - yearValue(ordered[i - 1]);
    if (distance > gap) { gap = distance; split = i; }
  }
  // Compress only a dominant, unoccupied gap. Filtered modern-only charts stay linear.
  const shouldBreak = gap >= 500 && gap > .65 * (yearValue(ordered.at(-1)) - yearValue(ordered[0]));
  let segments, yearBreak = null;
  if (shouldBreak) {
    const lower = ordered.slice(0, split), upper = ordered.slice(split);
    const lowerSpan = yearValue(lower.at(-1)) - yearValue(lower[0]);
    const upperSpan = yearValue(upper.at(-1)) - yearValue(upper[0]);
    const bottom = Math.max(20, Math.min(65, 90 * lowerSpan / (lowerSpan + upperSpan || 1)));
    segments = [yearSegment(lower, 0, bottom, true), yearSegment(upper, bottom + 10, 100, true)];
    yearBreak = { bottom, top: bottom + 10, from: segments[0].max, to: segments[1].min };
  } else {
    segments = [yearSegment(ordered, 0, 100)];
  }
  return {
    hasBCE: ordered[0] < 0,
    yearBreak,
    yearTicks: segments.flatMap(segment => segment.ticks),
    yearBands: segments.flatMap(segment => segment.ticks.slice(0, -1).map((tick, i) => ({
      bottom: tick.position, height: segment.ticks[i + 1].position - tick.position, shaded: i % 2 === 0
    }))),
    position: year => segments[yearBreak && year > yearBreak.from ? 1 : 0].position(year)
  };
}

// Coordinates are percentages so labels and book targets keep their size on phones.
export function publicationLayout(events, selection = {}) {
  if (!events.length) return null;
  const scale = publicationScale(events.map(event => event.book.publicationYear));

  const dates = events.map(event => Date.parse(event.finished));
  const firstYear = selection.year && selection.year !== 'all' ? +selection.year : new Date(Math.min(...dates)).getUTCFullYear();
  const lastYear = selection.year && selection.year !== 'all' ? +selection.year : new Date(Math.max(...dates)).getUTCFullYear();
  let start = utcDate(firstYear), end = utcDate(lastYear+1), dateTicks = [];
  if (selection.month && selection.year !== 'all') {
    const month = +selection.month;
    start = utcDate(firstYear, month);
    end = month === 12 ? utcDate(firstYear+1) : utcDate(firstYear, month+1);
    for (let date = 1; date <= (end-start)/day; date += 7) {
      dateTicks.push({value: start+(date-1)*day, label: `${monthLabel.format(start)} ${date}`});
    }
  } else if (firstYear === lastYear) {
    dateTicks = [1, 3, 5, 7, 9, 11].map(month => ({value: utcDate(firstYear, month), label: monthLabel.format(utcDate(firstYear, month))}));
  } else {
    const interval = Math.max(1, Math.ceil((lastYear-firstYear+1)/6));
    for (let year = firstYear; year <= lastYear; year += interval) dateTicks.push({value: utcDate(year), label: String(year)});
  }
  const datePosition = value => 100*(value-start)/(end-start);
  return {
    yearTicks: scale.yearTicks, yearBands: scale.yearBands, yearBreak: scale.yearBreak, hasBCE: scale.hasBCE,
    dateTicks: dateTicks.map(tick => ({...tick, position: datePosition(tick.value)})),
    points: events.map(event => ({event, x: datePosition(Date.parse(event.finished)), y: scale.position(event.book.publicationYear)})),
  };
}
