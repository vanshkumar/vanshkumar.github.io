// Offline handoff index. This never imports into the reader app or approves copy.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {digest,publicEntry} from './review-snapshot.mjs';
const [revision]=process.argv.slice(2);
if(!/^r\d+$/.test(revision??''))throw Error('Usage: create-registry.mjs rNN');
const dir=`content/pilots/revisions/${revision}`;
const read=p=>JSON.parse(fs.readFileSync(p));
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const manifest=read(`${dir}/MANIFEST.json`),payload=read(`${dir}/payload.json`);
const receiptPath=`${dir}/INTEGRATION_RECEIPT.json`,receipt=read(receiptPath);
if(receipt.payloadSha256!==hash(`${dir}/payload.json`))throw Error('Registry requires the exact integrated payload');
const coveragePath=`${dir}/COVERAGE_RECONCILIATION.jsonl`;
const coverage=fs.readFileSync(coveragePath,'utf8').trim().split('\n').map(JSON.parse);
const drafts=manifest.sources.map(s=>({...s,data:read(s.path)})).filter(s=>s.data.entries);
const entries=payload.entries.map((entry,index)=>{
 const owners=drafts.filter(d=>d.data.entries.some(e=>e.id===entry.id));
 if(owners.length!==1)throw Error(`Canonical ownership is not unique: ${entry.id}`);
 const owner=owners[0],draftIndex=owner.data.entries.findIndex(e=>e.id===entry.id);
 if(hash(owner.path)!==owner.sha256||digest(publicEntry(owner.data.entries[draftIndex]))!==digest(entry))throw Error(`Canonical source differs: ${entry.id}`);
 const provenanceIndex=owner.data.provenance.findIndex(p=>p.entryId===entry.id);
 if(provenanceIndex<0)throw Error(`Missing private provenance: ${entry.id}`);
 const placements=payload.placements.filter(p=>p.entryId===entry.id).map(p=>{
  const snapshot=manifest.snapshots.find(s=>s.placementId===p.id);
  const approvals=receipt.components.find(c=>c.placementId===p.id);
  if(!snapshot||!approvals)throw Error(`Missing integrated placement: ${p.id}`);
  return {id:p.id,ageId:p.ageId,topicIds:p.topicIds,...(p.openingOrder?{openingOrder:p.openingOrder}:{}),snapshot:{path:snapshot.path,sha256:snapshot.sha256,textPlacementSha256:snapshot.textPlacementSha256,artContextSha256:snapshot.artContextSha256},approvals:approvals.approvals};
 });
 return {id:entry.id,title:entry.title,kind:entry.kind,canonicalEntrySha256:digest(entry),
  owner:'Task 4; revisions after handoff belong to the sole Task 8 integrator',
  authoringRecord:{path:owner.path,sha256:owner.sha256,jsonPointer:`/entries/${draftIndex}`,author:owner.author.task,provenancePointer:`/provenance/${provenanceIndex}`},
  publicProjection:{path:`${dir}/payload.json`,sha256:hash(`${dir}/payload.json`),jsonPointer:`/entries/${index}`,role:'Generated immutable public projection of the authoring record; never edit a second body here'},
  placements,
  sourceIdeas:coverage.map((r,i)=>({r,i})).filter(({r})=>r.targetIds.includes(entry.id)).map(({r,i})=>({sourceId:r.sourceId,sourceIdeaId:r.sourceIdeaId,ageId:r.ageId,disposition:r.disposition,evidenceIds:r.evidenceIds,coverageLine:i+1}))
 };
});
const result={revision,date:'2026-09-10',scope:'Frozen reusable pilot canonical versions and approved placements; other ages require exact new placement review',
 manifest:{path:`${dir}/MANIFEST.json`,sha256:hash(`${dir}/MANIFEST.json`)},
 integrationReceipt:{path:receiptPath,sha256:hash(receiptPath)},
 coverage:{path:coveragePath,sha256:hash(coveragePath),rows:coverage.length},
 entryCount:entries.length,placementCount:payload.placements.length,entries,
 allocation:{path:'content/pilots/POPULATION_ALLOCATION.md',sha256:hash('content/pilots/POPULATION_ALLOCATION.md')},
 reuseRule:'Use the canonical ID plus this registry revision and canonicalEntrySha256. Additional placements reference the frozen public record; do not duplicate its body or existing entry/age pair. Changed wording or references requires the sole integrator to issue a new immutable canonical revision and renew affected independent reviews.'};
fs.writeFileSync('content/pilots/CANONICAL_REGISTRY.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({entries:entries.length,placements:payload.placements.length,sha256:hash('content/pilots/CANONICAL_REGISTRY.json')}));
