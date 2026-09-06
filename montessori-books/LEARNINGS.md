# Learnings

## What Has Worked

**[2026-09-04] — Montessori source references**
- Observation: The Baby PDF is a 310-page reflowed document without reliable printed-page labels; the Toddler PDF has 257 physical pages, with the inspected main-text printed page numbers nine lower than the physical PDF pages.
- Action: Label Baby citations as PDF pages. Keep verified printed and PDF references together for Toddler; do not apply its offset to Baby.
- Confidence: high

**[2026-09-04] — Standalone design comparison**
- Observation: All ten directions share six guidance records and use hash routes under `/montessori-books/`, preserving the selected age when switching designs.
- Action: Keep age and guidance data separate from concept layouts so comparisons use equivalent content and direct links remain compatible with static Pages hosting.
- Confidence: high

## Patterns and Preferences

**[2026-09-04] — Age navigation on phones**
- Observation: Absolutely positioned screen-reader labels inside the horizontally scrolling age links extended the document width until the age row and links became positioning contexts.
- Action: Keep the age row and links `position: relative`, and scroll the selected age into the row's visible area when loading a stage.
- Confidence: high

**[2026-09-04] — Prototype validation**
- Observation: The user requested ten random-seed design directions and specifically asked to keep testing minimal during prototyping.
- Action: Preserve all ten directions until a selection is made; use a production build and a brief browser check instead of adding an automated test suite for this comparison phase.
- Confidence: high

## What Has Failed

No project-specific failures recorded.
