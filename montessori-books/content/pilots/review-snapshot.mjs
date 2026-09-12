// Offline review tooling. This file and its outputs must never be imported by src/.
import { createHash } from 'node:crypto';

export function stableJSON(value) {
  if (Array.isArray(value)) return `[${value.map(stableJSON).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().filter(key => value[key] !== undefined)
      .map(key => `${JSON.stringify(key)}:${stableJSON(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export const digest = value => createHash('sha256').update(stableJSON(value)).digest('hex');
const copy = value => JSON.parse(JSON.stringify(value));
const pick = (object, fields) => Object.fromEntries(fields.filter(field => object?.[field] !== undefined)
  .map(field => [field, copy(object[field])]));
const imageFields = ['src', 'alt', 'width', 'height', 'caption'];

function publicDisplayContext(context, placement, references) {
  if (!context) throw new Error('Visible display context is required');
  const result = pick(context, ['ageLabel', 'kindLabel', 'headings', 'openingCTA', 'footer', 'colophon', 'bookline', 'referenceNote']);
  for (const key of ['ageLabel', 'kindLabel', 'footer']) {
    if (typeof result[key] !== 'string' || !result[key].trim()) throw new Error(`Missing display context: ${key}`);
  }
  if (!Array.isArray(result.headings) || !result.headings.length || result.headings.some(value => typeof value !== 'string')) throw new Error('Visible headings are required');
  if (placement.openingOrder != null && !result.openingCTA) throw new Error('Opening CTA is required');
  result.topics = context.topics?.map(topic => pick(topic, ['id', 'label']));
  if (!result.topics || stableJSON(result.topics.map(topic => topic.id)) !== stableJSON(placement.topicIds)
    || result.topics.some(topic => typeof topic.label !== 'string')) throw new Error('Visible topic labels must match placement');
  result.referenceLabels = context.referenceLabels?.map(reference => pick(reference, ['title', 'pages']));
  if (result.referenceLabels?.length !== references.length
    || result.referenceLabels.some(reference => typeof reference.title !== 'string' || typeof reference.pages !== 'string')) throw new Error('Visible reference labels are required');
  return result;
}

export function publicEntry(entry) {
  const result = pick(entry, ['id', 'kind', 'title', 'category', 'actionLabel', 'invitation', 'summary', 'cue', 'detail', 'steps']);
  if (entry.principle) result.principle = pick(entry.principle, ['id', 'text']);
  result.references = entry.references.map(reference => ({
    ...pick(reference, ['id', 'sourceId', 'section', 'locator', 'legacyPageLabel']),
    ...(reference.pdfPages ? { pdfPages: reference.pdfPages.map(span => pick(span, ['start', 'end'])) } : {}),
    ...(reference.printedPages ? { printedPages: reference.printedPages.map(page => pick(page, ['pdfPage', 'printedPage'])) } : {}),
  }));
  if (entry.illustration) result.illustration = pick(entry.illustration, imageFields);
  return result;
}

export function publicPlacement(placement) {
  const result = pick(placement, ['id', 'entryId', 'ageId', 'topicIds', 'openingOrder']);
  if (placement.ageContext) result.ageContext = pick(placement.ageContext, ['bookAge', 'readiness', 'note']);
  return result;
}

export const publicScene = scene => scene ? pick(scene, ['id', 'ageId', 'layout', 'sourceId', ...imageFields]) : null;

// Pass only the scene used for this placement (null when it is not an opening).
// assetDigests maps each actual src to its SHA-256 bytes, never just its filename.
// displayContext binds shared visible labels and reference formatting too.
export function makeSnapshot({ entry, placement, scene = null, assetDigests = {}, displayContext, provenance }) {
  const readerEntry = publicEntry(entry);
  const readerPlacement = publicPlacement(placement);
  if (readerPlacement.entryId !== readerEntry.id) throw new Error('Entry/placement mismatch');
  const readerScene = publicScene(scene);
  if (readerScene && (readerScene.ageId !== placement.ageId || placement.openingOrder == null)) throw new Error('Scene/placement mismatch');
  const { illustration = null, ...wording } = readerEntry;
  const textPlacement = { entry: wording, placement: readerPlacement, displayContext: publicDisplayContext(displayContext, readerPlacement, wording.references) };
  const textPlacementSha256 = digest(textPlacement);
  const images = [readerScene, illustration].filter(Boolean);
  const assets = images.map(image => {
    const sha256 = assetDigests[image.src];
    if (!/^[a-f0-9]{64}$/.test(sha256 ?? '')) throw new Error(`Missing asset digest: ${image.src}`);
    return { src: image.src, sha256 };
  });
  const artContext = images.length ? {
    scene: readerScene, illustration, assets,
    // Any changed public qualification invalidates art-context approval too.
    // An image-only change still leaves the independent text hash untouched.
    textPlacementSha256,
  } : null;
  const publicProjection = { textPlacement, artContext };
  return {
    snapshotVersion: 1,
    publicProjection,
    textPlacementSha256,
    artContextSha256: artContext ? digest(artContext) : null,
    publicProjectionSha256: digest(publicProjection),
    // Evidence revisions and source-read logs are private context, not approval or public cautions.
    ...(provenance ? { provenance: copy(provenance) } : {}),
  };
}
