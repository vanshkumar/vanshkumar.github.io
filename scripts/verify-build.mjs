import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { canonicalWritingPath } from '../src/lib/writing.mjs';
import { hasShelfReview } from '../src/lib/shelf.mjs';

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

has('/', /<h2 id="recent-posts-title">/, 'missing Recent posts heading');
has('/', /<h2 id="recent-notes-title">/, 'missing Recent notes heading');
has('/', /<figure class="home-comic">[\s\S]*?<img\b[^>]*alt="[^"]+"/, 'comic needs non-empty alt text');
has('/', /class="skip-link" href="#main-content"/, 'missing skip link');
const homeHtml = htmlFor('/');
const writingNavHtml = homeHtml.match(/<nav class="home-writing-nav"[\s\S]*?<\/nav>/)?.[0];
assert.ok(writingNavHtml, 'homepage should contain the writing navigation');
assert.deepEqual(
  [...writingNavHtml.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map((match) => [match[1], match[2]]),
  [['/posts', 'Posts'], ['/notes', 'Notes'], ['/poems', 'Poems']],
  'homepage writing navigation should be Posts · Notes · Poems'
);
const homeDirectoryHtml = homeHtml.slice(
  homeHtml.indexOf('class="home-static home-static-directory"'),
  homeHtml.indexOf('class="home-writing-nav"')
);
assert.doesNotMatch(
  homeDirectoryHtml,
  /href="\/poems"/,
  'Poems should stay out of the homepage directory'
);
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
has('/posts', /<h1 id="posts-title">/, 'missing Posts archive heading');
has('/notes', /<h1 id="notes-title">/, 'missing Notes archive heading');
has('/poems', /<h1 id="poems-title">/, 'missing Poems archive heading');

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
assert.match(
  shelfCss,
  /\.prose\s+\.shelf-review-link\s*\{[^}]*align-self:\s*center[^}]*\}/,
  'Shelf notes links should be centered below their covers'
);
assert.match(
  shelfCss,
  /\.poem-body\s*>\s*p\s*\{[^}]*white-space:\s*pre-line[^}]*\}/,
  'Poem paragraphs should preserve authored line breaks'
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
assert.doesNotMatch(
  currentlyReadingHtml,
  /<a\b[^>]*>\s*<span\b[^>]*class="[^"]*\bshelf-cover\b/,
  'Currently reading covers should not be links'
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
const shelfRoot = path.join(process.cwd(), 'src', 'content', 'shelf');
fs.readdirSync(shelfRoot).filter((name) => name.endsWith('.md')).forEach((name) => {
  const { content } = matter(fs.readFileSync(path.join(shelfRoot, name), 'utf8'));
  const route = `/shelf/${name.replace(/\.md$/, '')}`;
  const hasNotes = hasShelfReview({ body: content });
  assert.equal(fs.existsSync(fileForRoute(route)), hasNotes, `${route}: detail routes should depend on authored notes`);
  assert.equal(shelfHtml.includes(`class="shelf-review-link" href="${route}"`), hasNotes, `${route}: notes links should depend on authored notes`);
});

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
const writingLinks = [...rss.matchAll(/<link>(https:\/\/vanshkumar\.net\/(?:posts|notes|poems)\/[^<]+)<\/link>/g)]
  .map((match) => match[1].replace(/\/$/, ''));
const writingRoot = path.join(process.cwd(), 'src', 'content', 'terrain');
const expectedWritingLinks = fs.readdirSync(writingRoot)
  .filter((name) => name.endsWith('.md'))
  .map((name) => {
    const { data } = matter(fs.readFileSync(path.join(writingRoot, name), 'utf8'));
    return `https://vanshkumar.net${canonicalWritingPath({ slug: name.replace(/\.md$/, ''), data })}`;
  });
const poemRoot = path.join(process.cwd(), 'src', 'content', 'poems');
const expectedPoemLinks = fs.readdirSync(poemRoot)
  .filter((name) => name.endsWith('.md'))
  .map((name) => `https://vanshkumar.net/poems/${name.replace(/\.md$/, '')}`);
const expectedFeedLinks = [...expectedWritingLinks, ...expectedPoemLinks];
assert.equal(items.length, expectedFeedLinks.length, 'RSS should contain every writing entry');
assert.deepEqual(writingLinks.sort(), expectedFeedLinks.sort(), 'RSS should use the canonical link for every writing entry');
assert.equal(new Set(writingLinks).size, expectedFeedLinks.length, 'RSS canonical links should be unique');

expectedWritingLinks.forEach((link) => {
  const route = new URL(link).pathname;
  canonical(route, route);
  has(route, /<meta property="og:type" content="article">/, 'writing must use article OG type');
  const slug = path.posix.basename(route);
  ['posts', 'notes', 'terrain', 'projects', 'questions', 'hunches', 'guesses', 'traces'].forEach((prefix) => {
    const alias = `/${prefix}/${slug}`;
    if (alias !== route) redirect(alias, route);
  });
});

expectedPoemLinks.forEach((link) => {
  const route = new URL(link).pathname;
  canonical(route, route);
  has(route, /<meta property="og:type" content="article">/, 'poems must use article OG type');
});

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

console.log('Verified canonical writing routes, redirects, metadata, homepage, archives, Poems, Shelf, RSS, and prototype isolation.');
