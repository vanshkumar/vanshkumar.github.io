"""Record the editor's explicit decisions; this does not approve reader content."""
import json
from pathlib import Path

decisions=[]
def add(suffix, disposition, targets, reason, book='baby', held=None):
    prefix='baby.idea.' if book=='baby' else 'toddler.'
    decisions.append({'sourceIdeaId':prefix+suffix,'disposition':disposition,
                      'targetIds':targets,'reason':reason,'heldDetails':held or [],
                      'editor':'/root','reviewStatus':'Targets require their own independent text judgments.'})
add('ch06-language-household','combined',['baby-language','toddler-objects-and-pictures','toddler-pouring'],
    'The first-birthday transition combines reciprocal language without required words, familiar vocabulary and early household participation. These targets retain those meanings at their supported ages; the transitional paragraph is not a new milestone.')
add('ch06-knobbed-puzzles','combined',['toddler-puzzles'],
    'The unchanged body explicitly retains removal before replacement and adult resetting. The 9–12 placement adds the Baby witness; one- versus three-piece variants remain source context rather than a required set.')
add('ch06-grid-mirror','context-only',['baby-movement','baby-space-to-explore'],
    'The unelaborated illustrated newborn mirror is an optional environment example. The targets retain self-initiated movement and an adapted space; neither is claimed to teach mirror installation or to reproduce this equipment.', held=['Specific mirror placement and installation are not supplied as new construction directions.'])
add('ch06-grid-walker-wagon','combined',['infant-push-wagon'],
    'The saved wagon entry preserves the fuller cruising and stability conditions. The shorter 9–12 illustrated-grid witness does not override those conditions.')
add('feeding-frequency-and-awake-feed','context-only',['early-feeding-cues','baby-feeding-connection'],
    'Responsive feeding, variation and feeding as connection are retained. The source’s feed-frequency/duration examples and waking intervention are not reproduced as a newborn feeding protocol.', held=['Numerical feed timings and the slightly cool cloth method remain attributed source context, not reader instructions.'])
for suffix,target,reason in [
    ('app-activity-drawing','toddler-drawing','Chunky pencil or crayon, paper and protective underlay are retained; the source’s block-crayon and paper variants do not require another entry.'),
    ('app-activity-chalk-easel','toddler-paint-and-chalk','Large chalk surface, whole-arm movement and erasing are retained. Wall-mounted construction, color order and a full supply arrangement remain optional source detail.'),
    ('app-activity-paint-easel','toddler-paint-and-chalk','Standing unaided, thick paint in one color, a short chunky brush and supervision are explicit in the body. Hook, bin and spare-paper layout are optional setup details, not a quota.'),
    ('app-activity-nuts-bolts','infant-nuts-and-bolts','The new entry retains basic matching pairs beginning with nuts attached; the graded board is explicitly separated as a later variant.'),
    ('app-activity-vocabulary','toddler-objects-and-pictures','The body retains a few real or replica vocabulary objects on a familiar theme and naming without testing; the three-to-six quantity stays an appendix example.'),
    ('app-activity-puzzles','toddler-puzzles','Simple knob puzzles, manageable challenge, taking out and adult replacement are retained. Particular realistic subjects remain optional examples.'),
    ('app-activity-wiping','toddler-wipe-and-dust','Cloth or mitt at the place of work, participation and adult help are retained. The Baby once-walking row supports the later placement; replacement-mitt storage remains setup context.')]:
    add(suffix,'combined',[target],reason)
add('care.idea.travel-small-materials','context-only',['toddler-waiting-outside-home'],
    'The body retains preparing something familiar to share while waiting. Loose coins/shells and the exact pouch inventory are not offered as a universal travel kit.',book='toddler',held=['Specific loose-material travel examples remain source context.'])
add('care.idea.hot-note','context-only',['toddler-words-that-help','toddler-clear-limits'],
    'A visual reminder is an example of communicating a limit. The specific oven sign is not presented as protection that depends on a toddler reading or complying.',book='toddler')
add('care.idea.biting-alternative','context-only',['toddler-clear-limits'],
    'The target retains protective limits with empathy. The pillow and apple examples are source-specific protective/food responses, not generalized treatment instructions.',book='toddler',held=['Pillow placement for self-injury and apple as an alternative to biting are not reproduced as protocols.'])
add('care.idea.standing-diaper-change','combined',['infant-standing-diaper-change'],
    'The new entry retains optional standing participation with adult help. The Toddler between-the-adult’s-knees setup is a separate source variant; its exact positioning is not claimed as part of the Baby-based body.',book='toddler')
add('care.idea.milk-glass','context-only',['infant-eating-tools','toddler-meals'],
    'Small-glass participation belongs with eating tools and meals. The regular-milk transition, quantity and breastfeeding timing remain nutritional source context, not new feeding advice.',book='toddler',held=['No milk-selection, amount or breastfeeding schedule is prescribed.'])
add('care.idea.intentional-peeing','context-only',['toddler-toileting'],
    'The body retains gradual, unforced toileting and appropriate medical help. The author’s tentative interpretation of apparent intentional peeing is not generalized into an inference about a child’s motive or blame for an accident.',book='toddler')
add('care.idea.hitting-sensory-examples','context-only',['toddler-clear-limits'],
    'Protective limits and attending to the situation are retained. Hard snacks and cold/mouthing toys are source-specific prevention examples, not a universal behavior-calming prescription.',book='toddler',held=['Specific sensory/food calming methods remain source context.'])
add('family.idea.table-sibling-responsibility','combined',['toddler-sibling-conflict'],
    'Supporting both children without choosing a side retains the table’s shared-responsibility meaning. Eldest status does not assign responsibility automatically.',book='toddler')
add('family.idea.table-sign','context-only',['toddler-words-that-help'],
    'The table’s written reminder illustrates changing how a message is communicated. The child-facing body uses brief words, time and showing; it does not assume toddler literacy.',book='toddler')
# These material meanings were missing and now have explicit new authored bodies.
draft=json.loads(Path('content/6-18/drafts/material-variants/draft-r01.json').read_text())
for p in draft['provenance']:
    for idea in p['sourceIdeaIds']:
        decisions.append({'sourceIdeaId':idea,'disposition':'combined','targetIds':[p['entryId']],
            'reason':'The new body explicitly groups this hand movement with its named material variants and preserves different source age labels; it does not require every variant.',
            'heldDetails':p['heldDetails'],'editor':'/root','reviewStatus':'New body and every age context are unreviewed.'})
known={r['id'] for book in ['baby','toddler'] for r in map(json.loads,Path(f'research/{book}/COVERAGE_LEDGER.jsonl').read_text().splitlines())}
assert all(d['sourceIdeaId'] in known for d in decisions)
Path('content/editorial/COVERAGE_DECISIONS-r01.json').write_text(json.dumps({'editor':'/root','date':'2026-09-12','decisions':decisions},indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'explicitDecisions':len(decisions)}))
