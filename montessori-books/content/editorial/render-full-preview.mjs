// Private real-component preview; never writes the application's approved payload.
import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {createGuideStore} from '../../src/guide/store.js';
import {readRoute,homeLink} from '../../src/guide/routes.js';
import {read,hash,loadFrozen,rendererPaths} from '../pilots/contribution-core.mjs';
import {digest,makeSnapshot} from '../pilots/review-snapshot.mjs';
import {displayContext} from '../pilots/display-context.mjs';
const [name='full-r01']=process.argv.slice(2);
if(!/^full-r\d+$/.test(name))throw Error('Unique full-rNN required');
const directory=`content/editorial/${name}`,scratch=`tmp/editorial/${name}`;
if(fs.existsSync(directory))throw Error('Immutable preview already exists');
fs.mkdirSync(directory,{recursive:true});fs.mkdirSync(scratch,{recursive:true});
const pilot=read('content/pilots/revisions/r08/payload.json');
const entries=new Map(pilot.entries.map(e=>[e.id,e])),placements=new Map(pilot.placements.map(p=>[p.id,p]));
const contributions=[];
for(const [owner,revision] of Object.entries(read('content/editorial/ACTIVE_REVISIONS.json'))){
 const path=`content/${owner}/revisions/${revision}`;
 const {payload,manifest}=loadFrozen(path);contributions.push({path,manifestSha256:hash(`${path}/MANIFEST.json`)});
 for(const id of manifest.targetPlacementIds){const p=payload.placements.find(p=>p.id===id);if(placements.has(id))throw Error(`Duplicate target ${id}`);placements.set(id,p);}
 for(const e of payload.entries){if(entries.has(e.id)){const {illustration,...text}=entries.get(e.id);if(digest(text)!==digest(e))throw Error(`Conflicting body ${e.id}`);}else entries.set(e.id,e);}
}
const art=read('content/editorial/ART_CANDIDATES.json');
for(const {entryId,...illustration} of art.illustrations)entries.set(entryId,{...entries.get(entryId),illustration});
const payload={entries:[...entries.values()],placements:[...placements.values()],scenes:[...pilot.scenes,...art.scenes]};
const assets=Object.fromEntries([...payload.scenes,...art.illustrations].map(a=>[a.src,hash(`public/${a.src}`)]));
const guide=createGuideStore(payload),records=[];
const server=await createServer({optimizeDeps:{noDiscovery:true,include:[],entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const {default:HomeStudy}=await server.ssrLoadModule('/src/HomeStudy.jsx');
 const render=options=>renderToStaticMarkup(React.createElement(HomeStudy,{route:readRoute(homeLink(options)),guide}));
 const save=(name,html)=>{const path=`${scratch}/${name}.html`;fs.writeFileSync(path,`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/home.css"><link rel="stylesheet" href="/src/art-surfaces.css"><title>Small Beginnings — private art review</title></head><body>${html.replaceAll('"/montessori-books/','"/')}</body></html>`);return path;};
 for(const p of payload.placements){
  const entry=guide.entry(p.entryId),scene=p.openingOrder!=null?guide.scene(p.ageId):null;
  const snapshot=makeSnapshot({entry,placement:p,scene,assetDigests:assets,displayContext:displayContext(entry,p)});
  const paths={};
  if(scene)paths.opening=save(`${p.id}.opening`,render({age:p.ageId,idea:p.entryId}));
  if(entry.illustration)paths.reader=save(`${p.id}.entry`,render({age:p.ageId,entry:p.entryId}));
  if(scene||entry.illustration)records.push({placementId:p.id,snapshot,paths,previousPilotArtwork:pilot.placements.some(x=>x.id===p.id)&&!entry.illustration});
 }
 const write=(file,value)=>fs.writeFileSync(`${directory}/${file}`,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
 write('payload.json',payload);
 write('ART_CONTEXTS.json',{status:'Pending independent actual-art reviews',contexts:records});
 write('MANIFEST.json',{contributions,artInput:{path:'content/editorial/ART_CANDIDATES.json',sha256:hash('content/editorial/ART_CANDIDATES.json')},payloadSha256:hash(`${directory}/payload.json`),assets,renderer:[...rendererPaths,'src/art-surfaces.css','src/guide/store.js','src/guide/routes.js'].map(path=>({path,sha256:hash(path)})),publication:false});
 console.log(JSON.stringify({directory,entries:entries.size,placements:placements.size,artContexts:records.length,newArtContexts:records.filter(r=>!r.previousPilotArtwork).length}));
}finally{await server.close();}
