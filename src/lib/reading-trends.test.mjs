import test from 'node:test';
import assert from 'node:assert/strict';
import { trendLayout } from './reading-trends.mjs';

const month=(label,count,pages=0,pageCoverage=count)=>({label,count,pages,pageCoverage});

test('trend axes bound the data with evenly spaced integer ticks and centered periods',()=>{
  const layout=trendLayout([[month('Jan',3),month('Feb',6),month('Mar',2)]],'count');
  assert.deepEqual(layout.ticks.map(t=>t.value),[0,2,4,6]);
  assert.equal(layout.series[0][1].x,50);
  assert.equal(layout.series[0][1].y,100);
  const pages=trendLayout([[month('Jan',3,2601)]],'pages');
  assert.deepEqual(pages.ticks.map(t=>t.value),[0,1000,2000,3000]);
  assert.ok(pages.series[0][0].y<100);
});

test('page charts leave missing lengths and cutoff months as gaps, retaining real zeros',()=>{
  const data=[month('Jan',2,200),month('Feb',1,0,0),month('Mar',0),month('Apr',1,300)];
  const layout=trendLayout([data],'pages',[3]);
  assert.deepEqual(layout.series[0].map(p=>p.value),[200,null,0,null]);
  assert.deepEqual(layout.runs[0].map(run=>run.map(p=>p.value)),[[200],[0]]);
  assert.equal(layout.selected,1);
});

test('comparison series share a scale but keep their individual cutoffs',()=>{
  const layout=trendLayout([[month('Jan',4),month('Feb',7)],[month('Jan',8),month('Feb',2)]],'count',[1,2]);
  assert.equal(layout.ceiling,8);
  assert.deepEqual(layout.series.map(s=>s.map(p=>p.value)),[[4,null],[8,2]]);
  assert.equal(layout.series[0][0].y,50);
  assert.equal(layout.selected,1);
  assert.equal(trendLayout([[]],'count'),null);
  const empty=trendLayout([[month('Jan',0)]],'pages');
  assert.equal(empty.series[0][0].value,0);
  assert.equal(empty.series[0][0].x,50);
  assert.ok(Number.isFinite(empty.series[0][0].y));
});
