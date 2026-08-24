import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(process.cwd(), 'dist');
const htmlFor = (route) => {
  const relative = route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`;
  const file = path.join(dist, relative);
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
assert.match(shelfHtml, /<h2 id="currently-reading">Currently reading<\/h2>/, 'Shelf needs Markdown-authored Currently reading');
assert.match(shelfHtml, /<h2 id="book-reviews">Book reviews<\/h2>/, 'Shelf needs Markdown-authored Book reviews');
assert.ok(
  shelfHtml.indexOf('id="currently-reading"') < shelfHtml.indexOf('id="book-reviews"'),
  'Currently reading should appear before Book reviews'
);
const currentlyReadingHtml = shelfHtml.slice(
  shelfHtml.indexOf('id="currently-reading"'),
  shelfHtml.indexOf('id="book-reviews"')
);
const bookReviewsHtml = shelfHtml.slice(shelfHtml.indexOf('id="book-reviews"'));
assert.match(
  currentlyReadingHtml,
  /href="\/shelf\/why-greatness-cannot-be-planned"/,
  'in-progress book should be in Currently reading'
);
assert.doesNotMatch(currentlyReadingHtml, /class="shelf-rating"/, 'Currently reading should not show ratings');
assert.match(
  bookReviewsHtml,
  /href="\/shelf\/the-invention-of-nature"/,
  'completed book should be in Book reviews'
);
assert.doesNotMatch(
  bookReviewsHtml,
  /href="\/shelf\/why-greatness-cannot-be-planned"/,
  'currently reading book should not be in Book reviews'
);
has(
  '/shelf/why-greatness-cannot-be-planned',
  /<p class="meta">[^<]*Currently reading<\/p>/,
  'currently reading detail should show its lifecycle state'
);
has(
  '/shelf/the-invention-of-nature',
  /<p class="meta">[^<]*5\/5 stars<\/p>/,
  'review detail should show its rating'
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
