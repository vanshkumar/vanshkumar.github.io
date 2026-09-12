import { content } from '../content.js';

// Temporary adapter for the existing local prototype, not a publication manifest.
// Move no evidence/review objects into this module. Replace its inputs after pilots pass.
export const prototypeEntries = Object.values(content).flatMap(age => age.items.map(item => ({
  id: item.id,
  kind: 'invitation',
  title: item.title,
  category: item.category,
  actionLabel: item.actionLabel,
  invitation: item.invitation,
  summary: item.summary,
  cue: item.cue,
  steps: item.steps,
  principle: { text: item.principle },
  references: [{
    id: `${item.id}.prototype-reference`,
    sourceId: age.art === 'baby' ? 'baby-2021' : 'toddler-2019',
    section: item.source.section,
    legacyPageLabel: item.source.pages,
  }],
})));

// IDs, rather than array positions, join canonical copy to editorial placement.
export const prototypePlacements = [
  { id: '6-9.baby-movement', entryId: 'baby-movement', ageId: '6-9', topicIds: ['play-discovery'], openingOrder: 1 },
  { id: '6-9.baby-language', entryId: 'baby-language', ageId: '6-9', topicIds: ['play-discovery'], openingOrder: 2 },
  { id: '6-9.baby-connection', entryId: 'baby-connection', ageId: '6-9', topicIds: ['connection-feelings', 'everyday-care'], openingOrder: 3 },
  { id: '18-24.toddler-pouring', entryId: 'toddler-pouring', ageId: '18-24', topicIds: ['play-discovery'], openingOrder: 1 },
  { id: '18-24.toddler-drawing', entryId: 'toddler-drawing', ageId: '18-24', topicIds: ['play-discovery'], openingOrder: 2 },
  { id: '18-24.toddler-shoes', entryId: 'toddler-shoes', ageId: '18-24', topicIds: ['home-that-helps', 'everyday-care'], openingOrder: 3 },
];

export const prototypeScenes = [
  {
    id: 'home-paper-baby', ageId: '6-9', src: 'art/home-paper-baby.webp',
    width: 1536, height: 1024, layout: 'open-left',
    alt: 'An illustrated home: a baby on their tummy reaches toward a soft ball on a mat, with a caregiver sitting beside them.',
    caption: 'Follow what catches their attention.', sourceId: 'baby-2021',
  },
  {
    id: 'home-paper-toddler', ageId: '18-24', src: 'art/home-paper-toddler.webp',
    width: 1536, height: 1024, layout: 'above-scene',
    alt: 'An illustrated home: a toddler stands at a low table pouring water with a caregiver nearby. Paper and crayons wait on a low shelf, and shoes sit in a basket beside it.',
    caption: 'Follow what catches their attention.', sourceId: 'toddler-2019',
  },
];
