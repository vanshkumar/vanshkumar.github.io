// Offline, text-only population contribution workflow. No application writes.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {digest, makeSnapshot, publicEntry, publicPlacement} from './review-snapshot.mjs';
import {displayContext} from './display-context.mjs';
import {stages} from '../../src/concepts.js';
import {books, topics, kindLabels} from '../../src/guide/catalog.js';
import {createGuideStore} from '../../src/guide/store.js';

export const read = file => JSON.parse(fs.readFileSync(file));
export const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', {flag:'wx'});
export const rendererPaths = ['src/HomeStudy.jsx','src/home.css','src/styles.css','src/guide/catalog.js','src/concepts.js'];
export const policies = {
  'birth-6': {prefixes:['early-'], ages:['0-3','3-6']},
  '6-18': {prefixes:['infant-'], ages:['6-9','9-12','12-18']},
  '18-36': {prefixes:['later-','family-'], ages:['18-24','24-36']},
};
export function location(directory) {
  const match = /^content\/(birth-6|6-18|18-36)\/revisions\/(r\d+)$/.exec(directory ?? '');
  if (!match) throw Error('Use an owned content/{birth-6,6-18,18-36}/revisions/rNN directory');
  return {owner:match[1], revision:match[2], root:`content/${match[1]}`, ...policies[match[1]]};
}
function owned(file, root) {
  const relative = path.relative(path.resolve(root), path.resolve(file));
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw Error(`Input outside owned directory: ${file}`);
}
const textEntry = entry => {const {illustration, ...text} = publicEntry(entry); return text;};
function validateEntry(entry) {
  if (!/^[a-z0-9-]+$/.test(entry.id) || !kindLabels[entry.kind] || !entry.title?.trim() || !entry.summary?.trim() || !entry.references?.length) throw Error(`Incomplete entry: ${entry.id}`);
  for (const ref of entry.references) {
    if (!ref.id || !books[ref.sourceId] || !ref.section?.trim() || !ref.locator?.trim() || ref.legacyPageLabel || !ref.pdfPages?.length) throw Error(`Incomplete reference: ${ref.id}`);
    const end = ref.sourceId === 'baby-2021' ? 310 : 257;
    for (const span of ref.pdfPages) if (!Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start < 1 || span.end < span.start || span.end > end) throw Error(`Invalid reference pages: ${ref.id}`);
  }
}

// Deterministically rebuild from explicitly named immutable inputs. Verification
// repeats this assembly, so editing a frozen projection cannot confer approval.
export function assemble(directory, draftPaths, registryReference) {
  const config = location(directory);
  if (!draftPaths.length || new Set(draftPaths).size !== draftPaths.length) throw Error('Explicit unique drafts required');
  if (registryReference.path !== 'content/pilots/CANONICAL_REGISTRY.json' || hash(registryReference.path) !== registryReference.sha256) throw Error('Missing or changed frozen pilot registry');
  const registry = read(registryReference.path);
  for (const reference of [registry.manifest, registry.integrationReceipt]) if (hash(reference.path) !== reference.sha256) throw Error(`Changed registry input: ${reference.path}`);
  const pilotManifest = read(registry.manifest.path), pilotReceipt = read(registry.integrationReceipt.path);
  const payloadPath = path.posix.join(path.posix.dirname(registry.manifest.path),'payload.json');
  if (hash(payloadPath) !== pilotReceipt.payloadSha256) throw Error('Pilot payload is not the integrated version');
  const pilot = read(payloadPath), registered = new Map(registry.entries.map(e => [e.id,e]));
  if (registered.size !== pilot.entries.length || pilot.placements.length !== pilotReceipt.components.length) throw Error('Incomplete pilot registry context');
  for (const entry of pilot.entries) {
    const record = registered.get(entry.id);
    if (!record || record.canonicalEntrySha256 !== digest(entry) || record.publicProjection.path !== payloadPath || record.publicProjection.sha256 !== hash(payloadPath)) throw Error(`Invalid registered canonical body: ${entry.id}`);
  }
  const sources = draftPaths.map(file => {
    owned(file,config.root);
    const draft = read(file);
    if (!draft.author?.task || draft.scenes?.length || draft.entries?.some(e => e.illustration)) throw Error(`Attributed text-only draft required: ${file}`);
    return {path:file,sha256:hash(file),author:draft.author,draft};
  });
  const newEntries = sources.flatMap(s => (s.draft.entries ?? []).map(entry => {
    if (registered.has(entry.id) || !config.prefixes.some(prefix => entry.id.startsWith(prefix))) throw Error(`Canonical ID is not owned here: ${entry.id}`);
    if (!s.draft.provenance?.some(p => p.entryId === entry.id)) throw Error(`Missing canonical provenance: ${entry.id}`);
    validateEntry(entry);
    return publicEntry(entry);
  }));
  const newIds = new Set(newEntries.map(e => e.id));
  const reuse = sources.flatMap(s => s.draft.reuse ?? []);
  const reuseIds = new Set();
  for (const ref of reuse) {
    const record = registered.get(ref.entryId);
    if (!record || reuseIds.has(ref.entryId) || ref.registryRevision !== registry.revision || ref.canonicalEntrySha256 !== record.canonicalEntrySha256) throw Error(`Stale/duplicate canonical reuse: ${ref.entryId}`);
    if (hash(record.authoringRecord.path) !== record.authoringRecord.sha256) throw Error(`Changed canonical authoring record: ${ref.entryId}`);
    reuseIds.add(ref.entryId);
  }
  const targetPlacements = sources.flatMap(s => (s.draft.placements ?? []).map(raw => {
    const p = publicPlacement(raw);
    if (p.id !== `${p.ageId}.${p.entryId}` || !stages.some(age => age.id === p.ageId) || !p.topicIds?.length || new Set(p.topicIds).size !== p.topicIds.length || p.topicIds.some(id => !topics.some(t => t.id === id))) throw Error(`Invalid placement: ${p.id}`);
    if (!newIds.has(p.entryId) && !(reuseIds.has(p.entryId) && config.ages.includes(p.ageId))) throw Error(`Placement is not owned here: ${p.id}`);
    if (p.openingOrder != null && (!config.ages.includes(p.ageId) || ![1,2,3].includes(p.openingOrder))) throw Error(`Invalid cross-age/opening selection: ${p.id}`);
    const evidence = s.draft.placementEvidence?.find(e => e.placementId === p.id);
    if (!evidence?.sourceAge || !evidence.readiness || !evidence.editorialPlacement) throw Error(`Missing three-part private age evidence: ${p.id}`);
    return p;
  }));
  if (!targetPlacements.length || [...newIds,...reuseIds].some(id => !targetPlacements.some(p => p.entryId === id))) throw Error('Every authored/reused ID needs an owned target placement');
  // Accepted pilot pairs provide immutable rendering context; they are never
  // contributor targets and cannot be replaced or copied by another task.
  const payload = {entries:[...pilot.entries.map(textEntry),...newEntries],placements:[...pilot.placements,...targetPlacements],scenes:[]};
  const guide = createGuideStore(payload);
  for (const age of config.ages) {
    const openings = guide.openings(age);
    if (openings.length !== 3 || openings.some((item,i) => item.placement.openingOrder !== i+1 || !item.entry.actionLabel || !item.entry.invitation) || topics.some(t => !guide.forTopic(age,t.id).length)) throw Error(`Three complete openings and five topics required: ${age}`);
  }
  const manifest = {revision:config.revision,owner:config.owner,mode:'text-only-contribution',createdOn:'2026-09-10',
    purpose:'Private exact text review. Artwork, composition and publication remain pending.',
    registry:registryReference,context:{manifest:registry.manifest,integrationReceipt:registry.integrationReceipt,payload:{path:payloadPath,sha256:hash(payloadPath)},placementIds:pilot.placements.map(p=>p.id)},
    sources:sources.map(({draft,...source})=>source),reuse,
    renderer:rendererPaths.map(file=>({path:file,sha256:hash(file)})),targetPlacementIds:targetPlacements.map(p=>p.id),snapshots:[],
    artworkBoundary:'No scene or placeholder asset in this contribution. Existing canonical illustrations are omitted from this generated text-only projection. Exact actual artwork combinations require Task 8 reviews.'};
  const snapshots = targetPlacements.map(p => {
    const entry=guide.entry(p.entryId), source=sources.find(s=>s.draft.placements?.some(item=>item.id===p.id));
    const canonical=registered.get(entry.id);
    return {placement:p,snapshot:makeSnapshot({entry,placement:p,displayContext:displayContext(entry,p),provenance:{revision:config.revision,placementDraft:{path:source.path,sha256:source.sha256},canonical:canonical?{entryId:entry.id,canonicalEntrySha256:canonical.canonicalEntrySha256,authoringRecord:canonical.authoringRecord}:null,mode:'text-only-contribution'}})};
  });
  return {payload,manifest,snapshots,pilotManifest};
}

export function loadFrozen(directory) {
  location(directory);
  const manifest=read(`${directory}/MANIFEST.json`);
  if (manifest.mode !== 'text-only-contribution') throw Error('Expected text-only contribution');
  const rebuilt=assemble(directory,manifest.sources.map(s=>s.path),manifest.registry);
  if (digest(rebuilt.payload) !== digest(read(`${directory}/payload.json`))) throw Error('Changed frozen payload');
  for (const source of manifest.sources) if(hash(source.path)!==source.sha256)throw Error(`Changed frozen draft: ${source.path}`);
  for (const renderer of manifest.renderer) if(hash(renderer.path)!==renderer.sha256)throw Error(`Changed frozen renderer: ${renderer.path}`);
  if (digest({...manifest,snapshots:[]})!==digest(rebuilt.manifest))throw Error('Changed frozen manifest/context');
  if(manifest.snapshots.length!==rebuilt.snapshots.length)throw Error('Incomplete target snapshots');
  for(const {placement,snapshot} of rebuilt.snapshots){
    const item=manifest.snapshots.find(s=>s.placementId===placement.id);
    if(!item||item.path!==`${directory}/snapshots/${placement.id}.json`||hash(item.path)!==item.sha256||digest(read(item.path))!==digest(snapshot)||item.textPlacementSha256!==snapshot.textPlacementSha256||item.artContextSha256!==null)throw Error(`Changed target snapshot: ${placement.id}`);
  }
  return {...rebuilt,manifest};
}
