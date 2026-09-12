"""Editor-adopted source meanings after comparing the saved bodies with the queue."""
import json
from pathlib import Path
queue=json.loads(Path('content/editorial/coverage/PROVENANCE_RESOLUTION_QUEUE.json').read_text())
meaning={
 'family-baby-screen-perspective':'The body retains the Baby authors’ screen recommendation as their attributed position, alongside direct sensory experience and quiet; no individual developmental outcome is promised.',
 'family-watching-without-a-demonstration':'The body retains observing chosen actions instead of requesting a performance, with the separate Toddler curiosity/test distinction and its qualification.',
 'family-interests-without-gender-labels':'The body retains varied opportunities without gender limits and temporary descriptions instead of fixed labels.',
 'family-starting-preschool':'The body retains everyday participation, familiarity with another caregiver before gradual separation, saying goodbye and adult help with social exchanges, without an admission-skills checklist.',
 'infant-dressing-place':'The body retains a very low sturdy stool, steady sitting and feet flat, as an optional place for supported participation.',
 'infant-standing-diaper-change':'The body retains an already-standing child, resistance to lying down, an adult seated low, adult cleaning and gentle necessary care. Other changing-area layout details remain context.',
 'infant-first-toilet-interest':'The body retains neutral body language, interest before offering and the difference between awareness and independent toilet use. Cloth/training-pants choices remain source context, not a universal schedule.',
 'infant-find-a-sound':'The body retains a familiar sound from different places and noticing the response, using clapping as the no-material example; this is not a hearing test.',
 'infant-peekaboo':'The body retains the named game, reciprocal looks/sounds/gestures and no required spoken response.',
 'infant-push-wagon':'The body retains self-initiated use after efficient cruising, a non-tipping push wagon and the differing monthly wording. Sandbag construction and an outcome timetable are not supplied.',
 'infant-ball-tracker':'The body distinguishes the large stable standing example from the appendix’s creeping-age ramp example; watching, retrieval, repetition and mouthing conditions are retained.',
 'infant-climbing-stairs':'The body retains supervised interest in climbing, slower learning to descend, adult modeling and the distinct low-step bridge example. It does not give construction specifications.',
 'infant-press-and-squeeze':'The body retains pressing/squeezing, the named pliable alternatives and setting dough aside if eating continues; the timing remains attributed to the authors.',
 'infant-drawer-to-explore':'The body retains an accessible drawer/cupboard with a few suitable room-related objects in a secured space. Bathroom clips and exact inventories are optional source context, not blanket suitable-material claims.',
 'infant-posting-drawer':'The body retains hidden-ball recovery with a drawer and the distinct soft knitted-ball opening that adds pushing, alongside suitable mouthing materials.',
 'infant-music-player':'The body retains Junnifa’s personal example of marking a player button around 8–9 months so a child can choose or pause music; quiet and no required purchase remain explicit.',
 'infant-push-through-balls':'The body retains the three-ball, three-hole example and hand-pushing movement, with secure-parts/mouthing conditions and partial repetition.',
 'infant-eating-tools':'The body retains manageable real utensils, scaled adult help, thicker food while learning the spoon, small glass with support and less-breakable alternatives during dropping; source care qualifications remain.',
 'infant-changing-preferences':'The body retains tentative understanding, protective limits, few words/help during distress, wanted contact or nearby presence, later repair and observing repeated environmental patterns.',
 'infant-spinning-top':'The body retains the pump-handle tin top, watching before operating and allowing the activity to wait if frustrating.',
 'infant-threading-beads':'The body retains different firm-ended/lace/tubing variants, age and material-size differences, partial repetition and adult supervision. Exact DIY stick construction is not supplied.',
 'infant-nuts-and-bolts':'The body retains one or two shaped matching pairs with nuts initially attached, one hand holding and one turning; the graded board is a separate later variant.',
 'infant-dressing-fasteners':'The body retains distinct Velcro, joined-bottom zipper, large-button, snap and buckle variants and their different age labels, while preserving help. Exact frame construction and optional pull-ring attachment remain source detail.',
 'later-pedal-tricycle':'The revised body explicitly retains foot-propelled riding, the appendix’s 14–16 month label versus the photo’s around-2/height condition, self-paced coasting and the separate 2½-year pedal-tricycle example. New early placements receive independent review.'}
context={
 'baby.idea.nicole-changing':'This is the broader photographed changing-area layout. The standing-change body retains that participation witness; visible-clothes rotation and the movable pad are retained as private source context, not claimed as a fully reproduced room plan.',
 'baby.idea.ch06-observe-language':'The observation checklist informs looking for responses in the game. The short peekaboo entry does not claim to reproduce the full language checklist.',
 'baby.idea.ch06-standing-and-walking-process':'The independent standing/walking overview informs the wagon’s self-initiated movement condition. It is not republished as a developmental timetable.',
 'baby.idea.ch06-grid-drawers':'The grid’s shorter 6–9 drawer label remains distinct from the body’s steadier-on-feet condition. The short grid does not authorize overriding the fuller readiness passage.',
 'baby.idea.app-m10-12-care':'The monthly table also names naps, meals and feeds. Only its early-awareness witness is used in the potty body, with the fuller interest condition. The rest stays private context rather than becoming a 10–12 month care schedule.'}
out=[]
for row in queue:
 assert all(t in meaning for t in row['targets'])
 out.append({'sourceIdeaId':row['id'],'disposition':'context-only' if row['id'] in context else 'combined',
             'targetIds':row['targets'],'reason':context.get(row['id'],' '.join(meaning[t] for t in row['targets'])),
             'editor':'/root','reviewStatus':'Coverage decision only; all target text and age contexts still require independent judgments.'})
Path('content/editorial/COVERAGE_DECISIONS-r02.json').write_text(json.dumps({'editor':'/root','date':'2026-09-12','decisions':out},indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'explicitSavedMeaningDecisions':len(out)}))
