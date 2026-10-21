// Shared geometry for the monthly/yearly charts. Missing page counts and
// months beyond the displayed cutoff remain gaps, never zero-valued points.
export function trendLayout(timelines, field, limits = []) {
  const periods = timelines[0] ?? [];
  if (!periods.length) return null;
  const length = periods.length;
  const series = timelines.map((timeline, j) => timeline.map((group, i) => ({
    value: i >= (limits[j] ?? Infinity) || (field === 'pages' && group.count && !group.pageCoverage)
      ? null : group[field],
    x: (i + .5) * 100 / length,
  })));
  const max = Math.max(1, ...series.flatMap(points => points.map(point => point.value ?? 0)));
  const magnitude = 10 ** Math.floor(Math.log10(max / 4));
  const step = Math.max(1, [1, 2, 5, 10].find(n => n * magnitude >= max / 4) * magnitude);
  const ceiling = Math.ceil(max / step) * step;
  const ticks = Array.from({length: Math.round(ceiling / step) + 1}, (_, i) => ({value: i * step, position: i * step / ceiling * 100}));
  for (const points of series) for (const point of points) point.y = point.value === null ? null : point.value / ceiling * 100;
  const runs = series.map(points => {
    const result = [[]];
    for (const point of points) {
      if (point.value === null) result.push([]);
      else result.at(-1).push(point);
    }
    return result.filter(run => run.length);
  });
  let selected = periods.findLastIndex((_, i) => timelines.some((t, j) => t[i]?.count && i < (limits[j] ?? Infinity)));
  if (selected < 0) selected = Math.max(0, periods.findLastIndex((_, i) => series.some(points => points[i]?.value !== null)));
  return {periods, series, runs, ticks, selected, ceiling};
}
