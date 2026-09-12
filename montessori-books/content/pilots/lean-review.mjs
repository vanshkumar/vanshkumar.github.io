// Scope and formatting helpers for the user-approved lean workflow.
// These functions never manufacture editorial decisions or source reads.
import {digest} from './review-snapshot.mjs';

export function normalized(value) {
  if (typeof value === 'string') return value.normalize('NFC').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/\s+/g,' ').trim();
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,normalized(item)]));
  return value;
}
export const mechanicallyEqual = (a,b) => digest(normalized(a)) === digest(normalized(b));

export function validReferences(refs, label) {
  if (!Array.isArray(refs) || !refs.length) throw Error(`Missing ${label} source references`);
  for (const ref of refs) {
    const limit={'baby-2021':310,'toddler-2019':257}[ref.sourceId];
    if (!limit || !Array.isArray(ref.pdfPages) || !ref.pdfPages.length) throw Error(`Invalid ${label} source reference`);
    for (const span of ref.pdfPages) if (!Number.isInteger(span.start)||!Number.isInteger(span.end)||span.start<1||span.end<span.start||span.end>limit) throw Error(`Invalid ${label} source span`);
  }
  return refs;
}

export function requiredReferences({role,entry,evidence,reuse,review,registrySha256}) {
  const ageRefs=validReferences([...(evidence?.sourceAge?.references??[]),...(evidence?.readiness?.references??[]),...(evidence?.editorialPlacement?.references??[])],'placement');
  if (reuse) {
    const body=review.bodyReview;
    if (!body || body.entryId!==entry.id || body.canonicalEntrySha256!==reuse.canonicalEntrySha256 || body.registrySha256!==registrySha256) throw Error(`Missing exact approved-body basis: ${entry.id}`);
  } else if (review.bodyReview) throw Error(`New entry cannot claim a pilot body review: ${entry.id}`);
  if (role==='source') return [...(reuse?[]:validReferences(entry.references,'new entry')),...ageRefs];
  if (role!=='tone') throw Error('Unknown editorial role');
  return [...validReferences(review.contextReferences,'tone context'),...ageRefs];
}

export function assertReadCoverage(refs,logs,label) {
  if (!logs.length || logs.some(log=>!log)) throw Error(`Missing original reads: ${label}`);
  for (const ref of refs) for(const span of ref.pdfPages) for(let page=span.start;page<=span.end;page++) {
    if(!logs.some(log=>log.sourceId===ref.sourceId&&['full-text','full-page-visual'].includes(log.mode)&&log.pdfPages?.some(p=>p.start<=page&&p.end>=page))) throw Error(`Cited page unread: ${label}/${ref.sourceId}/${page}`);
  }
}

// Exact reversible string delta; the full first rendering remains in the packet.
export function textDelta(before,after) {
  if(before===after)return null;
  let start=0,end=0;
  while(start<before.length&&start<after.length&&before[start]===after[start])start++;
  while(end<before.length-start&&end<after.length-start&&before[before.length-1-end]===after[after.length-1-end])end++;
  return {start,remove:before.slice(start,before.length-end),insert:after.slice(start,after.length-end)};
}
