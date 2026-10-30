---
slug: notes-on-neuroscience-of-human-social-instincts
title: Notes on Neuroscience of human social instincts
type: post
date: 2026-10-25
lastmod: 2026-10-29
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
- Short-term predictors have a "defer-to-predictor" mode where the output of the predictor can itself trigger the Steering subsystem reaction
	- This seems like a misnomer to me, at least in the example provided in the article? When you're just thinking about a person, the Steering subsystem isn't getting visual input of that person, so only the inputs of the learned short-term predictor are active. It's not really deferring to the predictor, it's just that only the short-term predictor is active
- A TD learning style algorithm can convert a short-term predictor into a long-term predictor – the predictor can learn to activate the relevant Steering subsystem physiological state at the first cue of a causal chain. Ex:
	- You always only get in your car to go to a restaurant to eat, which feels good
	- Short-term predictor learns that picking up a fork with food in front of you -> feel good
	- Long-term predictor uses a TD-style algo to learn that getting in your car -> feel good
- **Recap**: predictors learn to associate cortical world model concepts with physiological state over various time delays, with ground truth provided by the Steering subsystem
- How do we ensure that predictors learn useful world model<>physiological state associations?
	- Steering subsystem uses "**involuntary attention**" to force your cortex to think about what you are seeing/hearing/sensing (instead of eg daydreaming), so that likely relevant cortical world model concepts are active for forming associations
- With everything so far you get the following:
	- Steering subsystem – see another person -> activate social attention reflex
	- When you see another person, Steering subsystem also triggers involuntary attention to force you to think about that person
	- Predictor learns to associate thinking about person[^1] -> social attention reflex
	- Defer-to-predictor mode means that the predictor can itself trigger the reflex – purely thinking about that person triggers the social attention reflex
- Another way to see this picture:
	- Predictor is constantly trying to predict what Steering subsystem will do
	- After some initial learning period (how long?), Steering subsystem starts defaulting to defer-to-predictor mode, relying on the learned predictor rather than its own innate heuristics
	- Sometimes, the Steering subsystem injects ground truth when the predictor is wrong for long enough (what are the rules here?), and the predictor updates
	- ..no the above is wrong, hm
- 


[^1]: more precisely, learn to associate "cortical world model concepts that are active when you saw that person" with the social attention reflex