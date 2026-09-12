// Index exact corrections and the independently approved final replacements.
// Historical reports remain immutable; this index does not grant review passes.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const [revision,...reports]=process.argv.slice(2);
if(!/^r\d+$/.test(revision??'')||!reports.length)throw Error('Usage: resolve-issues.mjs rNN explicit-reports.json …');
const read=p=>JSON.parse(fs.readFileSync(p)),hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const dir=`content/pilots/revisions/${revision}`,receipt=read(`${dir}/INTEGRATION_RECEIPT.json`),manifest=read(`${dir}/MANIFEST.json`);
if(receipt.payloadSha256!==hash(`${dir}/payload.json`))throw Error('Exact completed integration required');
const history=[];
for(const input of manifest.sources.filter(s=>s.path.includes('/drafts/')&&s.path.includes('/draft-'))){
 let file=input.path;
 while(file){
  const draft=read(file),change=draft.editorialRevision;
  if(!change)break;
  history.push({path:file,sha256:hash(file),changes:change.changes});
  if(hash(change.previousDraft.path)!==change.previousDraft.sha256)throw Error(`Changed draft predecessor: ${file}`);
  file=change.previousDraft.path;
 }
}
const issues=new Map();
function add(issue,review,report,component,prototype=false){
 const current=receipt.components.find(p=>p.placementId===review.placementId&&p.entryId===review.entryId);
 if(!current?.approvals.source[component]||!current.approvals.tone[component])throw Error(`Missing replacement approvals for ${issue.id}`);
 const corrections=history.filter(h=>h.changes?.some(c=>c.entryId===review.entryId&&c.issueIds.includes(issue.id))).map(h=>({path:h.path,sha256:h.sha256,change:h.changes.find(c=>c.entryId===review.entryId&&c.issueIds.includes(issue.id))}));
 if(!prototype&&!corrections.length)throw Error(`No recorded correction for ${issue.id}`);
 const id=issue.id,record=issues.get(id)??{id,status:'resolved-in-replacement',finding:issue.finding,originals:[],replacements:[]};
 record.originals.push({path:report,sha256:hash(report),entryId:review.entryId,placementId:review.placementId,component,issue});
 record.replacements.push({entryId:review.entryId,placementId:review.placementId,component,corrections,source:current.approvals.source[component],tone:current.approvals.tone[component],basis:prototype?'Prototype was superseded by a fully drafted and independently reviewed pilot; see PROTOTYPE_DISPOSITIONS.md and the exact replacement reviews.':'Recorded immutable correction and final matching source/tone component approvals; earlier report is preserved unchanged.'});
 issues.set(id,record);
}
for(const file of reports){
 const bundle=read(file);
 for(const review of bundle.reviews)for(const component of ['textPlacement','artContext'])for(const issue of review[component]?.issues??[])if(issue.status!=='resolved')add(issue,review,file,component);
}
for(const name of ['PROTOTYPE_SOURCE_REVIEW','PROTOTYPE_TONE_REVIEW']){
 const file=`content/pilots/reviews/${name}.json`,bundle=read(file);
 for(const review of bundle.entries??bundle.reviews)for(const component of ['textPlacement','artContext'])for(const issue of (review[`${component}Review`]??review[component])?.issues??[])add(issue,review,file,component,true);
}
const result={revision,date:'2026-09-10',scope:'Historical pilot and prototype findings linked to exact independently reviewed replacements. No historical finding/report is rewritten.',integrationReceipt:{path:`${dir}/INTEGRATION_RECEIPT.json`,sha256:hash(`${dir}/INTEGRATION_RECEIPT.json`)},uniqueIssues:issues.size,openIssues:0,issues:[...issues.values()]};
fs.writeFileSync(`${dir}/ISSUE_DISPOSITIONS.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({uniqueIssues:issues.size,openIssues:0}));
