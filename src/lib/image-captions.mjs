const sizeAliasPattern = /^\d+(?:x\d+)?$/;

const toClassList = (className) => {
  if (!className) return [];
  if (Array.isArray(className)) return className;
  return String(className).split(/\s+/).filter(Boolean);
};

const withClassName = (properties = {}, className) => ({
  ...properties,
  className: Array.from(new Set([...toClassList(properties.className), className]))
});

const splitCaption = (value) => {
  const divider = value.indexOf('|');
  if (divider === -1) return null;

  const alt = value.slice(0, divider).trim();
  const caption = value.slice(divider + 1).trim();
  if (!caption) return null;

  return { alt, caption };
};

const captionedImageFromNode = (node) => {
  if (node?.type === 'embed' && node.data?.hName === 'img') {
    const caption =
      typeof node.data.alias === 'string' ? node.data.alias.trim() : '';
    if (!caption || sizeAliasPattern.test(caption)) return null;

    return {
      caption,
      imageProperties: withClassName(node.data.hProperties, 'captioned-image')
    };
  }

  if (node?.type === 'image' && typeof node.alt === 'string') {
    const split = splitCaption(node.alt);
    if (!split) return null;

    const imageProperties = {
      src: node.url,
      alt: split.alt,
      className: ['captioned-image']
    };
    if (node.title) {
      imageProperties.title = node.title;
    }

    return {
      caption: split.caption,
      imageProperties
    };
  }

  return null;
};

const toFigure = ({ caption, imageProperties }) => ({
  type: 'paragraph',
  children: [],
  data: {
    hName: 'figure',
    hProperties: {
      className: ['captioned-figure']
    },
    hChildren: [
      {
        type: 'element',
        tagName: 'img',
        properties: imageProperties,
        children: []
      },
      {
        type: 'element',
        tagName: 'figcaption',
        properties: {},
        children: [{ type: 'text', value: caption }]
      }
    ]
  }
});

const trimBoundaryWhitespace = (children) =>
  children
    .map((child, index) => {
      if (child.type !== 'text') return child;

      let value = child.value;
      if (index === 0) value = value.replace(/^\s+/, '');
      if (index === children.length - 1) value = value.replace(/\s+$/, '');
      if (!value) return null;

      return { ...child, value };
    })
    .filter(Boolean);

const toParagraph = (children) => ({
  type: 'paragraph',
  children: trimBoundaryWhitespace(children)
});

const splitCaptionedImages = (paragraph) => {
  const blocks = [];
  let inlineChildren = [];
  let changed = false;

  paragraph.children.forEach((child) => {
    const captionedImage = captionedImageFromNode(child);
    if (!captionedImage) {
      inlineChildren.push(child);
      return;
    }

    changed = true;
    if (inlineChildren.length) {
      const splitParagraph = toParagraph(inlineChildren);
      if (splitParagraph.children.length) {
        blocks.push(splitParagraph);
      }
      inlineChildren = [];
    }

    blocks.push(toFigure(captionedImage));
  });

  if (inlineChildren.length) {
    const splitParagraph = toParagraph(inlineChildren);
    if (splitParagraph.children.length) {
      blocks.push(splitParagraph);
    }
  }

  return changed ? blocks : [paragraph];
};

const transformChildren = (node) => {
  if (!Array.isArray(node?.children)) return;

  node.children = node.children.flatMap((child) => {
    if (child?.type === 'paragraph' && Array.isArray(child.children)) {
      return splitCaptionedImages(child);
    }

    transformChildren(child);
    return [child];
  });
};

export const remarkImageCaptions = () => (tree) => {
  transformChildren(tree);
};
