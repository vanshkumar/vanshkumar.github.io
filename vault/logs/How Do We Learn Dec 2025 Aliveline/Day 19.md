---
date: 2026-01-10
lastmod: 2026-02-10
---
# Day 19 (1/10)

Hm one of the most surprising results from the Brennan paper is actually that they were able to reconstruct the locomotion manifold from such a small subset of neurons (15) and I think even from a single neuron? Building a manifold from ~100 neurons is cool but it's even odder that you can get it from just one... weird. I mean the single neuron has to be part of the process (locomotion) you're trying to model. What's the intuition there? Every neuron's delay embedded trace has the manifold in there. But every neuron is not _needed_ for the brain to implement the locomotion manifold? That might be too strong of a statement.

---

Thinking more about what I'm trying to do here with chatgpt...

### 1) Representation generalization (partial observation + different neuron sets)

**Goal:** _Recover the same underlying locomotion scaffold even when neuron IDs differ, many neurons are missing, or the neuron count is huge._

QSimeon is actually a great stress test here.

Success criteria:
- You get a stable loop/phase coordinate across animals.
- Projection works with variable neuron subsets.
- Results don’t hinge on hand-tuned params (sweeps are stable).

This is “ADM is robust as a **coordinate system**.”

### 2) Dynamics generalization (nonstationarity / inputs / stimulus)

**Goal:** _Extend ADM from a single stationary Markov-ish flow to input-conditioned or time-varying dynamics._

WT_Stim is _perfect_ here, because it’s explicitly a forced system.

Success criteria:
- Geometry is mostly stable, but **transition rates / occupancy** change with input; **or**
- You can explicitly model two regimes (stim on/off) or a time-dependent transition operator.

This is “ADM + **control/input**.”

### 3) Mechanistic bridge (toward “local neuronal rules”)

**Goal:** _Use ADM to define the macroscopic variables that local rules must implement, then test candidate mechanisms against those macroscopic constraints._

Success criteria:
- You can map latent coordinates back to circuit features (which neurons encode phase, which encode gating, etc.).
- A plausible mechanistic model (connectome-ish + neuromodulation/proprioception) reproduces:
    - the low-D scaffold,
    - the transition structure,
    - and how plasticity changes _some parts_ (e.g., transition rates) without destroying canalization (stable loop).

This is “ADM as a **phenomenological constraint** on mechanisms.”

---

It is worth stepping back and thinking about what it ***actually means*** to understand a complex system like the brain. Reading a couple papers on this:
- https://www.cell.com/cancer-cell/fulltext/S1535-6108%2802%2900133-2
- https://journals.plos.org/ploscompbiol/article/file?id=10.1371/journal.pcbi.1005268&type=printable

Going to go a bit deeper on the above during my weekly review time tomorrow and really marinate on what this means for what a good result for extending ADM to this larger dataset could actually be. Might just be suggesting more experiments to run, we'll see.
