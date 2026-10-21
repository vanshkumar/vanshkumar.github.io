import test from 'node:test';
import assert from 'node:assert/strict';
import { publicationLayout } from './reading-publication.mjs';

const event = (finished, publicationYear) => ({finished, book: {publicationYear}});

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
