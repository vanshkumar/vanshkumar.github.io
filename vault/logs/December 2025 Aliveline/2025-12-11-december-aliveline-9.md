---
date: 2025-12-11
---
# Day 9

The stakes for this experiment have been starting to feel unnecessarily high lately. Part of that is self-pressure to have an insight that's both original and big/important, which is not actually part of my success criteria here. So let's drop it. The main ideas I've played with over the last 10 days:
1. Kolmogorov complexity as measure of representational capacity for brains (minimal program to generate the low-D manifold that encodes a behavior)?
2. Can we treat developmental / genetic parameters as the small-scale couplings, and macroscopic neural manifolds as fixed points or order parameters of an RG-like flow?
3. Can we show a phase transition in covariance between neurons before vs after an organism understands a rule? Tracy-Widom-esque universality class

I think (3) is the most tractable wrt what datasets are currently available today. There appears to be some mouse data and some worm data. Let's try it.

---

Reading this relevant [work](https://elifesciences.org/articles/46814) more deeply, it's pretty incredible. Some highlights:

>These inter-individual differences in neuronal activation is the primary reason why principal component analysis performed on neuronal activity in each individual successfully reveals cycles in neuronal dynamics (Kato et al., 2015) but attempts at projecting data from all individuals onto a common set of principal components fails to reveal any meaningful structure (Figure 1—video 1).

>Note that the simulations reproduce not just the time scale of individual behaviors (forward and backward locomotion) but also sequences of behaviors that we refer to as backing bouts. This is remarkable because the model of the dynamics was constructed by estimating probability of transition between two states on the time scale of one time step dictated by data acquisition and GCAMP kinetics (~ 1/3 of a second). Yet, the simulation reproduces the dynamics on the time scale longer than 100 s

>Knowing the initial conditions is sufficient to predict the expected time of transitions between different modes of locomotion 30 s before they are experimentally observed (Figure 3). Remarkably, these predictions are valid across individuals observed years apart. Therefore, neuronal dynamics model can be applied universally across individuals despite significant inter-individual differences in neuronal activation and undersampling of neuronal activity. Although it is likely that the simulation-based predictions could be improved with addition of more neurons, the fact that the animals in the validation dataset shared as few as eight neurons with the original data suggests that using our methodology one can uncover macroscopic dynamics even when only a small subset of the nervous system can be recorded and unequivocally identified.

>Thus, at least in the simple nervous system of C. elegans a predictive model can be constructed on the basis of a single experimentally observed neuron as long as activation of this neuron is tightly coupled to the network that mediates the observed behaviors

>The structure of the manifold constructed on the basis of 15 neurons across individuals is nearly identical to the manifold constructed on the basis of 107 neurons in a single animal (Figure 4A). Position in phase space (theta; a) preserves behavioral information across animals. As a result, the assigned behavioral state can be correctly decoded 83% of the time solely on the basis of position along the manifold in Figure 4B.

>We hypothesize that the nontrivial degeneracy between microscopic biophysical processes and circuit-level dynamics arises because evolutionary selection operates at the macroscopic level of organismal behavior (La ¨ssig and Valleriani, 2008) embodied by the global dynamics of the brain. Thus, there is no explicit selective pressure for each individual to produce identical neuronal activation during behavior.

Note that they used data based on immobilized worms, not freely moving worms, which might affect the neuronal dynamics.

Their Asymmetric Diffusion Map Method – a method for modeling nonlinear dynamical systems like the neuronal dynamics – is interesting and possibly applicable to other worm datasets? From [convo w chatgpt](https://chatgpt.com/c/693ad5ab-7d50-832e-9152-a0dd5a1a4854) about their nonlinear dynamics method, seems like there are two main approaches to nonlinear neuronal dynamics ppl use:
- Geometry first models, which are looking at spatial relationships in activity space. Good for finding main modes, clusters, curved low-D embeddings
- Dynamics first models, which explicitly bake in time and try to learn a transition operator. Good for finding attractors, limit cycles, transition rates, phase

The dynamics approach is more appropriate for the kinds of questions I'm interested in. I also tend to believe that cognition *is* a nonlinear dynamical system.


Part of me wants to deeply internalize (eg using Anki for support) the brain of C. Elegans. It's just 302 neurons and some similarly small number of muscles etc. I wonder what would happen if I "got inside" the brain of this worm to an insane degree, by internalizing datasets of it doing different behaviors etc.


Note to self – things I need to study:
- Probability/stats (Math Academy)
- Linear algebra (Math Academy)
- Nonlinear dynamics (Strogatz course+textbook)
- Neuroscience (https://neuronaldynamics.epfl.ch/online/index.html)
