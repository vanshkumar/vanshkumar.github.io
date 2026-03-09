---
lastmod: 2026-03-09
---
The microprocessor analogy clarifies what "understanding" means here: if you knew the circuit architecture of a microprocessor before analyzing its activity data, interpretation becomes tractable. What I want is the equivalent for the brain — a theory of hierarchical information flow that tells you what to look for in neural data. Without this analytical framework, we're doing pattern-matching on activity data without knowing what patterns *mean*.


A sub-question worth pursuing: are current methods (calcium imaging, electrophysiology, computational modeling) even *capable* of answering the questions I care about? My current suspicion is largely no — which suggests that either (a) I need to work on improving methodology, or (b) I need to reframe what "understanding" means in a way that's tractable with existing tools.

This connects to [[Neuroscience progress may be primarily measurement limited]] — if progress is measurement-limited, then understanding the brain may require fundamentally new measurement paradigms, not just better analysis of existing data.


A better framing than "we need more/better data": what specific theoretical claims could existing methods (calcium imaging, electrophysiology, computational modeling) actually adjudicate? What would a decisive experiment look like with tools we already have? If no such experiment exists, that tells you something about the theory, not just the tools.

What are the tools we have today?
- Measurements
	- Calcium imaging – spike trains
	- Electrophysiology – local field potentials
	- Crucially, no way to read off synaptic weights or see what's happening _inside_ a neuron (eg dendritic tree)
- Methods
	- Lesioning
	- Granger causality
	- Dimensionality reduction
		- Linear (eg nonnegative matrix factorization)
		- Nonlinear (eg ADM/LOOPER)
	- Computational modeling
		- PaN-type very minimal networks
		- Learning models fit on 

---

References:
- Could A Neuroscientist Understand A Microprocessor?