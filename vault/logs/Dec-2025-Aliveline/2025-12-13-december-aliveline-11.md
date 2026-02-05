---
layout: post
title: December Aliveline - Day 11
date: 2025-12-13
categories: alivelines
---
# Day 11

Continuing data work with mouse pre-frontal cortex today. Integrated Codex into the Matlab workflow as well.

Pipeline (for each mouse):
- Data: session x neurons x trials
- For each session, drop trials that are all nan for all neurons & any neurons that have zero variance across all trials (= not contributing)
- Eigen-decomposition for each session
	- Compute z-score of each neuron across the trials
	- Compute covariance across neurons
	- Compute eigenvectors of that covariance matrix
- Compare to null for each session
	- 200 times, independently permute trials for each neuron, calculate & save top eigenvector
	- Compute mean and std of the 200 shuffled top eigenvectors
	- Compute lambda1z = (top eigenvector - shuffle mean) / shuffle std
	- Compute lambda1ratio = top eigenvector / shuffle mean
- Plot lambda1z, lambda1ratio for each session
	- Hypothesis: there is a spike when the mouse learns the rule
- Correlate top eigenvector with CTI & CTI orthogonal for each session
	- Compute correlations of abs(top eigen) and abs(CTI), abs(CTI orthog)
- Plot correlations
	- Hypothesis: correlation with CTI goes up as mouse learns the rule
		- CTI is measure of a neuron's selectivity wrt the active rule, so higher correlation w top eigenvector = top eigenvector dimension also has category selectivity
	- Hypothesis: correlation with CTI orthogonal goes down as mouse learns the rule

Got the above working. Seeing a mix of things with the top eigenvector across trial.

From the paper:
>To disentangle how stimulus category, choice and reward affected the trial-by-trial responses of category-selective neurons, we used linear regression to determine their individual contributions (Extended Data Fig. 9a). Although choice selectivity did not directly explain CTI (Extended Data Fig. 9b, c), the activity pattern of Go category-selective cells showed significant modulation by multiple factors, stimulus category, choice and reward (Extended Data Fig. 9d). By contrast, the responses of NoGo category-selective cells were only significantly influenced by category identity (Extended Data Fig. 9d).

I need to do something similar. Intuition is that the top eigenvector could be showing correlation with stimulus category, choice, reward, movement, arousal, a whole host of things. Need to regress those confounds out and see if anything remains, similar to what the paper did.

To start with, going to plot correlations between top eigenvectors and the various other axes to see what it looks like across sessions. Perhaps I should email authors for their data processing code to copy how they regressed things out.