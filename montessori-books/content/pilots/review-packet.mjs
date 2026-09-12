// Print bounded public review inputs once per canonical entry, with age deltas.
import {loadFrozen,read} from './contribution-core.mjs';
import {textDelta} from './lean-review.mjs';
const [directory,...ids]=process.argv.slice(2);
if(!ids.length)throw Error('Name the entry IDs for one related review batch');
const {manifest,payload}=loadFrozen(directory);
const surfaces=read(`${directory}/RENDERED_SURFACES.json`).surfaces;
const drafts=manifest.sources.map(source=>read(source.path));
const packet={workflow:'lean-v1',revision:directory,renderedSurfaces:`${directory}/RENDERED_SURFACES.json`,entries:[]};
for(const id of [...new Set(ids)]){
  const targets=manifest.snapshots.filter(s=>s.entryId===id);
  if(!targets.length)throw Error(`No owned review targets: ${id}`);
  const first=surfaces.find(s=>s.placementId===targets[0].placementId);
  if(!first?.entryText)throw Error(`Render before creating packet: ${id}`);
  const entry=payload.entries.find(e=>e.id===id);
  packet.entries.push({entry:{id:entry.id,kind:entry.kind,references:entry.references},approvedBody:manifest.reuse.find(r=>r.entryId===id)??null,
    authorDrafts:manifest.sources.filter(source=>{const draft=read(source.path);return draft.entries?.some(e=>e.id===id)||draft.placements?.some(p=>p.entryId===id);}).map(source=>source.path),
    firstRenderedEntryText:first.entryText,
    placements:targets.map(target=>{
      const snapshot=read(target.path),surface=surfaces.find(s=>s.placementId===target.placementId);
      if(!surface?.entryText)throw Error(`Missing surface: ${target.placementId}`);
      return {placement:snapshot.publicProjection.textPlacement.placement,
        ageEvidence:drafts.flatMap(d=>d.placementEvidence??[]).find(e=>e.placementId===target.placementId),
        entryTextDelta:textDelta(first.entryText,surface.entryText),openingText:surface.openingText,topicRows:surface.topicRows};
    })});
}
console.log(JSON.stringify(packet,null,2));
