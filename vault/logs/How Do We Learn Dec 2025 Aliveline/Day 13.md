---
date: 2025-12-16
---
# Day 13

Reading [Aversive Learning Induces Context-Gated Global Reorganization of Neural Dynamics in Caenorhabditis elegans](https://www.biorxiv.org/content/10.1101/2025.10.31.685731v1)

Very cool. Notes/summary:
- PA14 is a well known bacterium that C Elegans naturally prefers but is virulent, and that it learns to avoid after 4-6h of exposure
- Setup
	- Naive worms vs trained worms (previously trained for 4-6h that PA14 is harmful)
	- Main experiments
		- PA14 in the presence of OP5O (food context) – discrimination task
		- PA14 in the presence of buffer (no-food context) – detection task
	- Controls
		- PA14-gac (less virulent version) in the presence of OP50
			- With PA14-gac trained worms
		- OP50 in the presence of buffer
		- Buffer only
	- Imaged ~78% of the brain during these tasks
- PA14 being present causes *brain-wide* activity in the trained worms, it's not just localized to sensory neurons
	- Brain-wide activity is low dimensional (top 3 SVD components explain 90% of variance)
- High correlation between top 3 SVD components of brain-wide activity & top 3 PCA components of turning behavior of worms
	- Indicates the brain-wide activity may be encoding the behavioral preferences as worm movements (ie move away from PA14, towards OP50)
	- Tho top 3 components of turning behavior only explain 44% of turning variance
> - Together, our results show that aversive training with PA14 modulates the activity of the nervous system in a manner that is both context-gated and task-specific. As a result, trained worms reduce their preference for PA14 in the discrimination task between PA14 and OP50, but preserve their ability in odorant detection task and continue to exhibit the preference for food over a non-food stimulus (Buffer), even if the food, PA14, is harmful.
	- Much less changes in neurons in the detection task vs the discrimination task
	- Context is encoded in the brain! This allows the worm to learn things like "prefer food (OP50) to PA14" but continue to "prefer PA14 to no food"
	- Brain is learning new stuff without altering existing functions
	- "For C. elegans to survive in the wild, it is adaptive for the learning to be context-specific, with changes only relevant to the task at hand and not for all interactions with the environment"
- Learning is encoded as brain-wide network changes, not just local changes, and happens in the same low-dimensional realm
	- Changes observed across sensory, inter, and motor neurons
- Rotations and contractions in the low-D realm as a result of learning
	- Sensory neurons mostly rotated, interneurons mostly contracted
	- Notably these changes were specific to discrimination task with pathogenic PA14
- Fit linear dynamical system & found that learning changed fixed points of various neural populations' activity,  depending on stimulus + context
	- So learning => brain predisposed to specific states based on stimulus + context
	- Another way to say this is that learning *collapses* the set of possible neural state trajectories (at least for a given stimulus + context); network was more plastic & flexible before
- Discussion
	- Encoding context along with stimulus (1) preserves original behaviors and (2) increases information encoding capacity
	- Authors have shown that context-gating is a systems strategy for encoding learned info, rather than something that affects specific synapses during learning etc
	- C. Elegans has very few neurons and very little redundancy (1-4 neurons per cell type); propose that context-gating along with reuse of neural representations can prevent catastrophic forgetting in tiny nervous systems


There is a very interesting through-line across these 3 papers:
- [A quantitative model of conserved macroscopic dynamics predicts future motor commands](https://elifesciences.org/articles/46814) - 2019
	- Low-dimensional manifold represents locomotion across worms
- [Locomotion modulates olfactory learning through proprioception in _C. elegans_](https://www.nature.com/articles/s41467-023-40286-x) - 2023
	- Locomotion itself affects learning (higher speed = higher learning) via proprioception
- [Aversive Learning Induces Context-Gated Global Reorganization of Neural Dynamics in Caenorhabditis elegans](https://www.biorxiv.org/content/10.1101/2025.10.31.685731v1) - 2025
	- Learning is context-gated & at the system/global level

[Discussion with ChatGPT](https://chatgpt.com/g/g-p-6940510567788191a1a4cfdd32b77a9c-c-elegans-locomotion-neuronal-manifolds-learning/c/694058f3-02b8-832e-96d3-ecf9fc40e260) on these 3 papers, the story they tell, testable claims bridging them, and countervailing papers/evidence. Seems there are some caveats to this view:
- Immobilization can change the correlation structure, so the locomotion manifold may not be universal / depends on setting
- Motor-program phase can gate sensory processing (a confound _and_ an alternative mechanism to ‘learning changes the manifold’). what does this mean? per chat:
	- the same sensory input can mean different things depending on what the motor system is currently doing (forward run vs turn vs reversal), because the motor circuit feeds back and changes how sensory signals propagate
	- if sensory→neural→behavior mapping depends on motor phase, then:
		- If training changes how often the animal is in _forward vs turning_ (or changes speed/gait), the dataset becomes a different mixture of motor phases.
		- Averaging across that mixture can easily look like a rotation / contraction / fixed-point shift in low-D space even if _within each motor phase_ nothing fundamental changed
	- an “apparent learning-induced geometry change” could be explained by:
		- No intrinsic re-wiring of the sensory representation, plus
		- Learning alters state occupancy (more/less turning, different gait), and
		- Because motor state gates sensory processing, the evoked trajectories look different
- In a freely moving worm / natural context, _nearly everything is doing something_ and it’s not obviously collapsible to one locomotor manifold

Hm I don't think I subscribed to the view that there is one supreme location manifold that the whole brain is organized around anyways? I would suppose it is context-dependent, emerges differently based on how an individual worm develops, etc. My hypothesis would be something more like:
- There exists a locomotion-related population subspace
- The exact manifold that shows up in that space is specific to the worm, context, task, etc and changes over time due to learning etc

More to think through here...
