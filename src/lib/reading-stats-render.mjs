import { amazonBookUrl, formatReadingDate } from './reading-log.mjs';
import { readingStats, compareYears } from './reading-stats.mjs';

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
  return `<ol class="stats-books" role="list">${events.map(event=>`<li>${bookLink(event,c)}<span class="stats-book-date">${event.finished ? e(formatReadingDate(event.finished)) : e(c.unknownDate)}</span></li>`).join('')}</ol>`;
}
function bars(title,groups,c) {
  const max=Math.max(1,...groups.map(g=>g.count));
  return `<section class="stats-panel"><h3>${e(title)}</h3><div class="stats-bars">${groups.map(g=>`<details class="stats-bar"><summary style="--bar:${100*g.count/max}%"><span>${e(g.label==='Unknown'?c.unknown:g.label)}</span><strong>${g.count}</strong></summary>${bookList(g.events,c)}</details>`).join('')||`<p>${e(c.noData)}</p>`}</div></section>`;
}
function lineChart(timelines,field,labels,c) {
  const width=640,height=180,left=42,bottom=145,top=15;
  const length=Math.max(1,...timelines.map(t=>t.length));
  const max=Math.max(1,...timelines.flatMap(t=>t.map(g=>g[field])));
  const x=i=>left+(width-left-16)*i/Math.max(1,length-1);
  const y=v=>bottom-(bottom-top)*v/max;
  const ticks=[0,Math.ceil(max/2),max];
  const title=field==='pages'?c.pages:c.completions;
  return `<figure class="stats-line"><figcaption>${e(title)}</figcaption><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${e(title)}"><title>${e(title)}; ${e(c.timelineTable)}</title>${ticks.map(v=>`<line x1="${left}" x2="${width-16}" y1="${y(v)}" y2="${y(v)}" class="stats-gridline"/><text x="${left-7}" y="${y(v)+4}" text-anchor="end">${number(v)}</text>`).join('')}${timelines.map((t,j)=>{
    const runs=[[]];
    const dots=t.map((g,i)=>{
      if(field==='pages' && g.count && !g.pageCoverage){runs.push([]);return '';}
      runs.at(-1).push(`${x(i)},${y(g[field])}`);
      return `<circle class="stats-dot-${j}" cx="${x(i)}" cy="${y(g[field])}" r="3"><title>${e(labels[j])} ${e(g.label)}: ${number(g[field])}</title></circle>`;
    }).join('');
    return runs.filter(run=>run.length).map(run=>`<polyline class="stats-line-${j}" points="${run.join(' ')}"/>`).join('')+dots;
  }).join('')}${(timelines[0]??[]).map((g,i)=>`<text x="${x(i)}" y="170" text-anchor="middle">${e(g.label.slice(0,4).match(/^\d{4}$/)?g.label:g.label.slice(0,3))}</text>`).join('')}</svg></figure>`;
}
function timeline(stats,c) {
  return `${lineChart([stats.timeline],'count',[''],c)}${lineChart([stats.timeline],'pages',[''],c)}<details class="stats-table-details"><summary>${e(c.timelineTable)}</summary><div class="stats-table-wrap"><table><thead><tr><th>${e(c.period)}</th><th>${e(c.books)}</th><th>${e(c.pages)}</th></tr></thead><tbody>${stats.timeline.map(g=>`<tr><th><details><summary>${e(g.label)}</summary>${bookList(g.events,c)}</details></th><td>${g.count}</td><td>${pageNumber(g.pages,g.pageCoverage,g.count)}</td></tr>`).join('')}</tbody></table></div></details>`;
}
function scatter(events,c) {
  if (!events.length) return `<p>${e(c.noData)}</p>`;
  const years=events.map(e=>e.book.publicationYear), dates=events.map(e=>Date.parse(e.finished));
  const lowY=Math.min(...years), highY=Math.max(...years), lowD=Math.min(...dates), highD=Math.max(...dates);
  const x=event=>55+565*(Date.parse(event.finished)-lowD)/Math.max(1,highD-lowD);
  const y=event=>175-155*(event.book.publicationYear-lowY)/Math.max(1,highY-lowY);
  return `<figure class="stats-scatter"><svg viewBox="0 0 640 215" role="img" aria-label="${e(c.publication)}"><title>${e(c.publicationChartLabel)}</title><line x1="55" y1="175" x2="620" y2="175" class="stats-gridline"/><text x="5" y="24">${highY}</text><text x="5" y="179">${lowY}</text><text x="55" y="204">${e(events[0].finished)}</text><text x="620" y="204" text-anchor="end">${e(events.at(-1).finished)}</text>${events.map(event=>`<circle cx="${x(event)}" cy="${y(event)}" r="4" class="stats-dot-0"><title>${e(event.book.title)}: ${event.book.publicationYear} → ${e(event.finished)}</title></circle>`).join('')}</svg></figure><details class="stats-table-details"><summary>${e(c.publicationTable)}</summary><div class="stats-table-wrap"><table><thead><tr><th>${e(c.titleLabel)}</th><th>${e(c.publicationYear)}</th><th>${e(c.finished)}</th></tr></thead><tbody>${events.map(event=>`<tr><th>${bookLink(event,c)}</th><td>${event.book.publicationYear}</td><td>${e(formatReadingDate(event.finished))}</td></tr>`).join('')}</tbody></table></div></details>`;
}
export function renderStats(events,selection,c) {
  const s=readingStats(events,selection);
  const card=(label,value)=>`<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`;
  const eventHighlight=(label,event,extra)=>`<div><dt>${e(label)}</dt><dd>${event?bookLink(event,c):e(c.noData)}${event&&extra?`<small>${e(extra(event))}</small>`:''}</dd></div>`;
  return `<section aria-labelledby="stats-overview"><h2 id="stats-overview">${e(c.overview)}</h2><dl class="stats-summary">${card(c.completions,s.count)}${card(c.pages,pageNumber(s.pages,s.pageCoverage,s.count))}${card(c.averageLength,s.averagePages===null?'—':`${number(s.averagePages)} ${c.pagesUnit}`)}</dl>${s.count?'':`<p>${e(c.noCompletions)}</p>`}</section>
  <section><h2>${e(selection.year==='all'?c.annualTrends:c.trends)}</h2>${timeline(s,c)}</section>
  <section><h2 id="stats-breakdowns">${e(c.breakdowns)}</h2><div class="stats-panels">${['genres','moods','pace','length','type','authors'].map(key=>bars(c[key],s.buckets[key],c)).join('')}</div></section>
  <section><h2 id="stats-highlights">${e(c.highlights)}</h2><dl class="stats-highlights">${eventHighlight(c.first,s.first,e=>formatReadingDate(e.finished))}${eventHighlight(c.last,s.last,e=>formatReadingDate(e.finished))}${eventHighlight(c.shortest,s.shortest,e=>`${e.pages} ${c.pagesUnit}`)}${eventHighlight(c.longest,s.longest,e=>`${e.pages} ${c.pagesUnit}`)}<div><dt>${e(c.busiest)}</dt><dd>${s.busiest?`${e(formatReadingDate(s.busiest.label))} · ${s.busiest.count}`:'—'}</dd></div></dl>
  ${bars(`${c.newAuthors} (${s.newAuthors.length})`,s.newAuthors,c)}</section>
  <section><h2>${e(c.publication)}</h2>${scatter(s.scatter,c)}</section>
  <section><h2>${e(c.allBooks)}</h2>${bookList(s.events,c)}</section>`;
}
export function renderComparison(events,a,b,mode,today,c) {
  const [sa,sb]=compareYears(events,a,b,mode,today), stats=[sa,sb], labels=[a,b];
  const keys=['count','pages','averagePages'];
  const names=[c.completions,c.pages,c.averageLength];
  const genres=[...new Set(stats.flatMap(s=>s.buckets.genres.map(g=>g.label)))].sort((a,b)=>a.localeCompare(b));
  return `${mode==='ytd'?`<p class="stats-caption">${e(copy(c.through,{date:formatReadingDate(today).replace(/, \d{4}$/,'')}))}</p>`:''}<div class="stats-table-wrap"><table><thead><tr><th>${e(c.overview)}</th>${labels.map(l=>`<th>${e(l)}</th>`).join('')}</tr></thead><tbody>${keys.map((key,i)=>`<tr><th>${e(names[i])}</th>${stats.map(s=>`<td>${s[key]===null?'—':key==='pages'?pageNumber(s.pages,s.pageCoverage,s.count):number(s[key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="stats-legend"><span>${e(a)}</span><span>${e(b)}</span></p>${lineChart(stats.map(s=>s.timeline),'count',labels,c)}${lineChart(stats.map(s=>s.timeline),'pages',labels,c)}<details class="stats-table-details"><summary>${e(c.timelineTable)}</summary><div class="stats-table-wrap"><table><thead><tr><th>${e(c.month)}</th>${labels.map(l=>`<th>${e(l)} ${e(c.books)} / ${e(c.pages)}</th>`).join('')}</tr></thead><tbody>${sa.timeline.map((g,i)=>`<tr><th>${e(g.label)}</th>${stats.map(s=>`<td><details><summary>${s.timeline[i].count} / ${pageNumber(s.timeline[i].pages,s.timeline[i].pageCoverage,s.timeline[i].count)}</summary>${bookList(s.timeline[i].events,c)}</details></td>`).join('')}</tr>`).join('')}</tbody></table></div></details><h3>${e(c.compareGenres)}</h3><div class="stats-table-wrap"><table><thead><tr><th>${e(c.genres)}</th>${labels.map(l=>`<th>${e(l)}</th>`).join('')}</tr></thead><tbody>${genres.map(label=>`<tr><th>${e(label==='Unknown'?c.unknown:label)}</th>${stats.map(s=>{const g=s.buckets.genres.find(g=>g.label===label);return `<td>${g?`<details><summary>${g.count}</summary>${bookList(g.events,c)}</details>`:'0'}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
}
