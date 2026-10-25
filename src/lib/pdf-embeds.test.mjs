import assert from 'node:assert/strict';
import test from 'node:test';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import wikiLinkPlugin from '@flowershow/remark-wiki-link';
import { remarkImageCaptions } from './image-captions.mjs';
import { remarkPdfEmbeds } from './pdf-embeds.mjs';

const processor = await createMarkdownProcessor({
  remarkPlugins: [
    [wikiLinkPlugin, { permalinks: ['/assets/research_notes.pdf', '/assets/diagram.png'] }],
    remarkImageCaptions,
    [remarkPdfEmbeds, { openLabel: 'Open PDF ↗', downloadLabel: 'Download' }]
  ]
});

test('PDF embeds have a titled reader, native controls, and standalone file links', async () => {
  const { code } = await processor.render('![[research_notes.pdf]]');
  assert.match(code, /^<figure class="pdf-reader">/);
  assert.match(code, /class="pdf-reader-title">research notes<\/span>/);
  assert.match(code, /href="\/assets\/research_notes.pdf" target="_blank" rel="noopener noreferrer"/);
  assert.match(code, /href="\/assets\/research_notes.pdf" download/);
  assert.match(code, /src="\/assets\/research_notes.pdf#view=FitH&#x26;navpanes=0"/);
  assert.match(code, /title="research notes" loading="lazy" width="100%" height="720"/);
  assert.doesNotMatch(code, /toolbar=0|<p>/);
});

test('mixed paragraphs and nested embeds keep surrounding text outside the reader', async () => {
  const { code } = await processor.render('Before\n![[research_notes.pdf|Research & notes]]\nAfter\n\n> ![[research_notes.pdf]]');
  assert.match(code, /^<p>Before\n<\/p>\n<figure/);
  assert.match(code, /<\/figure>\n<p>\nAfter<\/p>/);
  assert.match(code, /title="Research &#x26; notes"/);
  assert.match(code, /<blockquote>\n<figure class="pdf-reader">/);
  assert.equal((code.match(/class="pdf-reader"/g) ?? []).length, 2);
});

test('image captions, PDF links, and unrelated iframes are preserved', async () => {
  const { code } = await processor.render('![[diagram.png|A diagram]]\n\n[Read the PDF](/assets/research_notes.pdf)\n\n<iframe src="https://example.com/embed"></iframe>');
  assert.match(code, /<figure class="captioned-figure">/);
  assert.match(code, /<figcaption>A diagram<\/figcaption>/);
  assert.match(code, /<a href="\/assets\/research_notes.pdf">Read the PDF<\/a>/);
  assert.match(code, /<iframe src="https:\/\/example.com\/embed"><\/iframe>/);
  assert.doesNotMatch(code, /pdf-reader/);
});
