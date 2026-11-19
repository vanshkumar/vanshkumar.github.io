---
slug: notes-on-neuroscience-of-human-social-instincts
title: Notes on Neuroscience of human social instincts
type: post
date: 2026-10-25
lastmod: 2026-11-19
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
	- Long-term predictor uses a TD-style algo to learn that getting in your car -> feel good[^1]
- **Recap**: predictors learn to associate cortical world model concepts with physiological state over various time delays, with ground truth provided by the Steering subsystem
- How do we ensure that predictors learn useful world model<>physiological state associations?
	- Problem: innate arousal reflex is triggered because you saw a spider, but you're daydreaming about what you had for lunch. The predictor will learn to associate cortical world model concepts about what you ate with arousal
		- Solution – Steering subsystem uses "**involuntary attention**" to force your cortex to think about what you are seeing/hearing/sensing when its innate reflex is triggered, so that likely relevant cortical world model concepts are active for forming associations
	- Problem: you're reading a book where you're feeling empathetic simulated rage for the protagonist, but your Steering subsystem is not signaling arousal. The predictor will learn to associate cortical world model concepts about the book, rage, etc, with lack-of-arousal
		- Solution – Steering subsystem **modulates learning rate** so that predictor only updates when you're actually paying attention to your own interoceptive rage
- A specific kind of predictor is an **interoceptive concept finder**, which learns to associate active cortical world model concepts related to your own interoceptive input with Steering subsystem outputs like physiological arousal
	- I don't quite get this.. aren't interoceptive inputs (hunger, thirst, heat, etc) *outputs* of the Steering subsystem already?
- With everything so far you get **transient empathetic simulation**:
	- When you see another person, Steering subsystem triggers the social attention reflex:
		- Involuntary attention to force you to think about that person
		- Involuntary **lack** of attention towards your own interoceptive inputs
	- The only interoceptive models active now are those that are somehow associated with the other person, so we can query the "interoceptive concept finder" predictor and see what physiological state it associates with the cortical world model concepts currently active
	- The readout of this is essentially how we feel about the person[^2]
- In simpler words – you learn to associate certain things with feeling arousal in yourself, and then query that same predictor to see how you feel about others
	- Is this social projection theory?
- We can then use this transient empathetic simulation thing to build social instinct circuits, eg:
	- Get a signal if X person is feeling pleasure/displeasure, multiply that by if we think they're a friend/enemy, and you get "compassion/spite"

More details on the predictor itself:
- Predictor is constantly trying to predict what Steering subsystem will do
- Default setting is defer-to-predictor mode[^3]
- Early on, the predictor is wrong often, but the Steering subsystem issues "overrides" / injects ground truth based on its inputs, which both does the right thing & sends the predictor supervisory signals so it can improve
- Later, the predictor is better at predicting what the Steering subsystem is going to do, and overrides become smaller in magnitude + cancel out in expectation
- Over time, using a TD learning style algo, the predictor learns to predict chains of cues/context that would result in Steering subsystem overrides (eg going to this room means I see a spider which always scares me, so I get scared thinking about going to the room)


Other thoughts/notes/questions:
- A testable prediction (I think?) from this framework is that the interoceptive concept finder must first be trained on yourself before it can be queried successfully to simulate others' feelings. You have to be able to associate some cortical world model concept X with rage to be able to then associate person Y -> X -> rage. So the test would be – can someone who can't recognize rage in themselves tell if someone else is feeling rage?
	- Extremely broadly speaking it does seem like kids first learn about themselves and then about others
	- How would one even test this?
- A key part of this framework is that the ground truth for all these social instincts is ultimately some innate response
- What social instincts are active in young children vs older children? How does this change over time? It clearly does
	- If the basis for all this stuff is predictors, which live in the cerebellum, how does the cerebellum evolve & grow as kids mature?
- Does this framework imply that you can't both pay attention to your own interoceptive inputs & guess how someone else is feeling simultaneously? Perhaps only if the "social attention reflex" is active. So presumably it's something like – if you catch sight of someone out of the corner of your eye and orient to them, in that instant you either know how they are feeling or how you are feeling?


[^1]: notably Byrnes doesn't think this requires the standard many trial, step-by-step backup in TD learning; instead, this is somehow done with latent variables that are active in many contexts ("I'm hungry" is active both when you're getting in the car and when you're eating lunch). Haven't fully thought thru this yet.

[^2]: more precisely, "cortical world model concepts that are somehow active/associated with that person"

[^3]: it's really a weighted average rather than an all-or-nothing switch