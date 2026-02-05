---
layout: post
title: December Aliveline - Day 18
date: 2025-12-22
categories: alivelines
lastmod: 2026-01-26
---
# Day 27

Continuing to work on a few things with LOOPER:
- Repro Kato 2015 data from original paper (immobilized, no stimulus)
	- Single worm, all neurons
	- All 5 worms, all neurons
	- All 5 worms, shared neuron set (this is the paper's figure 5b)
- Test on Atanas baseline data (freely moving worms, no stimulus)
	- Single worm, all neurons
- Test on Atanas heat data (freely moving worms, instantaneous heat pulse)
	- Fit LOOPER on pre-stimulus neural trace and see if there is recovery dynamics after the stimulus

Many annoyances in trying to repro the paper's figure 5b – their supplemental data uses 15 neurons subset while their actual saved OSF worm looper results shows 18 neurons. Also their R^2 plot is some train/validation split whereas the LOOPER code plotreconstruction is just Pearson correlation. It's not clear how valuable it is to actually reproduce the paper figure fully given how scattered and likely somewhat out of date the provided code is. I do think I am successfully recovering loops from Kato worms, so I am going to move on to the Atanas data.

Hm unfortunately it is looking like from a single Atanas baseline worm we do not find loops and instead just find 2 separate regimes with a clear transition between the two. Not too surprising given it is freely moving worms I suppose. Going to run across all the Atanas baseline worms to see if this applies to all of them, but the Kato stim dataset may be better depending on what exactly the stimulus was in that dataset. Or maybe Nichols 2017 which was immobilized & then switched O2 levels? Hmm. Either way I can at least write up that I was not able to recover loops in Atanas freely moving worms, which is maybe not too surprising, but still worth a writeup. Negative results are still science.

Seems like Kato and Nichols are both O2 switches.

