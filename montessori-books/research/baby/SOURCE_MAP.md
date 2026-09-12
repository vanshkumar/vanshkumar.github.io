# The Montessori Baby: complete source map

Task 2, 2026-09-10. This map follows the supplied book in source order. The
235 detailed records in `SECTION_REGISTER.json` include subheadings, lists,
callouts, tables, photographs, continuations and their idea IDs. `PAGE_REGISTER.json`
accounts for every physical page, including the blank and non-advice pages.

## Source identity and citation convention

Source ID: `baby-2021`. Simone Davies and Junnifa Uzodike, *The Montessori Baby*,
Workman, copyright 2021; eISBN 9781523514069. Both authors appear on PDF 3;
publication details are on PDF 310. The supplied file is 310 physical pages and
10,117,663 bytes, with SHA-256
`517a095024dff9cc43d72fd2ba60516bc50ee6aba686ee8277d0e695b785f04f`.
Its exact local path and bibliographic limits are in the foundation's
`SOURCE_MANIFEST.md`. Readers independently checked the original against that
identity. Cached text was compared with fresh original-PDF extraction for the
pages personally read; neither caching nor keyword search counts as reading.

All locators are **one-based physical PDF pages**, inclusive. `printedPages` is
null and `printedVerification` is `not-applicable`. There is no dependable
printed-page offset. Internal print-style numbers are navigation clues only;
the named destination and full unit were located in this supplied PDF.

## Source-order orientation

| Physical PDF pages | Source unit | Accounting and important boundaries |
| --- | --- | --- |
| 1–10 | Front matter | Blank 1, cover 2, title 3, dedications 4, contents 5–10; context, not advice. |
| 11–23 | 1. Introduction | Illustration 11; reframing, author stories, babies' needs, reading frame, complete perspective boxes 21–23. |
| 24–38 | 2. Montessori principles for babies | History and framework, tendencies, sensitive periods; complete observation 33–37 and practice 38. |
| 39–63 | 3. From conception to the first 6 weeks | Prenatal/birth material explicitly accounted and excluded from product scope; family inclusion 41, newborn/adult recovery 53–60, complete Slabaugh interview 60–63 retained separately. |
| 64–94 | 4. Setting up the home | Room table 69–75, SIDS box 76, floor-bed questions 77–79, siblings/small spaces, toddler overview 81–83, all numbered diagrams 85–86, home tours 87–94. |
| 95–116 | 5. Parenting the Montessori baby | Trust, acceptance, respect, boundaries, concentration, movement, attachment, crying, guidance, connection checklist and pace. Time-limited trust/outcome claims explicitly disposed. |
| 117–127 | 6. Activities: introduction | Selection/materials 119–120, effort/help 121–126, heuristic exploration and clothing. These qualify later material examples. |
| 128–139 | Language activities | Full age-labeled subsections, multilingual context, summary table and observation prompts. Source ages remain separate from browsing bands. |
| 140–169 | Movement activities | Development framework and tables, mobiles 146–152, fine/gross movement, objects, boxes and puzzles; specific source readiness and cautions retained. |
| 170–176 | Music, outdoors and movement summaries | Monthly movement table 172–174; all 25 items in illustrated inventory 174–176 separately accounted. |
| 177–179 | Illustration and chapter 7 opening | 177 is an uncaptained baby illustration; outline starts 178 and continues 179. |
| 180–193 | 7. Daily life: rhythm and eating | Rhythm, breast/bottle feeding, complete solids 186–188, choking box 188, eating furniture/tools, observation, weaning and attributed external references. |
| 193–206 | Sleeping | Full numbered discussion, four wake-window rows plus one-nap qualification, co-sleeping, sleep-help box and complete question rows. |
| 207–216 | Physical care | Clothing, diapering/toileting, resistance, bathing, car travel, baby wearing, teething, pacifier, sharing, colic/reflux and screens. |
| 217–231 | Common questions and other situations | Behavior and separation, mouthing, daily work, budget, siblings, twins, prematurity, adoption, differences and complete practice prompts. |
| 232–242 | 8. Preparation of the adult | Illustration 232; preparation, needs, help-seeking, self-trust, self-observation, all 49 calm ideas and closing practice. |
| 243–258 | 9. Working together | Help, partners and caregivers, family/contact safety exception 247, shared understanding, complete care choice 253–255, goodbye 256–257 and visitor box 257–258. |
| 259–266 | 10. What's next? | Toddler overview, four planes table 264–265, later-age scope exclusions, peace/practice perspective. |
| 267–282 | Bonus real stories | Index, seven family/classroom stories and every photo; anecdotes are context, with strong guarantees and sensitive examples explicitly disposed. |
| 283–294 | Appendices: month-by-month preparation | Prenatal table excluded; every newborn/older row and column accounted. Monthly care summaries remain tied to detailed body context. |
| 294–303 | Activities list for babies | Guideline outside prior table at 294; all 63 rows on 295–303 read in all four columns from originals. Each has global and within-page row indices. |
| 303–305 | Primitive reflexes | Definitions, age table and split final row checked; physiological/diagnostic interpretation held. |
| 305–310 | Back matter | Further Reading 305–306, acknowledgments 306–307, resources 308, author 309, copyright 310 inventoried. External sources were not imported. |

## Visual and navigation findings that affect reuse

- The movement inventory is **174–176**, not 175–177. Page 177 has no item labels.
  Appendix pages 295–303 contain meaningful image-only table text.
- The SIDS box on 76 actually skips item 6. Keep the source's omission; do not
  invent a tenth visible line or describe the 2021 list as current guidance.
- Room diagrams use 0–5, 5–9 and 9–12 months. Their labels are example-room ages,
  not the product's browsing bands or proof of equipment readiness.
- The feeding caption on 92 describes floor-reaching feet, while its photograph
  shows raised feet. The 4-month meal anecdote on 87 differs from the complete
  six-month-plus-readiness qualification at 186–189.
- The ball-basket continuation atop 292 belongs to Months 7–9. The walking
  warning crosses 293–294. The activity age guideline on 294 is outside the
  monthly table. No row inherits an adjacent row's age.
- All 63 activity rows preserve activity name, own age/readiness, description and
  attributed development classification. Paint-easel 302 uses standing unaided;
  wiping 303 uses walking. The heading on 294 says babies up to six months, but
  later continuation rows explicitly list older ages. Preserve individual rows.
- The source says **rattan ball** on 300 and **five wooden beads** on 297. These
  audit corrections preserve the source example, without approving construction.
- The reflex table's final row has Moro at the foot of 304 and its 12-month label
  and Tonic neck on 305. It is not an extra continuation of the 10-month row.
- Some internal links land before the named content: orientation anchor 28/prose
  29, toddler bathroom anchor 82/prose 83, visitor-note anchor 256/box 257–258.
  The visitor note's colic/reflux discussion is the complete 215–216 unit.

## Record navigation and editorial targets

Start with a page record, follow its section IDs, then its idea IDs to the ledger
and evidence. The ledger records one concrete disposition per idea; a combined
row links its surviving evidence while preserving the original witness.
`CROSSWALK.json` contains 56 groups for repeated ideas, source differences and
necessary internal context. It does not pretend each reader personally read the
other reader's pages. Partition files retain the researchers' original scope;
the root files record package-level reconciliation.

Targets beginning `principle.` refer to the approved foundation charter keys.
`source-manifest.baby-2021` refers to that source identity. `scope.exclude-prenatal`
and `scope.excluded.prenatal-and-birth-preparation` are aliases for the same
prenatal/birth-preparation product exclusion; `scope.exclude-after-three` records
later-age exclusions. `editorial.no-tracking`, `editorial.no-outcome-guarantees`
and `editorial.omit-developmental-guarantees` record charter decisions, not
missing evidence files. All such external editorial target keys are listed in
`VALIDATION.json`.
