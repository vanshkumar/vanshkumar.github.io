import test from 'node:test';
import assert from 'node:assert/strict';
import { statsEvents, readingStats, compareYears } from './reading-stats.mjs';
import { renderStats } from './reading-stats-render.mjs';
const book=(slug,finished,data={})=>({slug,data:{title:slug,authors:['Author'],...(finished===undefined?{}:{finished}),...data}});

test('counts completion events independently of status and handles partial/unknown dates',()=>{
 const events=statsEvents([book('one','2024',{status:'to-read'}),book('two','2025-02'),book('three',null),book('unread',undefined,{status:'read'})]);
 assert.equal(readingStats(events,{year:'all'}).count,3);
 assert.equal(readingStats(events,{year:'2024'}).count,1);
 assert.equal(readingStats(events,{year:'2024',month:'01'}).count,0);
 assert.equal(readingStats(events,{year:'2025',month:'02'}).count,1);
 assert.equal(readingStats(events,{year:'all'}).timeline[0].count,1);
 assert.equal(readingStats(events,{year:'2024'}).timeline.reduce((s,m)=>s+m.count,0),0);
});
test('page totals and averages use only books with known reference lengths',()=>{
 const events=statsEvents([book('a','2024-01-01',{pageCount:200}),book('b','2024-02-01'),book('c','2024-03-01',{pageCount:500})]);
 const stats=readingStats(events,{year:'2024'});
 assert.equal(stats.pages,700);assert.equal(stats.pageCoverage,2);assert.equal(stats.averagePages,350);
 assert.deepEqual(stats.buckets.length.map(g=>g.label).sort(),['500+','<300','Unknown']);
});
test('multi-label stats count each read once per label and disclose unknowns',()=>{
 const events=statsEvents([book('a','2024-01-01',{genres:['science fiction','science fiction','classics']}),book('b','2024-02-01')]);
 const stats=readingStats(events,{year:'2024'});
 assert.equal(stats.buckets.genres.length,3);
 assert.ok(stats.buckets.genres.every(g=>g.count===1));
});
test('new authors use full history, including after JSON serialization',()=>{
 const events=JSON.parse(JSON.stringify(statsEvents([
  book('a','2023-01-01'),book('b','2024-01-01'),
  book('c','2024-02-01',{authors:['New author']}),
  book('d',null,{authors:['Uncertain author']}),book('e','2024-03-01',{authors:['Uncertain author']})
 ])));
 assert.deepEqual(readingStats(events,{year:'2024'}).newAuthors.map(g=>g.label),['New author']);
});
test('first and last highlights use only exact calendar dates',()=>{
 const events=statsEvents([book('a','2024-03-01'),book('b','2024-04-01'),book('c','2024'),book('d',null)]);
 const stats=readingStats(events,{year:'2024'});
 assert.equal(stats.first.finished,'2024-03-01');assert.equal(stats.last.finished,'2024-04-01');
});
test('matching YTD clamps leap days and excludes uncertain cutoff intervals',()=>{
 const events=statsEvents([...['2023-02-28','2023-03-01','2024-02-29','2024-02','2024','2024-03-01'].map((date,i)=>book(String(i),date))]);
 const [a,b]=compareYears(events,'2023','2024','ytd','2024-02-29');
 assert.equal(a.count,1);assert.equal(b.count,2);
 const [,early]=compareYears(events,'2023','2024','ytd','2024-02-15');assert.equal(early.count,0);
});
test('empty periods produce stable empty summaries',()=>{
 const stats=readingStats([],{year:'2024'});
 assert.equal(stats.count,0);assert.equal(stats.averagePages,null);
 assert.equal(stats.timeline.length,12);assert.deepEqual(stats.scatter,[]);
});

test('approximate BCE books appear in the chart, accessible labels, and dates table', async()=>{
 const fs=await import('node:fs/promises');const {default:matter}=await import('gray-matter');
 const c=matter(await fs.readFile(new URL('../../vault/pages/reading-stats.md',import.meta.url),'utf8')).data.readingStats;
 const events=statsEvents([
  book('Recent book','2024-01-01',{publicationYear:2000}),
  book('Ancient book','2024-02-01',{publicationYear:-300,publicationYearApproximate:true})
 ]);
 assert.equal(readingStats(events,{year:'2024'}).scatter.length,2);
 const html=renderStats(events,{year:'2024'},c);
 assert.ok(html.includes('Published c. 300 BCE'));
 assert.ok(html.includes('data-publication-year>c. 300 BCE</span>'));
 assert.ok(html.includes('<td>c. 300 BCE</td>'));
 assert.ok(html.includes('class="publication-break" role="note"'));
 assert.ok(html.includes('Year axis skips from 300 BCE to 2000'));
 const modern=renderStats(events,{year:'2024',month:'01'},c);
 assert.ok(!modern.includes('class="publication-break"'));
});
test('rendered titles and chart labels cannot inject HTML',async()=>{
 const fs=await import('node:fs/promises');const {default:matter}=await import('gray-matter');
 const c=matter(await fs.readFile(new URL('../../vault/pages/reading-stats.md',import.meta.url),'utf8')).data.readingStats;
 const html=renderStats(statsEvents([book('<script>bad</script>','2024-01-01',{publicationYear:2001,genres:['<img src=x onerror=bad>']})]),{year:'2024'},c);
 assert.ok(!html.includes('<script>bad'));assert.ok(!html.includes('<img src=x'));
 assert.ok(html.includes('&lt;script&gt;bad'));
});

test('new-author highlights exclude uncertain prior dates within the selected year',()=>{
 const events=statsEvents([book('a','2024'),book('b','2024-03-01'),book('c','2024-03-01')]);
 assert.equal(readingStats(events,{year:'2024',month:'03'}).newAuthors.length,0);
 assert.equal(readingStats(events,{year:'2024'}).newAuthors.length,1);
});
test('a monthly timeline contains only the selected month',()=>{
 const stats=readingStats(statsEvents([book('a','2024-03-01')]),{year:'2024',month:'03'});
 assert.equal(stats.timeline.length,1);assert.equal(stats.timeline[0].label,'March');
});

test('unknown page totals render as missing rather than zero',async()=>{
 const fs=await import('node:fs/promises');const {default:matter}=await import('gray-matter');
 const c=matter(await fs.readFile(new URL('../../vault/pages/reading-stats.md',import.meta.url),'utf8')).data.readingStats;
 const html=renderStats(statsEvents([book('Unknown length','2024-01-01')]),{year:'2024'},c);
 assert.ok(html.includes('<dt>Estimated pages</dt><dd>—</dd>'));
 assert.ok(html.includes('<td>—</td>'));
});
