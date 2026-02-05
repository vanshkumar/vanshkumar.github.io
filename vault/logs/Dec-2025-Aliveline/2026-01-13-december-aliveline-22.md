---
layout: post
title: December Aliveline - Day 18
date: 2025-12-22
categories: alivelines
lastmod: 2026-01-14
---
# Day 22

Strongest form of hypothesis:
> Genetics encodes behavior (eg locomotion) as a top-down computational constraint on a neuronal network. Locomotion in the worm brain is implemented by loops in phase space. Local neuronal rules are constrained by the top-down behavior so that the loop structure shows up, but are otherwise completely free to develop.


What would it mean to understand the brain in the context of this hypothesis?
- Ideally we can create some genome -> neuronal rules -> structure
- Neuronal rules -> structure would look like some equation, either analytical or numerical, that allows us to construct ?

Can you use this LOOPER thing to do interpretability / understand deep learning? Are DNNs nonlinear dynamical systems?
	I don't think feedforward DNNs are. But RNNs definitely are – or at least are able to simulate any dynamical system. Transformers? Hmm.

Is storing information as a trajectory in a dynamical system _efficient_? How might it be efficient from the perspective of genetic encoding?
	Specifically efficient in the context of a noisy recurrent system? Li et al (and I assume a lot of the Predictive Coding folks also?) say that the noise is actually necessary to learn in their toy RL env

Isn't there a contradiction somewhere in that genes work at the level of local neurons, but also somehow only specify high-level behavior which the overall architecture is free to implement how it chooses?
	It's odd because I tend to think of genes as positively specifying how neurons develop. Perhaps it is instead they specify constraints? Or maybe specifying "this is how to respond to stimulus" is a better way to phrase it. Something in the math of nonlinear dynamical systems & feedback would help sort this out.

LOOPER work indicates that the specific learning rule (backprop vs synaptic plasticity) doesn't "matter" in the sense that both can end up learning a computational scaffold that solves the problem. Tho it does indicate that whatever synaptic plasticity is doing is much more *generalizable* by default.

Another hypothesis:
> Genes constrain the set of dynamical systems that a neuronal network can implement – they define what's *reachable* by making certain dynamical system configurations overwhelmingly likely (eg locomotion manifold). This is implemented through local neuronal rules.

The above feels closer to how an evolutionary mechanism might actually work? Like oops this animal's neuronal network ended up with a dynamical system that can't implement locomotion, so that animal's genes will not survive.

Was locomotion originally a learned behavior? It's almost certainly genetically canalized / more or less hardwired now, but it could have genetically canalized the way that Waddington described at some point? Ie started as an acquired skill during an organism's lifetime.
	Hm the Waddington concept of "ability to acquire skills" as something that is naturally selected for seems like a good way to think about this. Plasticity itself as the OG skill.


"what's far rarer is ML algorithms inspired from the biology"
	Synaptic plasticity as a training algo?


are we approaching the question from the wrong direction? perhaps simple rules in a complex environment naturally give rise to intelligence. what if intelligence/the brain were *simple* and they seem complex because the environment is complex? simple in the sense of having a relatively small set of rules (in some genetic coordinate space.. perhaps in the kolmogorov complexity sense... is there an analog to kolmogorov complexity in DNA?)


---

Read "The neuron as a direct data-driven controller". Sick paper! Thoughts and questions from the paper:
- Damn this is really cool and extremely confirmation bias-y for me ha. This is exactly what I think is going on in the brain! But I didn't think to conceptualize it at the single neuron level, makes a lot of sense tho
	- It's essentially the idea behind "Surfing Uncertainty" and Predictive Coding at the single neuron level?
		- Actually this is probably too strong of a statement. I suspect this could work without needing some higher-level notion of prediction error that Predictive Coding needs?
- Could feedback control be the language in which the "local neuronal rules" I've been thinking about are implemented?
- Classic control theory often assumes you know the system’s equations (or you explicitly learn them), then you compute a control law. They argue that’s too heavy for a single neuron.
- DD-DC is the workaround: **don’t explicitly identify the system** (no explicit A,b,C matrices; no explicit latent-state estimator). Instead, **learn a mapping from observations → control directly from past experience** (past observation/control pairings).
	- Concretely, for (locally) linear dynamics, DD-DC says: _new valid “what I see / what I do” combinations live in the subspace spanned by previous ones_ (via Willems’ fundamental lemma).
- This paper focuses on **linear** control feedback (presumably bc it's analytically tractable) and then hypothesizes that if nonlinear loop dynamics of the brain can be approximated linearly, a switching linear system of DD-DCs could work
	- What does nonlinear feedback control look like? Too intractable?
- There is a link between this and ADM/LOOPER... I wonder if I can tease out something like that from the QSimeon data...

What might the link between neuron as a DD-DC and ADM/LOOPER be?
- LOOPER is pulling out 1D trajectories of the dynamical system that is a population of neural activity
- Neuron as DD-DC is saying that a single neuron is itself a feedback controller that is constantly trying to modify its input & output to reach an optimal state. When the environment (external or internal) changes, the neuron modifies synaptic weights based on that.
	- Hrmm tho for their subspace span to work, each neuron has to have locally linear dynamics. Does that jive with ADM/LOOPER view (eg they were able to reconstruct the phase space loops from a single neuron)? I think it does – the diffusion mapping methodology specifically preserves local topology?
- DD-DC speculates that nonlinear (feedback) loops could be approximated locally as linear and handled as a switching linear system controlled by switching DD-DCs
- LOOPER results in 1D trajectories with probabilistic switching/merging
	- **Interpretation:** a LOOPER “trajectory” could correspond to a _mode/controller regime_ (a locally linear control policy), and merges/splits could correspond to when different regimes become behaviorally indistinguishable or when the system commits to different control-dependent futures.
- [ChatGPT experiment ideas](https://chatgpt.com/g/g-p-6940510567788191a1a4cfdd32b77a9c-c-elegans-locomotion-neuronal-manifolds-learning/c/6967e363-c7a4-8331-80cd-5fb526289efc)


---

Concretely to finish off the aliveline – would I be satisfied with extending LOOPER to QSimeon & writing up the results? Let's read the [experiments I could run](https://chatgpt.com/g/g-p-6940510567788191a1a4cfdd32b77a9c-c-elegans-locomotion-neuronal-manifolds-learning/c/696576b0-bde4-832e-98c5-cd0c5f9175b4), and see if one of these would be satisfactory. I think so, though.
