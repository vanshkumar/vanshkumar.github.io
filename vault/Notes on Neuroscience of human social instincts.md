---
slug: notes-on-neuroscience-of-human-social-instincts
title: Notes on Neuroscience of human social instincts
type: post
date: 2026-10-25
lastmod: 2026-11-04
description: studying a possible framework for the brain
---
![[neuro_of_social_instincts_a_sketch.pdf]]


Notes/summary:
- Steering subsystem (~amygdala, hypothalamus, brainstem)
	- Innate/genetically specified, so active at birth
	- Houses heuristic mappings from primitive sensory inputs to physiological states
	- Contains "primary rewards," steers the learning subsystem
	- Ex: *reflexive* physiological arousal when seeing a spider-like object
- Learning subsystem (~cortex, striatum)
	- Within-lifetime learning, so mostly useless at birth
	- Houses world model
	- Ex: physiological arousal when *thinking* about a spider
- **Symbol grounding problem**: how does the brain wire up inputs that don't exist until later in life (eg cortical concept of a spider) with outputs like physiological arousal?
	- Implementation of human social instincts, among many other things, must solve this problem
	- Ex: how does the brain wire up thinking about a person -> excitement?
- Steering subsystem has heuristics for conspecifics (other humans), termed the "**social attention reflex**." When you hear a human vs a bird, you pay special attention
- Learning subsystem contains "**short-term predictors**," trained in a supervised way to associate cortical world model concepts with Steering subsystem outputs
	- Context/input = currently active cortical world model concepts
	- Output = estimate of the target Steering subsystem signal
	- Ground truth = output of Steering subsystem (eg physiological arousal)
- Short-term predictors learn to associate cortical world model concepts with active physiological states – every time I go into this particular room I see a spider, so just going into the room triggers the same response before even seeing the spider
- Steering subsystem has a "defer-to-predictor" mode where the output of the predictor itself determines the Steering subsystem output
- A TD learning style algorithm can convert a short-term predictor into a long-term predictor – the predictor can learn to activate the relevant Steering subsystem physiological state at the first cue of a causal chain. Ex:
	- You always only get in your car to go to a restaurant to eat, which feels good
	- Short-term predictor learns that picking up a fork with food in front of you -> feel good
	- Long-term predictor uses a TD-style algo to learn that getting in your car -> feel good[^2]
- **Recap**: predictors learn to associate cortical world model concepts with physiological state over various time delays, with ground truth provided by the Steering subsystem
- How do we ensure that predictors learn useful world model<>physiological state associations?
	- Problem: innate arousal reflex is triggered because you saw a spider, but you're daydreaming about what you had for lunch. The predictor will learn to associate cortical world model concepts about what you ate with arousal
		- Solution – Steering subsystem uses "**involuntary attention**" to force your cortex to think about what you are seeing/hearing/sensing when its innate reflex is triggered, so that likely relevant cortical world model concepts are active for forming associations
	- Problem: you're reading a book where you're feeling empathetic rage for the protagonist, but your Steering subsystem is not signaling arousal. The predictor will learn to associate cortical world model concepts about the book, rage, etc, with lack-of-arousal
		- Solution – Steering subsystem **modulates learning rate** so that the predictor only updates when the Steering subsystem is *actually* feeling arousal
- With everything so far you get the following:
	- Steering subsystem – see another person -> activate social attention reflex
	- When you see another person, Steering subsystem also triggers involuntary attention to force you to think about that person
	- Predictor learns to associate thinking about person[^1] -> social attention reflex
	- Defer-to-predictor mode means that the predictor can itself trigger the reflex – purely thinking about that person triggers the social attention reflex
		- This solves the symbol grounding problem
- A little more detail on the predictor:
	- Predictor is constantly trying to predict what Steering subsystem will do
	- Default setting is defer-to-predictor mode[^3]
	- Early on, the predictor is wrong often, but the Steering subsystem issues "overrides" / injects ground truth based on its inputs, which both does the right thing & sends the predictor supervisory signals so it can improve
	- Later, the predictor is better at predicting what the Steering subsystem is going to do, and overrides become smaller in magnitude + cancel out in expectation
	- Over time, using a TD learning style algo, the predictor learns to predict chains of cues/context that would result in Steering subsystem overrides (eg going to this room means I see a spider which always scares me, so I get scared thinking about going to the room)
- 


[^1]: more precisely, learn to associate "cortical world model concepts that are active when you saw that person" with the social attention reflex

[^2]: notably Byrnes doesn't think this requires the standard many trial, step-by-step backup in TD learning; instead, latent variables in context that are active 

[^3]: it's really a weighted average rather than an all-or-nothing switch