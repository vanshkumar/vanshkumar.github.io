---
layout: post
title: December Aliveline - Day 18
date: 2025-12-22
categories: alivelines
lastmod: 2026-01-24
---
# Day 25

A few days break, with a trip to Seattle + a bit of general scatteredness. Anyways.

I am still working with the hypothesis of
> Genes work at the neuron level, but need to encode behavior (eg locomotion) as a top-down computational constraint on the network. They accomplish this via modifying neurons' nonlinear feedback control algorithms. This results in certain structures (eg 2D loops for locomotion in C Elegans) appearing with very high probability, despite each overall brain's neural coordinate system being unique.

Ended up moving forward with an experiment that uses specific datasets that are present in qsimeon, but I can't use them directly from there because I need more metadata. Starting with Atanas 2023 data, which has NeuroPAL recordings & records that are baseline & heat stimulus. Idea of the experiment is to see if there is negative feedback that drives the neural system back towards the LOOPER scaffold when it goes off of it. That would provide at least some observational evidence of "negative feedback control", and is probably as much as I can do for my hypothesis using calcium imaging data without specific neuron-level perturbations.

Worked with codex to make the LOOPER code/directory standalone with good LLM-friendly documentation, and same for QSimeon & Atanas data. Looking to make it easier to stitch these together later if the dataset needs to change, by making documentation more modular.

Working on a few things with LOOPER:
- Repro Kato 2015 data from original paper (immobilized, no stimulus)
- Test on Atanas baseline data (freely moving worms, no stimulus)
- Test on Atanas heat data (freely moving worms, instantaneous heat pulse)
	- Fit LOOPER on pre-stimulus neural trace and see if there is recovery dynamics after the stimulus