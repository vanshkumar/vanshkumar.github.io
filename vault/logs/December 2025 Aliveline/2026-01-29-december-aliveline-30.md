---
date: 2026-01-29
lastmod: 2026-01-30
---
# Day 30

Second to last day! What would I like to get done before the end?
- Code wise
	- Re-run Kato shared
	- Run Atanas fidelity/stationarity tests
	- Update documentation/writeup with results
- Convert my various musings/thoughts/questions throughout this into draft-y Evergreen Questions, so I can refine & sharpen them later
- Reflections on this process while it's still fresh
- Overall writeup, though I'll let all of this sit for a little before doing this – mostly just want to make sure raw materials are in place while it's fresh

Kato shared is running. Did some refactoring of Kato/Atanas code to avoid code going out of sync, it's much cleaner and clearer to see what is going on now. Tons of documentation updates to get it to a finalized place (for now).

---

Thinking about this Evergreen Questions format... here's the original [Evergreen Notes](https://notes.andymatuschak.org/z5E5QawiXCMbtNtupvxeoEX):
- [Evergreen notes should be atomic](https://notes.andymatuschak.org/zNUaiGAXp21eorsER1Jm9yU)
- [Evergreen notes should be concept-oriented](https://notes.andymatuschak.org/z2hQEhqWkdRLL9JUwfawZZx)
- [Evergreen notes should be densely linked](https://notes.andymatuschak.org/zF8xCU4BwXwbmSyp7tmff9i)
- [Prefer associative ontologies to hierarchical taxonomies](https://notes.andymatuschak.org/z8SU3r8xyZyvwRhyDdJasJ2)
- [Write notes for yourself by default, disregarding audience](https://notes.andymatuschak.org/zXDPrYcxUSZbF5M8vM5Y1U9)

What am I thinking for Evergreen Questions? Why do I need a separate format beyond Evergreen Notes?
- Original reasoning was that Evergreen Notes require a lot of maintenance – because they are densely linked, any semi major changes will require changing a lot of them. Evergreen Questions at least a priori seem like they may need less, because questions remain valid even if they are answered; how refined/sharp they are may change over time. Also loosely inspired from [[Questions are not just for asking]]
- I also like the idea of practicing the skill of converting questions into falsifiable / testable hypotheses and actual experiments. Each Evergreen Question is in a good state once I am able to sharply define an associated hypothesis/experiment (ideally just a single one to make sure questions are atomic)
- Probably I should just try it out and see what happens. Let's do that

From [[2026-01-14-december-aliveline-23]] is my rough list of Evergreen Questions from this aliveline:
- Each neuron is a DD-DC
	- Can't you test this by seeing what happens if you perturb a single neuron and see if it behaves like a feedback controller?
- Moving faster allows enables/strengthens learning through proprioception
	- Hypothesis: because each neuron is a DD-DC, speed increases quality & quantity of feedback
- Locomotion is implemented as loops in a low-D phase space in C Elegans
- Each brain has its own neural coordinate system to implement the same behavior
- Neural population activity encode tasks like motor control and even higher order cognition as manifolds
	- As things become more predictable, tangling decreases (manifold geometry becomes simpler)
	- hypothesis: As things become more predictable, some analog to Kolmogorov complexity goes down
- What might a useful KC analog definition look like?
	- Minimum number of neurons that need to be activated to achieve a particular neural state space trajectory?
	- what if we frame this in terms of feedback/control??
- Theories of the brain have shifted from a single-neuron view to global population dynamics due to advancements in measurement technology
	- What's the natural extension here? What kind of measurement would enable this?
- The space of neuromodulators is massive, even in a small nervous system like C Elegans
	- Ex: Cytokines paper
- Can the Tracy-Widom distribution (or other universality class distributions) describe the transition of neural population activity before/after a rule is learned?
- Behavior is a top-down computational constraint on a neuronal network
- How does DNA bridge the micro (local neuronal rules) to the macro (evolutionarily relevant behavior)
	- hypothesis: perhaps in local neuronal rules are in the language of feedback control laws?
- What is the appropriate measure of 'complexity' or 'representational capacity' for a brain?
- How does the parallelism of the brain tie into the feedback control / nonlinear dynamical system view?
- [This comment](https://news.ycombinator.com/item?id=42259686): In CN, the trend is to take algorithms from computer science and statistics and map them onto biology. What’s far rarer is extracting new ML algorithms from the biology itself.
- What if intelligence/the brain were *simple* and they seem complex because the environment is complex? simple in the sense of having a relatively small set of rules

---

Also asked codex to pull out Evergreen Notes/Questions from the ideas in this folder to see if it gives me interesting ideas. Results:

**Process / Meta‑Research**
  - _Constraints as a motivation engine_ — why “absurd objectives” reliably create momentum.
  - _Problem‑creator mindset reduces skill bottlenecks_ — when reframing beats solving.
  - _Fast iteration beats perfect framing in short timelines_ — when to pick a path vs keep exploring.
  - _Failure can be designed to be interesting_ — criteria for “good failure.”
  - _Research pace is gated by social bandwidth_ — author outreach as default step.
  - _LLM co‑working needs explicit loop design_ — prompts, checkpoints, and autonomy boundaries.
  - _Asking for help earlier changes research speed_ — how much is “enough” independence?
  - _Negative results are still structure_ — how to turn “didn’t work” into a useful note.

  **Methods / Measurement**
  - _Stationarity assumptions quietly dominate neural dynamics analyses_ — when they break.
  - _“Fidelity” vs “stationarity” as separate validation axes_ — why both matter.
  - _Freely moving vs immobilized data may be different systems_ — when manifolds disappear.
  - _Dataset conditions are first‑class confounds_ — stimulus regimes as regime switches.
  - _Small neuron subsets can recover global structure_ — what that implies and what it doesn’t.
  - _When a manifold is real vs epiphenomenal_ — criteria for “computational relevance.”

  **Neuro / Theory**
  - _Behavior as a top‑down constraint on network dynamics_ — not hardwiring, but shaping.
  - _Degeneracy vs universality_ — stable behavior with unstable micro‑implementation.
  - _Context‑gating as a memory strategy in tiny brains_ — minimal memory without overwrite.
  - _Manifolds as reused scaffolds_ — reuse without catastrophic forgetting.
  - _Learning as state‑space geometry change_ — rotations/contractions as signatures.
  - _Local rules → global loops_ — how local feedback might yield conserved dynamics.
  - _Genetic “reachability” instead of explicit encoding_ — behavior as a basin, not a script.
  - _Control‑theoretic language for neurons_ — feedback laws as a unifying micro‑vocabulary.

  **AI / ML / Cross‑Domain**
  - _Emergent low‑D structure in both brains and models_ — what’s the shared pressure?
  - _Macro behavior selection vs micro implementation freedom_ — analogy to model pruning or lotteries.
  - _When AI models should be trained near criticality_ — why structure appears at phase edges.
  - _“Simple rules, complex environment” as a brain hypothesis_ — where complexity really lives.
