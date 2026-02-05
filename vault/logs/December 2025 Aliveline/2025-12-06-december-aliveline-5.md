---
date: 2025-12-06
---
# Day 5 (12/6)

Again fairly little time to work on this, for bug fighting reasons. I may combine day 3/4/5/6 into one day since only summed across all four have I had my usual daily working time of 4 hours. Anyways that can be done later. Into the work.

How does a population of neurons start firing? Is it all simultaneous? Presumably not given there's synapses that are crossed in some order. So you have to set some neuronal dominoes going to get a particular population level activation?
	Yes there is an order and the neural state space has some binning/quantization choice to define a time step. People look at explicit spike order for things like rapid sound localization, visual classification, etc., but the spike binning approach is OK for longer timescale tasks.

After the spike quantization is done, you end up with something like a neural state space trajectory. Seems like people do various dimensionality reduction techniques (PCA, more recently nonlinear dimensionality reduction) on that state space to look at the "neural subspace" where interesting stuff is occurring. That's the space in which this neural population geometry work is happening. 

I have a feeling there is something interesting in trying to define Kolmogorov complexity for neural coding. What might a useful KC analog definition look like?
- Minimum number of neurons that need to be activated to achieve a particular neural state space trajectory?

[Convo with ChatGPT](https://chatgpt.com/c/6932ff2c-5a40-8331-8bb2-a7301b9b2c12) on the KC idea for brains

Another interesting angle is if the Tracy-Widom distribution, which describes phase transitions from weak coupling to strong coupling, could describe the transition of populations of neurons that spike when a pattern is not understood vs when the underlying rule 'clicks'?
