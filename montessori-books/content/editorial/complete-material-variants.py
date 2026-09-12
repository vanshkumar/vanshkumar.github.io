"""Explicit editorial additions from personally inspected source units; unreviewed."""
import json
from pathlib import Path

directory = Path('content/6-18/drafts/material-variants')
directory.mkdir(parents=True, exist_ok=True)
def ref(book, pages, section, locator):
    return {'sourceId': 'baby-2021' if book == 'baby' else 'toddler-2019',
            'pdfPages': [{'start': a, 'end': b} for a, b in pages],
            'section': section, 'locator': locator}
framing = [
    ref('baby', [(119, 122), (294, 294)], 'Montessori activities for babies / Activities list for babies', 'Interest, individual timing, manageable materials and activity-age guidelines'),
    ref('toddler', [(39, 39)], 'General principles to keep in mind', 'Modify the challenge, use what is available and supervise small parts')]
items = [
    dict(id='infant-rings-and-posts', title='A ring off, a ring on',
         summary='The books describe taking rings off a post before finding a way to put them back. Repeating one small movement can be the whole activity, with an adult supervising the materials.',
         cue='Your child may enjoy lifting off a ring, turning it, or finding the post again.',
         detail=[
             'The Baby appendix begins its rocking-base example once a baby can sit stably, around 8–11 months. Its stable-base example is listed at 8–12+ months, depending on skill with the earlier activity. A large opening gives the hand room to find the post.',
             'Later Baby examples use a basket with two or three rings and a peg at 10–12+ months, then two or three same-size napkin rings on a spindle at 11–12+ months. These offer different ways to repeat taking off and putting on; they are not a shopping list.',
             'Both appendices list four or five rings of different sizes from 12+ months. The Baby chapter also describes horizontal and curved posts; the Toddler appendix places those variants around 14–16 months, and three colored pegs with rings at 15–18+ months.',
             'A child may put rings on any colored peg before becoming interested in matching. The books leave room to adjust the number of pieces, offer help, or come back another day. Color matching and a completed stack are not the point of every turn.'
         ],
         references=[ref('baby', [(159,159),(167,169)], 'Montessori activities for babies / Gross-motor development / Fine-motor development', 'Independent sitting, ring stackers, horizontal or serpentine holders and colored pegs'),
                     ref('baby', [(301,302)], 'Activities list for babies', 'Rocking and stable bases, basket and rings, napkin rings and graded rings'),
                     ref('toddler', [(43,43),(246,246),(248,248)], 'Eye-hand coordination / List of Montessori activities for toddlers', 'Ring removal, graded rings, horizontal and serpentine dowels, and colored pegs')],
         ages=['6-9','9-12','12-18','18-24','24-36'],
         bookAge='Baby: rocking base once sitting stably, around 8–11 months; stable base 8–12+ depending on prior skill. Later materials have their own age labels.',
         readiness='A comfortable position the child has reached independently, interest in the hand movement, and materials suited to the child, with adult supervision.',
         notes={'6-9':'Near the later part of this band, the early rocking-base example may be relevant if sitting is already stable. Later ring variants are possibilities for another time.',
                '9-12':'The early ring examples may be relevant here; the Toddler appendix places horizontal and colored-peg variants later. There is no need to work through them all.',
                '12-18':'Graded rings begin at 12+ in both appendices; the Toddler appendix places horizontal or curved posts around 14–16 months and colored pegs at 15–18+.',
                '18-24':'Earlier ring activities can remain interesting. A new size, color or post is optional, according to the child’s interest.',
                '24-36':'An earlier material can still offer a satisfying hand movement. Matching or grading need not become a test.'},
         ideas=['baby.idea.ch06-rings-and-stackers','baby.idea.ch06-colored-pegs','baby.idea.app-activity-rocking-rings','baby.idea.app-activity-stable-rings','baby.idea.app-activity-basket-rings','baby.idea.app-activity-napkin-spindle','baby.idea.app-activity-graded-rings','toddler.activities.idea.rings-graded','toddler.activities.idea.horizontal-discs','toddler.activities.idea.serpentine-discs','toddler.activities.idea.colored-rings'],
         holds=['No DIY post construction or certification of loose household rings. The Baby and Toddler material ages remain separate.']),
    dict(id='infant-pegs-and-cubes', title='Finding a place for a piece',
         summary='A peg going into a hole and a cube sliding over a post ask the hands to find a particular position. The books offer both as possibilities, with adult supervision and help when wanted.',
         cue='Your child may keep returning to taking a piece out or finding where it fits.',
         detail=[
             'The peg-box example has six holes and a tray for the pegs the child removes. Taking pieces out can be worth repeating; an adult can help reset the material.',
             'A separate example has three cubes that fit onto one vertical dowel. The cubes may begin on the post or in a nearby basket. This is a different movement from fitting pegs into holes.',
             'The Baby illustrated activity grid places both in its 9–12 month group. The fuller Baby and Toddler appendix rows say 12+ months. These are the books’ different presentations, not a deadline to reconcile.',
             'Choose a manageable challenge and let interest guide how long it stays out. Small parts need supervision; a child does not have to place every piece to have explored the material.'
         ],
         references=[ref('baby', [(167,169),(175,176)], 'Montessori activities for babies / Fine-motor development / Movement Activities', 'Placing objects, removal and the 9–12 month illustrated peg-box and cube examples'),
                     ref('baby', [(303,303)], 'Activities list for babies', '12+ months: peg box and cubes on a vertical dowel'),
                     ref('toddler', [(246,246)], 'List of Montessori activities for toddlers', '12+ months: peg box and cubes on a vertical dowel')],
         ages=['9-12','12-18','18-24','24-36'],
         bookAge='Baby’s illustrated grid says 9–12 months; both fuller appendix rows say 12+ months.',
         readiness='Interest in removing or placing a piece, with manageable materials, adult supervision and help.',
         notes={'9-12':'Included as a perspective from the Baby grid. The appendix examples carry a later 12+ label; removing a piece can be enough.',
                '12-18':'This band includes the 12+ appendix examples. Follow interest rather than expecting the whole set to be completed.',
                '18-24':'The appendix’s 12+ label leaves room to revisit these earlier materials when they remain interesting.',
                '24-36':'Repetition of an earlier material can still be welcome. There is no requirement to make the challenge harder.'},
         ideas=['baby.idea.ch06-grid-imbucare-pegs','baby.idea.ch06-grid-cubes-dowel','baby.idea.app-activity-peg-box','baby.idea.app-activity-cube-dowel','toddler.activities.idea.peg-box','toddler.activities.idea.cubes-dowel'],
         holds=['Grid and appendix age labels are not averaged. No unsupervised-use or material-size certification.']),
    dict(id='infant-slot-posting', title='Turning a piece toward a slot',
         summary='Posting a flat piece through a narrow slot asks for a different hand movement from dropping a ball through a round hole. The books describe it as one possible interest to follow, with adult supervision.',
         cue='Your child may turn a flat piece several ways while looking for the opening.',
         detail=[
             'The Baby chapter mentions older babies manipulating a poker-chip-sized piece into a narrow slot. Its appendix lists the slotted box from around 13 months, with the box and a basket of pieces on a tray.',
             'The Toddler chapter likewise describes a coin slot as a more precise posting challenge. Its photographed example is labeled from 16 months. These examples have different age labels; neither is a date by which a child needs to do it.',
             'The Baby appendix’s optional latch adds another challenge when retrieving the pieces. A simple box can keep attention on the posting movement itself.',
             'Show a small movement if help is welcome, then leave time to try or pause. The books’ small-part activities need adult supervision. Their household examples are possibilities, not a requirement to make or buy a special set.'
         ],
         references=[ref('baby', [(167,169),(303,303)], 'Montessori activities for babies / Fine-motor development / Activities list for babies', 'Older-baby slot posting and the around-13+ slotted box row'),
                     ref('toddler', [(44,44),(59,60)], 'Eye-hand coordination / Illustrated examples', 'Increasing precision in posting; photographed coin-slot example from 16 months')],
         ages=['12-18','18-24','24-36'],
         bookAge='Baby appendix: around 13+ months. Toddler photograph: from 16 months. The Baby chapter also discusses the movement among older-baby activities.',
         readiness='Interest in turning a flat piece toward an opening; suitable materials, adult supervision and help.',
         notes={'12-18':'This band spans two differently labeled examples. Interest and manageable materials matter more than reaching either printed age.',
                '18-24':'An earlier posting challenge may remain interesting. A latch or a more precise opening is optional.',
                '24-36':'A familiar posting movement can still be satisfying without turning it into a harder assignment.'},
         ideas=['baby.idea.app-activity-slotted-box'],
         holds=['Coins, poker chips, laminated-letter pieces and DIY box dimensions are not generalized into a safety-certified making recipe.']),
    dict(id='infant-opening-and-keys', title='What makes this open?',
         summary='Opening and closing can hold a child’s attention all by itself. The books describe a few different closures to explore, with an adult choosing and supervising the materials.',
         cue='Your child may want another turn with a lid, clasp or turning key.',
         detail=[
             'Both appendices describe a basket of two or three opening-and-closing objects from 12+ months. A box, tin or purse offers its own movement; there is no need to collect every type.',
             'Keys are a separate example. The Baby appendix describes a key in lockable furniture from 10+ months, while the separate lock-and-key baskets in both books begin around 13+ months. The Toddler chapter also describes lockboxes.',
             'Turning a key, releasing a clasp and lifting a lid are different problems for the hands. A slow demonstration or adult help can make one part accessible without requiring the child to manage every step.',
             'Stay with the child when materials have small parts. Repeat an interesting movement, simplify the choice, or leave it for another time. These book examples do not require a new collection or a homemade lock board.'
         ],
         references=[ref('baby', [(301,301),(303,303)], 'Activities list for babies', 'Furniture keys from 10+ months; opening and closing from 12+; separate locks and keys around 13+'),
                     ref('toddler', [(44,44),(246,246)], 'Eye-hand coordination / List of Montessori activities for toddlers', 'Opening and closing objects, lockboxes, and separate locks and keys')],
         ages=['12-18','18-24','24-36'],
         bookAge='Opening-and-closing baskets: 12+ months. Separate locks and keys: around 13+. Baby’s furniture-key example has an earlier 10+ label.',
         readiness='Interest in a particular opening movement, with adult help and supervision of the chosen materials.',
         notes={'12-18':'The basket and separate-key examples have their own labels within this band. The earlier furniture example is context, not an instruction to alter furniture.',
                '18-24':'A familiar lid or closure may remain interesting; the child can repeat just the part they can manage.',
                '24-36':'A different closure is an optional new puzzle for the hands, with help still available.'},
         ideas=['baby.idea.app-activity-furniture-keys','baby.idea.app-activity-open-close','baby.idea.app-activity-locks','toddler.activities.idea.locks'],
         holds=['The sources’ key-and-string attachments and later latch-board construction remain private context, not new DIY directions or independent safety advice.'])
]
read_logs = [{'id':'editor.materials.baby-text','sourceId':'baby-2021','pdfPages':[{'start':119,'end':122},{'start':159,'end':159},{'start':167,'end':169},{'start':294,'end':294}], 'mode':'full-text','path':'tmp/editorial/sources/baby','notes':'Original page text personally read by /root.'},
             {'id':'editor.materials.baby-visual','sourceId':'baby-2021','pdfPages':[{'start':175,'end':176},{'start':300,'end':303}], 'mode':'full-page-visual','path':'tmp/editorial/sources/baby','notes':'Original grid boundary and complete table rows personally inspected by /root.'},
             {'id':'editor.materials.toddler-text','sourceId':'toddler-2019','pdfPages':[{'start':39,'end':39},{'start':43,'end':44},{'start':60,'end':60},{'start':246,'end':248}], 'mode':'full-text','path':'tmp/editorial/sources/toddler','notes':'Original page text personally read by /root; reviewer must inspect meaningful table and photo context independently.'}]
(directory/'READ_LOG.json').write_text(json.dumps(read_logs,indent=2)+'\n')
draft={'author':{'task':'/root','reasoning':'xhigh'},'revision':'draft-r01','workflow':'lean-v1','entries':[],'reuse':[],'placements':[],'placementEvidence':[],'provenance':[],'readLogFiles':[str(directory/'READ_LOG.json')]}
known={r['id'] for book in ['baby','toddler'] for r in map(json.loads,Path(f'research/{book}/COVERAGE_LEDGER.jsonl').read_text().splitlines())}
for item in items:
    assert all(i in known for i in item['ideas']), [i for i in item['ideas'] if i not in known]
    refs=item['references']+framing
    entry={k:item[k] for k in ['id','title','summary','cue','detail']}
    entry['kind']='perspective'
    entry['references']=[dict(r,id=f"{item['id']}.ref.{n}") for n,r in enumerate(refs,1)]
    draft['entries'].append(entry)
    for age in item['ages']:
        pid=f"{age}.{item['id']}"
        draft['placements'].append({'id':pid,'entryId':item['id'],'ageId':age,'topicIds':['play-discovery'],'ageContext':{'bookAge':item['bookAge'],'readiness':item['readiness'],'note':item['notes'][age]}})
        draft['placementEvidence'].append({'placementId':pid,'sourceAge':{'statement':item['bookAge'],'references':item['references']},'readiness':{'statement':item['readiness'],'references':framing},'editorialPlacement':{'reason':item['notes'][age]},'sourceIdeaIds':item['ideas']})
    draft['provenance'].append({'entryId':item['id'],'author':'/root','sourceIdeaIds':item['ideas'],'sourceReferences':refs,'authorReadLogIds':[r['id'] for r in read_logs],'readLogFile':str(directory/'READ_LOG.json'),'qualifications':['Ages describe specific source variants, not deadlines.','Adult supervision, help and interest retained.'],'heldDetails':item['holds'],'reviewStatus':'unreviewed','illustrationImplications':'No art included; any new image requires independent source and tone review.'})
(directory/'draft-r01.json').write_text(json.dumps(draft,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'entries':len(draft['entries']),'placements':len(draft['placements'])}))
