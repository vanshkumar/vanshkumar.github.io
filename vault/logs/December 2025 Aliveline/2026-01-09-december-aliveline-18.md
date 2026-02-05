---
date: 2026-01-09
lastmod: 2026-01-10
---
# Day 18 (12/22)

Energy was not there today, so I skipped. Did a bunch of end of year admin stuff instead. Meh I think I am going to take Christmas/New Years "off". That's where the energy is naturally going anyways.

12/21 – 1/1 will be completely off. I will do an annual review over 2-3 days in that time period, but that's it in terms of anything work-shaped.


---

# Day 18 (1/9)

OK it's 2026 and we are back! It was nice to take a break, read tons of random things, do a lil annual review. I feel more centered. It extended a bit longer than originally planned because we had a trial-and-error week or two with sleep training the baby, but things are clearer now. Let's hop to it.

Today I made a lot of edits to the Matlab code (obviously AI doing ~all of it). Decided to get some minimal repros done before trying to extend Asymmetric Diffusion Map (ADM) to all the worms in the QSimeon dataset. Specifically:
1. Repro the plots in the original Brennan paper using original Kato 2015 data, which is available online
2. Validate that the Kato 2015 worms in the QSimeon dataset have manifolds which match the manifolds that are repro'd in (1)

# (1)
Able to successfully do (1) for the 5 worms used in Brennan, tho the pipeline is suuuper slow for these 100 neuron worms. Putting the results here for fun
## Worm 1
![[Pasted image 20260109143545.png]]
![[Pasted image 20260109143602.png]]
![[Pasted image 20260109143629.png]]
![[Pasted image 20260109143635.png]]

## Worm 2
![[Pasted image 20260109143703.png]]
![[Pasted image 20260109143708.png]]
![[Pasted image 20260109143713.png]]
![[Pasted image 20260109143717.png]]

## Worm 3
![[Pasted image 20260109143726.png]]
![[Pasted image 20260109143732.png]]
![[Pasted image 20260109143751.png]]
![[Pasted image 20260109143756.png]]
## Worm 4
![[Pasted image 20260109143804.png]]
![[Pasted image 20260109143810.png]]
![[Pasted image 20260109143816.png]]
![[Pasted image 20260109143821.png]]

## Worm 5
![[Pasted image 20260109143832.png]]
![[Pasted image 20260109143838.png]]
![[Pasted image 20260109143843.png]]
![[Pasted image 20260109143848.png]]


# (2)

Realized that (2) is not doable unfortunately because the 12 Kato worms in the QSimeon dataset are the ones from the Stim condition, whereas the 5 Kato worms used in Brennan are from the NoStim condition. Not sure if there's overlap in the specific worms, but the Stim condition is not some intrinsic locomotion situation. Chat's description:

---
**Stim vs NoStim in Kato2015 really is an _external O₂ drive_**:
- **NoStim:** 18 min at constant **21% O₂**.
- **Stim:** 12 min total: first **6 min at 21% O₂**, then **6 min of 30 s shifts between 4% and 21% O₂**.

So if you run ADM on **WT_Stim**, you’re fitting dynamics of a system that’s being **time-dependently forced** (piecewise-stationary, with regular step changes).
## What to expect if you apply ADM to WT_Stim

You _don’t_ necessarily need to “remove global motion” as if it’s an artifact—because the O₂ steps are a **real input** that changes brain/behavior state. But you should expect **nonstationarity** to show up in the embedding/model:
- The **same locomotion loop(s)** may still appear (they’re strong), but the loop can **thicken**, **split**, or acquire an **extra slow axis** that correlates with O₂ level / time-since-switch.
- Transition probabilities can become a **mixture of two regimes** (4% vs 21%), which is slightly at odds with the “single stationary Markov process” assumption that ADM is implicitly leaning on.

## A good way to think about it for your goal (extending ADM to qsimeon)

Since the qsimeon-preprocessed Kato source they’re using is explicitly **WT_Stim.mat**, the question becomes: _do you want ADM to recover an “intrinsic locomotion manifold,” or a “locomotion manifold + how O₂ modulates it”?_

---

Sooo yeah seems like each of these datasets may have some weird experimental conditions going on. Perhaps I should be much more selective with my dataset choices here, and think more clearly about what it means to "extend ADM to QSimeon".
