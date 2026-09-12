// Expand explicit reviewer decisions; all verdicts/read evidence are human-authored.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {loadFrozen,read,hash,write,location} from './contribution-core.mjs';
import {requiredReferences,assertReadCoverage} from './lean-review.mjs';
const [directory,decisionPath,output,...basisArgs]=process.argv.slice(2);
if(basisArgs.length%2||basisArgs.some((arg,i)=>i%2===0&&arg!=='--basis'))throw Error('Use --basis prior-report.json for retained correction reading');
const config=location(directory),{manifest,payload}=loadFrozen(directory);
if(!decisionPath?.startsWith(`${config.root}/reviews/`)||decisionPath.split('/').includes('..'))throw Error('Keep immutable decisions in the owned reviews directory');
if(!output?.startsWith(`${config.root}/reviews/`)||output.split('/').includes('..'))throw Error('Write the report in the owned reviews directory');
const input=read(decisionPath),reviewer=input.reviewer;
if(!reviewer?.task||!['source','tone'].includes(reviewer.role)||reviewer.reasoning!=='xhigh')throw Error('Explicit xhigh reviewer identity required');
if(!input.decisions?.length)throw Error('Explicit editorial decisions required');
const logs=new Map();
const addLog=log=>{
  if(!log.id)throw Error('Read-log ID required');
  if(logs.has(log.id)&&JSON.stringify(logs.get(log.id))!==JSON.stringify(log)){
    // Retained batches may independently use the same local identifier. Keep
    // both genuine declarations; give the later witness a deterministic suffix.
    const originalReadLogId=log.id,suffix=createHash('sha256').update(JSON.stringify(log)).digest('hex').slice(0,12);
    log={...log,id:`${originalReadLogId}~${suffix}`,originalReadLogId};
  }
  logs.set(log.id,log);return log.id;
};
const retainedReads=[];
const retainedSeen=new Set();
const retain=link=>{
  const sha256=hash(link.path);
  if(link.sha256&&sha256!==link.sha256)throw Error('Changed retained-reading report');
  const key=JSON.stringify([link.path,sha256,link.readLogIds??null]);
  if(retainedSeen.has(key))return;retainedSeen.add(key);
  const prior=read(link.path);
  if(prior.reviewer?.task!==reviewer.task||prior.reviewer?.role!==reviewer.role)throw Error('Only this reviewer’s own original reads can be retained');
  // An explicit whole-report pointer retains that report's declared reading
  // ancestry too. Every link is hashed and must belong to this same reviewer.
  if(!link.readLogIds)for(const ancestor of prior.retainedReads??[])retain(ancestor);
  const readLogIds=link.readLogIds??(prior.readLogs??[]).map(log=>log.id);
  for(const id of readLogIds){const log=prior.readLogs?.find(r=>r.id===id);if(!log)throw Error(`Missing retained read: ${id}`);addLog(log);}
  retainedReads.push({...link,sha256,readLogIds});
};
for(const link of input.retainedReads??[])retain(link);
for(const log of input.readLogs??[])addLog(log);
// A correction can retain the same reviewer's original reading for these exact
// entries/placements. This imports reading evidence only, never a verdict.
const readingBasis=basisArgs.filter((_,i)=>i%2===1).map(path=>{
  const report=read(path);
  if(report.reviewer?.task!==reviewer.task||report.reviewer?.role!==reviewer.role)throw Error('Correction reading basis must belong to the same independent reviewer');
  return {path,sha256:hash(path),report};
});
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
    for(const basis of readingBasis){
      const previous=basis.report.reviews.find(r=>r.placementId===id&&r.entryId===item.entryId);
      if(!previous)continue;
      for(const logId of previous.readLogIds){
        const log=basis.report.readLogs.find(r=>r.id===logId);if(!log)throw Error('Missing original basis read');
        const assignedId=addLog(log);if(!record.readLogIds.includes(assignedId))record.readLogIds.push(assignedId);
      }
    }
    const refs=requiredReferences({role:reviewer.role,entry:payload.entries.find(e=>e.id===item.entryId),evidence:drafts.flatMap(d=>d.placementEvidence??[]).find(e=>e.placementId===id),reuse,review:record,registrySha256:manifest.registry.sha256});
    // Matching identifiers is administration: use only this reviewer's already
    // declared personal reads. Missing actual reading still fails below; neither
    // an original read nor an editorial verdict is created by this join.
    record.administrativeReadLinks=[];
    for(const ref of refs)for(const span of ref.pdfPages)for(let page=span.start;page<=span.end;page++){
      const matches=log=>log?.sourceId===ref.sourceId&&['full-text','full-page-visual'].includes(log.mode)&&log.pdfPages?.some(p=>p.start<=page&&p.end>=page);
      if(record.readLogIds.some(id=>matches(logs.get(id))))continue;
      const existing=[...logs.values()].find(matches);
      if(existing){record.readLogIds.push(existing.id);record.administrativeReadLinks.push({id:existing.id,sourceId:ref.sourceId,page});}
    }
    assertReadCoverage(refs,record.readLogIds.map(id=>logs.get(id)),record.id);
    reviews.push(record);
  }
}
fs.mkdirSync(`${config.root}/reviews`,{recursive:true});
write(output,{id:input.id??`${config.owner}-${reviewer.role}-${manifest.revision}`,workflow:'lean-v1',reviewer,date:input.date??'2026-09-10',scope:input.scope??'Explicit grouped source-topic decisions; exact age contexts reviewed.',
  renderedSurfaces:{path:`${directory}/RENDERED_SURFACES.json`,sha256:hash(`${directory}/RENDERED_SURFACES.json`)},
  decisionInput:{path:decisionPath,sha256:hash(decisionPath)},readingBasis:readingBasis.map(({report,...reference})=>reference),retainedReads,readLogs:[...logs.values()],reviews});
console.log(JSON.stringify({output,placements:reviews.length,sha256:hash(output)}));
