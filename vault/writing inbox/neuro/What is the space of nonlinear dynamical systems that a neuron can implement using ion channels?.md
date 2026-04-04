---
lastmod: 2026-03-22
---
In the Hodgkin-Huxley model, ion channels mold the firing shape/behavior of a neuron, and these ion channels appear to be genetically modifiable. This could be one of the mechanistic ways that answers [[How does DNA bridge the micro (local neuronal rules) to the macro (evolutionarily relevant behavior)?]]

From the [Neuronal Dynamics textbook](https://neuronaldynamics.epfl.ch/online/Ch2.S3.html):

> For each ion channel type $k$, we introduce activation and inactivation variables: $$ I_k(t) = g_k([Ca^{++}],...)m^{p_k}h^{q_k}(u-E_k) $$
> where $m$ and $h$ describe activation and inactivation of the channel with equations analogous to Eq. ([2.6](https://neuronaldynamics.epfl.ch/online/Ch2.S2.html#Ch2.E6)), $p_k$ and $q_k$ are empirical parameters, $E_k$ is the reversal potential, and $g_k$ is the maximum conductance which may depend on secondary variables such as the concentration of calcium, magnesium, dopamine or other substances. In principle, if the dynamics of each channel type (i.e. all parameters that go into Eqs. ([2.11](https://neuronaldynamics.epfl.ch/online/Ch2.S3.html#Ch2.E11)) and ([2.6](https://neuronaldynamics.epfl.ch/online/Ch2.S2.html#Ch2.E6)) are available, then one needs only to know which channels are present in a given neuron in order to build a biophysical neuron model. Studying the composition of messenger RNA in a drop of liquid extracted from a neuron, gives a strong indication of which ion channel are present in a neuron, and which are not ([514](https://neuronaldynamics.epfl.ch/online/bib.html#bib2 "Correlation maps allow neuronal electrical properties to be predicted from single-cell gene expression profiles in rat neocortex")). The relative importance of ion channels is not fixed, but depends on the age of neuron as well as other factors. Indeed, a neuron can tune its spiking dynamics by regulating its ion channel composition via a modification of the gene expression profile.
> Ion channels are complex transmembrane proteins which exist in many different forms. It is possible to classify an ion channel using (i) its genetic sequence; (ii) the ion type (sodium, potassium, calcium …) that can pass through the open channel; (iii) its voltage dependence; (iv) its sensitivity to second-messengers such as intra-cellular calcium; (v) its presumed functional role; (vi) its response to pharmacological drugs or to neuromodulators such as acetylcholine and dopamine.

Eq 2.6: $$ \dot{x}=-\frac{1}{\tau_x(u)}[x-x_0(u)] $$
So $x$ (when $u$ is not a function of time) evolves like: $$ x(t)=x_0(u)+\left[x(t_0)-x_0(u)\right]e^{-(t-t_0)/\tau_x(u)} $$

Qualitatively the ways an ion channel can shape firing behavior boil down to:
1. Voltage dependence – determine where in voltage the channel engages (activates/inactivates)
2. Timescale of the ion channel – determine how long its effect lasts, if it accumulates, etc
3. Calcium concentration dependence – determine where in calcium concentration the channel engages

This is a lot of parameters/degrees of freedom!

Examples [from the textbook](https://neuronaldynamics.epfl.ch/online/Ch2.S3.html) of various behaviors ion channels can implement:
- Adaptation via a potassium channel
- Refractoriness
- Adaptation via a calcium channel & a calcium-sensitive potassium channel
- Subthreshold adaptation/facilitation
- Calcium-mediated postinhibitory rebound


It may be worth trying to characterize the mathematical space of functions that a neuron can implement using ion channels.

To do this we first need to have definitions of what the input & output are here. Input is $I(t)$ as in standard HH model. Output is $u(t)$ / the generated spike train, which we can think of as a series of discrete spike separated in time.

My initial thought is that an arbitrary set of ion channels can create *any* spike train, because *each* ion channel can work at specific voltages & timescales.

What are the actual constraints here?
- Spikes are generally caused by nonlinear positive feedback in a sodium channel
- Spikes can be halted by
	- Approaching $E_{Na}$ reversal potential slowing the positive feedback loop
	- Sodium channel inactivation
	- Potassium channel activation
	- ...


Thinking of a single neuron as a static function is not accurate. Because it has memory. [[A single neuron is a stateful nonlinear dynamical system]]. It's more that it maps input + state/history -> output.

So a more complete description is
	Input: $I(t)$, initial state
	Output: $u(t)$, spike train


Clearly from chatting with Claude about intuition behind HH model I need to study nonlinear dynamics & chaos to be able to answer this question properly.

[Apparently](https://claude.ai/chat/9fdee5b3-7409-4548-88a3-c1f3a7a91a1e) the stationary/target values of each ion channel $x_0(u)$ are always monotonic sigmoids in the HH model. This is super constraining for the dynamics it can generate. Though there do seem to be empirical exceptions, as with everything in biology, eg U-type inactivation.