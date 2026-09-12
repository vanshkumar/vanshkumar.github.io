import {stages} from '../../src/concepts.js';
import {topics,books,kindLabels,pageLabel} from '../../src/guide/catalog.js';
export function displayContext(entry,placement){
  const headings = ['A home within reach'];
  if (entry.cue) headings.push(entry.kind === 'invitation' ? 'Start by noticing' : 'In the everyday');
  if (placement.ageContext) headings.push('Age, interest & context');
  if (entry.steps?.length) headings.push(entry.kind === 'invitation' ? 'Try it together' : 'In this situation');
  if (entry.principle) headings.push('What’s underneath');
  headings.push('Back to the books');
return {
      ageLabel: stages.find(stage => stage.id === placement.ageId).label,
      kindLabel: kindLabels[entry.kind], headings,
      ...(placement.openingOrder != null ? { openingCTA: entry.kind === 'invitation' ? 'Try this together' : 'Read more' } : {}),
      topics: placement.topicIds.map(id => topics.find(topic => topic.id === id)),
      referenceLabels: entry.references.map(ref => ({ title: books[ref.sourceId].title, pages: pageLabel(ref) })),
      bookline: 'A Montessori companion',
      footer: 'You don’t need a different home. Start with what you have.',
      colophon: 'Original summaries inspired by The Montessori Baby and The Montessori Toddler. Open any idea for its book references. The illustration is an invitation to explore, rather than a room to reproduce. Follow your child’s pace.',
      referenceNote: 'Paraphrased for this companion. Illustrations are original and illustrative.',
    };
}
