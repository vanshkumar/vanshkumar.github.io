# Duplication audit — 2026-09-12

## Follow-up: distinct starting selections

The user requested removing the repeated starting ideas. Curation release
`full-r02` now has 21 distinct entries and navigation labels across the seven
ages. The following audit findings describe the prior `full-r01` baseline.

| Age (months) | Current starting ideas |
| --- | --- |
| 0–3 | Begin with your voice; Read a little of your book aloud; Let them know before a pickup |
| 3–6 | Make a moment for a song; Watch a hand’s shadow; When looking becomes reaching |
| 6–9 | Room for their own movement; A basket of things to explore; Your baby’s daily rhythm |
| 9–12 | Share a game of peekaboo; Taking things out of a container; Listen for a sound in the room |
| 12–18 | A place for shoes; Make a mark; A turn to add and stir |
| 18–24 | A little water to pour; Try the coat flip when there is time; A familiar thing and its picture |
| 24–36 | Remember something you did together; Spray, wipe, and try again; Find a familiar shape by touch |

The selection separates activities as well as IDs: conversational turn-taking,
singing, sound localization and remembering a shared event have different
actions; fetching shoes and putting on a coat are different tasks; exploratory
object handling, picture matching and identifying a shape by touch have
different aims. Daily rhythm takes the place of another shelf/basket selection
at 6–9 to avoid overlapping choices within that trio.

All 174 source entries and 645 age/topic placements remain available. Nine
previously absent navigation labels were added; the full rendered bodies of all
645 readers, including age notes and references, compare identically with the
prior release. The production build passed. The local browser preview was
blocked by the sandbox's listening-port restriction; browser verification was
not completed. The curation receipt retains the prior independent review
evidence without claiming those reviews cover the new opening combinations.
No deployment was performed.

## Finding

The three starting ideas at 12–18 and 18–24 months are the same three entries,
reordered. Across all seven ages, 21 starting slots use 12 distinct entries:
nine slots repeat an idea featured elsewhere. Six entries account for every
exact repeat.

This is an opening-selection issue. The store deliberately resolves placements
to shared entries. The home screen renders the entry's title, action label,
invitation and observation cue without age-specific text. Age/readiness notes
appear only after opening the reader; the shared body and steps remain identical.

## Every starting selection, in display order

| Age (months) | First idea | Second idea | Third idea |
| --- | --- | --- | --- |
| 0–3 | Begin with your voice | Read a little of your book aloud | Room for their own movement |
| 3–6 | A conversation with your baby | Watch a hand’s shadow | Room for their own movement |
| 6–9 | Room for their own movement | A conversation with your baby | Let them know before a pickup |
| 9–12 | Share a game of peekaboo | A conversation with your baby | Let them know before a pickup |
| 12–18 | A place for shoes | A little water to pour | Make a mark |
| 18–24 | A little water to pour | Make a mark | A place for shoes |
| 24–36 | Remember something you did together | Spray, wipe, and try again | Make a mark |

## All exact opening repeats

| Entry | Ages where it is a starting idea |
| --- | --- |
| Room for their own movement (`baby-movement`) | 0–3, 3–6, 6–9 |
| A conversation with your baby (`baby-language`) | 3–6, 6–9, 9–12 |
| Let them know before a pickup (`baby-connection`) | 6–9, 9–12 |
| A place for shoes (`toddler-shoes`) | 12–18, 18–24 |
| A little water to pour (`toddler-pouring`) | 12–18, 18–24 |
| Make a mark (`toddler-drawing`) | 12–18, 18–24, 24–36 |

Adjacent ages share 1/3, 2/3, 2/3, 0/3, 3/3 and 1/3 of their starting ideas,
respectively. There are no repeated entries within one age's trio.

There is also conceptual overlap between **Begin with your voice** at 0–3 and
**A conversation with your baby** at 3–6, 6–9 and 9–12. Both center on speaking,
pausing and answering sounds or gestures. The newborn version adds care
narration; the later version adds vocal play and optional signs. These are
different entries, but conversation remains a starting theme in every baby age.

## Wider library

The approved payload contains 174 entries and 645 age placements. Of those
entries, 161 appear at more than one age; 27 appear at all seven ages. The
editorial charter explicitly calls for canonical reuse of shared guidance, so
cross-age availability is expected. All seven age scenes use different image
paths.

Checks over the whole payload found:

- No duplicate entry IDs or duplicate age/entry pairs.
- No duplicate titles, summaries, invitations, cues, complete detail bodies or
  complete step lists between different entry IDs, after normalizing case and
  whitespace.
- One identical detail paragraph shared by four material entries
  (`infant-opening-and-keys`, `infant-pegs-and-cubes`, `infant-rings-and-posts`,
  `infant-slot-posting`). It carries the same material-size, mouthing and
  attachment qualifications into each relevant reader.

Different wording can still cover similar ground. A vocabulary-similarity scan
of all entry pairs, review of all titles, and closer reading of the strongest
matches identified these topic overlaps:

| Related entries | Where they coexist | Assessment |
| --- | --- | --- |
| More than one language in family life / The languages in your family’s day | 12–18 | Strong consolidation candidate: both describe languages associated with familiar people, settings and times. Preserve any book-specific qualifications when joining them. |
| When eating slows or food is thrown / When food goes on the floor | 12–18 | Same food-throwing situation; the Baby entry emphasizes appetite and ending a meal, while the Toddler entry adds the response to continued throwing. Could be one reader with clearly identified source perspectives. |
| Share a little of the cleanup / Wiping and dusting together | 12–18 | Shared wiping action; the first is meal cleanup, the second adds household dusting and sweeping. Related, with a meaningful scope difference. |
| Make a moment for a song / Sing, move, and answer a rhythm | 12–18 | Shared songs, gestures and attentive listening; the Toddler entry expands into dance and answering a rhythm. Candidates for a shared reader or clearer presentation of the progression. |
| Stay with a favorite page / Read the book they bring back | 12–18 | Shared child-led reading; the Toddler entry adds choosing, handling, shelving and its book-specific realism preference. Related, with distinct details. |
| Sharing toys and taking turns / A turn for the child using it, and help waiting | 12–18 | Shared respect for the current turn; the Toddler entry adds public-playground courtesy and preparing for visitors. Related, with distinct contexts. |
| A turn to add and stir / A stir while you bake | 24–36 | Similar titles obscure a real distinction: adding adult-measured ingredients versus helping measure. The entries explicitly preserve different source age descriptions. Clarify titles if revising; retain the distinction. |

Other high vocabulary matches describe different actions or materials: ball
trackers versus posting drawers, looking mobiles versus tactile mobiles, basic
nut turning versus fitting bolts by size, and simple puzzles versus jigsaw pairs.
They should not be treated as interchangeable merely because their words overlap.

## Recommended editorial change

Curate a more varied set of starting ideas from entries already available at each
age, prioritizing the identical toddler trios and the 3–6 / 6–9 / 9–12 overlap.
Keep useful recurring guidance available through Explore more. Where a theme
recurs as a starting idea, make the different action apparent in the home text;
changing the order or a note inside the reader does not achieve that.

Review the overlapping Baby/Toddler topic pairs at 12–18 together. Consolidation
must carry forward their meaningful differences, references and qualifications.

## Scope and evidence

Audited the local approved release in `src/guide/approved.json`, its selectors in
`src/guide/store.js`, and the rendering paths in `src/HomeStudy.jsx`. Reuse intent
is documented in `research/foundation/EDITORIAL_CHARTER.md`, under Product and
review boundaries. Exact comparisons cover the entire payload; semantic
judgments cover all starting ideas and selected related topic entries, not a
fresh source-fidelity review of every book passage. No application content was
changed or published by this audit.
