// Read-only progress query; this does not approve or export reader content.
import fs from 'node:fs';
const [revision]=process.argv.slice(2);
if(!/^r\d+$/.test(revision??''))throw Error('Usage: review-status.mjs rNN');
const read=p=>JSON.parse(fs.readFileSync(p));
const manifest=read(`content/pilots/revisions/${revision}/MANIFEST.json`);
const files=fs.readdirSync('content/pilots/reviews/final').filter(f=>f.endsWith('.json'))
 .sort((a,b)=>Number(a.match(/r(\d+)\.json$/)?.[1]??0)-Number(b.match(/r(\d+)\.json$/)?.[1]??0)||a.localeCompare(b));
const bundles=files.map(file=>({file:`content/pilots/reviews/final/${file}`,bundle:read(`content/pilots/reviews/final/${file}`)}));
const records=bundles.flatMap(({file,bundle})=>bundle.reviews.map(review=>({file,bundle,review})));
const counts={},pending={};
for(const role of ['source','tone'])for(const component of ['textPlacement','artContext']){
 const key=`${role}.${component}`;counts[key]={pass:0,revise:0,hold:0,missing:0};pending[key]=[];
 for(const item of manifest.snapshots){
  const hash=item[`${component}Sha256`];if(!hash)continue;
  const found=[...records].reverse().find(({bundle,review})=>bundle.reviewer.role===role&&review.placementId===item.placementId&&review[`${component}Sha256`]===hash&&review[component]?.verdict);
  const verdict=found?.review[component].verdict??'missing';
  counts[key][verdict]++;
  if(verdict!=='pass')pending[key].push({id:item.placementId,verdict,...(found?{file:found.file,issues:found.review[component].issues.map(i=>i.id)}:{})});
 }
}
console.log(JSON.stringify({revision,reportCount:files.length,counts,pending,boundary:'Progress only. File/source/rendering integrity and editorial issue resolution still require the integration gate and human review.'},null,2));
