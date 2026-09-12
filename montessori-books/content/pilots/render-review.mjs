// Render frozen public drafts through the real components without importing drafts into the app.
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createGuideStore } from '../../src/guide/store.js';
import { readRoute, homeLink } from '../../src/guide/routes.js';

const [revision] = process.argv.slice(2);
if (!/^r\d+$/.test(revision ?? '')) throw new Error('Usage: render-review.mjs r01');
const directory = `content/pilots/revisions/${revision}`;
const payload = JSON.parse(fs.readFileSync(`${directory}/payload.json`));
const guide = createGuideStore(payload);
const scratch = `tmp/pilot-review/${revision}`;
fs.mkdirSync(scratch, { recursive: true });
const server = await createServer({ optimizeDeps: { noDiscovery: true, include: [], entries: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const plain = html => html.replace(/<[^>]*>/g, ' ').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
try {
  const { default: HomeStudy } = await server.ssrLoadModule('/src/HomeStudy.jsx');
  const render = options => renderToStaticMarkup(React.createElement(HomeStudy, { route: readRoute(homeLink(options)), guide }));
  // Vite prefixes asset URLs while serving these private HTML files.
  const save = (name, html) => fs.writeFileSync(`${scratch}/${name}.html`, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/home.css"></head><body>${html.replaceAll('"/montessori-books/', '"/')}</body></html>`);
  const surfaces = [];
  for (const placement of payload.placements) {
    const id = placement.entryId, age = placement.ageId;
    const detail = render({ age, entry: id });
    save(`${placement.id}.entry`, detail);
    const opening = placement.openingOrder != null ? render({ age, idea: id }) : null;
    if (opening) save(`${placement.id}.opening`, opening);
    const topicRows = placement.topicIds.map(topicId => {
      const html = render({ age, topic: topicId });
      const match = html.match(new RegExp(`<a id="entry-link-${id}"[\\s\\S]*?</a>`));
      if (!match) throw new Error(`Missing actual topic row: ${placement.id}/${topicId}`);
      return { topicId, text: plain(match[0]), html: match[0] };
    });
    surfaces.push({ entryId: id, placementId: placement.id, openingText: opening ? plain(opening) : null, topicRows, entryText: plain(detail), renderedEntryPath: `${scratch}/${placement.id}.entry.html` });
  }
  fs.writeFileSync(`${directory}/RENDERED_SURFACES.json`, JSON.stringify({ revision, rendererMode: 'Actual HomeStudy server render; development-only visual-study navigation is present in this local review and omitted from production.', surfaces }, null, 2) + '\n', { flag: 'wx' });
  console.log(`Rendered ${surfaces.length} actual age placements into ${directory}/RENDERED_SURFACES.json`);
} finally {
  await server.close();
}
