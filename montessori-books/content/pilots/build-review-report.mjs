// Expand explicit reviewer decisions; all verdicts/read evidence are human-authored.
import fs from 'node:fs';
import {loadFrozen,read,hash,write,location} from './contribution-core.mjs';
import {requiredReferences,assertReadCoverage} from './lean-review.mjs';
const [directory,decisionPath,output]=process.argv.slice(2);
const config=location(directory),{manifest,payload}=loadFrozen(directory);
if(!decisionPath?.startsWith(`${config.root}/reviews/`)||decisionPath.split('/').includes('..'))throw Error('Keep immutable decisions in the owned reviews directory');
if(!output?.startsWith(`${config.root}/reviews/`)||output.split('/').includes('..'))throw Error('Write the report in the owned reviews directory');
const input=read(decisionPath),reviewer=input.reviewer;
if(!reviewer?.task||!['source','tone'].includes(reviewer.role)||reviewer.reasoning!=='xhigh')throw Error('Explicit xhigh reviewer identity required');
if(!input.decisions?.length)throw Error('Explicit editorial decisions required');
const logs=new Map();
const addLog=log=>{if(!log.id)throw Error('Read-log ID required');if(logs.has(log.id)&&JSON.stringify(logs.get(log.id))!==JSON.stringify(log))throw Error(`Conflicting read log: ${log.id}`);logs.set(log.id,log);};
for(const link of input.retainedReads??[]){
  if(hash(link.path)!==link.sha256)throw Error('Changed retained-reading report');
  const prior=read(link.path);
  if(prior.reviewer?.task!==reviewer.task||prior.reviewer?.role!==reviewer.role)throw Error('Only this reviewer’s own original reads can be retained');
  for(const id of link.readLogIds??[]){const log=prior.readLogs?.find(r=>r.id===id);if(!log)throw Error(`Missing retained read: ${id}`);addLog(log);}
}
for(const log of input.readLogs??[])addLog(log);
const drafts=manifest.sources.map(s=>read(s.path)),seen=new Set(),reviews=[];
for(const decision of input.decisions){
  if(!['pass','revise','hold'].includes(decision.verdict)||!decision.assessment?.trim()||!decision.placementIds?.length)throw Error('Explicit verdict, scope and short assessment required');
  if(decision.verdict==='pass'&&decision.issues?.length)throw Error('A pass cannot have open findings');
  if(decision.verdict!=='pass'&&!decision.issues?.length)throw Error('Revise/hold needs a concrete issue');
  for(const id of decision.placementIds){
    if(seen.has(id))throw Error(`Duplicate decision: ${id}`);seen.add(id);
    const item=manifest.snapshots.find(s=>s.placementId===id);if(!item)throw Error(`Not an owned review target: ${id}`);
    const reuse=manifest.reuse.find(r=>r.entryId===item.entryId);
    const record={id:`${input.id??`${config.owner}-${reviewer.role}-${manifest.revision}`}.${id}`,entryId:item.entryId,placementId:id,
      snapshotPath:item.path,snapshotFileSha256:hash(item.path),textPlacementSha256:item.textPlacementSha256,artContextSha256:null,
      readLogIds:decision.readLogIds??[],contextReferences:decision.contextReferences??[],artContext:null,
      textPlacement:{verdict:decision.verdict,issues:decision.issues??[],assessment:decision.assessment}};
    if(decision.reuseBody){if(!reuse)throw Error(`No approved pilot body: ${id}`);record.bodyReview={entryId:item.entryId,canonicalEntrySha256:reuse.canonicalEntrySha256,registrySha256:manifest.registry.sha256};}
    if(decision.resolves)record.resolves=decision.resolves;
    const refs=requiredReferences({role:reviewer.role,entry:payload.entries.find(e=>e.id===item.entryId),evidence:drafts.flatMap(d=>d.placementEvidence??[]).find(e=>e.placementId===id),reuse,review:record,registrySha256:manifest.registry.sha256});
    assertReadCoverage(refs,record.readLogIds.map(id=>logs.get(id)),record.id);
    reviews.push(record);
  }
}
fs.mkdirSync(`${config.root}/reviews`,{recursive:true});
write(output,{id:input.id??`${config.owner}-${reviewer.role}-${manifest.revision}`,workflow:'lean-v1',reviewer,date:input.date??'2026-09-10',scope:input.scope??'Explicit grouped source-topic decisions; exact age contexts reviewed.',
  renderedSurfaces:{path:`${directory}/RENDERED_SURFACES.json`,sha256:hash(`${directory}/RENDERED_SURFACES.json`)},
  decisionInput:{path:decisionPath,sha256:hash(decisionPath)},retainedReads:input.retainedReads??[],readLogs:[...logs.values()],reviews});
console.log(JSON.stringify({output,placements:reviews.length,sha256:hash(output)}));
