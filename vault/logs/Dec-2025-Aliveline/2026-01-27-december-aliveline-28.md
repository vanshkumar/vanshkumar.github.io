---
layout: post
title: December Aliveline - Day 18
date: 2025-12-22
categories: alivelines
lastmod: 2026-01-27
---
# Day 28

Working on the same stuff as yesterday. I am fairly satisfied in recovering Kato worms, though I will run the shared neuron subset across all worms thing later today (it takes many hours).

But it appears that LOOPER really cannot find loops in the Atanas baseline worms, which means doing the recovery dynamics test after the heat pulse is likely a no-go. Spending a bunch of time today checking correctness of the eval scripts I'm using to come to that conclusion.

OK correctness is sufficiently ensured and the code is in a decent place. It is pretty clear that we are not able to recover LOOPER-like loops in the freely moving worms. Last thing I am trying is if detrending will help, but it looks like a no. It's probably worth writing this up now.

Did a lot of code cleanup, documentation, results coalescing, etc. Ready to put on github and have results summaries.