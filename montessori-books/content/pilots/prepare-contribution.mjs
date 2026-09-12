import fs from 'node:fs';
import {assemble,hash,write,location} from './contribution-core.mjs';
const [directory,...drafts]=process.argv.slice(2);
location(directory);
if(fs.existsSync(directory))throw Error('Immutable contribution revision already exists');
const registry={path:'content/pilots/CANONICAL_REGISTRY.json',sha256:hash('content/pilots/CANONICAL_REGISTRY.json')};
const {payload,manifest,snapshots}=assemble(directory,drafts,registry);
fs.mkdirSync(`${directory}/snapshots`,{recursive:true});
write(`${directory}/payload.json`,payload);
for(const {placement,snapshot} of snapshots){
 const file=`${directory}/snapshots/${placement.id}.json`;write(file,snapshot);
 manifest.snapshots.push({entryId:placement.entryId,placementId:placement.id,path:file,sha256:hash(file),textPlacementSha256:snapshot.textPlacementSha256,artContextSha256:null,publicProjectionSha256:snapshot.publicProjectionSha256});
}
write(`${directory}/MANIFEST.json`,manifest);
console.log(JSON.stringify({directory,targets:snapshots.length,mode:manifest.mode}));
