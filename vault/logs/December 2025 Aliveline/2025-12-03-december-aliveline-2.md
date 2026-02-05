---
date: 2025-12-03
---
# Day 2 (12/3)

Initially I was planning to spend another day on exploration and brainstorming of where I might spend my time. But given the time pressure with this aliveline, I now suspect it might be more fruitful to pick something and see where I can get with it in a day or two. The point of an aliveline is to try to fail in interesting ways, and that can only be accomplished with action not rumination. So the candidate "insight", which I worked with ChatGPT a bit to pull out from my brainstorming yesterday, is:

>The representational capacity of a brain is better thought of as the capacity of the **ensemble of effective circuits it can reconfigure into**, under realistic resource constraints (time, energy, neuromodulatory bandwidth), not just as the capacity of any one static circuit.

I suspect this is already suggested by the literature – it doesn't feel like some fresh new insight (which is fine!). I do wonder if this idea has been analogized across ML and neuroscience though? Specifically, I recall:
- A Gwern article describing how these big models learn an ensemble of compressed functions to apply to different tasks and how to choose among them during pre-training
- An Ilya S soundbite (when I was watching a video on why double descent might happen) where he describes something similar about models operating in the space of functions

So perhaps there is a useful analogy here, either from ML to biology, or vice-verse. I don't want to just write a cute blog post making such an analogy though; I want it to be an actually **useful** analogy. 

What are the properties of a truly useful analogy?
- Makes clear falsifiable claims
- Explicitly describes new questions that could be answered with further research
- Sheds light on why a previously not-understood process might work the way it does

OK, so without looking up those Gwern or Ilya references, what might I conjecture on the ML side?

>Double descent happens because the model is expanding its representational capacity along the neuromodulatory dimension, rather than reconfiguring into the single static circuit that best fits the training data.

Hm this feels similar to the Tishby IB bottleneck compression story? First it learns the training data then it learns how to generalize. Double descent does make it sound like there are two distinct phases, which I think is not confirmed as a general property of DNNs?


Actual hypotheses from the above:
- Brains
	- Having more neuromodulator bandwidth = more representational capacity, so animals with ~the same circuit size but different neuromodulator configurations/abilities will have different neural abilities
		- Species with similar neuron counts but more modulatory systems / receptor diversity should show disproportionately richer behavioral repertoires
- ML
	- Double descent is a consequence of an over-parameterized model learning to represent an ensemble of functions rather than the one function which fully fits the training data


This feels like enough of a hypothesis to start looking into some literature, using ChatGPT to help find it.


OK just spent like an hour or so skimming a ton of literature. Definitely seems like there is some thinking on how neural circuits embed certain behaviors in their latent space and how to quantify that dimensionality. [This](https://pmc.ncbi.nlm.nih.gov/articles/PMC8688220/) was the most interesting article on that front.

Notes from lit review:
- There is obviously a good amount of redundancy in neural circuits. Could neural error-correction naturally emerge from local neuron<>neuron interactions?
- Seems like older neuro articles use more linear techniques like PCA for lowering the dimensionality of correlated neural activations. Autoencoders and more modern non-linear decomposition techniques could help us see deeper?
- Enjoyed [this article](https://www.researchgate.net/publication/350484075_Large-scale_neural_recordings_call_for_new_insights_to_link_brain_and_behavior) which makes it clear that when we could only record single neurons at a time, theories were very focused on a single neuron modulated view of activity. Now that we can record many neurons simultaneously, the theory is more around population-level activations causing behavior. What's the natural extension here? What kind of measurement would enable this?
	- It's something like recording the whole brain simultaneously. And then eventually recording the whole body+brain combo (and environment). I mean it's only natural that you see it all as one system eventually?
- [This one is cool](https://elifesciences.org/articles/96303) in that it shows that both excitatory and inhibitory neurons are needed to avoid "runaway" spike patterns
- [This one](https://pmc.ncbi.nlm.nih.gov/articles/PMC5503128/) is amazing ([great summary](https://www.sciencedirect.com/science/article/pii/S0960982217302749)) showing that cytokines in *C. Elegans*, which are part of the immune system, function as neuromodulators & directly affect neural circuits. So the space of neuromodulators that exist may be massive.
- Neural population geometry papers ([1](https://www.sciencedirect.com/science/article/pii/S0959438821001227?utm_source=chatgpt.com), [2](https://journals.aps.org/prx/abstract/10.1103/PhysRevX.8.031003?utm_source=chatgpt.com)) – didn't skim, just listened to notebooklm podcast. Seems to say that populations of neurons encode tasks like motor control and even higher cognition as geometric shapes in higher dimensions (manifolds). Also interestingly as things become more predictable (eg while watching a repeating movie or smth), the manifold geometry becomes simpler.
	- Minimizing prediction error in the brain = trying to simplify its geometrical representation in the latent space. If it has a simpler geometry it's easier to encode?
	- Another way to say this is that seemingly complex activations of populations of neurons may actually be a simple geometry (and therefore simple information theoretically / perhaps in terms of Kolmogorov complexity) in the manifold space
