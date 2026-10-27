import { amazonBookUrl, formatReadingDate } from './reading-log.mjs';
import { readingStats, compareYears, todayInNewYork } from './reading-stats.mjs';
import { publicationLayout, formatPublicationYear } from './reading-publication.mjs';
import { trendLayout } from './reading-trends.mjs';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e = escapeHtml;
const number = n => n.toLocaleString('en-US', {maximumFractionDigits:1});
const pageNumber = (value,known,total) => !known && total ? '—' : number(value);
const copy = (s, values) => s.replace(/\{(\w+)\}/g, (_,key) => values[key] ?? '');
function bookLink(event,c) {
  const b=event.book;
  return `<a href="${e(amazonBookUrl(b))}" target="_blank" rel="noopener noreferrer">${e(b.title)}</a> <span class="stats-byline">${e(b.authors.join(', '))}</span>${b.notesUrl ? ` <a href="${e(b.notesUrl)}">(${e(c.notes)})</a>` : ''}`;
}
export function bookList(events,c) {
  return `<ol class="stats-books" role="list">${events.map(event=>`<li><span class="stats-book-description">${bookLink(event,c)}</span><span class="stats-book-date">${event.finished ? e(formatReadingDate(event.finished)) : e(c.unknownDate)}</span></li>`).join('')}</ol>`;
}
function bars(title,groups,c,key='authors') {
  const max=Math.max(1,...groups.map(g=>g.count));
  const total=groups.reduce((sum,g)=>sum+g.count,0);
  const color=(g,i)=>key==='type'?g.label==='fiction'?'#476b4d':g.label==='nonfiction'?'#ad704d':'#8a8e83':['#476b4d','#87976e','#b29458','#ad704d'][i%4];
  let distribution='';
  if (total && key==='type') {
    let start=0;
    const stops=groups.map((g,i)=>{const end=start+g.count/total*100;const stop=`${color(g,i)} ${start}% ${end}%`;start=end;return stop;});
    distribution=`<div class="stats-donut" style="background:conic-gradient(${stops.join(',')})" aria-hidden="true"><span><strong>${total}</strong>${e(c.books)}</span></div>`;
  } else if (total && ['pace','length'].includes(key)) {
    distribution=`<div class="stats-distribution" aria-hidden="true">${groups.map((g,i)=>`<span style="flex:${g.count};background:${color(g,i)}"></span>`).join('')}</div>`;
  }
  return `<details class="stats-panel stats-panel-${key}"><summary><h3>${e(title)}</h3></summary>${distribution}<div class="stats-bars">${groups.map((g,i)=>`<details class="stats-bar" style="--bar:${100*g.count/max}%;${['type','pace','length'].includes(key)?`--bar-color:${color(g,i)};`:''}"><summary><span class="stats-bar-label">${e(g.label==='Unknown'?c.unknown:key==='type'?(c[g.label]??g.label):g.label)}</span><strong>${g.count}</strong><span class="stats-bar-track" aria-hidden="true"><i></i></span></summary>${bookList(g.events,c)}</details>`).join('')||`<p>${e(c.noData)}</p>`}</div></details>`;
}
function trendChart(timelines,field,labels,c,limits=[]) {
  const layout=trendLayout(timelines,field,limits);
  if (!layout) return '';
  const {periods,series,runs,ticks,selected}=layout;
  const title=field==='pages'?c.pages:c.completions;
  const value=(j,i)=>series[j][i]?.value===null?'—':number(series[j][i]?.value??0);
  const points=run=>run.map(p=>`${p.x*10},${100-p.y}`).join(' ');
  return `<figure class="stats-trend stats-trend-${field}${periods.length>8?' stats-trend-dense':''}" data-trend-chart>
    <figcaption><span class="stats-trend-title">${e(title)}</span><span class="stats-trend-readout"><span data-trend-period>${e(periods[selected].label)}</span>${series.map((_,j)=>`<span class="stats-trend-value stats-series-${j}">${labels[j]?`<span class="stats-trend-year">${e(labels[j])}</span>`:''}<strong data-trend-value>${value(j,selected)}</strong></span>`).join('')}</span></figcaption>
    <div class="stats-trend-plot" role="group" aria-label="${e(title)}">
      ${ticks.map(tick=>`<span class="stats-trend-grid" style="bottom:${tick.position}%" aria-hidden="true"><span>${number(tick.value)}</span></span>`).join('')}
      ${field==='pages'?`<svg class="stats-trend-lines" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">${runs.map((segments,j)=>segments.map(run=>`<polygon class="stats-trend-area stats-series-${j}" points="${run[0].x*10},100 ${points(run)} ${run.at(-1).x*10},100"/><polyline class="stats-trend-line stats-series-${j}" points="${points(run)}"/>`).join('')).join('')}</svg>`:''}
      <div class="stats-trend-columns" style="--periods:${periods.length}">${periods.map((group,i)=>{
        const values=series.map((_,j)=>value(j,i));
        const label=`${group.label}, ${title}: ${values.map((v,j)=>`${labels[j]?`${labels[j]}: `:''}${v}`).join('; ')}`;
        return `<button type="button" class="stats-trend-column" data-trend-column data-trend-label="${e(group.label)}" data-trend-values="${e(JSON.stringify(values))}" aria-label="${e(label)}" aria-pressed="${i===selected}" tabindex="${i===selected?0:-1}">${series.map((s,j)=>s[i].value===null?'':field==='count'?`<span class="stats-trend-bar stats-series-${j}" style="height:${s[i].y}%" aria-hidden="true"></span>`:`<span class="stats-trend-dot stats-series-${j}" style="bottom:${s[i].y}%" aria-hidden="true"></span>`).join('')}<span class="stats-trend-label" aria-hidden="true">${e(/^\d{4}$/.test(group.label)?group.label:group.label.slice(0,3))}</span></button>`;
      }).join('')}</div>
    </div>
  </figure>`;
}
function timeline(stats,c,limit) {
  return `${trendChart([stats.timeline],'count',[''],c,[limit])}${trendChart([stats.timeline],'pages',[''],c,[limit])}<details class="stats-table-details"><summary>${e(c.timelineTable)}</summary><div class="stats-table-wrap"><table><thead><tr><th>${e(c.period)}</th><th>${e(c.books)}</th><th>${e(c.pages)}</th></tr></thead><tbody>${stats.timeline.map(g=>`<tr><th><details><summary>${e(g.label)}</summary>${bookList(g.events,c)}</details></th><td>${g.count}</td><td>${pageNumber(g.pages,g.pageCoverage,g.count)}</td></tr>`).join('')}</tbody></table></div></details>`;
}
function scatter(events,selection,c) {
  const layout=publicationLayout(events,selection);
  if (!layout) return `<p>${e(c.noData)}</p>`;
  const selected=layout.points.at(-1);
  const yearLabel=event=>formatPublicationYear(event.book.publicationYear,{approximate:event.book.publicationYearApproximate});
  const type=event=>['fiction','nonfiction'].includes(event.book.bookType)?event.book.bookType:'unknown';
  const types=['fiction','nonfiction','unknown'].filter(key=>events.some(event=>type(event)===key));
  return `<figure class="publication-chart${layout.hasBCE?' publication-has-bce':''}" data-publication-chart aria-label="${e(c.publicationChartLabel)}" style="--selected-x:${selected.x}%;--selected-y:${selected.y}%">
    <figcaption class="publication-heading"><span>${e(c.publicationYear)}</span><span class="publication-legend">${types.map(key=>`<span><i class="publication-symbol publication-${key}" aria-hidden="true"></i>${e(c[key])}</span>`).join('')}</span></figcaption>
    <div class="publication-plot" role="group" aria-label="${e(c.publicationChartLabel)}">
      ${layout.yearBands.map(band=>`<span class="publication-band" style="bottom:${band.bottom}%;height:${band.height}%;opacity:${band.shaded?1:0}" aria-hidden="true"></span>`).join('')}
      ${layout.dateTicks.map(tick=>`<span class="publication-date-grid" style="left:${tick.position}%" aria-hidden="true"><span>${e(tick.label)}</span></span>`).join('')}
      ${layout.yearTicks.map(tick=>`<span class="publication-year-grid" style="bottom:${tick.position}%" aria-hidden="true"><span>${e(tick.label)}</span></span>`).join('')}
      <span class="publication-guide publication-guide-x" aria-hidden="true"></span><span class="publication-guide publication-guide-y" aria-hidden="true"></span>
      ${layout.yearBreak?`<div class="publication-break" role="note" aria-label="${e(copy(c.publicationAxisBreakTemplate,{from:formatPublicationYear(layout.yearBreak.from,{includeEra:true}),to:formatPublicationYear(layout.yearBreak.to,{includeEra:true})}))}" style="bottom:${layout.yearBreak.bottom}%;height:${layout.yearBreak.top-layout.yearBreak.bottom}%"><span aria-hidden="true">${e(c.publicationAxisBreak)}</span></div>`:''}
      ${layout.points.map(point=>{
        const active=point===selected;
        const label=`${point.event.book.title}, ${c.publicationYear} ${yearLabel(point.event)}, ${c.finished} ${formatReadingDate(point.event.finished)}`;
        return `<button type="button" class="publication-point publication-${type(point.event)}${active?' is-selected':''}" data-book-id="${e(point.event.id)}" style="left:${point.x}%;bottom:${point.y}%" tabindex="${active?0:-1}" aria-pressed="${active}" aria-label="${e(label)}"><span class="publication-symbol" aria-hidden="true"></span></button>`;
      }).join('')}
    </div>
    <div class="publication-axis-label">${e(c.finished)}</div>
    <div class="publication-detail">
      <span class="publication-detail-year" data-publication-year>${e(yearLabel(selected.event))}</span>
      <div class="publication-detail-book"><strong data-publication-title>${e(selected.event.book.title)}</strong><span data-publication-authors>${e(selected.event.book.authors.join(', '))}</span></div>
      <div class="publication-detail-date"><span>${e(c.finished)}</span><time data-publication-finished datetime="${e(selected.event.finished)}">${e(formatReadingDate(selected.event.finished))}</time></div>
    </div>
  </figure><details class="stats-table-details"><summary>${e(c.publicationTable)}</summary><div class="stats-table-wrap"><table><thead><tr><th>${e(c.titleLabel)}</th><th>${e(c.publicationYear)}</th><th>${e(c.finished)}</th></tr></thead><tbody>${events.map(event=>`<tr><th>${bookLink(event,c)}</th><td>${e(yearLabel(event))}</td><td>${e(formatReadingDate(event.finished))}</td></tr>`).join('')}</tbody></table></div></details>`;
}
export function renderStats(events,selection,c,today=todayInNewYork()) {
  const s=readingStats(events,selection);
  const limit=selection.year===today.slice(0,4)&&!selection.month?+today.slice(5,7):Infinity;
  const card=(label,value)=>`<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`;
  const eventHighlight=(label,event,value,unit='')=>`<div><dt>${e(label)}</dt><dd>${event?`<span class="stats-highlight-value">${e(value(event))}${unit?`<span class="stats-unit">${e(unit)}</span>`:''}</span><span class="stats-highlight-book">${bookLink(event,c)}</span>`:e(c.noData)}</dd></div>`;
  return `<section aria-labelledby="stats-overview"><h2 id="stats-overview">${e(c.overview)}</h2><dl class="stats-summary">${card(c.completions,s.count)}${card(c.pages,pageNumber(s.pages,s.pageCoverage,s.count))}${card(c.averageLength,s.averagePages===null?'—':number(s.averagePages))}</dl>${s.count?'':`<p>${e(c.noCompletions)}</p>`}</section>
  <section><h2>${e(selection.year==='all'?c.annualTrends:c.trends)}</h2>${timeline(s,c,limit)}</section>
  <section><h2 id="stats-breakdowns">${e(c.breakdowns)}</h2><div class="stats-panels">${['genres','moods','pace','length','type','authors'].map(key=>bars(c[key],s.buckets[key],c,key)).join('')}</div></section>
  <section aria-labelledby="stats-highlights"><h2 id="stats-highlights">${e(c.highlights)}</h2><dl class="stats-highlights">${eventHighlight(c.first,s.first,event=>formatReadingDate(event.finished))}${eventHighlight(c.last,s.last,event=>formatReadingDate(event.finished))}${eventHighlight(c.shortest,s.shortest,event=>event.pages,c.pagesUnit)}${eventHighlight(c.longest,s.longest,event=>event.pages,c.pagesUnit)}<div class="stats-highlight-busiest"><dt>${e(c.busiest)}</dt><dd>${s.busiest?`<span class="stats-highlight-value">${e(formatReadingDate(s.busiest.label))}</span><span class="stats-highlight-count">${s.busiest.count}<span class="stats-unit">${e(c.books)}</span></span>`:'—'}</dd></div></dl>
  ${bars(`${c.newAuthors} (${s.newAuthors.length})`,s.newAuthors,c)}
  <div class="stats-publication"><h3 id="stats-publication">${e(c.publication)}</h3>${scatter(s.scatter,selection,c)}</div></section>
  <section class="stats-all-books"><h2>${e(c.allBooks)}</h2>${bookList(s.events,c)}</section>`;
}
export function renderComparison(events,a,b,mode,today,c) {
  const stats=compareYears(events,a,b,mode,today), [sa]=stats, labels=[a,b];
  const keys=['count','pages','averagePages'];
  const names=[c.completions,c.pages,c.averageLength];
  const limits=labels.map(year=>mode==='ytd'||year===today.slice(0,4)?+today.slice(5,7):Infinity);
  const genres=[...new Set(stats.flatMap(s=>s.buckets.genres.map(g=>g.label)))].sort((a,b)=>a.localeCompare(b));
  const maxGenre=Math.max(1,...stats.flatMap(s=>s.buckets.genres.map(g=>g.count)));
  const yearHeaders=labels.map((label,j)=>`<th scope="col" class="stats-series-${j}"><span class="stats-year-key">${e(label)}</span></th>`).join('');
  const overview=keys.map((key,i)=>{
    const max=Math.max(1,...stats.map(s=>s[key]??0));
    return `<tr><th scope="row">${e(names[i])}</th>${stats.map((s,j)=>{
      const missing=s[key]===null||(key==='pages'&&!s.pageCoverage&&s.count);
      return `<td class="stats-series-${j}"><span class="stats-comparison-value">${missing?'—':number(s[key])}</span>${missing?'':`<span class="stats-comparison-track" aria-hidden="true"><i style="width:${100*s[key]/max}%"></i></span>`}</td>`;
    }).join('')}</tr>`;
  }).join('');
  const totals=sa.timeline.map((g,i)=>`<tr><th>${e(g.label)}</th>${stats.map(s=>`<td><details><summary>${s.timeline[i].count} / ${pageNumber(s.timeline[i].pages,s.timeline[i].pageCoverage,s.timeline[i].count)}</summary>${bookList(s.timeline[i].events,c)}</details></td>`).join('')}</tr>`).join('');
  const genreRows=genres.map(label=>`<tr><th scope="row">${e(label==='Unknown'?c.unknown:label)}</th>${stats.map((s,j)=>{
    const g=s.buckets.genres.find(g=>g.label===label);
    return `<td class="stats-series-${j}">${g?`<details class="stats-compare-genre"><summary><span>${g.count}</span><span class="stats-comparison-track" aria-hidden="true"><i style="width:${100*g.count/maxGenre}%"></i></span></summary>${bookList(g.events,c)}</details>`:'<span class="stats-zero">0</span>'}</td>`;
  }).join('')}</tr>`).join('');
  return `${mode==='ytd'?`<p class="stats-caption">${e(copy(c.through,{date:formatReadingDate(today).replace(/, \d{4}$/,'')}))}</p>`:''}
    <div class="stats-table-wrap"><table class="stats-comparison-overview"><thead><tr><th scope="col">${e(c.overview)}</th>${yearHeaders}</tr></thead><tbody>${overview}</tbody></table></div>
    ${trendChart(stats.map(s=>s.timeline),'count',labels,c,limits)}${trendChart(stats.map(s=>s.timeline),'pages',labels,c,limits)}
    <details class="stats-table-details"><summary>${e(c.timelineTable)}</summary><div class="stats-table-wrap"><table><thead><tr><th>${e(c.month)}</th>${labels.map(l=>`<th>${e(l)} ${e(c.books)} / ${e(c.pages)}</th>`).join('')}</tr></thead><tbody>${totals}</tbody></table></div></details>
    <details class="stats-panel stats-genres-comparison"><summary><h3>${e(c.compareGenres)}</h3></summary><div class="stats-table-wrap"><table><thead><tr><th scope="col">${e(c.genres)}</th>${yearHeaders}</tr></thead><tbody>${genreRows}</tbody></table></div></details>`;
}
