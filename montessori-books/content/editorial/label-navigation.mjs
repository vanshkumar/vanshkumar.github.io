// Record navigation labels and the refresh UI without renewing source/art reviews.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createGuideStore } from '../../src/guide/store.js';
import { homeLink, readRoute } from '../../src/guide/routes.js';
import { refreshIdeas } from '../../src/guide/ideas.js';

const [revision, labelsPath = 'content/editorial/navigation-labels.json'] = process.argv.slice(2);
if (!/^full-r\d+$/.test(revision ?? '')) throw Error('Usage: label-navigation.mjs full-rNN [labels.json]');
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
release.assets.forEach(({ src, sha256 }) => verify({ path: `public/${src}`, sha256 }));
const allowedRendererChanges = new Set(['src/HomeStudy.jsx', 'src/home.css', 'src/guide/routes.js']);
for (const file of release.renderer) if (!allowedRendererChanges.has(file.path)) verify(file);
const renderer = [...new Set([...release.renderer.map(file => file.path), 'src/guide/ideas.js'])].map(ref);
const baseline = read(sourcePath), payload = structuredClone(baseline), labels = read(labelsPath);
if (!same(Object.keys(labels).sort(), baseline.entries.map(entry => entry.id).sort())) throw Error('Label every entry exactly once');
const uniqueLabels = new Set(), labelChanges = [];
for (const entry of payload.entries) {
  const label = labels[entry.id];
  if (typeof label !== 'string' || !label.trim() || label !== label.trim()
    || label.length > 22 || label.split(/\s+/).length > 3) throw Error(`Use a short label: ${entry.id}`);
  if (uniqueLabels.has(label.toLowerCase())) throw Error(`Repeated label: ${label}`);
  uniqueLabels.add(label.toLowerCase());
  if (entry.actionLabel !== label) labelChanges.push({ entryId: entry.id, before: entry.actionLabel ?? null, after: label });
  entry.actionLabel = label;
}
// Navigation labels are the only public content changes permitted here.
for (const [index, entry] of payload.entries.entries()) {
  const { actionLabel: _before, ...before } = baseline.entries[index];
  const { actionLabel: _after, ...after } = entry;
  if (!same(before, after)) throw Error(`Reader content changed: ${entry.id}`);
}
if (!same(payload.placements, baseline.placements) || !same(payload.scenes, baseline.scenes)) throw Error('Placements or artwork changed');
const priorProof = new Map(read(release.receiptPath).validation.readerProof.map(proof => [proof.placementId, proof.sha256]));
const guide = createGuideStore(payload), readerProof = [], openingProof = [], refreshProof = [];
const server = await createServer({ optimizeDeps: { noDiscovery: true, include: [], entries: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { default: HomeStudy } = await server.ssrLoadModule('/src/HomeStudy.jsx');
  const render = options => renderToStaticMarkup(React.createElement(HomeStudy, { guide, route: readRoute(homeLink(options)) }));
  for (const placement of payload.placements) {
    const html = render({ age: placement.ageId, entry: placement.entryId });
    const body = html.match(/<div class="he-entry-body">[\s\S]*<\/article>/)?.[0];
    if (!body || hash(body) !== priorProof.get(placement.id)) throw Error(`Rendered reader changed: ${placement.id}`);
    readerProof.push({ placementId: placement.id, sha256: hash(body) });
  }
  for (const { ageId: age } of payload.scenes) {
    const openings = guide.openings(age);
    for (const { entry, placement } of openings) {
      const html = render({ age, idea: entry.id });
      if (!html.includes('id="home-idea-title"') || !html.includes('aria-label="Show three new activities"')) throw Error('Opening did not render');
      openingProof.push({ placementId: placement.id, title: entry.title, actionLabel: entry.actionLabel, sha256: hash(html) });
    }
    const pool = guide.forAge(age).filter(item => item.entry.kind === 'invitation').map(item => item.entry.id);
    let ids = openings.map(item => item.entry.id), seen = [], covered = new Set(ids.filter(id => pool.includes(id)));
    for (let i = 0; i < pool.length; i++) {
      const next = refreshIdeas(pool, ids, seen, () => .37);
      if (!next || next.ids.length !== 3 || new Set(next.ids).size !== 3
        || next.ids.some(id => ids.includes(id) || !pool.includes(id))) throw Error(`Invalid refresh: ${age}`);
      for (const id of next.ids) {
        if (covered.has(id) && covered.size < pool.length) throw Error(`Early repeat: ${age}`);
        covered.add(id);
      }
      ids = next.ids; seen = next.seen;
      for (const idea of ids) {
        const html = render({ age, ideas: ids, idea });
        const entry = guide.entry(idea);
        const titleMarkup = renderToStaticMarkup(React.createElement('h2', { id: 'home-idea-title', className: 'he-scene-title' }, entry.title));
        if (!html.includes(titleMarkup)) throw Error('Refreshed idea did not render');
        const expectedLink = homeLink({ age, ideas: ids, entry: idea, idea }).replaceAll('&', '&amp;');
        if (!html.includes(`href="${expectedLink}"`)) throw Error('Reader link lost the refreshed trio');
        const reader = render({ age, ideas: ids, entry: idea, idea });
        const expectedBack = homeLink({ age, ideas: ids, idea }).replaceAll('&', '&amp;');
        if (!reader.includes(`href="${expectedBack}"`)) throw Error('Return link lost the refreshed trio');
      }
    }
    refreshProof.push({ age, pool: pool.length, allCoveredBeforeRepeating: covered.size === pool.length, batchesChecked: pool.length });
  }
} finally {
  await server.close();
}

verify({ path: 'src/guide/approved.json', sha256: release.payloadSha256 });
renderer.forEach(verify);
const payloadBytes = encode(payload), receiptPath = `${directory}/INTEGRATION_RECEIPT.json`;
const receipt = {
  revision, integratedOn: new Date().toISOString(), type: 'user-requested-navigation-labels-and-refresh',
  authorization: 'Yea I think let’s give everything a short nav label, and then implement the refresh button',
  baselineRelease: { path: `${directory}/BASE_RELEASE.json`, sha256: hash(encode(release)) },
  baselinePayload: ref(sourcePath), baselineReceipt: ref(release.receiptPath),
  labels: { path: `${directory}/LABELS.json`, sha256: hash(encode(labels)) },
  payloadSha256: hash(payloadBytes), labelChanges, renderer,
  validation: { labeledEntries: payload.entries.length, unchangedReaderBodies: readerProof.length, readerProof, openingProof, refreshProof },
  reviewScope: 'All entries receive short navigation labels. The home navigation and routes add a refresh control with an age-matched invitation pool, session history and URL-preserved trios. Reader bodies match the prior rendered hashes; age/topic placements, initial selections and artwork are unchanged. These navigation changes are local implementation, not new independent source or artwork approval.',
  publication: 'Local implementation; deployment not performed'
};
fs.mkdirSync(directory);
for (const [name, value] of Object.entries({ 'BASE_RELEASE.json': release, 'LABELS.json': labels, 'payload.json': payload, 'INTEGRATION_RECEIPT.json': receipt })) {
  fs.writeFileSync(`${directory}/${name}`, encode(value), { flag: 'wx' });
}
fs.writeFileSync('src/guide/approved.json', payloadBytes);
fs.writeFileSync('content/APPROVED_RELEASE.json', encode({ ...release, revision, payloadSha256: hash(payloadBytes), receiptPath, receiptSha256: ref(receiptPath).sha256, renderer }));
console.log(JSON.stringify({ revision, labeledEntries: payload.entries.length, labelChanges: labelChanges.length, unchangedReaderBodies: readerProof.length, refreshProof }));
