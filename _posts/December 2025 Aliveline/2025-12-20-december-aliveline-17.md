---
layout: post
title: December Aliveline - Day 17
date: 2025-12-20
categories: alivelines
---
# Day 17

I felt some enthusiasm for trying to apply the asymmetric diffusion map method to a bunch of different worms in the qsimeon dataset. Let's try it.

Lol just getting the test system in the ADMM repo to work is taking a while due to Matlab dependencies, and the fact that it's from 2019. If I can get some interesting results extending this to other worms, might be worth a Python port/update.

If I do successfully extend ADMM across the many worms in the qsimeon dataset... will that count as "have and publish an original insight"? Interesting Q. Here's how I defined this at the beginning.

>What I mean by "have and publish an original insight"
> - I have been reading here and there about intelligence – how we learn, how the brain works, how ML works, etc
> - I want to publish something that is original relative to the current research AND more importantly something that I would consider novel/interesting today

It is definitely something I would have considered novel/interesting. At least before starting doing this, it doesn't *appear* original relative to the current research. Let's see what comes out of actually extending it. I at least will know in a day or two (like I did with the mouse dataset) if this is something interesting to pursue further etc.

Extremely interesting blog posts re: the C Elegans problem & our current models of the brain:
- https://ccli.substack.com/p/the-biggest-mystery-in-neuroscience
- https://ccli.substack.com/p/the-biggest-mystery-in-neuroscience-a1a
- https://ccli.substack.com/p/the-biggest-mystery-in-neuroscience-3e2

Argues that some kind of fixed-circuit model of the brain is not useful

I tend to agree... it is clear that the brain is an emergent, complex system. Local rules give rise to complex global behavior. I think nonlinear dynamics, complexity science, statistical physics are the right tools to study the brain rather than CS style logical gates / circuits. Also immediately puts me off a bit on the various papers that try to use DNNs to simulate the C Elegans brain. But actually that maybe doesnt make sense – those models are just learning the latent structure & studying the trained DNN models could possibly reveal some latent structure / model that informs our real model of the brain. Similar to how the stacked DBMs learns block spin renormalization when trained near the critical points of the 2D Ising model. I guess we should be training DNNs near some notion of criticality/phase transition for them to learn the latent structure?