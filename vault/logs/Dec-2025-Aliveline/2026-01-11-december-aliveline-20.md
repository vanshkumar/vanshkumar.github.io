---
layout: post
title: December Aliveline - Day 18
date: 2025-12-22
categories: alivelines
lastmod: 2026-01-15
---
# Day 20

I had already run ADM on the 12 Kato WT_Stim worms, and the DPCA/transition matrices looked like they still had structure, so discussing with ChatGPT for how to move forward with them. Realistically this large QSimeon dataset can support something along the lines of 1 and 2 suggested by Chat yday:
1. Representation generalization (partial observation + different neuron sets)
	- You get a stable loop/phase coordinate across animals.
	- Projection works with variable neuron subsets.
	- Results don’t hinge on hand-tuned params (sweeps are stable).
2. Dynamics generalization (nonstationarity / inputs / stimulus)
	- Geometry is mostly stable, but **transition rates / occupancy** change with input; **or**
	- You can explicitly model two regimes (stim on/off) or a time-dependent transition operator.

Taking a step back... say that I show (1) or (2). That means something along the lines of "the worm brain implements locomotion as a 2D loop in some latent space"? Even that statement is too strong. It's more like "the population activity of a worm brain relates to locomotion in a latent space". Drawing from the "Can a Neuroscientist Understand a Microprocessor?" article, this relationship may not necessarily give us any important view into how the brain actually processes information. It may be something akin to the clock phase/read-write signal in the microprocessor case.

OK say that we believe there is a latent manifold associated with locomotion in *all* worm brains. What would be some experiments we could run to see if the worm brain uses these kind of latent variables to actually *implement* locomotion? Some hypotheses:
- Motor-specific learning should show up as changes in the manifold
	- The PA14/buffer aversive context learning paper says that the learning is a rotation/contraction of the locomotion manifold. They also showed how fixed points of a linear dynamical system model of the population activity shifted due to the learning.
	- Even this is not enough? Like if the manifold is something that's just very associated/correlated with locomotion (like the microprocessor example), you could still be misled?
- Perturb manifold (silence neuron?) and 

Strongest form of the hypothesis:
>The worm brain *implements* locomotion behaviors as a manifold in phase space, with local neuronal rules constraining development such that this geometrical structure shows up.


I have this sense that something in the mathematics of nonlinear dynamical systems / complexity will help shed light on how neuronal rules can be specified locally and end up resulting in universal manifold-like representations.


Grabbing a snapshot of a worm brain at a point in time (or rather at an extended period during which it's at "steady state" – which ADM paper does) gives you a snapshot of a dynamical system. The core feature of brains-as-dynamical-systems is that they change over time, in response to input.

Random thought – given the brain is massively parallel, what does that say about how it implements a nonlinear dynamical system? Does something special or interesting happen with the math of nonlinear dynamical systems if they are treated in parallel rather than sequentially?
	It does seem like people tend to analyze them in deterministic sequential ways? Eg phase portraits. Hm actually I'm not sure if this line of thinking really makes much sense.. the idea is that the population activity of a bunch of neurons is a point in phase space, and _part of_ a nonlinear dynamical system. So you can recover things like transition matrices etc and figure out the larger structure if you have data of the system at steady state.

OK maybe to flip it on its head. If you _knew_ you had a nonlinear dynamical system (say the locomotion loops in the worm brain), what local neuronal rules would lead to the population activity following the observed transition matrix/loops?
	This might be easier to reason about in the 15-neuron subset case, where we can directly look at the transition matrix and see what's going on with it

The results of the ADM paper are saying that given the knowledge of a worm brain's current population activity, they can use their learned manifold/transition matrix to know what the population activity will look like next? Can they tell what a particular neuron in the brains of the worms in their hold-out set will (likely) do next given the global population activity at a point in time? Or it's more just that "brain is on this loop and so the worm will continue moving forward"?
	Yea they [cannot](https://chatgpt.com/g/g-p-6940510567788191a1a4cfdd32b77a9c-c-elegans-locomotion-neuronal-manifolds-learning/c/696541eb-f0b8-8327-a409-a171d3248538). It's more about transitions between states; they could provide a probabilistic guess for single neurons that are within the training set, but not more than that.

