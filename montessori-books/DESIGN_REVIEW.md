# Home concept — 2026-09-10

Two independent screenshot-only critiques, each in a fresh context with ultra
reasoning and the identical prompt below. Both assessed the 6–9 month default
state in a 1280×1000 viewport. Neither critic received a prior score or a target.

| Version | Score | Main finding |
| --- | --- | --- |
| Original | 7/10 | Too much header ceremony, pasted illustration caption, generic annotations, inconsistent alignment, and prototype navigation. |
| Revised | 7.5/10 | Stronger overall composition, but boxed markers, a narrow sidebar with excess empty space, formulaic editorial details, and small interactive text remain. |

The revised design brings the room roughly 110 pixels higher, removes the image
overlay, uses a shared editorial grid, replaces category hotspots with actions,
and displays the selected invitation beside the room. The source-backed full
instructions still open in the reading dialog. Other concepts remain available.

The user capped this first pass at two reviews. The 9/10 target has not been
reached. Suggested next changes: integrate the markers into the illustration,
anchor them to the activity itself, widen the reading panel and group its source
with the copy, and simplify repeated labels/dividers.

Screenshots from this pass are kept locally under `tmp/design-critique/` and are
not part of the published assets. Validation: production build, room selection,
source dialog, age changes, and a phone-width overflow check. No test suite added.

## Exact critic prompt

You are an independent design critic. Your only evidence is the screenshot at /tmp/montessori-critique/current.png. Open it with view_image. Do not inspect any other files, code, implementation details, conversation history, or other reviews. Infer the aesthetic the design is going for, imagine how a top design studio would execute that aesthetic, then identify the biggest gaps. Think high-level about overall structure and composition as well as fine details. Watch for patterns that feel overdone, excessive, or obviously AI-generated, and penalize them. Give tight, specific feedback, not vague prose. Be bold and opinionated rather than choosing what is safe or easy. Return: (1) the intended aesthetic in one sentence; (2) the 3–5 biggest gaps, in priority order, with concrete changes; (3) a score out of 10 for how close the screenshot is to a top design studio’s quality bar, with one sentence explaining the score. Judge only what is visible. Do not edit files or call other agents.

## Second pass — two more reviews

The user requested another two rounds and explicitly added a studio execution
comparison to the judging criteria. Two fresh ultra critics used the revised
prompt below, with no implementation or previous review context. Both received
only a screenshot of the default 6–9 month state at 1280×1000.

| Round | Score | Main finding |
| --- | --- | --- |
| 3 — before this pass | 7.2/10 | The room feels staged and emotionally inert; annotations feel pasted on; reading panel too narrow; repeated editorial labels; small utility type. |
| 4 — after this pass | 7.5/10 | Coherent palette and restraint, but uniform amber storybook art, repeated numbering, competing focal points, too many rules, and a weak action treatment. |

Implemented between the reviews:

- Two original age-specific edits of the room illustration: baby floor play with
  caregiver, and toddler pouring with caregiver, crayons and a shoe basket.
- Simpler numbered markers placed near relevant activities, with the text choices
  directly beneath the picture.
- A wider reading panel, larger useful text, compact source placement, and fewer
  repeated editorial labels. The full instructions and verified references remain
  available in the reading dialog.
- A tighter image frame retaining the roof and floor. The entire scene, choices,
  and selected invitation fit together in the assessed desktop viewport.

The result is a modest gain within this pass, not a clear break from the earlier
7.5/10 plateau. The 9/10 goal has not been reached. Work stopped at the requested
two-review limit. No visual changes were made after round 4's assessment.

### Round 4 priorities for a future pass

1. Strengthen art direction: enlarge the parent–baby interaction, reduce unused
   roof/table emphasis, introduce cooler daylight and less uniform textures.
2. Keep hotspots and concise legend; remove repeated sidebar numbering and
   instructions. Use consistent labels across the legend and reading panel.
3. Reduce the page title and let the selected activity headline lead the reading.
4. Remove most thin rules; retain the navigation separator and one content division.
5. Give the action a compact intentional treatment and move attribution into About.

Validation stayed minimal: production build passed; room selection and the book
reference dialog worked; age switching loaded the toddler scene and an unfinished
age state correctly; the 390px phone layout had no horizontal document overflow.
No automated tests added. Screenshots: `tmp/design-critique/round-3.png`,
`round-4.png`, `round-4-toddler.png`, and `round-4-mobile.png`.

### Identical prompt used for rounds 3 and 4

You are an independent design critic. Your only evidence is the screenshot at /tmp/montessori-critique/current.png. Open it with view_image. Do not inspect any other files, code, implementation details, conversation history, or other reviews. Review the aesthetic we’re going for, visualize how a top design studio would execute it, then judge our design’s quality against that bar. Identify the biggest gaps. Think high-level about overall structure and composition as well as fine details. Watch for patterns that feel overdone, excessive, or obviously AI-generated, and penalize them. Give tight, specific feedback, not vague prose. Be bold and opinionated rather than choosing what is safe or easy. Return: (1) the intended aesthetic in one sentence; (2) the 3–5 biggest gaps, in priority order, with concrete changes; (3) a score out of 10 for how close the screenshot is to a top design studio’s quality bar, with one sentence explaining the score. Judge only what is visible. Do not edit files or call other agents.

## Third pass — rounds 5 and 6

The user requested another two rounds. Both fresh ultra critics received only a
new 1280×1000 screenshot and the exact rounds 3–4 prompt above. No target, code,
or prior critique was provided.

| Round | Score | Main finding |
| --- | --- | --- |
| 5 — baseline | 7.5/10 | Generic Montessori showroom art; roof and unused furniture dominate; excessive dividers, repetitive numbering, and a detached action. |
| 6 — close domestic scenes | 7/10 | Generic idealized illustration remains; rectangular backdrop and pasted markers; choices detached from reading panel; age navigation and CTA lack a distinctive visual system. |

Implemented between the two reviews:

- New original baby and toddler illustrations with much larger human interaction,
  a cooler palette, and visible brushwork; removed the roof and whole-house framing.
- Reduced the page title and removed the scene topline, sidebar divider, source
  block, numbered sidebar label, and borders around the choices/footer.
- Unified the selected label between the choices and guidance; removed marker
  halos and made the primary action compact and filled.
- Moved attribution into About and retained the source-backed reading dialog.

The final critic scored the change lower. This is not convergence toward 9/10.
The new revision remains available locally for the user's review. No product
changes were made after round 6's assessment, and no third review was requested.

### Round 6 feedback

1. Establish a stronger illustrative voice with deliberate shapes and less uniform
   texture; remove the conspicuous rectangular cream backdrop.
2. Anchor hotspots to meaningful actions or objects, rather than a window frame
   or caregiver's knee; connect the selected subject visibly to the guidance.
3. Bring the three choices into the right column beneath the action so reading
   and selection form one sequence.
4. Tighten age navigation into a compact timeline with a stronger selected state.
5. Unify arrow, numeral, and underline treatments; give the action more character.

Validation: production build passed, toddler age switching and the drawing source
dialog worked, both illustrations loaded, and the 390px phone layout had no
horizontal document overflow. No automated tests added. Screenshots are in
`tmp/design-critique/round-5.png`, `round-6.png`, `round-6-toddler.png`, and
`round-6-mobile.png`. New assets and their exact built-in image_gen prompts are
recorded in `ARTWORK.md` as `home-focus-baby.webp` and `home-focus-toddler.webp`.

## Fourth pass — rounds 7 and 8

The user requested two more rounds. Both critics used fresh contexts, ultra
reasoning, and the exact rounds 3–4 prompt above. Each received only a fresh
1280×1000 screenshot of the default 6–9 month view.

| Round | Score | Main finding |
| --- | --- | --- |
| 7 — baseline | 8/10 | Strong restraint and typography, but generic illustration, weak hotspot targets, predictable split layout, and underdesigned secondary navigation. |
| 8 — integrated guide | 8.2/10 | Strong overall spacing and restraint; illustration proportions, meaningful annotation, a distinctive visual signature, and right-column rhythm still need refinement. |

The round 7 image was the same design scored 7/10 in round 6. Fresh reviewers
vary, so the 0.2-point gain within this pair is modest evidence, not proof of
steady convergence. The independent 9/10 threshold has not been reached.

Implemented between these reviews:

- Replaced the full-width age row with a compact labeled native select retaining
  all seven ages, explicit preview labels, and the existing hash routes.
- Combined the three choices and selected guidance in one expandable reading
  column. The same titles now identify each idea in the picture and guide.
- Added short leader lines ending at the ball, window, hands, pitcher/cup, crayons,
  and shoes, and removed the detached row of choices below the scene.
- Aligned the guide nearer the picture top, softened the picture boundary with
  CSS framing, unified arrows and disclosure symbols, and restored a clear footer
  boundary. Existing art assets were retained; no new images were generated.

### Round 8 priorities

1. Recompose the illustration with a smaller ball and more space above the parent,
   keeping the baby's gesture prominent and the strong blue rug.
2. Make annotations part of deliberate narrative moments with consistent,
   unmistakable leader lines and endpoints.
3. Develop a recognizable annotation or typographic signature beyond the familiar
   cream, serif, painterly illustration, and hairline-rule combination.
4. Tighten the space above the active headline, give collapsed titles more room,
   and align the three numbers as a clearer continuous vertical sequence.

Stopped after the second review. No product changes were made after round 8.
Validation remained minimal: production build, expandable guide selection, source
dialog, populated and unfinished age selection, and a 390px phone overflow check
all passed. No automated tests added. Screenshots are saved under
`tmp/design-critique/round-7.png`, `round-8.png`, `round-8-toddler.png`, and
`round-8-mobile.png`.

## Fifth pass — rounds 9 and 10

The user requested two more rounds. Both critics used fresh contexts, ultra
reasoning, and the exact rounds 3–4 prompt above, with only the default 6–9 month
screenshot at 1280×1000 as evidence.

| Round | Score | Main finding |
| --- | --- | --- |
| 9 — baseline | 8/10 | Artwork carries the identity; competing headlines; provisional-looking annotations; uneven rhythm between expanded and collapsed activities. |
| 10 — composition and hierarchy refinement | 8/10 | Faded image boundary, weak subject-level annotation, conventional accordion styling, and timid supporting type remain. |

Implemented between the reviews:

- One targeted image edit reduced the baby scene's ball to roughly head size,
  added headroom above the caregiver, and removed the shelf and peripheral plant.
  The blue rug, reach, and attentive open hands remain.
- Introduced a typographic wordmark, made the page title larger and the expanded
  activity heading smaller, and gave the other activities more breathing room.
- Matched guide number badges to the picture's number markers, shortened leaders
  in both age scenes, moved endpoints nearer their subjects, and increased stroke
  weight for legibility.

There was no score gain in this pair. The 9/10 threshold remains unmet. Work
stopped after the requested two reviews; no product changes followed round 10.

### Round 10 priorities

1. Remove the fuzzy rectangular fade; use a confident crop or authentic brush edge.
2. Make annotations identify unmistakable actions or objects. The current short
   leaders still did not make their relationship clear enough to the critic.
3. Refine the accordion's collapsed title size, number column, and expanded alignment.
4. Increase the contrast and selectively the size of captions, age label, and footer.

Validation stayed minimal: production build passed; both age scenes loaded and
were visually checked; the phone view had no horizontal overflow. No tests added.
Screenshots: `tmp/design-critique/round-9.png`, `round-10.png`,
`round-10-toddler.png`, and `round-10-mobile.png`. The before-pass source is saved
locally in `tmp/design-critique/round-9-source/`. The image edit and exact built-in
image_gen prompt are recorded in `ARTWORK.md` under `home-focus-baby-v2.webp`.

## Sixth pass — rounds 11 and 12

The user requested two more rounds. Both critics used fresh contexts, ultra
reasoning, and the exact rounds 3–4 prompt above. Each received only the default
6–9 month screenshot at 1280×1000.

| Round | Score | Main finding |
| --- | --- | --- |
| 11 — baseline | 8.2/10 | Hazy illustration perimeter, cramped inactive titles, pasted-on number markers, and faint supporting text. |
| 12 — action annotations and clearer hierarchy | 8/10 | Labels still feel pasted on; illustration lacks a distinctive voice; collapsed activities and age selector need stronger integration. |

Implemented between the reviews:

- Removed the CSS edge fade, retaining a clean rectangular crop of the existing
  illustrations. No new artwork was generated.
- Replaced numbered picture markers with short action labels: Reach, Listen,
  Pause, Pour, Draw, and Put away. Retained leader lines and synchronized selection.
- Removed the guide's number column, aligned invitation text with its heading,
  reduced collapsed title size, and reserved consistent space for disclosure controls.
- Increased supporting text size and contrast, including figure captions, the
  age label, invitation copy, and footer.

The final score was lower by 0.2 points. This pair does not establish convergence,
and the independent 9/10 threshold remains unmet. Work stopped after the requested
two reviews; no product changes followed round 12's assessment.

### Round 12 priorities

1. Integrate labels into the scene with unmistakable subject targets. The critic
   still read the cream rectangles as pasted on and Listen as labeling the window.
2. Give the artwork a more distinctive voice through selective detail, a narrower
   palette, and deliberate negative space rather than uniform painterly texture.
3. Tighten the expanded activity's spacing and establish a deliberate rhythm and
   bottom boundary for the two collapsed entries.
4. Integrate the age selector into the title area with a more deliberate boundary
   and alignment.

Validation stayed minimal: production build passed; a scene annotation selected
the matching guide and source dialog; age switching loaded the toddler scene;
the 390px phone view had no horizontal overflow. No tests added. Screenshots:
`tmp/design-critique/round-11.png`, `round-12.png`, `round-12-toddler.png`, and
`round-12-mobile.png`.

## Seventh pass — rounds 13 through 17

The user expanded this pass to five rounds. Each critic used a fresh context,
ultra reasoning, the exact rounds 3–4 prompt above, and only a newly captured
1280×1000 screenshot of the default 6–9 month view. No critic received code,
previous reviews, scores, or a target score.

| Round | Score | Revision and principal finding |
| --- | --- | --- |
| 13 — baseline | 8/10 | Action labels still look pasted on; accordion rhythm and age control remain weak. |
| 14 — focused reading panel | 8/10 | Removed picture overlays, introduced three compact choices and an observation cue. Picture boundary, boxed age control, and panel balance remain unresolved. |
| 15 — open illustrations | 8.2/10 | New transparent baby and toddler illustrations; inline age control; fewer rules. The image and text still feel adjacent, with large gaps and competing headlines. |
| 16 — activity-led composition | 8.5/10 | Moved the selected headline into the open illustration area, reduced the page title, strengthened choices, and tightened guidance. The critic praised the art direction; supporting type and lower-page spacing remain concerns. |
| 17 — simplified supporting hierarchy | 8.2/10 | Removed category and italic subheading, reduced artwork scale, enlarged supporting type, and tightened captions/footer. The critic found the headline hierarchy, gap below navigation, and primary action unresolved. |

The highest-scoring version, round 16, is retained. After the fifth critique,
the round 17 product changes were reversed exactly; no further design revision
or sixth critique was performed. Round 17's source and screenshots are saved
for comparison. The baseline-to-retained score increased from 8 to 8.5, but the
final candidate regressed, and fresh reviewers remain variable. The independent
9/10 threshold is still unmet.

### Retained changes

- Removed all overlaid image labels and leaders. Three visible action choices
  now control one reading panel with the existing source-backed observation cue.
- Added two original transparent illustrations, keeping the page paper visible
  around the figures. Prompts and built-in image_gen provenance are in `ARTWORK.md`.
- Integrated the selected activity headline into the scene's negative space,
  with a separate placement for the denser toddler illustration and normal text
  flow on narrow phones.
- Reduced the page title, aligned the inline age selector, enlarged the action
  choices, and gave the selected choice a full-width underline.
- Kept all existing ages, explicit unfinished previews, source dialogs, and the
  other nine visual studies.

### Remaining priorities from the retained version's critic

1. Reduce competing category, subheading, navigation, and CTA treatments without
   weakening the guidance hierarchy.
2. Bring the caption and lower divider closer to the illustration.
3. Keep the dark rug from dominating the reach and caregiver's expression.
4. Improve the smallest supporting text without flattening the overall hierarchy.

Validation stayed limited to production builds and brief browser checks: idea
selection and the matching source dialog worked; both new scenes loaded; the
retained 390px phone view had no horizontal overflow. No tests added. Local
screenshots are `tmp/design-critique/round-13.png` through `round-17.png`, with
phone captures for rounds 16 and 17 and a toddler capture for the retained version.
Source snapshots are in `round-13-source/`, `round-16-source/`, and
`round-17-source/` under the same directory.
