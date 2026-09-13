// Narrow final integration: retain exact text receipts, validate actual art,
// and project only those reviewed records into the existing application.
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {read,hash,write,loadFrozen} from '../pilots/contribution-core.mjs';
import {digest,makeSnapshot,publicEntry,publicPlacement,publicScene} from '../pilots/review-snapshot.mjs';
import {displayContext} from '../pilots/display-context.mjs';
import {assertReadCoverage,textDelta} from '../pilots/lean-review.mjs';
import {createGuideStore} from '../../src/guide/store.js';
import {readRoute,homeLink} from '../../src/guide/routes.js';
import {topics} from '../../src/guide/catalog.js';

const [directory,...artReviewPaths]=process.argv.slice(2);
if(!/^content\/editorial\/full-r\d+$/.test(directory??'')||artReviewPaths.length<2)throw Error('Frozen full preview and explicit independent art reports required');
const receiptPath=`${directory}/INTEGRATION_RECEIPT.json`;
if(fs.existsSync(receiptPath))throw Error('Immutable release already integrated');
const ref=path=>({path,sha256:hash(path)});
const unchanged=reference=>{if(hash(reference.path)!==reference.sha256)throw Error(`Changed input: ${reference.path}`);};
const manifest=read(`${directory}/MANIFEST.json`),payload=read(`${directory}/payload.json`);
if(hash(`${directory}/payload.json`)!==manifest.payloadSha256)throw Error('Changed full payload');
manifest.renderer.forEach(unchanged);unchanged(manifest.artInput);
for(const [src,sha256] of Object.entries(manifest.assets))unchanged({path:`public/${src}`,sha256});
if(digest(payload)!==digest({entries:payload.entries.map(publicEntry),placements:payload.placements.map(publicPlacement),scenes:payload.scenes.map(publicScene)}))throw Error('Private fields in public payload');
const guide=createGuideStore(payload),ages=['0-3','3-6','6-9','9-12','12-18','18-24','24-36'];
for(const age of ages){const openings=guide.openings(age);if(openings.length!==3||openings.some((x,i)=>x.placement.openingOrder!==i+1)||!guide.scene(age)||topics.some(t=>!guide.forTopic(age,t.id).length))throw Error(`Incomplete age: ${age}`);}

const baseline=read('content/pilots/APPROVED_RELEASE.json');
unchanged({path:baseline.receiptPath,sha256:baseline.receiptSha256});
const pilotPath='content/pilots/revisions/r08',pilot=read(`${pilotPath}/payload.json`),pilotManifest=read(`${pilotPath}/MANIFEST.json`),pilotReceipt=read(baseline.receiptPath);
if(hash(`${pilotPath}/payload.json`)!==baseline.payloadSha256)throw Error('Changed pilot baseline');
const text=new Map(),contributions=[];
function addText(base,sourceManifest,receipt,isPilot=false){
 for(const component of receipt.components){
  const item=sourceManifest.snapshots.find(s=>s.placementId===component.placementId);
  unchanged(item);
  const snapshot=read(item.path),approvals={};
  for(const role of ['source','tone']){
   const approval=isPilot?component.approvals[role].textPlacement:component.approvals[role];
   unchanged({path:approval.file,sha256:approval.fileSha256});approvals[role]=approval;
  }
  if(approvals.source.reviewer===approvals.tone.reviewer||text.has(component.placementId))throw Error('Duplicate or non-independent text approval');
  text.set(component.placementId,{snapshot,approvals,basis:base});
 }
}
addText(pilotPath,pilotManifest,pilotReceipt,true);
for(const contribution of manifest.contributions){
 unchanged({path:`${contribution.path}/MANIFEST.json`,sha256:contribution.manifestSha256});
 const {manifest:m}=loadFrozen(contribution.path),receipt=read(`${contribution.path}/CONTRIBUTION_RECEIPT.json`);
 [receipt.manifest,receipt.payload,receipt.renderedSurfaces,receipt.registry].forEach(unchanged);
 if(receipt.contributionComplete===false||receipt.components.length!==m.targetPlacementIds.length)throw Error('Incomplete contribution receipt');
 addText(contribution.path,m,receipt);contributions.push(ref(`${contribution.path}/CONTRIBUTION_RECEIPT.json`));
}
if(text.size!==payload.placements.length)throw Error('Unapproved placement or incomplete union');
const current=new Map();
for(const placement of payload.placements){
 const entry=guide.entry(placement.entryId),scene=placement.openingOrder!=null?guide.scene(placement.ageId):null;
 const snapshot=makeSnapshot({entry,placement,scene,assetDigests:manifest.assets,displayContext:displayContext(entry,placement)});
 if(snapshot.textPlacementSha256!==text.get(placement.id)?.snapshot.textPlacementSha256)throw Error(`Reviewed wording changed: ${placement.id}`);
 current.set(placement.id,snapshot);
}

// Actual rendering comparison uses existing frozen text surfaces. The pilot's
// original art captions are omitted from both sides of this text-only check.
const plain=html=>html.replace(/<[^>]*>/g,' ').replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const withoutArt=html=>html.replace(/<link\b[^>]*as="image"[^>]*\/?\s*>/g,'').replace(/<img\b[^>]*\/?\s*>/g,'').replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/g,'');
const renderingProof=[],navigationBindings=[];
const server=await createServer({optimizeDeps:{noDiscovery:true,include:[],entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const {default:HomeStudy}=await server.ssrLoadModule('/src/HomeStudy.jsx');
 const render=(store,options)=>withoutArt(renderToStaticMarkup(React.createElement(HomeStudy,{route:readRoute(homeLink(options)),guide:store})));
 const surface=(store,p)=>({entryText:plain(render(store,{age:p.ageId,entry:p.entryId})),openingText:p.openingOrder!=null?plain(render(store,{age:p.ageId,idea:p.entryId})):null,topicRows:p.topicIds.map(topicId=>{const html=render(store,{age:p.ageId,topic:topicId}).match(new RegExp(`<a id="entry-link-${p.entryId}"[\\s\\S]*?</a>`))?.[0];if(!html)throw Error('Missing topic row');return {topicId,text:plain(html),html};})});
 const pilotGuide=createGuideStore(pilot),cache=new Map();
 for(const p of payload.placements){
  const record=text.get(p.id),actual=surface(guide,p);
  let expected;
  if(record.basis===pilotPath)expected=surface(pilotGuide,p);
  else{if(!cache.has(record.basis))cache.set(record.basis,read(`${record.basis}/RENDERED_SURFACES.json`).surfaces);const s=cache.get(record.basis).find(s=>s.placementId===p.id);expected={entryText:s.entryText,openingText:s.openingText,topicRows:s.topicRows};}
  // A contributor may supply cross-age entries before that age's three opening
  // choices exist in its private payload. Full assembly makes the same default
  // return destination explicit. Permit only that exact, behavior-equivalent
  // href addition; all words, other attributes and query fields remain exact.
  const reconciled={...expected,topicRows:expected.topicRows.map(row=>{
   const target=actual.topicRows.find(r=>r.topicId===row.topicId);
   if(!target||target.html===row.html)return row;
   const options={age:p.ageId,topic:row.topicId,entry:p.entryId};
   const from=homeLink(options).replaceAll('&','&amp;');
   const idea=guide.openings(p.ageId)[0].entry.id;
   const to=homeLink({...options,idea}).replaceAll('&','&amp;');
   const html=row.html.replace(`href="${from}"`,`href="${to}"`);
   if(html===row.html||html!==target.html||target.text!==row.text)return row;
   navigationBindings.push({placementId:p.id,topicId:row.topicId,from,to,approvedDefaultOpening:idea});
   return {...row,html};
  })};
  if(digest(actual)!==digest(reconciled)){
   console.error(JSON.stringify({placementId:p.id,differences:Object.keys(actual).filter(k=>digest(actual[k])!==digest(expected[k])).map(field=>({field,delta:textDelta(JSON.stringify(expected[field]),JSON.stringify(actual[field]))}))}));
   throw Error(`Integrated reader/opening/topic wording changed: ${p.id}`);
  }
  renderingProof.push({placementId:p.id,sha256:digest(actual)});
 }
}finally{await server.close();}

const artPacketPath=`${directory}/ART_REVIEW_PACKET.json`,artPacket=read(artPacketPath),artContexts=read(`${directory}/ART_CONTEXTS.json`).contexts;
for(const group of artPacket.groups){unchanged(group);const packet=read(group.path);for(const context of packet.contexts)for(const screenshot of context.screenshots)unchanged(screenshot);}
const artReports=artReviewPaths.map(path=>{const bindingPath=path.replace(/\.json$/,'-BINDING.json'),binding=read(bindingPath);unchanged(binding.decisionInput);unchanged(binding.packet);return {path,sha256:hash(path),report:read(path),binding,bindingPath};});
const retainedReadingFiles=new Map();
function ownReads(report,reviewer,seen=new Set()){
 if(report.reviewer?.task!==reviewer.task||report.reviewer?.role!==reviewer.role)throw Error('Reading belongs to a different reviewer');
 const logs=[...(report.readLogs??[])];
 for(const link of report.retainedReads??[]){if(link.sha256)unchanged(link);const key=link.path;if(seen.has(key))continue;seen.add(key);retainedReadingFiles.set(key,ref(key));const prior=read(key);if(link.readLogIds){if(prior.reviewer?.task!==reviewer.task||prior.reviewer?.role!==reviewer.role)throw Error('Wrong retained reviewer');logs.push(...link.readLogIds.map(id=>{const log=prior.readLogs?.find(l=>l.id===id);if(!log)throw Error('Missing declared read');return log;}));}else logs.push(...ownReads(prior,reviewer,seen));}
 return logs;
}
const artApprovals=new Map();
const screenshotPath=record=>path.resolve(typeof record==='string'?record:record.path);
for(const id of artPacket.newPlacementIds){
 const context=artContexts.find(c=>c.placementId===id),snapshot=current.get(id);
 if(!context||context.snapshot.artContextSha256!==snapshot.artContextSha256)throw Error(`Art context changed: ${id}`);
 const group=artPacket.groups.find(g=>g.placementIds.includes(id)),packet=read(group.path),approvals={};
 for(const role of ['source','tone']){
  const found=[...artReports].reverse().find(r=>r.report.reviewer?.role===role&&r.binding.artContextHashes[id]===snapshot.artContextSha256&&r.report.decisions?.some(d=>d.placementIds.includes(id)));
  if(!found||found.report.reviewer.reasoning!=='xhigh'||found.report.reviewer.task==='/root')throw Error(`Missing independent art ${role}: ${id}`);
  const decision=found.report.decisions.find(d=>d.placementIds.includes(id));
  if(decision.verdict!=='pass'||decision.issues?.some(i=>i.status!=='resolved'))throw Error(`Unresolved art ${role}: ${id}`);
  const assetReads=[...(found.report.assetReads??[]),...(decision.assetReads??[])];
  if(!assetReads.some(a=>a.src===packet.actualArtwork.src&&a.mode==='actual-image-visual'&&a.description))throw Error(`Missing actual image inspection: ${id}`);
  const screenshotReads=new Set((found.report.screenshotReads??[]).map(screenshotPath));
  for(const s of packet.contexts.find(c=>c.placementId===id).screenshots)if(!screenshotReads.has(path.resolve(s.path)))throw Error(`Missing actual presentation inspection: ${id}/${s.path}`);
  const logs=ownReads(found.report,found.report.reviewer);
  const refs=role==='source'?[packet.sourceContext]:(decision.contextReferences??found.report.contextReferences??[]);
  if(!refs.length)throw Error(`Missing original art framing references: ${id}`);
  assertReadCoverage(refs,logs,id);
  approvals[role]={reviewer:found.report.reviewer.task,file:found.path,fileSha256:found.sha256,packet:group.path,packetSha256:group.sha256,artContextSha256:snapshot.artContextSha256};
 }
 if(approvals.source.reviewer===approvals.tone.reviewer)throw Error('Art perspectives are not independent');
 artApprovals.set(id,approvals);
}
for(const c of artContexts.filter(c=>c.previousPilotArtwork)){const original=read(pilotManifest.snapshots.find(s=>s.placementId===c.placementId).path);if(original.artContextSha256!==current.get(c.placementId).artContextSha256)throw Error('Pilot art changed');}
const coverage=read('content/editorial/coverage/RESOLUTION_SUMMARY.json');coverage.files.forEach(unchanged);
if(coverage.sourceIdeas!==1309||coverage.unresolvedSourceIdeas.length||coverage.invalidIncludedTargets.length)throw Error('Unresolved coverage allocation');
const supplementPath=`${directory}/ART_MOBILE_READER_SUPPLEMENT.json`,supplement=read(supplementPath);
for(const s of supplement.screenshots){unchanged(s);for(const role of ['source','tone'])if(!artReports.some(r=>r.report.reviewer.role===role&&(r.report.screenshotReads??[]).some(p=>screenshotPath(p)===path.resolve(s.path))))throw Error(`Missing ${role} phone reader inspection`);}
const receipt={integratedOn:new Date().toISOString(),payloadSha256:manifest.payloadSha256,contributions,pilot:ref(baseline.receiptPath),coverage:ref('content/editorial/coverage/RESOLUTION_SUMMARY.json'),artPacket:ref(artPacketPath),artSupplement:ref(supplementPath),artReports:artReports.map(({report,binding,...r})=>r),retainedReadingFiles:[...retainedReadingFiles.values()],renderingProof,navigationBindings,navigationBindingRule:'Only an omitted idea query parameter becoming the already-approved first opening of the same age; identical implicit/explicit return destination, exact reader words and all other markup/query fields preserved.',components:payload.placements.map(p=>({placementId:p.id,textPlacementSha256:current.get(p.id).textPlacementSha256,textApprovals:text.get(p.id).approvals,...(artApprovals.has(p.id)?{artApprovals:artApprovals.get(p.id)}:{})})),retainedPilotArtContexts:6,publication:'Approved local integration; deployment not performed'};
write(receiptPath,receipt);
fs.copyFileSync(`${directory}/payload.json`,'src/guide/approved.json');
write('content/APPROVED_RELEASE.json',{revision:directory.split('/').at(-1),payloadSha256:hash('src/guide/approved.json'),receiptPath,receiptSha256:hash(receiptPath),assets:Object.entries(manifest.assets).map(([src,sha256])=>({src,sha256})),renderer:[...manifest.renderer,...['src/main.jsx','src/guide/index.js','vite.config.js','index.html'].map(ref)]});
console.log(JSON.stringify({entries:payload.entries.length,placements:payload.placements.length,ages:ages.length,newArtContexts:artApprovals.size,receiptPath}));
