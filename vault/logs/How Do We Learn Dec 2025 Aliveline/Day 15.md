---
date: 2025-12-18
lastmod: 2026-02-01
---
# Day 15

More questions/thoughts:
- Tracy-Widom style phase transition hypothesis = some set of neurons that were previously weakly/not coupled, become strongly coupled after learning a rule
	- Coupling of neurons is how rules are implemented
- If you have only a few neurons, is it better to implement a key behavior like locomotion in a sparse distributed way or a more concentrated way?
	- If there is error correction built into the DNA itself... then maybe concentrated is OK?
		- Is "error correction" a useful framework for thinking about stuff like this? Not sure, it feels more designed than discovered
	- There is strong selective pressure for worms to be able to move. How might that selection manifest?
		- Any worms that end up without a fully functional locomotion subspace/manifold are pretty much dead on arrival
		- Why would worms not have a functional locomotion subspace/manifold?
			- Missing key neurons
				- I would think that there is where DNA error correction comes in? Like something in it makes it so that key locomotion neurons definitely develop, even if it means that other kinds of neurons don't develop
- Have people found a locomotion manifold across many worms (ie in the qsimeon homogenized dataset)? It's supposedly universal
	- I could try to do this. Apply the asymmetric diffusion map method to the full qsimeon dataset and see if I can reconstruct a locomotion manifold for all the worms
- This context-gating thing makes sense but not fully. To reiterate their results: PA14 trained worms have many more brain-wide differences in the discrimination task vs detection task
	- Trained worms are averse to PA14 when food is present, but still attracted when not present
	- Naive worms show no difference
	- Implication – the learning from training on PA14 causes brain-wide changes which can result in context and task-specific behavioral differences
	  
	- What kind of mechanism could make this work?
		- Discrimination task = OP50 for 30s, PA14 for 30s, OP50 for 30s
		- Detection task = buffer for 30s, PA14 for 30s, buffer for 30s
		- This is some kind of short-term memory, no?
			- Yea I guess it's like short-term memory in a dynamical systems sense – it's like a sensory state. So worm is in a "there is food present" vs "there is no food present" state. And then onset of PA14 changes its brain state in differing ways based on if it's trained or not.
		- And the authors specifically identify which neurons contribute to this
	- Are trained worms _less_ attracted to PA14 relative to buffer vs naive worms?
		- This would argue for some kind of "global downweighting" of PA14 as a result of training, perhaps a multiplicative downweighting, rather than actual context-dependent behavior
	- [Further discussion](https://chatgpt.com/g/g-p-6940510567788191a1a4cfdd32b77a9c-c-elegans-locomotion-neuronal-manifolds-learning/c/69441a63-7294-832c-ad8d-cd51afce86c8) on a number of points in this paper with ChatGPT


	The aliveline is "have and publish an original insight". But does it have to be me who does it? What if instead I am able to connect authors of a couple papers whose ideas are part of a similar story but haven't been previously connected, and that *leads to an original insight being published*? I would define that as success. That's a way more tractable problem to do in a month as well.
	
	Makes me wonder about how important such social-style bottlenecks are in science/research? There is an implicit narrative about science being bottlenecked by individual genius... but if you believe the scenius/technium-style thinking, the bit that's lacking is more coordination/social infra?
	
	Ultimately, my primary advantage in all of this is that I ***do not*** need to optimize for metrics like citation/paper count. I am doing this for the love of the game, for a desire to learn, to push science forward, etc. That **needs** to be my starting point here. And besides, an approach where I learn and work on things that are interesting, both inside and outside of formal science, is wayyy more fun.
