---
layout: post
title: December Aliveline - Day 18
date: 2025-12-22
categories: alivelines
lastmod: 2026-01-13
---
# Day 21

Strongest form of my hypothesis again:
>The worm brain *implements* locomotion behaviors as loops in phase space, with local neuronal rules ensuring this structure shows up


What is evolution doing? If you believe the macro universality micro degeneracy story, then it is working at the level of behavior. Behavior is then a top-down constraint on the neuronal network of a brain. That means there must be some way to encode *behavior* in genes?? This is similar to that bit in the Dwarkesh Ilya interview where Ilya notes that evolution has somehow figured out a way (and *quickly* figured it out – it's recent) to encode social behaviors in our genes.

So an even stronger form of my hypothesis would take it all the way through:
> Genetics encodes behavior (eg locomotion) as a top-down computational constraint on a neuronal network. Locomotion in the worm brain is implemented by loops in phase space. Local neuronal rules are constrained by the top-down behavior so that the loop structure shows up, but are otherwise completely free to develop.

The above feels too fixed-circuit ish? Not sure. It does feel like I'm missing some notion of how learning occurs & how that interacts with the local neuronal rules. And that is likely key as to how this actually occurs.
	Presumably this ties into the "minimizing prediction error" view of how the brain learns

It's worth re-reading the attractor dynamics parts of the aversive learning paper perhaps. Tho iirc they did straight PCA, not a nonlinear dimensionality reduction? Maybe that's only for viz tho; they did fit a linear dynamical system directly to the population activity and find the fixed points moved.
	I do suspect the aversive learning paper makes too strong of a claim tho – they say that the whole brain rewires as a result of PA14 training. Or hm I suppose actually I do agree with it in some way. A dynamical system way of saying it would be that the whole dynamical system changes _so that_ when PA14 is encountered different trajectories are taken?


Read the LOOPER paper. Super interesting! Seems like an upgraded version of ADM basically, glad I read this before spending a bunch of time extending ADM to the QSimeon dataset lol.

---

Experiments that could be run to show parts of the strong hypothesis

[Discussion](https://chatgpt.com/g/g-p-6940510567788191a1a4cfdd32b77a9c-c-elegans-locomotion-neuronal-manifolds-learning/c/696576b0-bde4-832e-98c5-cd0c5f9175b4)

Let’s turn that “strong form” into **falsifiable sub-claims**, then map each to experiments you can run _right now_ with ADM + qSimeon.

You’ve basically got a 3-layer statement:

1. **Macro (behavior) is conserved**: locomotion is a low-dim loop/loops in phase space.
2. **Micro is degenerate**: many different per-neuron “implementations” realize the same loop.
3. **Genetics constrains macro, not micro**: across animals (and even genotypes), loop topology is stable whenever behavior is the same; what changes is parameterization (speed, dwell times, switching), and the neuron-to-manifold mapping. 

ADM is literally designed to extract the loop + phase macrodynamics from neural time series and then use it for simulation/prediction. qSimeon gives you lots of worms across many protocols, standardized in time and normalization, with neuron masks.

Below are experiments grouped by claim, with **what to compute** and **what would falsify**.

---

## A. “Locomotion is loop structure in phase space” (topology)

### A1) Loop topology prevalence across datasets/conditions

**Goal:** Is “loopiness” a robust signature of locomotion-like dynamics, or just Kato-style immobilized fictive motor programs?

**Method**
- For each worm, run ADM embedding (your standard pipeline).
- Quantify _topology_ of the embedding using a loop metric:
    - simplest: does the trajectory form a closed cycle in 2D/3D after phase-unwrapping?
    - stronger: persistent homology / Betti-1 (one prominent 1D hole) on the embedded point cloud over time windows.
- Do this across datasets that differ strongly (immobilized vs freely moving, stimulation vs none), leveraging qSimeon’s breadth.

**Predictions if your hypothesis is right**
- Datasets that are primarily locomotion/state-cycling should show **stable Betti-1 ≈ 1 or 2 loops** (depending on whether you get Brennan’s two-loop structure).
- Datasets dominated by sensory encoding (e.g., odor panels) should show **less robust loop topology** or loops that are _not aligned to locomotion variables_.

**Falsifiers**
- “Locomotion datasets” frequently yield no loop structure even with reasonable hyperparameters and windowing.
- “Sensory-only datasets” yield equally strong loop topology with no relation to behavior/state.

---

### A2) Within-worm state dependence: loop collapses in sleep/quiescence

**Goal:** If loops are the locomotion control manifold, they should weaken when locomotion circuitry is globally downregulated (sleep, quiescence).

**Method**
- Pick datasets with sleep/quiescence structure (e.g., lethargus, starvation quiescence).
- Segment each worm into “active” vs “quiescent” windows using simple activity amplitude/variance thresholds (since qSimeon is z-scored; you can use global RMS).
- Run ADM separately on windows.

**Prediction**
- **Active windows:** loop/loops recover cleanly.
- **Quiescent windows:** loop topology degrades (point cloud collapses / no stable phase progression).

**Falsifier**
- Loop structure is equally strong in quiescence as in active locomotion-like epochs.

---

## B. “Micro rules are otherwise free” (degeneracy of implementations)

### B1) Same manifold, different neuron-to-manifold mappings across individuals

This is the _core_ “degeneracy” test.

**Method**
1. For each worm, compute ADM latent coordinates (z(t)) (2D or 3D).
2. Fit a decoder from (z(t)\rightarrow x_i(t)) for each neuron (i) (simple ridge regression, or a small MLP).
3. Compare:
    - manifold topology similarity across worms (e.g., Betti-1, loop length, phase velocity profile)
    - **decoder variability** across worms for the same neuron identity.

**Key metric**
- Cross-worm generalization: train decoder on worm A, test on worm B **after aligning manifolds** (Procrustes / phase alignment).
- If the manifold is conserved but micro implementation differs, then:
    - manifold alignment works well
    - but neuron-specific decoders generalize poorly (or require worm-specific affine remaps)

**Prediction**
- Strong conservation in the **latent dynamics** with weak conservation in per-neuron readouts—exactly the “behavior stable / neuron details free” pattern.

**Falsifiers**
- Either (i) manifolds aren’t alignable across worms, or (ii) neuron-to-latent mappings generalize extremely well across worms (micro not free).

This lines up directly with Brennan/Proekt’s observation: neuron activity differs consistently across animals, while the macroscopic manifold is conserved and predictive.

---

### B2) Many different neuron subsets recover the same loop

If local rules are “free,” the loop should be recoverable from _many_ different subsets, not just command interneurons.

qSimeon provides a neuron mask per worm and standardized traces, so this is easy.

**Method**
- For each worm, repeatedly subsample neurons:
    - random subsets of size k (k = 5,10,15,30,50…)
    - structured subsets (top variance neurons, random-but-excluding command neurons if identities exist, etc.)
- Run ADM on each subset.
- Score whether you recover the same loop topology + a consistent phase progression (e.g., phase monotonicity, loop closure, similarity to full-set embedding).

**Prediction**
- Above some k*, recovery probability becomes high and not restricted to a tiny privileged set.
- There _will_ be “bad” neurons/subsets, but loop recovery should be broadly achievable.

**Falsifiers**
- Only a very specific neuron set recovers the loop; random subsets fail even at moderate k.

(You can also replicate Brennan/Proekt’s “single neuron sometimes suffices” idea across many datasets as a special case.)

---

### B3) “Same loop, different speeds”: parameterization varies but topology doesn’t

A clean way to separate “macro constraint” from “micro freedom” is: topology fixed, dynamics reparameterized.

**Method**  
For each worm/dataset:
- Extract phase (\theta(t)) along the loop.
- Compute phase velocity (d\theta/dt), dwell-time distributions near “decision regions,” loop switching probabilities if you recover two loops.

Compare across conditions (fed vs starved, different genotypes, immobilized vs free).

**Prediction**
- Topology stable; **phase velocity profile and switching rates change** with condition.

**Falsifier**
- Topology changes wildly, not just parameterization.

---

## C. “Genetics encodes behavior as a top-down constraint” (genotype vs phenotype)

You won’t fully prove “genetics encodes behavior” with these datasets alone, but you can test **the implied invariances**:

### C1) Genotype changes that preserve locomotion should preserve manifold topology

Example: different wild-type backgrounds, mild mutants, or lab-to-lab differences where gross locomotion is similar.

**Method**
- Identify genotype groups within a dataset (where metadata exists).
- Compare manifold topology + phase dynamics across groups.
- Use a “manifold classifier” trained on one group to decode behavioral phase (or predict next phase) in the other.

**Prediction**
- High cross-genotype manifold transfer when phenotype is similar.

**Falsifier**
- Small genotype changes destroy topology even when locomotion looks similar.

---

### C2) Genotype changes that alter behavior should alter manifold structure

Conversely, pick manipulations known to alter state structure (sleep mutants, neuromodulator perturbations, etc.).

**Method**
- Same as above but focus on conditions where behavior/state should differ.
- Ask: do you get additional attractors, loop splitting/merging, or collapse into fixed points?

**Prediction**
- You see structural changes in the manifold (not just speed).

**Falsifier**
- Even large behavioral changes yield identical manifold structure.

---

## D. “Macro constraint predicts future motor commands” (causal usefulness)

ADM’s original selling point is: from current latent state you can predict future transitions better than dwell-time-only models.

### D1) Cross-dataset prediction of transitions

**Method**
- Train ADM transition operator / Markov model on one dataset (or subset of worms).
- Apply to held-out worms and to _other datasets_ after manifold alignment.
- Evaluate:
    - next-step prediction in latent space
    - expected time-to-transition (if you can define transitions via latent regions or behavior labels)
    - compare against nulls: dwell-time-only, shuffled latent, phase-randomized traces.

**Prediction**
- Prediction generalizes across worms and partially across labs/conditions when phenotype overlaps.

**Falsifier**
- Predictive power is only within-worm, not cross-worm, even after alignment.

---

## Practical roadmap (so this doesn’t explode)

1. **Reproduce** Brennan/Proekt on a single dataset you trust (sanity check your ADM implementation). ADM should yield a loop/loops + usable phase and transition model.
2. Do **A1 + B2** first: “Do loops exist broadly?” and “Do many neuron subsets recover them?” These are fast and highly diagnostic.
3. Then do **B1**: “manifold conserved, neuron mappings vary” (your strongest “micro free” evidence).
4. Then do **B3/C1/C2**: isolate topology vs parameterization across conditions/genotypes.
5. Finish with **D1**: cross-dataset predictive transfer.

---

## What I’d watch out for (common failure modes)

- **Behavior vs state mismatch:** some datasets are primarily sensory coding or sleep state; ADM may find loops that are _not locomotion_. That’s okay—your hypothesis predicts loop structure is _behavior-dependent_, not universal.
- **Windowing matters:** loop topology often appears in the right time window; too long mixes regimes, too short under-samples.
- **Neuron ID availability varies:** the strongest “micro degeneracy” tests want consistent neuron IDs; in qSimeon some datasets have richer IDs than others, but masks are always there.

---

If you tell me which _two or three_ datasets you want to start with (e.g., “immobilized locomotion-like” vs “freely moving” vs “sleep”), I’ll propose **exact metrics + plots** for A1/B2/B1 and a tight “results table” format so you can iterate quickly.

