---
layout: post
title: December Aliveline - Day 14
date: 2025-12-15
categories: alivelines
---
# Day 14

OK roughly halfway through the aliveline. I want to try regressing out stimulus category, choice, reward, movement, and see if there is a spike around the rule learning. Re-reading the paper and methods to make sure I understand what I'm doing.

>To convert an internal category representation into a motor decision, it would be sufficient for cells in the mPFC to show selectivity for only one category. However, we observed two types of neuron—one that represented rewarded stimuli (Go preferring: 73% of all category-selective cells at T5 and 65% at T8) and the other non-rewarded stimuli (NoGo preferring: 27% at T5 and 35% at T8).

In other words, some neurons are explicitly learning which stimulus does *not* give a reward. In the context of my neuron covariance thinking, this means that I should expect *two* stronger eigenmodes, for representing Go and NoGo?

>To disentangle how stimulus category, choice and reward affected the trial-by-trial responses of category-selective neurons, we used linear regression to determine their individual contributions (Extended Data Fig. 9a). Although choice selectivity did not directly explain CTI (Extended Data Fig. 9b, c), the activity pattern of Go category-selective cells showed significant modulation by multiple factors, stimulus category, choice and reward (Extended Data Fig. 9d). By contrast, the responses of NoGo category-selective cells were only significantly influenced by category identity (Extended Data Fig. 9d).

In their analysis, the neurons which encoded the Go rules were heavily modulated by stimulus category, choice, and reward. And learned faster. But NoGo neurons learned slower & were actually more category-selective. So in some sense the NoGo neurons are the more discriminating & "knowledgeable" ones.

Interestingly the population of NoGo neurons was different in rule 1 vs rule 2 across trials. But the Go neurons had significant overlap across the rules. So yea makes sense that Go neurons would be much more entangled choice/reward/etc.


Various other thoughts I [discussed](https://chatgpt.com/g/g-p-693d87e5a30c81918cc933400e5c309e-neuronal-phase-transitions-during-learning/c/69401937-c788-8331-9a5b-6eb093cec234) with chatgpt:
- Understanding how stimulus category, choice, reward, motor planning, etc can be correlated with category & so confound the neuron selectivity picture
- How the paper's task-switch experiment cleanly separates out (some of) these correlations
- Questioning the paper's seemingly implicit assumption that higher firing rate for a neuron = it's more associated with a particular rule/category/whatever, which doesn't seem to allow for nonlinear dynamics
	- Their regression does allow for negative weights, so a neuron being silenced can still encode signal
	- But it is true that their claims are about a coarse-grained code (trial-averaged activity during stimulus) and how it correlates with task variables, not a claim that this is the only or best description of the computation
- Could neuronal adaptation be another confound in their results
- Seems like there an absurd number of confounds when any kind of higher order abstraction/rule is being learned and it's very hard to isolate its (likely sparse) representation in the brain
	- This seems way harder in "higher" animals like mice etc. I'm thinking it might be better to just start with *C. Elegans* and maybe something like locomotion. Those olfactory aversion papers seems right up this alley


---

Now I want to spend the second half of my time today reading my previous posts and determining if I want to continue with this dataset/approach to the aliveline

Hm from day 1:
>Broadly it's hard to find unifying ideas in things like evolution/learning/the brain because they are so environment/niche driven IMO. Evolution means organisms are adapting to whatever specific environment they are presented with and environments are super diverse and complex. So the solutions evolution ends up at will also end up be like that. They will reflect the diversity and complexity of the real world. So does that mean if we understand the real world in a more unified way, we will subsequently perhaps understand common principles across different evolutionary strategies better too? Ya prolly

I wonder if there are certain unifying principles about the real world we already understand today that could help us understand evolution better?
- 


From day 2:
>Another way to say this is that seemingly complex activations of populations of neurons may actually be a simple geometry (and therefore simple information theoretically / perhaps in terms of Kolmogorov complexity) in the manifold space

What is the minimal program that can generate the 'locomotion manifold' in *C. Elegans*?
- Minimum number of neurons that need to be activated (assuming some domino effect) to achieve a particular neural state space trajectory / manifold?


From day 3:
>It does seem like a more dynamical systems approach to cognition and how the brain works would be way more fruitful than any static views. In other words, you can't separate mind from subject (a la Democracy and Education) – cognition is a joint process between the mind, body, and the environment.

I tend to subscribe to the view that there is no such thing as un-embodied intelligence


From day 8:
>The way a particular brain represents something is in a unique coordinate system, though it is likely related to how other brains choose to represent the same thing via some kind of linear transformation. So if you're given a particular brain's neural population activations.. can you reconstruct what the person is seeing/thinking/whatever? If you have some alphabet of neural population manifolds, I suppose you could compare against those, up to a linear transformation (rotation, translation)? Is there a "hash" you could take that preserves what matters so you can quickly compare against some library of manifolds? Shazam-ing a brain.


From day 9:
>Can we treat developmental / genetic parameters as the small-scale couplings, and macroscopic neural manifolds as fixed points or order parameters of an RG-like flow?


From day 5:
>Another interesting angle is if the Tracy-Widom distribution, which describes phase transitions from weak coupling to strong coupling, could describe the transition of populations of neurons that spike when a pattern is not understood vs when the underlying rule 'clicks'?

This is what I've been looking at recently with the Reinert mouse PFC data

---

Where to go from here? Some options from the above:
- I wonder if there are certain unifying principles about the real world we already understand today that could help us understand evolution better?
- What is the minimal program that can generate the 'locomotion manifold' in *C. Elegans*?
- Can we treat developmental / genetic parameters as the small-scale couplings, and macroscopic neural manifolds as fixed points or order parameters of an RG-like flow?
- Can we find phase transitions in *C. Elegans* neuron populations when a rule is learned?
- Keep going with mice data – regress out the various confounds and see if we can isolate the sparse representation of the category rule
- Do something entirely different
	- I want to do this "get inside the brain of a worm" thing for sure. Perhaps after this aliveline is over?

My sense is I should take some 'do nothing' meditation time and see how I feel

---

Let's look at locomotion manifolds in *C. Elegans*