// Split explicit cross-contribution decisions for the existing report compiler.
// No verdict, assessment, issue, evidence or text is created here.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const [batchPath,decisionPath]=process.argv.slice(2);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const batch=read(batchPath),decision=read(decisionPath);
const judged=decision.decisions.flatMap(d=>d.placementIds);
if(new Set(judged).size!==judged.length||JSON.stringify([...judged].sort())!==JSON.stringify([...batch.placementIds].sort()))throw Error('Every exact packet placement needs one actual decision');
const result=[];
for(const revision of batch.revision.split(',')){
 const manifest=read(`${revision}/MANIFEST.json`),targets=new Set(manifest.targetPlacementIds);
 const decisions=decision.decisions.map(d=>({...d,placementIds:d.placementIds.filter(p=>targets.has(p))})).filter(d=>d.placementIds.length);
 if(!decisions.length)continue;
 const root=`content/${manifest.owner}/reviews`,name=decisionPath.split('/').at(-1);
 fs.mkdirSync(`${root}/decisions`,{recursive:true});
 const splitPath=`${root}/decisions/${name}`,output=`${root}/${name}`;
 fs.writeFileSync(splitPath,JSON.stringify({...decision,decisions,editorialDecisionInput:{path:decisionPath,sha256:hash(decisionPath)},packet:{path:batchPath,sha256:hash(batchPath)}},null,2)+'\n',{flag:'wx'});
 result.push(JSON.parse(execFileSync(process.execPath,['content/pilots/build-review-report.mjs',revision,splitPath,output],{encoding:'utf8'})));
}
console.log(JSON.stringify(result));
