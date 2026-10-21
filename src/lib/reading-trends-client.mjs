export function bindTrendCharts(root) {
  const columnFor = event => event.target instanceof Element ? event.target.closest('[data-trend-column]') : null;
  function select(column) {
    if (column.getAttribute('aria-pressed') === 'true') return;
    const chart = column.closest('[data-trend-chart]');
    for (const other of chart.querySelectorAll('[data-trend-column]')) {
      const selected = other === column;
      other.setAttribute('aria-pressed', String(selected));
      other.tabIndex = selected ? 0 : -1;
    }
    chart.querySelector('[data-trend-period]').textContent = column.dataset.trendLabel;
    const values = JSON.parse(column.dataset.trendValues);
    chart.querySelectorAll('[data-trend-value]').forEach((node, i) => { node.textContent = values[i]; });
  }
  root.addEventListener('pointermove', event => {
    const column = columnFor(event);
    if (column && event.pointerType === 'mouse') select(column);
  });
  root.addEventListener('click', event => {
    const column = columnFor(event);
    if (column) { select(column); column.focus({preventScroll: true}); }
  });
  root.addEventListener('focusin', event => {
    const column = columnFor(event);
    if (column) select(column);
  });
  root.addEventListener('keydown', event => {
    const column = columnFor(event);
    if (!column || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const columns = [...column.closest('[data-trend-chart]').querySelectorAll('[data-trend-column]')];
    const index = columns.indexOf(column);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? columns.length - 1
      : (index + (event.key === 'ArrowLeft' ? -1 : 1) + columns.length) % columns.length;
    columns[next].focus({preventScroll: true});
  });
}
