// Verification-only handoff. Never writes src/, pilot revisions, or release state.
import fs from 'node:fs';
import {digest} from './review-snapshot.mjs';
import {loadFrozen,read,hash,write,location} from './contribution-core.mjs';
import {mechanicallyEqual,requiredReferences,assertReadCoverage} from './lean-review.mjs';
const [directory,...reviewPaths]=process.argv.slice(2);
const config=location(directory),{payload,manifest}=loadFrozen(directory);
const currentRenderingPath=`${directory}/RENDERED_SURFACES.json`,currentRendering=read(currentRenderingPath);
if(currentRendering.mode!==manifest.mode||currentRendering.surfaces.length!==manifest.snapshots.length)throw Error('Missing complete current rendering');
const output=`${directory}/CONTRIBUTION_RECEIPT.json`;
if(fs.existsSync(output))throw Error('Immutable contribution already verified');
if(reviewPaths.length<2)throw Error('Explicit source and tone reports required, oldest to newest');
const authors=new Set(manifest.sources.map(s=>s.author.task));
const registry=read(manifest.registry.path);
const authoredEvidence=manifest.sources.flatMap(source=>read(source.path).placementEvidence??[]);
for(const ref of manifest.reuse)authors.add(registry.entries.find(e=>e.id===ref.entryId).authoringRecord.author);
const records=reviewPaths.flatMap(file=>{
 if(!file.startsWith(`${config.root}/`)||file.split('/').includes('..'))throw Error(`Review must be in owned directory: ${file}`);
 const bundle=read(file);
 if(!['source','tone'].includes(bundle.reviewer?.role)||bundle.reviewer.reasoning!=='xhigh'||!bundle.reviewer.task||authors.has(bundle.reviewer.task))throw Error(`Invalid independent reviewer: ${file}`);
 if(!bundle.renderedSurfaces?.path||!bundle.renderedSurfaces.path.startsWith(`${config.root}/revisions/`)||hash(bundle.renderedSurfaces.path)!==bundle.renderedSurfaces.sha256)throw Error(`Changed or missing reviewed rendering: ${file}`);
 const rendering=read(bundle.renderedSurfaces.path);
 if(rendering.mode!=='text-only-contribution')throw Error(`Wrong review mode: ${file}`);
 return bundle.reviews.map(review=>({file,fileSha256:hash(file),bundle,review,rendering}));
});
const receipt={revision:manifest.revision,owner:manifest.owner,mode:manifest.mode,verifiedOn:'2026-09-10',manifest:{path:`${directory}/MANIFEST.json`,sha256:hash(`${directory}/MANIFEST.json`)},payload:{path:`${directory}/payload.json`,sha256:hash(`${directory}/payload.json`)},renderedSurfaces:{path:currentRenderingPath,sha256:hash(currentRenderingPath)},registry:manifest.registry,components:[],publication:false,artwork:'Pending actual-image and combination review by Task 8; this receipt approves neither images nor composition.'};
for(const item of manifest.snapshots){
 const snapshot=read(item.path),entry=payload.entries.find(e=>e.id===item.entryId),approvals={};
 for(const role of ['source','tone']){
  const record=[...records].reverse().find(r=>r.bundle.reviewer.role===role&&r.review.placementId===item.placementId&&r.review.entryId===item.entryId&&r.review.textPlacement?.verdict&&
    (r.review.textPlacementSha256===item.textPlacementSha256||r.bundle.workflow==='lean-v1'&&r.review.snapshotPath.startsWith(`${config.root}/revisions/`)&&hash(r.review.snapshotPath)===r.review.snapshotFileSha256&&mechanicallyEqual(read(r.review.snapshotPath).publicProjection.textPlacement,snapshot.publicProjection.textPlacement)));
  if(!record||record.review.textPlacement.verdict!=='pass'||record.review.textPlacement.issues?.some(i=>i.status!=='resolved'))throw Error(`Missing current ${role} text pass: ${item.placementId}`);
  const {review,bundle,rendering}=record;
  if(!review.snapshotPath.startsWith(`${config.root}/revisions/`)||hash(review.snapshotPath)!==review.snapshotFileSha256)throw Error(`Changed reviewed snapshot: ${review.id}`);
  const reviewed=read(review.snapshotPath);
  const mechanical=review.textPlacementSha256!==item.textPlacementSha256;
  if(digest(reviewed.publicProjection.textPlacement)!==review.textPlacementSha256||mechanical&&!(bundle.workflow==='lean-v1'&&mechanicallyEqual(reviewed.publicProjection.textPlacement,snapshot.publicProjection.textPlacement))||review.artContextSha256!==null||review.artContext!==null||reviewed.publicProjection.artContext!==null)throw Error(`Wrong reviewed component: ${review.id}`);
  const surface=rendering.surfaces.find(s=>s.placementId===item.placementId&&s.entryId===item.entryId);
  if(!surface||!surface.entryText||snapshot.publicProjection.textPlacement.placement.openingOrder!=null&&!surface.openingText||snapshot.publicProjection.textPlacement.placement.topicIds.some(id=>!surface.topicRows.some(t=>t.topicId===id&&t.text)))throw Error(`Missing actual surfaces: ${review.id}`);
  const current=currentRendering.surfaces.find(s=>s.placementId===item.placementId);
  const visible=s=>({entryText:s.entryText,openingText:s.openingText,topicRows:s.topicRows});
  if(!current||!(digest(visible(surface))===digest(visible(current))||bundle.workflow==='lean-v1'&&mechanicallyEqual(visible(surface),visible(current))))throw Error(`Rendered context changed; renew review: ${review.id}`);
  const logs=(review.readLogIds??[]).map(id=>bundle.readLogs?.find(log=>log.id===id));
  const refs=bundle.workflow==='lean-v1'?requiredReferences({role,entry,evidence:authoredEvidence.find(e=>e.placementId===item.placementId),reuse:manifest.reuse.find(r=>r.entryId===item.entryId),review,registrySha256:manifest.registry.sha256}):entry.references;
  assertReadCoverage(refs,logs,review.id);
  approvals[role]={reviewId:review.id,reviewer:bundle.reviewer.task,file:record.file,fileSha256:record.fileSha256,snapshotPath:review.snapshotPath,textPlacementSha256:item.textPlacementSha256};
  if(review.bodyReview)approvals[role].bodyReview=review.bodyReview;
  if(bundle.workflow==='lean-v1')approvals[role].workflow='lean-v1';
  if(mechanical)approvals[role].mechanicalCarry={fromTextPlacementSha256:review.textPlacementSha256,rule:'NFC, whitespace and typographic quotes only; exact structure and normalized rendered surfaces match'};
 }
 if(approvals.source.reviewer===approvals.tone.reviewer)throw Error(`Reviewers are not distinct: ${item.placementId}`);
 receipt.components.push({entryId:item.entryId,placementId:item.placementId,textPlacementSha256:item.textPlacementSha256,artContextSha256:null,approvals});
}
write(output,receipt);
console.log(JSON.stringify({output,verifiedTextPlacements:receipt.components.length,publication:false,artwork:'pending'}));
