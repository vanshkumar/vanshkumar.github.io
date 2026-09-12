// Real HomeStudy markup with images/captions suppressed for private text review.
import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {createGuideStore} from '../../src/guide/store.js';
import {readRoute,homeLink} from '../../src/guide/routes.js';
import {loadFrozen,write} from './contribution-core.mjs';
const [directory]=process.argv.slice(2);
const {payload,manifest}=loadFrozen(directory);
if(fs.existsSync(`${directory}/RENDERED_SURFACES.json`))throw Error('Immutable rendering already exists');
const label='Text-only review — artwork and composition pending';
const sentinel='__private_text_review_structure__';
// HomeStudy currently gates its opening text on scene existence. This private
// in-memory object enters that branch; no file/image bytes are created, fetched,
// displayed, frozen, or passed to a reviewer as approved art.
const scenes=[...new Set(payload.placements.filter(p=>p.openingOrder!=null).map(p=>p.ageId))].map(ageId=>({id:`text-${ageId}`,ageId,layout:'open-left',src:sentinel,alt:'',width:1,height:1,caption:'',sourceId:'baby-2021'}));
const guide=createGuideStore({...payload,scenes});
const plain=html=>html.replace(/<[^>]*>/g,' ').replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const textMarkup=html=>{
 const result=html.replace(/<link\b[^>]*as="image"[^>]*\/?\s*>/g,'').replace(/<img\b[^>]*\/?\s*>/g,'').replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/g,'');
 if(result.includes(sentinel)||/<img\b|<figcaption\b/.test(result))throw Error('Artwork leaked into text-only rendering');
 return result;
};
fs.mkdirSync(`${directory}/rendered`,{recursive:true});
const server=await createServer({optimizeDeps:{noDiscovery:true,include:[],entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const {default:HomeStudy}=await server.ssrLoadModule('/src/HomeStudy.jsx');
 const render=options=>textMarkup(renderToStaticMarkup(React.createElement(HomeStudy,{route:readRoute(homeLink(options)),guide})));
 const save=(name,html)=>{
  const file=`${directory}/rendered/${name}.html`;
  fs.writeFileSync(file,`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/home.css"></head><body><p role="note">${label}</p>${html.replaceAll('"/montessori-books/','"/')}</body></html>`,{flag:'wx'});
  return file;
 };
 const surfaces=manifest.targetPlacementIds.map(placementId=>{
  const p=payload.placements.find(p=>p.id===placementId),age=p.ageId,id=p.entryId;
  const entry=render({age,entry:id}),opening=p.openingOrder!=null?render({age,idea:id}):null;
  const renderedEntryPath=save(`${p.id}.entry`,entry);
  const renderedOpeningPath=opening?save(`${p.id}.opening`,opening):null;
  const topicRows=p.topicIds.map(topicId=>{
   const html=render({age,topic:topicId});
   const row=html.match(new RegExp(`<a id="entry-link-${id}"[\\s\\S]*?</a>`));
   if(!row)throw Error(`Missing topic row: ${p.id}/${topicId}`);
   return {topicId,text:plain(row[0]),html:row[0]};
  });
  if(opening&&!opening.includes('id="home-invitation"'))throw Error(`Missing actual opening text: ${p.id}`);
  return {entryId:id,placementId:p.id,openingText:opening?plain(opening):null,topicRows,entryText:plain(entry),renderedEntryPath,renderedOpeningPath};
 });
 write(`${directory}/RENDERED_SURFACES.json`,{revision:manifest.revision,mode:manifest.mode,reviewLabel:label,rendererMode:'Actual HomeStudy server render with private structural opening context; all image and caption output removed. No placeholder image, artwork verdict, layout approval or publication.',surfaces});
 console.log(JSON.stringify({directory,targets:surfaces.length,openingTextSurfaces:surfaces.filter(s=>s.openingText).length,images:0}));
}finally{await server.close();}
