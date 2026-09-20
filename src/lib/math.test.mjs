import assert from 'node:assert/strict';
import test from 'node:test';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import config from '../../astro.config.mjs';

const processor = await createMarkdownProcessor(config.markdown);

test('currency stays prose next to inline and display math', async () => {
  const { code } = await processor.render(String.raw`Tickets cost \$2 or \$4, with \$*W* in the bank and \$log(2) in utility.

The equation is $f = ma$ and $mg = m \frac{d^2s}{dt^2}$.

$$
x_n = \frac{1}{2^n}
$$

> Guides earn \$60k/yr vs \$40k/yr.

Literal brackets: \[already\].`);
  assert.match(code, /Tickets cost \$2 or \$4, with \$<em>W<\/em> in the bank and \$log\(2\) in utility\./);
  assert.match(code, /Guides earn \$60k\/yr vs \$40k\/yr\./);
  assert.match(code, /Literal brackets: \[already\]\./);
  assert.equal((code.match(/class="katex"/g) ?? []).length, 3);
  assert.equal((code.match(/class="katex-display"/g) ?? []).length, 1);
  assert.match(code, /<mfrac>/);
  assert.doesNotMatch(code, /katex-error|MathJax-script/);
});

test('math-like code and escaped dollars are not typeset', async () => {
  const { code } = await processor.render('`$x$` and \\$5.\n\n```text\n$x_n$\n```');
  assert.doesNotMatch(code, /class="katex"/);
  assert.match(code, /<code>\$x\$<\/code> and \$5/);
});
