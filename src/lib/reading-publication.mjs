const day = 86400000;
const utcDate = (year, month = 1, date = 1) => {
  const value = new Date(0);
  value.setUTCFullYear(year, month-1, date);
  return value.getTime();
};
const monthLabel = new Intl.DateTimeFormat('en-US', {month: 'short', timeZone: 'UTC'});

// Coordinates are percentages so labels and book targets keep their size on phones.
export function publicationLayout(events, selection = {}) {
  if (!events.length) return null;
  const years = events.map(event => event.book.publicationYear);
  const low = Math.min(...years), high = Math.max(...years);
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000].find(n => n >= (high-low)/5) ?? 2000;
  const minYear = Math.floor(low/step)*step;
  const maxYear = Math.max(minYear+step, Math.ceil(high/step)*step);
  const yearPosition = year => 100*(year-minYear)/(maxYear-minYear);
  const yearTicks = Array.from({length: Math.round((maxYear-minYear)/step)+1}, (_,i) => {
    const year = minYear+i*step;
    return {label: String(year), position: yearPosition(year)};
  });

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
    yearTicks,
    dateTicks: dateTicks.map(tick => ({...tick, position: datePosition(tick.value)})),
    points: events.map(event => ({event, x: datePosition(Date.parse(event.finished)), y: yearPosition(event.book.publicationYear)})),
  };
}
