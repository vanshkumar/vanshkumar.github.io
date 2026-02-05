---
date: 2026-01-28
lastmod: 2026-01-29
---
# Day 29

Mostly finalized repo is up: https://github.com/vanshkumar/LOOPER-freely-moving-worms

Still need to re-run a couple Kato things, but this is in a good state. Not sure what to spend time on today – perhaps some neuronal dynamics studying, and getting started on converting the many questions/thoughts I've had throughout this process into some kind of Evergreen Questions like format so I can sharpen & answer them over time.

Decided to improve my Kato positive control in the repo to also do a train on first half + reconstruction metric to have something directly comparable to the Atanas data & paper's original results. I am pretty convinced that qualitatively I am able to recover loops in Kato data (from metrics + staring at the many plots) but this is a stricter positive control, so worth doing for posterity if I ever want to run LOOPER on other data.

Interesting, Kato single worm does recover loops (based on phase metrics) vs Atanas did not. But Kato single worm also fails the first half/second half generalization test. I guess it's too strong of a stationarity test. So the first half/second half thing is just too strict, as I can't even get it working in the positive control case. Still doesn't change my plans, as I wasn't able to recover loops *at all* in the Atanas freely moving baseline case, but it does soften the result a bit.

Split scripts into fidelity tests (full trace loop-finding + reconstruction) & stationarity tests (train on first half, see if second half is stable). Running on all Kato worms shows they do quite well on the fidelity test but pretty much all fail the stationarity test. It's probably worth doing this same split for Atanas baseline worms to get a better sense of what is going on, but the fact that Atanas baseline fails the stationarity test means that the heat pulse recovery dynamics experiment is already a no-go. So I probably should move on and maybe run Atanas baseline fidelity test in the background.

Also chatgpt (web) found an indexing bug in the kato_shared run which invalidates the results. Annoying that gpt-5.2 is smarter than gpt-5.2-codex. Have to re-run this which will take quite some time. Also noting that MaxCheckTime is set to 1 due to memory constraints, which is different from the paper setting of 10 – it's used after the super slow diffusion step tho so I can mess with this after the diffusion cache is built.
