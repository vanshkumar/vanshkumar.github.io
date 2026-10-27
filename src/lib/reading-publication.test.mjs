import test from 'node:test';
import assert from 'node:assert/strict';
import { publicationLayout, formatPublicationYear } from './reading-publication.mjs';

const event = (finished, publicationYear) => ({finished, book: {publicationYear}});

test('publication labels distinguish approximate dates and historical eras', () => {
  assert.equal(formatPublicationYear(-300, { approximate: true }), 'c. 300 BCE');
  assert.equal(formatPublicationYear(-1), '1 BCE');
  assert.equal(formatPublicationYear(1, { includeEra: true }), '1 CE');
  assert.equal(formatPublicationYear(180, { approximate: true }), 'c. 180');
  assert.equal(formatPublicationYear(2025), '2025');
});

test('a dominant empty historical gap is marked and modern years retain space', () => {
  const events = [event('2026-01-15', -300), event('2026-04-15', 1914), event('2026-10-11', 2025)];
  const chart = publicationLayout(events, { year: '2026' });
  const gap = chart.yearBreak;
  assert.ok(gap && gap.from < gap.to);
  assert.ok(chart.yearTicks.some(tick => tick.label === '300 BCE'));
  assert.ok(chart.yearTicks.some(tick => tick.label === '1900 CE'));
  assert.ok(chart.points[0].y < gap.bottom);
  assert.ok(chart.points.slice(1).every(point => point.y > gap.top));
  assert.ok(chart.points[2].y - chart.points[1].y > 50);
  assert.ok(chart.yearBands.every(band => band.bottom + band.height <= gap.bottom || band.bottom >= gap.top));
  const modernOnly = publicationLayout(events.slice(1), { year: '2026' });
  assert.equal(modernOnly.yearBreak, null);
  assert.equal(modernOnly.hasBCE, false);
  assert.equal(chart.points[1].x, modernOnly.points[0].x);
});

test('BCE-only and continuous BCE/CE ranges stay linear without year-zero labels', () => {
  for (const years of [[-300], [-400, -200], [-1, 1, 2], [1], [-9999, 9999]]) {
    const chart = publicationLayout(years.map(year => event('2026-01-01', year)), { year: '2026' });
    assert.ok(chart.yearTicks.every(tick => !/^0(?: CE| BCE)?$/.test(tick.label)));
    assert.ok(chart.points.every(point => Number.isFinite(point.y) && point.y >= 0 && point.y <= 100));
    if (years[0] !== -9999) assert.equal(chart.yearBreak, null);
  }
  const boundary = publicationLayout([-1, 1, 2].map(year => event('2026-01-01', year)));
  assert.equal(boundary.points[1].y - boundary.points[0].y, boundary.points[2].y - boundary.points[1].y);
});

test('a break preserves order and proportional spacing within each segment', () => {
  const years = [-500, -400, -300, 1900, 1950, 2000];
  const chart = publicationLayout(years.map(year => event('2026-01-01', year)), { year: 'all' });
  assert.ok(chart.yearBreak);
  const positions = chart.points.map(point => point.y);
  assert.deepEqual([...positions].sort((a,b) => a-b), positions);
  assert.ok(Math.abs((positions[1]-positions[0]) - (positions[2]-positions[1])) < 1e-10);
  assert.ok(Math.abs((positions[4]-positions[3]) - (positions[5]-positions[4])) < 1e-10);
});

test('publication coordinates preserve dates and years within readable axis bounds', () => {
  const events = [event('2026-01-15',1914), event('2026-10-11',2025)];
  const chart = publicationLayout(events,{year:'2026'});
  assert.deepEqual(chart.yearTicks.map(tick=>tick.label),['1900','1925','1950','1975','2000','2025']);
  assert.deepEqual(chart.dateTicks.map(tick=>tick.label),['Jan','Mar','May','Jul','Sep','Nov']);
  assert.ok(chart.points[0].x < chart.points[1].x);
  assert.ok(chart.points[0].y < chart.points[1].y);
  assert.equal(chart.points[0].x,100*14/365);
  assert.ok(chart.points.every(point=>[point.x,point.y].every(value=>Number.isFinite(value)&&value>=0&&value<=100)));
});

test('monthly publication axes use actual leap-month bounds', () => {
  const chart = publicationLayout([event('2024-02-29',2000)],{year:'2024',month:'02'});
  assert.equal(chart.points[0].x,100*28/29);
  assert.deepEqual(chart.dateTicks.map(tick=>tick.label),['Feb 1','Feb 8','Feb 15','Feb 22','Feb 29']);
  assert.ok(Number.isFinite(chart.points[0].y));
});

test('publication layout handles empty, single-book, and all-time selections', () => {
  assert.equal(publicationLayout([]),null);
  const single=publicationLayout([event('2026-04-01',2020)],{year:'2026'});
  assert.ok(single.yearTicks.length>=2);
  const all=publicationLayout([event('2021-01-01',1873),event('2026-10-11',2025)],{year:'all'});
  assert.deepEqual(all.dateTicks.map(tick=>tick.label),['2021','2022','2023','2024','2025','2026']);
  assert.equal(all.points[0].x,0);
  const early=publicationLayout([event('0099-12-31',1)],{year:'0099'});
  const late=publicationLayout([event('9999-12-31',9999)],{year:'9999'});
  assert.ok([early,late].every(chart=>chart.points.every(point=>[point.x,point.y].every(Number.isFinite))));
});
