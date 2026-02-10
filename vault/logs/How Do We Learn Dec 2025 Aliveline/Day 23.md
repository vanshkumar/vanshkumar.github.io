---
date: 2026-01-14
lastmod: 2026-01-15
---
# Day 23

I have noticed that through these daily working notes I am repeating ideas and not really getting into the level of depth I would like. Part of that is because there was a 2-3 week break in the middle of this whole thing, which probably caused me to lose a bunch of intuition that was brewing. I think I have a pretty interesting experiment I can run to connect LOOPER and the DD-DC view using QSimeon (and/or a simulation), so I will start on that soon. But for now I think I could get a lot of value out of converting my understanding/hypotheses into Evergreen Notes.

Or is Evergreen Notes the best modality to do this? Perhaps writing out a longer form hypothesis/narrative would also work?

OK what might the Evergreen Notes look like, just to test it out?
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


That's... quite a list. It's probably worth developing them as Evergreen Notes though to sharpen my claims / see connections better / be clear about what I actually understand.

---

LOOPER/DD-DC experiment:


Yes — there’s a pretty clean “highest value” experiment you can run on qSimeon that ties the two stories together **without needing to literally prove “neurons are optimal controllers.”** It tests the part where DD-DC says “local (piecewise) linear closed-loop rules are enough,” and LOOPER says “global activity organizes into 1-D strands that branch/merge.”

## Highest-value dataset experiment: scaffold-conditioned local linear dynamics + “control leverage” per neuron

### Idea in one sentence

Use LOOPER/ADM to label where you are on the 1-D scaffold (which strand + phase), then ask: **does a piecewise-linear model predict the next population state much better than a single global model, and which neurons have the most leverage on moving along the strand vs switching strands?**

That’s the tightest bridge:
- **LOOPER:** provides the scaffold (1-D trajectories, branches/merges).
- **DD-DC:** predicts that behavior can be governed by **local linear rules / switching between regimes**, i.e., “a controller bank.”

### What you do (concrete)
1. **Build a scaffold label for every timepoint**
    - If you have LOOPER: use its strand ID + 1-D coordinate (position/phase).
    - If not: use your ADM embedding and define:
        - a **main loop phase** (e.g., angle in the first 2 diffusion components), and
        - a **discrete “regime” label** (e.g., clusters / branches via transition matrix structure).
2. **Fit a simple local linear predictor of population dynamics**  
    For each regime (and optionally phase-bin within regime), fit:  
    [  
    x_{t+1} \approx A_{r} x_t + b_r  
    ]  
    where (x_t) is the full neural population vector at time (t), and (r) is the regime/strand (optionally phase-bin).
    
    Use ridge regression (you’ll need it because (n) can be large vs samples per bin).
    
3. **Cross-validated test: piecewise vs global**  
    Compare prediction error of:
    - a single global (A)
    - your piecewise (A_r) (and/or (A_{r,\phi}))
    
    If LOOPER’s scaffold is “real computational structure,” the piecewise model should beat global **especially near branch/merge regions**.
    
4. **Extract “control leverage” of each neuron**  
    For each regime/bin, quantify neuron (i)’s leverage as something like:
    - **state influence:** ( |A_r[:, i]| ) (how much neuron (i) predicts changes in everyone else next step)
    - **phase influence:** regress **phase velocity** (\Delta \theta_t) on (x_t), and look at coefficients per neuron
    - **switching influence:** logistic regression predicting branch choice (r_{t+1}) from (x_t); coefficients give “who drives switches”
        
5. **Do the key comparison across worms**  
    This is where it becomes a real test of “degeneracy vs constraint”:
    - Are the top-leverage neurons **consistent across animals** (suggesting genetically constrained micro-implementation)?
    - Or does each worm use a different set of neurons to implement the same scaffold motion (degeneracy with conserved macro dynamics)?

### What would count as a strong tie between the papers

You’d be able to say something like:
- “LOOPER’s strands correspond to **regimes where a local linear predictor is stable and accurate**.”
- “Branch/merge regions correspond to **sharp changes in the best-fit local linear map** (switching dynamics).”
- “A small subset of neurons has high leverage on **phase progression** or **regime switching**, consistent with a controller-like role — but that subset is either conserved or degenerate across worms.”

That’s basically “switching DD-DC controllers generate LOOPER scaffolds,” tested in the only way you reasonably can with imaging data.

### Why this is high value
- It’s fast to implement (it’s just regression + your existing embedding/transition structure).
- It produces crisp plots: prediction error vs phase; leverage heatmaps; worm-to-worm consistency.
- It directly addresses your “local rule → global scaffold” question.

### Main caveat (worth keeping in mind)

With calcium imaging you don’t have true causal interventions, so “control leverage” is _effective influence_ (predictive, not causal). Still, it’s the right first pass.

---

## If you want an even cleaner story: do a small simulation in parallel

If you want something that **really looks like DD-DC → LOOPER** end-to-end:

### Minimal simulation recipe
- Latent motor phase (\theta_t) on a ring (oscillator).
- High-dimensional neural state (x_t) that is a nonlinear embedding of (\theta_t) plus noise.
- Add a **switching mechanism** (e.g., two gaits / turn vs forward) that changes the local linearization.
- Implement neurons as **adaptive AR/ARX filters** (DD-DC-flavored) that stabilize the oscillator and enact switching when certain sensory inputs occur.
    

Then run LOOPER (or LOOPER-like extraction) on the simulated (x_t) and show it recovers:
- 1-D strands (the phase trajectory),
- plus branches/merges (switching),
- and your piecewise linear fits recover the ground-truth regime switches.

This gives you a “proof of concept” that the conceptual link is mechanically plausible, and your qSimeon analysis becomes “do worms behave like this class of systems?”

---

## If you only run one thing

Run the **scaffold-conditioned local linear predictor + phase/switch leverage** on 2–3 conditions (e.g., spontaneous locomotion + stimulated) across multiple worms.

If you tell me which qSimeon split you trust most (Kato-only? WT_Stim?), I’ll outline the exact minimal implementation choices (binning scheme, regularization, metrics, and the 3 plots that make it persuasive).
