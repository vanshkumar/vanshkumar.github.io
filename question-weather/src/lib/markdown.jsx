export const normalizeTarget = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const inlinePattern =
  /(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))|(\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\])/g;

export const buildQuestionLookup = (questions) => {
  const lookup = new Map();
  questions.forEach((question) => {
    lookup.set(normalizeTarget(question.slug), question);
    lookup.set(normalizeTarget(question.title), question);
    question.aliases?.forEach((alias) => {
      lookup.set(normalizeTarget(alias), question);
    });
  });
  return lookup;
};

export const renderInlineMarkdown = (text, questionLookup, onSelectQuestion) => {
  const nodes = [];
  let lastIndex = 0;
  let match;

  while ((match = inlinePattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      nodes.push(<code key={`${match.index}-code`}>{match[2]}</code>);
    } else if (match[4]) {
      nodes.push(<strong key={`${match.index}-strong`}>{match[4]}</strong>);
    } else if (match[6]) {
      nodes.push(<em key={`${match.index}-em`}>{match[6]}</em>);
    } else if (match[8] && match[9]) {
      nodes.push(
        <a key={`${match.index}-link`} href={match[9]} target="_blank" rel="noreferrer">
          {match[8]}
        </a>
      );
    } else if (match[11]) {
      const label = match[12] ?? match[11];
      const linkedQuestion = questionLookup.get(normalizeTarget(match[11]));
      if (linkedQuestion) {
        nodes.push(
          <button
            key={`${match.index}-wiki`}
            className="wiki-link"
            type="button"
            onClick={() => onSelectQuestion(linkedQuestion.slug)}
          >
            {label}
          </button>
        );
      } else {
        nodes.push(
          <span key={`${match.index}-missing`} className="wiki-link is-missing">
            {label}
          </span>
        );
      }
    }

    lastIndex = inlinePattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};

const isBlockStart = (line) =>
  !line.trim() ||
  /^#{1,6}\s+/.test(line) ||
  /^>\s?/.test(line) ||
  /^\s*[-*+]\s+/.test(line) ||
  /^\s*\d+\.\s+/.test(line) ||
  /^```/.test(line);

export function MarkdownView({ body, questionLookup, onSelectQuestion }) {
  const lines = body.split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (/^```/.test(trimmed)) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <pre key={`code-${index}`}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const level = Math.min(heading[1].length, 3);
      const Tag = `h${level + 1}`;
      blocks.push(
        <Tag key={`heading-${index}`}>
          {renderInlineMarkdown(heading[2], questionLookup, onSelectQuestion)}
        </Tag>
      );
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, '').replace(/^\[![^\]]+\]\s*/, ''));
        index += 1;
      }
      blocks.push(
        <blockquote key={`quote-${index}`}>
          {quoteLines.map((quoteLine, quoteIndex) => (
            <p key={`${quoteLine}-${quoteIndex}`}>
              {renderInlineMarkdown(quoteLine, questionLookup, onSelectQuestion)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ul key={`ul-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>
              {renderInlineMarkdown(item, questionLookup, onSelectQuestion)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ol key={`ol-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>
              {renderInlineMarkdown(item, questionLookup, onSelectQuestion)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (index < lines.length && !isBlockStart(lines[index])) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    const paragraph = paragraphLines.join(' ');
    blocks.push(
      <p key={`p-${index}`}>
        {renderInlineMarkdown(paragraph, questionLookup, onSelectQuestion)}
      </p>
    );
  }

  return <div className="markdown-view">{blocks}</div>;
}
