const element = (tagName, properties, children = []) => ({
  type: 'element', tagName, properties, children
});
const text = (value) => ({ type: 'text', value });

const pdfFigure = (node, copy) => {
  if (node?.type !== 'embed' || node.data?.hName !== 'iframe') return null;

  const src = node.data.path;
  if (typeof src !== 'string' || !/\.pdf$/i.test(src)) return null;

  const alias = node.data.alias?.trim();
  const filename = src.split('/').pop().replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
  const title = alias || filename;

  return {
    type: 'paragraph',
    children: [],
    data: {
      hName: 'figure',
      hProperties: { className: ['pdf-reader'] },
      hChildren: [
        element('figcaption', { className: ['pdf-reader-toolbar'] }, [
          element('span', { className: ['pdf-reader-title'] }, [text(title)]),
          element('span', { className: ['pdf-reader-actions'] }, [
            element('a', { href: src, target: '_blank', rel: ['noopener', 'noreferrer'] }, [text(copy.openLabel)]),
            element('a', { href: src, download: true }, [text(copy.downloadLabel)])
          ])
        ]),
        element('iframe', {
          className: ['pdf-reader-frame'],
          // Restore the browser's page/zoom controls and start at the page width.
          src: `${src}#view=FitH&navpanes=0`,
          title,
          loading: 'lazy',
          width: '100%',
          height: 720
        })
      ]
    }
  };
};

export const remarkPdfEmbeds = (copy) => (tree) => {
  const transform = (parent) => {
    if (!Array.isArray(parent.children)) return;

    parent.children = parent.children.flatMap((node) => {
      if (node.type !== 'paragraph') {
        transform(node);
        return [node];
      }

      if (!node.children.some((child) => child.type === 'embed' && child.data?.hName === 'iframe')) {
        return [node];
      }

      const blocks = [];
      let inline = [];
      const flush = () => {
        // An Obsidian embed may share a paragraph with text or another embed.
        if (inline.some((child) => child.type !== 'text' || child.value.trim())) {
          blocks.push({ ...node, children: inline });
        }
        inline = [];
      };

      for (const child of node.children) {
        const figure = pdfFigure(child, copy);
        if (figure) {
          flush();
          blocks.push(figure);
        } else {
          inline.push(child);
        }
      }
      flush();
      return blocks;
    });
  };

  transform(tree);
};
