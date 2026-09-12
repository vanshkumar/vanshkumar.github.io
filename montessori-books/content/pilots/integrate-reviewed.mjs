// Offline integration gate. Review records and receipts never enter the app graph.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { digest, publicEntry, publicPlacement, publicScene } from './review-snapshot.mjs';
import { createGuideStore } from '../../src/guide/store.js';
import { topics } from '../../src/guide/catalog.js';

const [revision, ...reviewPaths] = process.argv.slice(2);
if (!/^r\d+$/.test(revision ?? '') || reviewPaths.length < 2) throw new Error('Usage: integrate-reviewed.mjs r01 source.json tone.json [re-reviews.json …]');
const directory = `content/pilots/revisions/${revision}`;
if (fs.existsSync(`${directory}/INTEGRATION_RECEIPT.json`)) throw new Error('This immutable revision was already integrated');
const read = file => JSON.parse(fs.readFileSync(file));
const hashFile = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest = read(`${directory}/MANIFEST.json`);
const renderedPath = `${directory}/RENDERED_SURFACES.json`;
const rendered = read(renderedPath);
if (rendered.surfaces.length !== manifest.snapshots.length) throw new Error('Incomplete current rendered surfaces');
for (const source of manifest.sources) {
  if (!source.author?.task || hashFile(source.path) !== source.sha256) throw new Error(`Changed or unattributed draft: ${source.path}`);
}
const authors = new Set(manifest.sources.map(source => source.author?.task).filter(Boolean));
const payload = read(`${directory}/payload.json`);
const clean = { entries: payload.entries.map(publicEntry), placements: payload.placements.map(publicPlacement), scenes: payload.scenes.map(publicScene) };
const guide = createGuideStore(clean);
for (const age of ['6-9', '18-24']) {
  const openings = guide.openings(age);
  if (openings.length !== 3 || openings.some((item, index) => item.placement.openingOrder !== index + 1) || !guide.scene(age) || topics.some(topic => !guide.forTopic(age, topic.id).length)) throw new Error(`Incomplete pilot: ${age}`);
}
if (digest(clean) !== digest(payload)) throw new Error('Payload contains non-public fields');
if (manifest.snapshots.length !== clean.placements.length || new Set(manifest.snapshots.map(item => item.placementId)).size !== clean.placements.length || clean.entries.some(entry => !clean.placements.some(placement => placement.entryId === entry.id))) throw new Error('Incomplete snapshot coverage');
for (const renderer of manifest.renderer) if (hashFile(renderer.path) !== renderer.sha256) throw new Error(`Renderer changed after freeze: ${renderer.path}`);
const records = reviewPaths.flatMap(file => {
  const bundle = read(file);
  if (!['source', 'tone'].includes(bundle.reviewer?.role) || bundle.reviewer.reasoning !== 'xhigh' || !bundle.reviewer.task) throw new Error(`Missing independent reviewer identity: ${file}`);
  if (authors.has(bundle.reviewer.task)) throw new Error(`Author cannot approve own pilot: ${file}`);
  if (!bundle.renderedSurfaces?.path || hashFile(bundle.renderedSurfaces.path) !== bundle.renderedSurfaces.sha256) throw new Error(`Missing or changed reviewed rendering: ${file}`);
  const rendering = read(bundle.renderedSurfaces.path);
  return bundle.reviews.map(review => ({ file, fileSha256: hashFile(file), bundle, review, rendering }));
});
const receipt = { revision, integratedOn: '2026-09-10', payloadSha256: hashFile(`${directory}/payload.json`), renderedSurfaces: { path: renderedPath, sha256: hashFile(renderedPath) }, components: [] };
for (const item of manifest.snapshots) {
  if (hashFile(item.path) !== item.sha256) throw new Error(`Changed snapshot: ${item.path}`);
  const snapshot = read(item.path);
  const publicProjection = snapshot.publicProjection;
  if (digest(publicProjection.textPlacement) !== item.textPlacementSha256 || (publicProjection.artContext ? digest(publicProjection.artContext) : null) !== item.artContextSha256 || digest(publicProjection) !== item.publicProjectionSha256) throw new Error(`Invalid snapshot digests: ${item.path}`);
  const expectedEntry = clean.entries.find(entry => entry.id === item.entryId);
  const { illustration, ...wording } = expectedEntry;
  if (digest(wording) !== digest(publicProjection.textPlacement.entry) || digest(clean.placements.find(placement => placement.id === item.placementId)) !== digest(publicProjection.textPlacement.placement)) throw new Error(`Payload/snapshot mismatch: ${item.placementId}`);
  const expectedScene = publicProjection.textPlacement.placement.openingOrder != null ? clean.scenes.find(scene => scene.ageId === publicProjection.textPlacement.placement.ageId) : null;
  if (digest(expectedScene ?? null) !== digest(publicProjection.artContext?.scene ?? null) || digest(illustration ?? null) !== digest(publicProjection.artContext?.illustration ?? null)) throw new Error(`Payload/art-context mismatch: ${item.placementId}`);
  for (const asset of publicProjection.artContext?.assets ?? []) if (hashFile(`public/${asset.src}`) !== asset.sha256) throw new Error(`Changed image bytes: ${asset.src}`);
  const approvals = {};
  for (const role of ['source', 'tone']) {
    approvals[role] = {};
    for (const component of ['textPlacement', 'artContext']) {
      const componentHash = item[`${component}Sha256`];
      if (!componentHash) continue;
      const record = [...records].reverse().find(({ bundle, review }) => bundle.reviewer.role === role && review.placementId === item.placementId && review.entryId === item.entryId && review[`${component}Sha256`] === componentHash && review[component]?.verdict);
      if (!record || record.review[component].verdict !== 'pass' || (record.review[component].issues ?? []).some(issue => issue.status !== 'resolved')) throw new Error(`Missing current ${role} ${component} pass: ${item.placementId}`);
      const { review, bundle } = record;
      const surface = record.rendering.surfaces.find(row => row.placementId === item.placementId && row.entryId === item.entryId);
      const currentSurface = rendered.surfaces.find(row => row.placementId === item.placementId && row.entryId === item.entryId);
      const visible = row => ({ entryText: row.entryText, openingText: row.openingText, topicRows: row.topicRows.map(topic => ({ topicId: topic.topicId, text: topic.text })) });
      if (!surface || !currentSurface || digest(visible(surface)) !== digest(visible(currentSurface))) throw new Error(`Rendered context changed; renew review: ${review.id}`);
      if (hashFile(review.snapshotPath) !== review.snapshotFileSha256) throw new Error(`Changed reviewed snapshot: ${review.snapshotPath}`);
      const reviewed = read(review.snapshotPath);
      if (reviewed[`${component}Sha256`] !== componentHash || digest(reviewed.publicProjection[component]) !== componentHash) throw new Error(`Review identity mismatch: ${review.id}`);
      if (component === 'artContext') for (const asset of publicProjection.artContext.assets) {
        if (!review.artContext.assetReads?.some(read => read.src === asset.src && read.sha256 === asset.sha256 && read.mode === 'actual-image-visual' && read.description)) throw new Error(`Missing actual artwork inspection: ${review.id}/${asset.src}`);
      }
      if (!review.readLogIds?.length) throw new Error(`Missing actual reads: ${review.id}`);
      const logs = review.readLogIds.map(id => bundle.readLogs.find(log => log.id === id));
      if (logs.some(log => !log)) throw new Error(`Unresolved read log: ${review.id}`);
      for (const ref of expectedEntry.references) for (const span of ref.pdfPages) for (let page = span.start; page <= span.end; page++) {
        if (!logs.some(log => log.sourceId === ref.sourceId && ['full-text', 'full-page-visual'].includes(log.mode) && log.pdfPages?.some(range => range.start <= page && range.end >= page))) throw new Error(`Cited page unread in ${review.id}: ${ref.sourceId}/${page}`);
      }
      approvals[role][component] = { reviewId: review.id, reviewer: bundle.reviewer.task, file: record.file, fileSha256: record.fileSha256, snapshotPath: review.snapshotPath, componentSha256: componentHash };
    }
  }
  if (approvals.source.textPlacement.reviewer === approvals.tone.textPlacement.reviewer) throw new Error(`Reviewers are not distinct: ${item.placementId}`);
  if (item.artContextSha256 && approvals.source.artContext.reviewer === approvals.tone.artContext.reviewer) throw new Error(`Art reviewers are not distinct: ${item.placementId}`);
  receipt.components.push({ entryId: item.entryId, placementId: item.placementId, approvals });
}
fs.writeFileSync('src/guide/approved.json', JSON.stringify(clean, null, 2) + '\n');
fs.writeFileSync(`${directory}/INTEGRATION_RECEIPT.json`, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
const assets = [...new Set([...clean.scenes, ...clean.entries.map(entry => entry.illustration).filter(Boolean)].map(image => image.src))];
fs.writeFileSync('content/pilots/APPROVED_RELEASE.json', JSON.stringify({ revision, payloadSha256: hashFile('src/guide/approved.json'), receiptPath: `${directory}/INTEGRATION_RECEIPT.json`, receiptSha256: hashFile(`${directory}/INTEGRATION_RECEIPT.json`), assets: assets.map(src => ({ src, sha256: hashFile(`public/${src}`) })) }, null, 2) + '\n');
console.log(`Integrated ${clean.entries.length} canonical entries / ${clean.placements.length} reviewed age placements.`);
