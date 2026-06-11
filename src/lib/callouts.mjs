const CALLOUT_RE = /^\[!([A-Za-z][\w-]*)\]([+-]?)[\t ]*/;

const CALLOUT_ALIASES = new Map(
  Object.entries({
    summary: 'abstract',
    tldr: 'abstract',
    hint: 'tip',
    important: 'tip',
    check: 'success',
    done: 'success',
    help: 'question',
    faq: 'question',
    caution: 'warning',
    attention: 'warning',
    fail: 'failure',
    missing: 'failure',
    error: 'danger',
    cite: 'quote'
  })
);

const SUPPORTED_CALLOUTS = new Set([
  'note',
  'abstract',
  'info',
  'todo',
  'tip',
  'success',
  'question',
  'warning',
  'failure',
  'danger',
  'bug',
  'example',
  'quote'
]);

const titleCase = (value) =>
  value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

const normalizeCalloutType = (value) => value.toLowerCase();

export const parseCalloutMarker = (value) => {
  const match = String(value).match(CALLOUT_RE);
  if (!match) return null;

  const type = normalizeCalloutType(match[1]);
  const canonicalType = CALLOUT_ALIASES.get(type) ?? type;
  const supportedType = SUPPORTED_CALLOUTS.has(canonicalType)
    ? canonicalType
    : 'note';

  return {
    raw: match[0],
    type,
    canonicalType,
    supportedType,
    fold: match[2] || null
  };
};

export const defaultCalloutTitle = (callout) =>
  titleCase(callout.canonicalType || callout.type || 'note');

const visitHast = (node, callback) => {
  if (!node || typeof node !== 'object') return;
  callback(node);
  if (Array.isArray(node.children)) {
    node.children.forEach((child) => visitHast(child, callback));
  }
};

const classList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
  return [];
};

const textNode = (value) => ({ type: 'text', value });

const splitCalloutTitle = (children, callout) => {
  const titleChildren = [];
  const bodyChildren = [];
  let split = false;

  children.forEach((child, index) => {
    const current =
      index === 0 && child.type === 'text'
        ? { ...child, value: child.value.slice(callout.raw.length) }
        : child;

    if (split) {
      bodyChildren.push(current);
      return;
    }

    if (current.type !== 'text') {
      titleChildren.push(current);
      return;
    }

    const lineBreak = current.value.indexOf('\n');
    if (lineBreak === -1) {
      if (current.value) titleChildren.push(current);
      return;
    }

    const titleText = current.value.slice(0, lineBreak);
    const bodyText = current.value.slice(lineBreak + 1).replace(/^[\t ]*/, '');
    if (titleText) titleChildren.push(textNode(titleText));
    if (bodyText) bodyChildren.push(textNode(bodyText));
    split = true;
  });

  return { titleChildren, bodyChildren };
};

export const rehypeObsidianCallouts = () => (tree) => {
  visitHast(tree, (node) => {
    if (node.type !== 'element' || node.tagName !== 'blockquote') return;

    const titleNode = node.children?.find(
      (child) => child.type === 'element' && child.tagName === 'p'
    );
    const firstText = titleNode?.children?.[0];
    const callout =
      firstText?.type === 'text' ? parseCalloutMarker(firstText.value) : null;

    if (!callout) return;

    const { titleChildren, bodyChildren } = splitCalloutTitle(
      titleNode.children,
      callout
    );

    const hasInlineTitle = titleChildren.some(
      (child) => child.type !== 'text' || child.value.trim()
    );
    titleNode.children = hasInlineTitle
      ? titleChildren
      : [textNode(defaultCalloutTitle(callout))];

    titleNode.properties = {
      ...titleNode.properties,
      className: [
        ...new Set([...classList(titleNode.properties?.className), 'callout-title'])
      ]
    };

    if (bodyChildren.length) {
      const titleIndex = node.children.indexOf(titleNode);
      node.children.splice(titleIndex + 1, 0, {
        type: 'element',
        tagName: 'p',
        properties: {},
        children: bodyChildren
      });
    }

    const isFoldable = callout.fold === '+' || callout.fold === '-';
    if (isFoldable) {
      node.tagName = 'details';
      titleNode.tagName = 'summary';
      if (callout.fold === '+') {
        node.properties = { ...node.properties, open: true };
      }
    }

    node.properties = {
      ...node.properties,
      className: [
        ...new Set([
          ...classList(node.properties?.className),
          'callout',
          `callout-${callout.supportedType}`,
          callout.canonicalType !== callout.supportedType
            ? `callout-${callout.canonicalType}`
            : null
        ].filter(Boolean))
      ],
      dataCallout: callout.type,
      dataCalloutFold: callout.fold ?? undefined,
      dataCalloutSupported: callout.supportedType
    };
  });
};

export const stripCalloutMarkers = (value) =>
  String(value).replace(
    /(^|\n)([ \t]*>[ \t]*)+\[!([A-Za-z][\w-]*)\][+-]?[\t ]*/g,
    '$1'
  );
