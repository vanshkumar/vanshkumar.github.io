import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(process.cwd(), 'dist');
const fileForRoute = (route) => {
  const relative = route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`;
  return path.join(dist, relative);
};
const htmlFor = (route) => {
  const file = fileForRoute(route);
  assert.ok(fs.existsSync(file), `Missing built route: ${route}`);
  return fs.readFileSync(file, 'utf8');
};
const has = (route, pattern, message) =>
  assert.match(htmlFor(route), pattern, `${route}: ${message}`);
const canonical = (route, target) =>
  has(route, new RegExp(`<link rel="canonical" href="https://vanshkumar\\.net${target}"`), `canonical should be ${target}`);
const redirect = (route, target) => {
  has(route, /<meta name="robots" content="noindex,follow">/, 'redirect must be noindex,follow');
  canonical(route, target);
};

const post = 'partition-summer';
const note = 'what-is-the-future-of-the-university';
const project = 'how-do-we-learn-dec-2025-aliveline';
const log = 'day-1';

has('/', /<h2 id="recent-posts-title">Recent posts<\/h2>/, 'missing Recent posts');
has('/', /<h2 id="recent-notes-title">Recent notes<\/h2>/, 'missing Recent notes');
has('/', /alt="Calvin and Hobbes discussing/, 'comic needs descriptive alt text');
has('/', /class="skip-link" href="#main-content"/, 'missing skip link');
const homeHtml = htmlFor('/');
assert.doesNotMatch(
  homeHtml,
  /<figure class="home-comic">[\s\S]*?<figcaption>/,
  'homepage comic should not have a caption'
);
const gardenMatches = homeHtml.match(/class="word-garden"/g) ?? [];
assert.equal(gardenMatches.length, 1, 'homepage should contain the Word Garden exactly once');
assert.ok(
  homeHtml.indexOf('class="word-garden"') > homeHtml.indexOf('id="recent-notes-title"'),
  'Word Garden should appear after Recent notes'
);
assert.doesNotMatch(
  homeHtml,
  /The word garden|A year of tending this site|word-garden-stats/,
  'Word Garden should not display introductory copy or totals'
);
assert.doesNotMatch(htmlFor('/about'), /class="word-garden"/, 'About should not contain the Word Garden');
has('/posts', /<h1 id="posts-title">Posts<\/h1>/, 'missing Posts archive');
has('/notes', /<h1 id="notes-title">Notes<\/h1>/, 'missing Notes archive');

const shelfHtml = htmlFor('/shelf');
const currentlyReadingStart = shelfHtml.indexOf('class="shelf-section shelf-current-section"');
const recommendationsStart = shelfHtml.indexOf('class="shelf-section shelf-recommendations-section"');
assert.notEqual(currentlyReadingStart, -1, 'Shelf needs a Currently reading section');
assert.notEqual(recommendationsStart, -1, 'Shelf needs a recommended books section');
assert.ok(
  currentlyReadingStart < recommendationsStart,
  'Currently reading should appear before recommended books'
);
const currentlyReadingHtml = shelfHtml.slice(currentlyReadingStart, recommendationsStart);
const recommendationsHtml = shelfHtml.slice(recommendationsStart);
const shelfStylesheetHref = shelfHtml.match(/<link rel="stylesheet" href="([^"]+\.css)">/)?.[1];
assert.ok(shelfStylesheetHref, 'Shelf needs a built stylesheet');
const shelfCss = fs.readFileSync(
  path.join(dist, shelfStylesheetHref.replace(/^\//, '')),
  'utf8'
);
assert.match(
  shelfCss,
  /\.prose\s+\.shelf-cover\s+img\s*\{[^}]*height:\s*100%[^}]*object-fit:\s*contain[^}]*\}/,
  'Shelf cover sizing must outrank the generic prose image height rule'
);
const shelfCoverTitles = (html) =>
  [...html.matchAll(/<img\b[^>]*\balt="([^"]+) cover"/g)].map((match) => match[1]);
const assertAlphabeticalShelfOrder = (html, label) => {
  const titles = shelfCoverTitles(html);
  const sortedTitles = [...titles].sort((a, b) =>
    a.localeCompare(b, 'en', { sensitivity: 'base' })
  );
  assert.deepEqual(titles, sortedTitles, `${label} Shelf books should be alphabetized by title`);
};
assertAlphabeticalShelfOrder(currentlyReadingHtml, 'Currently reading');
assertAlphabeticalShelfOrder(recommendationsHtml, 'Recommended');
assert.match(currentlyReadingHtml, /<h2\b/, 'Currently reading needs a Markdown-authored heading');
assert.match(recommendationsHtml, /<h2\b/, 'Recommended books need a Markdown-authored heading');
assert.match(currentlyReadingHtml, /class="shelf-grid"/, 'Currently reading should use the shared Shelf grid');
assert.doesNotMatch(
  currentlyReadingHtml,
  /<a\b[^>]*>\s*<span\b[^>]*class="[^"]*\bshelf-cover\b/,
  'Currently reading covers should not be links'
);
assert.equal(
  fs.existsSync(fileForRoute('/shelf/anna-karenina')),
  false,
  'Currently reading books without reviews should not get empty detail routes'
);
assert.match(
  recommendationsHtml,
  /class="shelf-review-link" href="\/shelf\/the-invention-of-nature"[^>]*>\s*Review/,
  'a recommendation with Markdown should link to its Review'
);
assert.doesNotMatch(
  shelfHtml,
  /class="shelf-book-(?:title|author)"/,
  'Shelf cards should not repeat titles or authors beneath their covers'
);
assert.doesNotMatch(
  shelfHtml,
  /class="shelf-rating"|★|☆|out of 5 stars/,
  'Shelf should not display star ratings'
);
has(
  '/shelf/the-invention-of-nature',
  /<p class="meta">[^<]*by Andrea Wulf<\/p>/,
  'review detail should show its author'
);

canonical(`/posts/${post}`, `/posts/${post}`);
has(`/posts/${post}`, /<meta property="og:type" content="article">/, 'Post must use article OG type');
has(`/posts/${post}`, /class="article-kind" href="\/posts">Post<\/a>/, 'Post label missing');
canonical(`/notes/${note}`, `/notes/${note}`);
has(`/notes/${note}`, /class="article-kind" href="\/notes">Note<\/a>/, 'Note label missing');

redirect(`/posts/${note}`, `/notes/${note}`);
redirect(`/notes/${post}`, `/posts/${post}`);
redirect(`/terrain/${post}`, `/posts/${post}`);
redirect(`/terrain/projects/${post}`, `/posts/${post}`);
redirect(`/projects/${post}`, `/posts/${post}`);
redirect(`/questions/${note}`, `/notes/${note}`);
redirect(`/hunches/${note}`, `/notes/${note}`);
redirect(`/guesses/${note}`, `/notes/${note}`);
redirect(`/traces/${note}`, `/notes/${note}`);
redirect(`/projects/${project}/logs/${log}`, `/posts/${project}/logs/${log}`);
redirect(`/terrain/${project}/logs/${log}`, `/posts/${project}/logs/${log}`);
canonical(`/posts/${project}/logs/${log}`, `/posts/${project}/logs/${log}`);
has(`/posts/${project}/logs/${log}`, /<meta property="og:type" content="article">/, 'log must use article OG type');

has('/terrain', /<meta name="robots" content="noindex,follow">/, 'legacy archive must be noindex');
has('/terrain', /id="projects"/, 'legacy Projects fragment missing');
has('/terrain', /id="questions"/, 'legacy Questions fragment missing');
has('/terrain', /id="hunches"/, 'legacy Hunches fragment missing');
redirect('/projects', '/posts');
redirect('/questions', '/notes');
redirect('/hunches', '/notes');
redirect('/guesses', '/notes');

const rss = fs.readFileSync(path.join(dist, 'rss.xml'), 'utf8');
const items = [...rss.matchAll(/<item>/g)];
const writingLinks = [...rss.matchAll(/<link>https:\/\/vanshkumar\.net\/(posts|notes)\/[^<]+<\/link>/g)].map((match) => match[0]);
assert.equal(items.length, 53, 'RSS should contain all 53 writing entries');
assert.equal(writingLinks.length, 53, 'RSS items should all use canonical Posts/Notes links');
assert.equal(new Set(writingLinks).size, 53, 'RSS canonical links should be unique');

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});

const headingDepths = (html) =>
  [...html.matchAll(/<h([1-6])(?:\s|>)/g)].map((match) => Number(match[1]));

const homeHeadings = headingDepths(htmlFor('/'));
assert.equal(
  homeHeadings.filter((depth) => depth === 1).length,
  1,
  'homepage should contain exactly one H1'
);

walk(dist)
  .filter((file) => file.endsWith('.html'))
  .forEach((file) => {
    const html = fs.readFileSync(file, 'utf8');
    if (!/<article class="article">/.test(html)) return;

    const depths = headingDepths(html);
    assert.equal(depths[0], 1, `${file}: article page should start with an H1`);
    assert.equal(
      depths.filter((depth) => depth === 1).length,
      1,
      `${file}: article page should contain exactly one H1`
    );
    depths.slice(1).forEach((depth, index) => {
      const previous = depths[index];
      assert.ok(
        depth <= previous + 1,
        `${file}: heading hierarchy should not jump from H${previous} to H${depth}`
      );
    });
  });

walk(path.join(dist, 'homepage-variants'))
  .filter((file) => file.endsWith('.html'))
  .forEach((file) => {
    assert.match(fs.readFileSync(file, 'utf8'), /<meta name="robots" content="noindex">/, `${file} must remain noindex`);
  });

console.log('Verified canonical writing routes, redirects, metadata, homepage, archives, Shelf, RSS, and prototype isolation.');
