---
layout: post
title: December Aliveline - Kickoff
date: 2025-12-02
categories: alivelines
lastmod: 2026-01-15
---
Lately I've been feeling lost. Unfortunately that's a feature not a bug of how I am trying to live my life now. A better way to to put it is that I've been feeling low on *momentum*. But today I feel more energy and more momentum. It's a great day to start something. Let's do it.

I enjoy reading about these "month to master" style projects where someone takes on a seemingly insane challenge (eg become a chess grandmaster in a month). They often don't succeed, but they fail in an interesting way as constraints breed creativity. I like the term "alivline" in lieu of deadline as a reminder for how the point of constraints is to get you excited about a crazy sounding goal and ultimately make you feel more alive. Time for me to try one of these.

For December I have chosen to try to **have and publish an original insight**. Today is December 2, and I plan to give myself 31 days for this, which brings us to **January 2**.

What I mean by "have and publish an original insight":
- I have been reading here and there about intelligence – how we learn, how the brain works, how ML works, etc
- I want to publish something that is original relative to the current research AND more importantly something that I would consider novel/interesting today

I'll keep track of how things are going on this blog. Let's go!

---
# Day 1 (12/2)

This feels like a daunting task! How might I begin?

I am reminded of the "problem solver" vs "problem creator" framework that Michael Nielsen describes in "Principles of Effective Research". It's unlikely that I can develop a level of technical skill in a month to solve some really hard technical problem in physics or something like that. I suspect the "problem creator" approach is a better approach here.

How can I adapt it so that I can actually accomplish something within a month? What kinds of approaches might work? Brainstorming:
- Probably need a sense of where the frontiers of knowledge even are in the fields I'm interested in
	- LLMs can bootstrap this pretty easily and then I can pick subareas to go deeper into
- Deliberately reading old obscure papers and seeing if they can be applied or connect to existing frontiers of knowledge
- What are some examples of articles that are in this kind of mode?
	- First Law of Complexodynamics
		- Applied resource constraints to ideas like entropy/complexity to get to where they wanted to go. Possibly can pull out the idea of "what if we apply resource constraints?" and apply that elsewhere
	- Universal Quantum Computer (Deutsch)
		- Asked the question "what if quantum physics was seen as a computer?"
	- Some of the early Complexity papers in the series are like this – light on falsifiability, heavy on speculation & questioning (which is fine!). Eg the maximum power principle thing
- Could look like a reframing of an existing interesting question, perhaps by connecting two fields
	- Information theory + the brain seems like a cool obvious one
	- Presumably universality/critical points and phase transitions math is pretty connected to the complexodynamics stuff?
	- Error correction + DNA (quantum?)
	- This almost certainly has to be two fields that people are *not* already thinking about connecting together, ie something that's not so obvious as info theory + brain
- Early chaos theory was born by deeply studying stuff like the weather, the logistic map, etc. Seemingly simple equations/models that resulted in crazy complexity. I guess that's another approach? Deeply study something that is accepted and seen as 'simple' today? What might that be?
- On the other hand, where are the scientific messes? Mess = opportunity

Broadly it's hard to find unifying ideas in things like evolution/learning/the brain because they are so environment/niche driven IMO. Evolution means organisms are adapting to whatever specific environment they are presented with and environments are super diverse and complex. So the solutions evolution ends up at will also end up be like that. They will reflect the diversity and complexity of the real world. So does that mean if we understand the real world in a more unified way, we will subsequently perhaps understand common principles across different evolutionary strategies better too? Ya prolly

Random questions:
- What if you see evolution as resource-bounded computation?
- Does evolution have a view on if physics is teleological?
- What is the appropriate measure of 'complexity' or 'representational capacity' for a brain, given that neuronal pathways can change over time etc?

Spent like 20-30m looking into how the whole connectome of *C. Elegans* has been mapped. It has 302 neurons and we know the connections between them all. There is a long-standing [OpenWorm](https://openworm.org/) project that aims to fully simulate a worm. Further mapping of its connectome has showed that neuromodularity allows the worm to have dynamic behavior and represent peristent internal states by changing the functional connection between neurons despite having a static connectome. Wild! [Some ppl did](https://arxiv.org/abs/2402.14102) some factorization + trained a generative model to understand the adaptability better, which indicates that functional circuits are task-, state-, and individual-dependent, rather than a single fixed wiring diagram

Hm I should try the stupidest possible thing, which is if ChatGPT can just do this for me. Let's see what it says. It suggests:
- For something based on my notes above
	- The representational capacity of a brain is better thought of as the capacity of the **ensemble of effective circuits it can reconfigure into**, under realistic resource constraints (time, energy, neuromodulatory bandwidth), not just as the capacity of any one static circuit.
- For its "own" insight
	- **The real object of intelligence isn’t a policy (state → action), it’s an _attentional σ-algebra_: the particular way an agent _coarsens the world into distinctions it bothers to notice_. Actions are almost a side-effect of that.**
		- We usually describe an agent by its **policy**:  “In state sss, it takes action aaa.”
		- But in anything complicated (brains, institutions, ML systems), what actually makes it smart or dumb is **which differences in the world it _treats as the same_** versus **which differences it insists on separating**.
		- That pattern of “we lump these together / we distinguish these” _is_ the intelligence. The action mapping is downstream.

