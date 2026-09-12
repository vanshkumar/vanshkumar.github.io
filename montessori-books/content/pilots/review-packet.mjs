// Print bounded public review inputs once per canonical entry, with age deltas.
import {loadFrozen,read} from './contribution-core.mjs';
import {textDelta} from './lean-review.mjs';
const [directoryArgument,...args]=process.argv.slice(2);
const directories=directoryArgument.split(',');
const compact=args.includes('--compact'),ids=args.filter(id=>id!=='--compact');
if(!ids.length)throw Error('Name the entry IDs for one related review batch');
const packet={workflow:'lean-v1',revision:directoryArgument,renderedSurfaces:directories.map(d=>`${d}/RENDERED_SURFACES.json`),entries:[]};
for(const directory of directories){
const {manifest,payload}=loadFrozen(directory);
const surfaces=read(`${directory}/RENDERED_SURFACES.json`).surfaces;
const drafts=manifest.sources.map(source=>read(source.path));
for(const id of [...new Set(ids)]){
  const targets=manifest.snapshots.filter(s=>s.entryId===id);
  if(!targets.length){if(directories.length>1)continue;throw Error(`No owned review targets: ${id}`);}
  const first=surfaces.find(s=>s.placementId===targets[0].placementId);
  if(!first?.entryText)throw Error(`Render before creating packet: ${id}`);
  const entry=payload.entries.find(e=>e.id===id);
  const existing=packet.entries.find(e=>e.entry.id===id);
  const approvedBody=manifest.reuse.find(r=>r.entryId===id)??null;
  if(existing&&(!approvedBody||existing.approvedBody?.canonicalEntrySha256!==approvedBody.canonicalEntrySha256))throw Error(`Cross-contribution body must be the same frozen canonical entry: ${id}`);
  const baseText=existing?.firstRenderedEntryText??first.entryText;
  const item={entry:{id:entry.id,kind:entry.kind,references:entry.references},approvedBody,
    authorDrafts:manifest.sources.filter(source=>{const draft=read(source.path);return draft.entries?.some(e=>e.id===id)||draft.placements?.some(p=>p.entryId===id);}).map(source=>source.path),
    firstRenderedEntryText:first.entryText,
    placements:targets.map(target=>{
      const snapshot=read(target.path),surface=surfaces.find(s=>s.placementId===target.placementId);
      if(!surface?.entryText)throw Error(`Missing surface: ${target.placementId}`);
      return {placement:snapshot.publicProjection.textPlacement.placement,
        ageEvidence:drafts.flatMap(d=>d.placementEvidence??[]).find(e=>e.placementId===target.placementId),
        entryTextDelta:textDelta(baseText,surface.entryText),openingText:surface.openingText,topicRows:surface.topicRows};
    })};
  if(existing){
    existing.authorDrafts.push(...item.authorDrafts);
    existing.placements.push(...item.placements);
    if(new Set(existing.placements.map(p=>p.placement.id)).size!==existing.placements.length)throw Error(`Duplicate cross-contribution placement: ${id}`);
  }else packet.entries.push(item);
}
}
for(const id of ids)if(!packet.entries.some(e=>e.entry.id===id))throw Error(`No owned review targets in any selected contribution: ${id}`);
if(compact){
  // Preserve reader surfaces and substantive age reasoning. Operational read-log
  // metadata remains in the frozen author drafts, outside the editorial packet.
  const catalog=[],keys=new Map();
  const refs=references=>(references??[]).map(reference=>{
    const key=JSON.stringify(reference);
    if(!keys.has(key)){keys.set(key,`ref-${catalog.length+1}`);catalog.push({id:keys.get(key),reference});}
    return keys.get(key);
  });
  for(const item of packet.entries){
    item.entry.references=refs(item.entry.references);
    for(const placement of item.placements){
      // Rendered words and topic identity retain the reader presentation. The
      // duplicate anchor markup stays in the hashed render file, not the packet.
      placement.topicRows=placement.topicRows.map(({topicId,text})=>({topicId,text}));
      const evidence=placement.ageEvidence;
      placement.ageEvidence=Object.fromEntries(['sourceAge','readiness','editorialPlacement'].map(key=>{
        const {authorReadLogIds,authorReadLogPath,evidenceIds,references,...meaning}=evidence[key]??{};
        return [key,{...meaning,...(references?{references:refs(references)}:{})}];
      }));
    }
  }
  packet.referenceCatalog=catalog;
  packet.format='compact references; reader text/deltas and substantive age evidence unchanged';
}
console.log(JSON.stringify(packet,null,2));
