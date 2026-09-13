// Recurate existing age placements without rewriting reviewed reader content.
// This records user-requested curation, not new independent source/art approval.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createGuideStore } from '../../src/guide/store.js';
import { homeLink, readRoute } from '../../src/guide/routes.js';

const [revision, selectionPath] = process.argv.slice(2);
if (!/^full-r\d+$/.test(revision ?? '') || !selectionPath) {
  throw Error('Usage: curate-openings.mjs full-rNN content/editorial/starting-ideas.json');
}
const directory = `content/editorial/${revision}`;
if (fs.existsSync(directory)) throw Error('Use a new immutable release revision');
const read = file => JSON.parse(fs.readFileSync(file));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const ref = path => ({ path, sha256: hash(fs.readFileSync(path)) });
const verify = ({ path, sha256 }) => {
  if (ref(path).sha256 !== sha256) throw Error(`Changed release input: ${path}`);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const encode = value => JSON.stringify(value, null, 2) + '\n';
const release = read('content/APPROVED_RELEASE.json');
const sourcePath = `content/editorial/${release.revision}/payload.json`;
verify({ path: release.receiptPath, sha256: release.receiptSha256 });
verify({ path: sourcePath, sha256: release.payloadSha256 });
verify({ path: 'src/guide/approved.json', sha256: release.payloadSha256 });
release.renderer.forEach(verify);
release.assets.forEach(({ src, sha256 }) => verify({ path: `public/${src}`, sha256 }));
const baseline = read(sourcePath);
const payload = structuredClone(baseline);
const selection = read(selectionPath);
const ages = baseline.scenes.map(scene => scene.ageId);
if (!same(Object.keys(selection).sort(), [...ages].sort())) throw Error('Select every existing age exactly once');
const selected = new Set(), titles = new Set(), labels = new Set();
const labelAdditions = [], changes = [];
for (const placement of payload.placements) delete placement.openingOrder;
for (const [age, choices] of Object.entries(selection)) {
  if (!Array.isArray(choices) || choices.length !== 3) throw Error(`Three choices required: ${age}`);
  for (const [index, choice] of choices.entries()) {
    const entry = payload.entries.find(entry => entry.id === choice.entryId);
    const placement = payload.placements.find(p => p.ageId === age && p.entryId === choice.entryId);
    const label = choice.actionLabel;
    if (!entry || !placement) throw Error(`No approved age placement: ${age}/${choice.entryId}`);
    if (typeof label !== 'string' || !label.trim() || label !== label.trim()) throw Error('Missing navigation label');
    if (selected.has(entry.id) || titles.has(entry.title.toLowerCase()) || labels.has(label.toLowerCase())) {
      throw Error(`Repeated starting idea, title or label: ${entry.id}`);
    }
    selected.add(entry.id); titles.add(entry.title.toLowerCase()); labels.add(label.toLowerCase());
    if (entry.actionLabel && entry.actionLabel !== label) throw Error(`Retain the existing label: ${entry.id}`);
    if (!entry.actionLabel) {
      entry.actionLabel = label;
      labelAdditions.push({ entryId: entry.id, actionLabel: label });
    }
    placement.openingOrder = index + 1;
  }
}
// The only permitted mutations are openingOrder and previously absent labels.
for (const [index, entry] of payload.entries.entries()) {
  const original = baseline.entries[index], copy = { ...entry };
  if (!original.actionLabel) delete copy.actionLabel;
  if (!same(copy, original)) throw Error(`Reader content changed: ${entry.id}`);
}
for (const [index, placement] of payload.placements.entries()) {
  const original = baseline.placements[index];
  const { openingOrder: before = null, ...oldContext } = original;
  const { openingOrder: after = null, ...newContext } = placement;
  if (!same(oldContext, newContext)) throw Error(`Age/topic context changed: ${placement.id}`);
  if (before !== after) changes.push({ placementId: placement.id, before, after });
}
if (!same(payload.scenes, baseline.scenes)) throw Error('Artwork changed');

const beforeGuide = createGuideStore(baseline), afterGuide = createGuideStore(payload);
const readerProof = [], openingProof = [];
const server = await createServer({ optimizeDeps: { noDiscovery: true, include: [], entries: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { default: HomeStudy } = await server.ssrLoadModule('/src/HomeStudy.jsx');
  const render = (guide, options) => renderToStaticMarkup(React.createElement(HomeStudy, { guide, route: readRoute(homeLink(options)) }));
  // Compare the full reader body, including age notes, references and images.
  // The back link changes when an age's default opening changes.
  for (const placement of payload.placements) {
    const options = { age: placement.ageId, entry: placement.entryId };
    const body = guide => render(guide, options).match(/<div class="he-entry-body">[\s\S]*<\/article>/)?.[0];
    const before = body(beforeGuide), after = body(afterGuide);
    if (!before || before !== after) throw Error(`Rendered reader changed: ${placement.id}`);
    readerProof.push({ placementId: placement.id, sha256: hash(after) });
  }
  for (const age of ages) {
    const openings = afterGuide.openings(age);
    if (openings.length !== 3) throw Error(`Incomplete openings: ${age}`);
    for (const { entry, placement } of openings) {
      const html = render(afterGuide, { age, idea: entry.id });
      if (!html.includes('id="home-idea-title"') || !html.includes('id="home-read-entry"')) throw Error('Opening did not render');
      openingProof.push({ placementId: placement.id, title: entry.title, actionLabel: entry.actionLabel, sha256: hash(html) });
    }
  }
} finally {
  await server.close();
}

// Recheck inputs before recording the immutable curation and updating the app.
verify({ path: 'src/guide/approved.json', sha256: release.payloadSha256 });
release.renderer.forEach(verify);
const payloadBytes = encode(payload);
const receiptPath = `${directory}/INTEGRATION_RECEIPT.json`;
const receipt = {
  revision, integratedOn: new Date().toISOString(), type: 'user-requested-opening-curation',
  authorization: 'Yea vary it so there aren’t any dupes',
  baselineRelease: { path: `${directory}/BASE_RELEASE.json`, sha256: hash(encode(release)) },
  baselinePayload: ref(sourcePath), baselineReceipt: ref(release.receiptPath),
  selection: { path: `${directory}/SELECTION.json`, sha256: hash(encode(selection)) },
  payloadSha256: hash(payloadBytes), changes, labelAdditions,
  validation: { ages: ages.length, distinctOpenings: selected.size, unchangedReaderBodies: readerProof.length, readerProof, openingProof },
  reviewScope: 'Existing source bodies, references, age/topic placements, artwork and renderer retained exactly. New navigation labels and opening combinations are local curation; historical independent reviews are not represented as reviews of these new combinations.',
  publication: 'Local curation; deployment not performed'
};
fs.mkdirSync(directory);
for (const [name, value] of Object.entries({ 'BASE_RELEASE.json': release, 'SELECTION.json': selection, 'payload.json': payload, 'INTEGRATION_RECEIPT.json': receipt })) {
  fs.writeFileSync(`${directory}/${name}`, encode(value), { flag: 'wx' });
}
fs.writeFileSync('src/guide/approved.json', payloadBytes);
fs.writeFileSync('content/APPROVED_RELEASE.json', encode({ ...release, revision, payloadSha256: hash(payloadBytes), receiptPath, receiptSha256: ref(receiptPath).sha256 }));
console.log(JSON.stringify({ revision, distinctOpenings: selected.size, unchangedReaderBodies: readerProof.length, changedPlacements: changes.length, labelAdditions: labelAdditions.length }));
