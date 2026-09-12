// Prepare explicit per-entry packets; never supplies reviewer judgments.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const [revision,name,...ids]=process.argv.slice(2);
if(!/^[a-z0-9-]+$/.test(name??'')||!ids.length)throw Error('revision batch-name explicit-entry-ids required');
const directory=`tmp/editorial/${name}`;
fs.mkdirSync(directory,{recursive:true});
const packets=ids.map(id=>{
 const text=execFileSync(process.execPath,['content/pilots/review-packet.mjs',revision,id,'--compact'],{encoding:'utf8'});
 const packet=JSON.parse(text),path=`${directory}/${id}.json`;
 fs.writeFileSync(path,text,{flag:'wx'});
 const pages={};
 for(const ref of packet.referenceCatalog)for(const span of ref.reference.pdfPages??[]){
  const book=ref.reference.sourceId==='baby-2021'?'baby':'toddler';
  pages[book]??=new Set();for(let p=span.start;p<=span.end;p++)pages[book].add(p);
 }
 return {id,path,sha256:createHash('sha256').update(text).digest('hex'),bytes:Buffer.byteLength(text),placementIds:packet.entries[0].placements.map(p=>p.placement.id),sourcePages:Object.fromEntries(Object.entries(pages).map(([book,ps])=>[book,[...ps].sort((a,b)=>a-b)]))};
});
const batch={revision,name,entryIds:ids,placementIds:packets.flatMap(p=>p.placementIds),packets,sourcePageDirectory:'tmp/editorial/sources',publication:false};
const path=`content/editorial/${name}.json`;
fs.writeFileSync(path,JSON.stringify(batch,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({path,entries:ids.length,placements:batch.placementIds.length,packetBytes:packets.reduce((n,p)=>n+p.bytes,0)}));
