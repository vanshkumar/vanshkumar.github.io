// Offline stage accounting. This does not certify source meaning or approve content.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const [revision,...amendmentPaths]=process.argv.slice(2);
if(!/^r\d+$/.test(revision??''))throw Error('Usage: reconcile-coverage.mjs r01 [explicit cumulative amendments.json …]');
const directory=`content/pilots/revisions/${revision}`;
const read=p=>JSON.parse(fs.readFileSync(p));
const rows=p=>fs.readFileSync(p,'utf8').trim().split('\n').map(JSON.parse);
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const payload=read(`${directory}/payload.json`),entryIds=new Set(payload.entries.map(e=>e.id)),placements=new Map(payload.placements.map(p=>[p.id,p]));
const amendments=new Map();
const amendmentInputs=amendmentPaths.map(file=>({path:file,sha256:hash(file),data:read(file)}));
for(const input of amendmentInputs)for(const change of input.data.changes??[]){
 const key=`${change.sourceId}/${change.sourceIdeaId}/${change.ageId}`;
 if(amendments.has(key)||!change.issueId||!change.reason?.trim()||!/^r\d+$/.test(input.data.revision??'')||Number(input.data.revision.slice(1))>Number(revision.slice(1)))throw Error(`Invalid/duplicate amendment:${key}`);
 amendments.set(key,{change,input});
}
const appliedAmendments=new Set();
const output=[],inputs=[];
for(const [book,sourceId,ageId] of [['baby','baby-2021','6-9'],['toddler','toddler-2019','18-24']]){
 const ledgerPath=`research/${book}/COVERAGE_LEDGER.jsonl`,evidencePath=`research/${book}/EVIDENCE.jsonl`,coveragePath=`content/pilots/drafts/${book}/COVERAGE.jsonl`;
 const ledger=rows(ledgerPath),coverage=rows(coveragePath),evidence=rows(evidencePath),ideaIds=new Set(ledger.map(r=>r.id)),evidenceIds=new Set(evidence.map(r=>r.id));
 if(coverage.length!==ideaIds.size||new Set(coverage.map(r=>r.sourceIdeaId)).size!==coverage.length||coverage.some(r=>!ideaIds.has(r.sourceIdeaId)))throw Error(`${book}: incomplete source idea set`);
 const coverageSha256=hash(coveragePath);
 inputs.push({sourceId,ledgerPath,ledgerSha256:hash(ledgerPath),evidencePath,evidenceSha256:hash(evidencePath),coveragePath,coverageSha256,sourceIdeas:coverage.length});
 coverage.forEach((originalRow,index)=>{
  const amendmentKey=`${sourceId}/${originalRow.sourceIdeaId}/${ageId}`,amendmentRecord=amendments.get(amendmentKey),amendment=amendmentRecord?.change;
  const row=amendment?{...originalRow,...amendment}:originalRow;
  if(amendment)appliedAmendments.add(amendmentKey);
  const disposition=row.disposition==='held'?'context-only':row.disposition;
  if(!['included','combined','context-only','excluded'].includes(disposition)||!row.reason?.trim())throw Error(`Invalid disposition/reason:${row.sourceIdeaId}`);
  const targetIds=[],contextTargets=[];
  for(const target of row.targetIds??[]){
   if(entryIds.has(target))targetIds.push(target);
   else if(disposition==='context-only'&&target.startsWith('research/')&&fs.existsSync(target.split('#')[0]))contextTargets.push(target);
   else throw Error(`Unresolved target:${row.sourceIdeaId}/${target}`);
  }
  for(const id of row.placementIds??[]){const p=placements.get(id);if(!p||p.ageId!==ageId||!targetIds.includes(p.entryId))throw Error(`Unresolved placement:${id}`);}
  for(const id of row.evidenceIds??[])if(!evidenceIds.has(id))throw Error(`Unresolved evidence:${id}`);
  if(['included','combined'].includes(disposition)&&(!targetIds.length||!row.placementIds?.length))throw Error(`Missing retained meaning target:${row.sourceIdeaId}`);
  const heldDetails=[];
  if(row.disposition==='held')heldDetails.push({scope:'Undrafted operational detail or unresolved variant',reason:row.reason,sourceHolds:row.sourceHolds??[]});
  else if(row.sourceHolds?.length)heldDetails.push({scope:'Inherited source questions retained for the selected treatment',sourceHolds:row.sourceHolds});
  if(row.heldInterpretation)heldDetails.push({scope:'Undrafted or qualified interpretation',reason:row.heldInterpretation});
  if(amendment?.heldDetails)heldDetails.push(...amendment.heldDetails);
  output.push({sourceId,sourceIdeaId:row.sourceIdeaId,ageId,disposition,reason:row.reason,targetIds,placementIds:row.placementIds??[],contextTargets,evidenceIds:row.evidenceIds??[],heldDetails,
   ...(row.disposition==='held'?{contextUse:'This source variant is retained to document the qualification or omission decision for the named entry. Its operational details are not claimed as included or combined.'}:{}),
   authorRecord:{path:coveragePath,sha256:coverageSha256,line:index+1,originalDisposition:originalRow.disposition},
   ...(amendment?{editorialAmendment:{path:amendmentRecord.input.path,sha256:amendmentRecord.input.sha256,issueId:amendment.issueId,editor:amendmentRecord.input.data.editor}}:{}),
   sourceLedger:{path:ledgerPath,sha256:hash(ledgerPath)},
   reviewBoundary:'Coverage disposition does not approve a reader entry; exact component reviews and the integration receipt control release.'});
 });
}
if(appliedAmendments.size!==amendments.size)throw Error('Unresolved coverage amendment source/age');
const counts=Object.fromEntries(inputs.map(input=>[input.sourceId,Object.fromEntries(['included','combined','context-only','excluded'].map(d=>[d,output.filter(r=>r.sourceId===input.sourceId&&r.disposition===d).length]))]));
fs.writeFileSync(`${directory}/COVERAGE_RECONCILIATION.jsonl`,output.map(r=>JSON.stringify(r)).join('\n')+'\n',{flag:'wx'});
fs.writeFileSync(`${directory}/COVERAGE_RECEIPT.json`,JSON.stringify({revision,scope:'Pilot-stage source idea accounting; no whole-product exclusion or editorial approval',inputs,amendments:amendmentInputs.map(({data,...input})=>input),appliedAmendments:appliedAmendments.size,rows:output.length,counts,normalization:'The 63 Baby author-held rows become context-only qualification/omission records with explicit heldDetails. Their original disposition/reason and source questions remain linked; no operational detail becomes included by normalization. The 7 foundation targets remain private context targets. Shared 153 rows overlap these source IDs and are never added as new ideas. Explicit cumulative revision amendments retain the original author record and the exact editorial issue link.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({rows:output.length,counts}));
