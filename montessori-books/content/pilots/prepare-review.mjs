// Offline: freeze explicitly named drafts for independent review. Never app-imported.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { makeSnapshot, publicEntry, publicPlacement, publicScene } from './review-snapshot.mjs';
import { stages } from '../../src/concepts.js';
import { topics, books, kindLabels, pageLabel } from '../../src/guide/catalog.js';
import { createGuideStore } from '../../src/guide/store.js';

const [revision, ...draftPaths] = process.argv.slice(2);
if (!/^r\d+$/.test(revision ?? '') || !draftPaths.length) throw new Error('Usage: prepare-review.mjs r01 draft.json …');
const directory = `content/pilots/revisions/${revision}`;
if (fs.existsSync(directory)) throw new Error(`Immutable revision already exists: ${directory}`);
const hashFile = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sources = draftPaths.map(file => ({ path: file, sha256: hashFile(file), draft: JSON.parse(fs.readFileSync(file)) }));
const entries = sources.flatMap(source => (source.draft.entries ?? []).map(publicEntry));
const placements = sources.flatMap(source => (source.draft.placements ?? []).map(publicPlacement));
const scenes = sources.flatMap(source => (source.draft.scenes ?? []).map(publicScene));
const guide = createGuideStore({ entries, placements, scenes });
for (const entry of entries) {
  if (!kindLabels[entry.kind] || !entry.title || !entry.summary || !entry.references.length) throw new Error(`Incomplete entry: ${entry.id}`);
  for (const ref of entry.references) {
    if (!books[ref.sourceId] || ref.legacyPageLabel || !ref.section || !ref.locator || !ref.pdfPages?.length) throw new Error(`Incomplete reference: ${ref.id}`);
    const last = ref.sourceId === 'baby-2021' ? 310 : 257;
    for (const span of ref.pdfPages) if (!Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start < 1 || span.end < span.start || span.end > last) throw new Error(`Invalid pages: ${ref.id}`);
  }
}
for (const placement of placements) {
  if (!stages.some(stage => stage.id === placement.ageId) || !placement.topicIds.length || placement.topicIds.some(id => !topics.some(topic => topic.id === id))) throw new Error(`Invalid placement: ${placement.id}`);
}
for (const age of ['6-9', '18-24']) {
  const opening = guide.openings(age);
  if (opening.length !== 3 || opening.some((item, index) => item.placement.openingOrder !== index + 1) || !guide.scene(age)) throw new Error(`Three ordered openings and a scene required: ${age}`);
  for (const topic of topics) if (!guide.forTopic(age, topic.id).length) throw new Error(`Empty pilot topic: ${age}/${topic.id}`);
}
const assets = [...new Set([...scenes, ...entries.map(entry => entry.illustration).filter(Boolean)].map(item => item.src))];
const assetDigests = Object.fromEntries(assets.map(src => [src, hashFile(`public/${src}`)]));
const manifest = { revision, createdOn: '2026-09-10', purpose: 'Unapproved immutable review input', sources: sources.map(({ draft, ...source }) => ({ ...source, author: draft.author ?? null })), renderer: ['src/HomeStudy.jsx', 'src/home.css', 'src/styles.css', 'src/guide/catalog.js', 'src/concepts.js'].map(file => ({ path: file, sha256: hashFile(file) })), snapshots: [] };
fs.mkdirSync(`${directory}/snapshots`, { recursive: true });
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
write(`${directory}/payload.json`, { entries, placements, scenes });
for (const placement of placements) {
  const entry = guide.entry(placement.entryId);
  const source = sources.find(source => source.draft.entries?.some(candidate => candidate.id === entry.id));
  const scene = placement.openingOrder != null ? guide.scene(placement.ageId) : null;
  const headings = ['A home within reach'];
  if (entry.cue) headings.push(entry.kind === 'invitation' ? 'Start by noticing' : 'In the everyday');
  if (placement.ageContext) headings.push('Age, interest & context');
  if (entry.steps?.length) headings.push(entry.kind === 'invitation' ? 'Try it together' : 'In this situation');
  if (entry.principle) headings.push('What’s underneath');
  headings.push('Back to the books');
  const snapshot = makeSnapshot({ entry, placement, scene, assetDigests,
    displayContext: {
      ageLabel: stages.find(stage => stage.id === placement.ageId).label,
      kindLabel: kindLabels[entry.kind], headings,
      ...(scene ? { openingCTA: entry.kind === 'invitation' ? 'Try this together' : 'Read more' } : {}),
      topics: placement.topicIds.map(id => topics.find(topic => topic.id === id)),
      referenceLabels: entry.references.map(ref => ({ title: books[ref.sourceId].title, pages: pageLabel(ref) })),
      bookline: 'A Montessori companion',
      footer: 'You don’t need a different home. Start with what you have.',
      colophon: 'Original summaries inspired by The Montessori Baby and The Montessori Toddler. Open any idea for its book references. The illustration is an invitation to explore, rather than a room to reproduce. Follow your child’s pace.',
      referenceNote: 'Paraphrased for this companion. Illustrations are original and illustrative.',
    },
    provenance: { draft: { path: source.path, sha256: source.sha256 }, revision, evidenceFile: source.path, note: 'Full private provenance and actual author read logs remain in this immutable draft and its handoff.' },
  });
  const file = `${directory}/snapshots/${placement.id}.json`;
  write(file, snapshot);
  manifest.snapshots.push({ entryId: entry.id, placementId: placement.id, path: file, sha256: hashFile(file), textPlacementSha256: snapshot.textPlacementSha256, artContextSha256: snapshot.artContextSha256, publicProjectionSha256: snapshot.publicProjectionSha256 });
}
write(`${directory}/MANIFEST.json`, manifest);
console.log(JSON.stringify({ directory: path.resolve(directory), entries: entries.length, placements: placements.length, scenes: scenes.length }));
