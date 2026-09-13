# Learnings

## What Has Worked

**[2026-09-12] — Activity refresh and complete navigation labels**
- Observation: All 174 entries now have distinct labels of up to three words; the two former “Listen” labels needed disambiguation. Carrying the three entry IDs in the hash preserves refreshed choices through readers, topics, reloads and browser history. Session storage keeps age-specific seen IDs. The label/refresh release retained all 645 rendered reader bodies.
- Action: Maintain labels in content/editorial/navigation-labels.json and use label-navigation.mjs for its release evidence. Carry the ideas parameter through home/topic/reader links, validate it against age placements, and exclude the visible trio even when filling a batch across an exhausted pool.
- Confidence: high

**[2026-09-12] — Refreshing the starting activities assessment**
- Observation: HomeStudy always uses the three openingOrder placements, while the approved payload contains 15–31 invitation entries per age. Only 3–9 invitations per age have short actionLabel text; the remainder already have titles and summaries. The release guard fingerprints the home renderer, selectors and routes.
- Action: For an activity refresh, select from age-matched invitations, track previously shown IDs and handle pool exhaustion. Provide a title fallback for missing navigation labels, preserve the chosen trio through reader navigation, and record the presentation change through the release process.
- Confidence: high

**[2026-09-12] — Distinct starting-idea curation**
- Observation: Promoting existing topic entries to starting ideas required nine missing action labels; HomeStudy already uses their approved summaries when no short invitation exists. Changing openingOrder and those labels left all 645 rendered reader bodies identical, while the 21 starting selections became unique.
- Action: Use content/editorial/starting-ideas.json and curate-openings.mjs for selection-only revisions. Retain age/topic placement and reader content, validate the full set of openings together, and record new curation separately from historical independent source/art reviews.
- Confidence: high

**[2026-09-12] — Starting-idea duplication audit**
- Observation: The 21 starting slots use only 12 entries; 12–18 and 18–24 repeat the same complete trio in a different order. HomeStudy renders shared entry text on the home screen, while placement-specific age notes appear only inside the reader. Differently named Baby/Toddler topic entries also overlap at 12–18.
- Action: Review the seven starting trios together when curating openings. Count repeated entry IDs and inspect similar actions under different titles; neither a reordered trio nor a changed reader age note creates a distinct starting idea. Use research/DUPLICATION_AUDIT-2026-09-12.md as the baseline inventory.
- Confidence: high

**[2026-09-12] — Cross-age topic link integration**
- Observation: A contribution can contain a topic entry for an age without owning that age’s three starting ideas. Assembly then adds an explicit `idea` query parameter for the already-approved first opening, although the contribution’s implicit default returns to the same opening. Literal markup equality initially treated that navigation binding as changed editorial content.
- Action: Allow only this validated implicit-to-explicit default-opening parameter when joining approved contributions. Preserve all other URL parameters, visible markup and exact text hashes, and record each binding in the integration receipt. Do not normalize away substantive presentation differences.
- Confidence: high

**[2026-09-12] — Retained reading ancestry**
- Observation: The adult-life source review referenced a previous raw decision file whose PDF 39 reading was itself retained from another review. The compiler initially reported the page unread even though the reviewer had read and explicitly retained it.
- Action: Follow explicitly declared same-reviewer/role reading ancestry, hash every link and preserve distinct log declarations with colliding local IDs. Do not ask the reviewer to repeat original reading just to repair this administrative join.
- Confidence: high

**[2026-09-10] — Pilot source-age separation**
- Observation: Toddler PDF 71 discusses unaged home play, while PDF 103–104 places its separate pretend-play discussion around 2½ and later. Combining these in the 18–24 pilot implied an earlier expectation.
- Action: Keep the home-play subject separate from the later creativity context in titles, cues, references, and public age notes.
- Confidence: high

**[2026-09-10] — Pilot contribution review surfaces**
- Observation: HomeStudy opening navigation displays neighboring action labels, so an individual entry digest cannot detect every change to that entry's rendered opening context.
- Action: Retain the existing actual rendered-surface equality checks alongside component hashes when carrying pilot or contribution approvals forward.
- Confidence: high

**[2026-09-10] — Reader-facing book references**
- Observation: HomeStudy renders reference sections and locators verbatim. Pilot reviews found private editing phrases such as “surrounding asserted outcomes” in those locators, and an editorial pacifier heading that differed from the original “Consider going pacifier-free.”
- Action: Use the actual book subsection headings required by the foundation contract and plain, recognizable subjects in public locators. Keep completeness notes, interpretation judgments, and review status in private provenance; inspect the rendered references as part of the parent-facing text.
- Confidence: high

**[2026-09-10] — Accepted artwork versus generation intent**
- Observation: The accepted home-paper-toddler.webp shows one hand on the pitcher and one steadying the cup, although earlier prompts requested two hands on the pitcher. Its actual rendering is softer storybook art than the prompts' cut-paper description.
- Action: Use the inspected assets and research/art-direction/PREFLIGHT.md as the visual reference for later age scenes, alt text, and source reviews. Preserve observed gestures and style rather than treating generation prompts as proof of image content.
- Confidence: high

**[2026-09-10] — Whole-book source differences**
- Observation: The supplied books sometimes give different details for related examples: Baby's Gobbi sphere counts differ between PDF 149 and 297, and Toddler's scissors ages differ between PDF 53 and 66/252. Care qualifications also continue across pages, including Toddler eating 154–155 and sleep 157–158.
- Action: Use the completed research crosswalks and exact variant/context references when populating entries. Preserve an unresolved difference or choose a specifically supported variant; do not average ages, normalize details, or let a short appendix replace the fuller passage.
- Confidence: high

**[2026-09-10] — Semantic checks beyond page accounting**
- Observation: Independent audits caught errors despite complete page registers: Toddler's paint container became a quantity and its PDF 138 anticipatory subsection was omitted; Baby's rattan ball became a rattle ball and its five-bead example lost the count.
- Action: Review final reader wording against the original table grammar, every relevant subsection, and concrete materials/quantities. Use page/read-log completeness as traceability, not as proof of faithful paraphrase.
- Confidence: high

**[2026-09-10] — Verified book identity and extraction gaps**
- Observation: The Baby PDF metadata names only Simone Davies and a conversion date, while its title/copyright pages credit Davies and Junnifa Uzodike and identify the 2021 publication. Sparse extraction also conceals illustrated material, including Baby activity-table pages and Toddler PDF page 202.
- Action: Use research/foundation/SOURCE_MANIFEST.md for source identity and physical-page references. Use ignored tmp/book-text/extraction-qc.json as a visual-inspection checklist, and inspect meaningful tables/illustrations on other pages too; do not equate empty extracted text with blank pages.
- Confidence: high

**[2026-09-10] — Open scene with an integrated activity headline**
- Observation: Five fresh ultra critiques scored 8, 8, 8.2, 8.5, and 8.2. Transparent scene illustrations, removing picture labels, and placing the selected headline in the scene's open space produced the strongest review at 8.5. A subsequent pass that removed the category and italic subheading and reduced the art scale scored lower, so the 8.5 version was restored.
- Action: Preserve the round 16 composition as the current home baseline. Use genuine image transparency for the paper background and keep the activity heading integrated with the picture; do not apply every critique mechanically when it weakens a previously reviewed composition. Compare against the saved round 16 and 17 screenshots and source snapshots.
- Confidence: medium

**[2026-09-10] — Integrated home guide**
- Observation: Moving all three choices into the reading column, opening one activity at a time, using consistent activity titles, and replacing the full age row with a labeled select received 8.2/10 after an 8/10 baseline review without generating more art. A fresh critic scored that unchanged baseline one point higher than the previous critic, so small score differences are noisy.
- Action: Preserve the integrated guide and compact age control for concept 02. Focus further work on illustration composition and a distinctive annotation system, and report modest score gains cautiously rather than treating them as strong convergence evidence.
- Confidence: medium

**[2026-09-10] — Second home design critique pass**
- Observation: Adding age-specific caregiver/child scenes, widening the reading panel, and simplifying markers moved two fresh ultra screenshot reviews from 7.2/10 to 7.5/10. The new critic still saw uniform amber illustration treatment, redundant numbering, and too many dividers; the score remains near the prior pass's plateau.
- Action: In a further pass, change the illustration's focal hierarchy and reduce repeated navigation and rules; do not expect further spacing polish alone to reach the studio bar. Keep the same screenshot dimensions and objective prompt within each pair of reviews.
- Confidence: medium

**[2026-09-10] — Home concept critique pass**
- Observation: Two fresh screenshot-only critics using ultra reasoning scored the original home concept 7/10 and the revised composition 7.5/10. The revision raised the room by roughly 110px, removed its overlay headline, and exposed one activity beside it; remaining weaknesses were boxed markers, narrow sidebar composition, and small interactive text.
- Action: Preserve the room-led direction. In another visual pass, prioritize markers anchored to the actual activity area and a wider reading panel over additional decorative elements. Keep the critic isolated from earlier scores.
- Confidence: medium

**[2026-09-04] — Montessori source references**
- Observation: The Baby PDF is a 310-page reflowed document without reliable printed-page labels; the Toddler PDF has 257 physical pages, with the inspected main-text printed page numbers nine lower than the physical PDF pages.
- Action: Label Baby citations as PDF pages. Keep verified printed and PDF references together for Toddler; do not apply its offset to Baby.
- Confidence: high

**[2026-09-04] — Standalone design comparison**
- Observation: All ten directions share six guidance records and use hash routes under `/montessori-books/`, preserving the selected age when switching designs.
- Action: Keep age and guidance data separate from concept layouts so comparisons use equivalent content and direct links remain compatible with static Pages hosting.
- Confidence: high

## Patterns and Preferences

**[2026-09-12] — Refresh control visibility**
- Observation: After trying refresh, the user found the muted icon too subtle, suggested a warmer color, and approved the burnt-orange icon with its faint circular background for publishing.
- Action: Give the refresh control the existing burnt-orange accent with a faint matching circular background; keep a stronger tint on hover.
- Confidence: high

**[2026-09-12] — Consolidated editorial trial**
- Observation: Two independent xhigh reviewers passed five saved entries across nine new placements without corrections. Interning repeated references and omitting operational metadata reduced the packet from 67,592 to 48,525 bytes, but both reviewers still needed recovery reads after oversized combined output was truncated. No actual token counter was exposed.
- Action: Keep one editor and two reviewers for related topic batches, with saved authors paused. Read one entry or source unit per bounded tool output; avoid concatenating the whole packet and multiple units. Retain the explicit partial-review receipt so nine passes cannot approve the other 104 contribution targets. Treat byte counts as payload measurements, not demonstrated token savings; this trial ends pending user assessment.
- Confidence: high

**[2026-09-10] — Population review cost**
- Observation: The two-age pilot produced eight frozen revisions and 40 review reports. Fresh reviewers repeatedly read overlapping source units, and minor corrections triggered additional reviews. The user paused the next three tasks for excessive token usage, resumed under lean-v1, then paused again because usage remained too high. The revised workflow has not demonstrated acceptable cost.
- Action: Keep all population tasks and subagents paused until explicitly authorized. Preserve saved work. On a future restart, account for total active-agent and reasoning cost as well as repeated reading; do not assume retained reviewers and generated metadata alone solve the problem. Continue reusing approved bodies, bounded source packets and consolidated corrections.
- Confidence: high

**[2026-09-10] — Full book population scope**
- Observation: The user accepted the round 16 design and chose layered coverage from birth through age three, three starting invitations followed by topics, original age scenes plus useful key-moment illustrations, and book-summary-only handling of safety-sensitive material. They requested fresh xhigh tasks/subagents in this shared saved project.
- Action: Follow POPULATION_PLAN.md and the source-grounded editorial charter. Preserve the accepted design across ages, keep age/readiness distinctions explicit, include adult/family guidance, and use durable evidence/review handoffs with one app writer. Do not resume a design score chase or add completion tracking or outside care advice.
- Confidence: high

**[2026-09-10] — Bounded refinement of concept 02**
- Observation: The user chose concept 02 for improvement and requested a fresh ultra-reasoning screenshot critic with an identical prompt each round, then limited this first pass to one or two rounds to evaluate convergence.
- Action: Treat this as a bounded refinement of concept 02; honor the latest requested round count (later expanded to five), report independent scores, and stop at that limit even if the original aspirational 9/10 threshold has not been reached.
- Confidence: high

**[2026-09-10] — Montessori design exploration**
- Observation: The user favored concepts 02 (A home within reach), 03 (Paths of discovery), and 05 (Paper play), and requested further broad brainstorming toward a bold, unique design language.
- Action: Retain this as historical exploration context. The later acceptance of home concept round 16 and the full-population plan supersede this open-ended exploration preference; other concepts remain development references.
- Confidence: high

**[2026-09-04] — Age navigation on phones**
- Observation: Absolutely positioned screen-reader labels inside the horizontally scrolling age links extended the document width until the age row and links became positioning contexts.
- Action: Keep the age row and links `position: relative`, and scroll the selected age into the row's visible area when loading a stage.
- Confidence: high

**[2026-09-04] — Prototype validation**
- Observation: The user requested ten random-seed design directions and specifically asked to keep testing minimal during prototyping.
- Action: Preserve all ten directions until a selection is made; use a production build and a brief browser check instead of adding an automated test suite for this comparison phase.
- Confidence: high

## What Has Failed

**[2026-09-12] — Generated transparency in the age scenes**
- Observation: Three new age-scene image-generation attempts painted checkerboards into opaque PNGs instead of supplying alpha. Pure-white corrections rendered cleanly with the existing scene multiply style; the shoe close-up needed the same blend scoped to that image.
- Action: Inspect actual image pixels and alpha metadata before selecting an asset. Keep the accepted pilot assets unchanged; use the inspected white-paper outputs and scoped blend for the six new assets rather than treating a transparency prompt as proof of transparency.
- Confidence: high

**[2026-09-10] — Action labels on the home illustration**
- Observation: Replacing numbered hotspots with underlined action words on cream backgrounds, removing the sidebar number column, and increasing supporting text legibility received 8/10 after an 8.2/10 baseline. The final critic still described the labels as pasted on and interpreted Listen as labeling the window despite its leader line.
- Action: Further home annotation work should make the depicted action and its label unmistakably correspond; replacing numerals with words alone does not solve integration. Retain this result as a plateau rather than evidence that the annotation approach reached the studio bar.
- Confidence: medium

**[2026-09-10] — Faded illustration boundary**
- Observation: The home scene's intersecting CSS gradient masks, fading its edges over 2–3% of the image, were specifically criticized as a fuzzy rectangular halo in round 10. Fixing the baby image's ball size, headroom, and peripheral clutter left the fresh before/after scores at 8/10.
- Action: For a future home pass, replace the synthetic edge fade with a deliberate crop or artwork with authentic open brush edges. Do not treat better scene proportions alone as resolving the artwork/interface integration.
- Confidence: medium

**[2026-09-10] — Close-up scene redesign**
- Observation: Replacing the cutaway house with close parent–child illustrations and removing most dividers received 7/10 after a fresh 7.5/10 baseline critique. The final critic still found the artwork generic and the markers pasted on; it also found the separate bottom choices disconnected from the reading panel. The larger figures alone did not resolve the design's distinctiveness.
- Action: Do not continue swapping similarly idealized domestic illustrations as the main refinement. A future pass should resolve a specific illustration-and-interaction concept, including meaningful marker targets and one coherent placement for the choices, before generating more artwork. Treat this pass as a regression in the critic's assessment, not evidence of convergence.
- Confidence: medium
