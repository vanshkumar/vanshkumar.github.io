---
date: 2026-01-30
lastmod: 2026-01-30
---
I recently came across your work on [Asymmetric Diffusion Mapping](https://elifesciences.org/articles/46814) and the later extension/upgrade of [LOOPER](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1010784). I am very interested in how the brain computes & really enjoyed both of these papers, especially how generalizable the computational scaffolds appear to be across different animals & RNNs.  
  
I also ran across [this paper](https://www.pnas.org/doi/10.1073/pnas.2311893121) which hypothesizes that individual neurons may be implementing feedback control, which got me thinking about how such a view might lead to LOOPER-like computational scaffolds showing up. This would be something like: LOOPER strands are the invariant sets created by distributed negative-feedback control. Branch/merge reflect policy switching and control-equivalence classes induced by feedback and noise. I think this view is particularly interesting because feedback control (gains, which variables to control, etc) could be the language of how DNA bridges the micro (local neuronal rules) and the macro (conserved behavior across worms) while still allowing for degeneracy in implementation across brains.

I have been playing around with extending the LOOPER methodology to a larger, more diverse C. Elegans calcium imaging [dataset](https://arxiv.org/html/2411.12091v1) & thinking through how I might test parts of the view above. Would love to hear your thoughts on any of this!

Also if there is anything I should know while working with the LOOPER code, that would be super useful too! For example, I'm not quite sure whether to use the code on [github](https://github.com/proektlab/LOOPER) or [OSF](https://osf.io/bge2n/overview)?


---

Follow up:

Hi Connor, quick update and a high level question for you if you don't mind

**Update**
- I was able to roughly reproduce the LOOPER results on Kato immobilized worms (clean loop structure)
- On a freely moving C elegans dataset (Atanas), I see loop-like structure but it’s more fragmented/noisy
- A simple time-split evaluation (fit early, evaluate late) degrades in both datasets, which makes me think behavioral mode switching / slow drift is a big factor and that conditioning on behavioral state is probably necessary


**Question**  
At a high level, I’ve been trying to think about locomotion loops as either:
1. largely intrinsic attractor dynamics (CPG / internal dynamics), versus
2. closed-loop control, where sensory feedback actively shapes/stabilizes the loop

In your view, **is trying to distinguish (1) vs (2) actually a useful/meaningful question for understanding the computation**, or do these collapse to essentially the same “algorithmic-level” description in practice?

If you think it _is_ useful: what would you consider the minimum experimental setup or analysis that could separate them cleanly (dense perturbations, specific signatures, behavioral annotations, etc.)? If you think it’s _not_ useful: what might be a better framing/question to pursue instead?

If you have a favorite paper (or two) that tackles this distinction well, I’d love a pointer.

Thank you so much!
Vansh
  
P.S. If you're interested, [here's my repo](https://github.com/vanshkumar/LOOPER-freely-moving-worms), with pretty good documentation (of course LLM assisted) as to what's going on – you can take a look at [RESULTS](https://github.com/vanshkumar/LOOPER-freely-moving-worms/blob/main/RESULTS.md) & [EXPERIMENTS](https://github.com/vanshkumar/LOOPER-freely-moving-worms/blob/main/EXPERIMENTS.md) if you want to get a bit more detail on my thought process so far
