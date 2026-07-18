---
slug: what-were-the-results-of-tjs-switch-to-a-lottery-system
title: What were the effects of TJ's admissions policy change?
date: 2026-06-18
lastmod: 2026-07-18
---
I attended Thomas Jefferson High School for Science and Technology (TJHSST), a [public magnet high school](https://en.wikipedia.org/wiki/Thomas_Jefferson_High_School_for_Science_and_Technology) in Northern Virginia, and graduated in 2012. To get in, I had to jump through the hoops of an admissions fee, GPA/transcript review, taking a TJ-specific standardized test, and writing an essay. Think college admissions, but for high school.

In fall of 2020 the admissions process went through an overhaul. While the initial proposal was to switch to a lottery system above a 3.5 GPA cutoff, that was rejected in favor of a “holistic review.” A [nice summary](https://www.tjtestprep.com/tj-admissions-overview) of what changed & the current process:

![[Pasted image 20260718133112.png|apparently I needed teacher recs too? wild]]
![[Pasted image 20260718133154.png]]


Needless to say, this broke the business model of the many “TJ test prep” programs & caused much distress among the (primarily Asian-American) parents who _needed_ their kids to go to TJ. I recall hearing stories around when I was graduating of parents who had moved cross-country & even internationally so their kids could go to TJ. This all culminated in [a legal case](https://en.wikipedia.org/wiki/Coalition_for_TJ_v._Fairfax_County_School_Board) between the Coalition for TJ[^1] and the Fairfax County School Board that ended with the Supreme Court declining to hear the Coalition’s appeal. The admissions process continues to be the holistic review described above.

I had heard about this policy change & discussed it with a few friends at the time, but forgot about it until I saw [this tweet](https://x.com/francisdeng/status/1834344019293622323):

![[Pasted image 20260718133219.png]]

This is an interesting and more importantly, measurable take! Some explanation:

A student is a National Merit Semifinalist (NMSF) if they take the PSAT in their junior year & get a score above some cutoff. Not _exactly_ accurate[^2], but you can think of NMSF = top national %ile score on the PSAT.

There was a large decline in the number of NMSFs at TJ in the first class admitted under the new admissions process, the class of 2025, compared to the previous year. This is pretty unsurprising IMO – as [this comment](https://www.dcurbanmom.com/jforum/posts/list/45/1229818.page#28423081) puts it:

> BREAKING: School that no longer overselects for test-taking ability suddenly performs worse than before but still better than everyone else at test-taking contest

But this tweeter is saying that the **total number** of NMSFs in the TJ geographic region went down too. The large decrease in TJ NMSFs was not compensated for by increases at the TJ-eligible high schools in the region. This is potentially more interesting – is there some net benefit to clustering “talent”[^3]? Are there kids who _would have been_ NMSFs had they gone to TJ? In other words, **was the change in admissions policy a net loss in NMSFs rather than just a redistribution**?

_disclaimer: we can’t rigorously answer this with public data but we can at least do a descriptive analysis_
# Answer: unclear so far

I put [the bots on the case](https://github.com/vanshkumar/tj-psat-analysis) (gotta burn tokens somehow) to both reproduce the tweeter’s numbers & expand the analysis to two years pre-policy change and two years post. Here are the results in a nifty infographic:

![[Pasted image 20260718064510.png|ok it’s not _that_ nifty. I blame AGI/the lack thereof]]


If you prefer words:
- The policy led to large decreases in the number of TJ NMSFs both years. Again, unsurprising
- Class of 2025 **did** show a net loss like the original tweet
- Class of 2026 **did** **not** show a net loss – regional numbers returned to pre-policy baseline. TJ was still down a lot compared to baseline, but other schools compensated ~fully. De-concentration, no net loss
- Need a few more years of data to really know, but 2025 may be a regional outlier. I’ll update this once more data comes out

So.. wtf happened with the class of 2025? I’m not sure!

My main guess[^4] is that this is somehow related to the class of 2025 being the first set of juniors to take the [digital PSAT](https://ihsvoice.com/2023/10/27/college-boards-new-digital-adaptive-psat/) instead of a paper version. The test itself changed a lot as part of this: it became shorter, “adaptive” to each student, calculators were allowed, etc. No idea why this would make the PSAT relatively harder for specifically Virginia students, but I don’t currently have a better hypothesis! Lmk if you can think of a better, ideally testable, one.

---

This whole thing took maybe like 4-5 hours of active time, though it was somewhat of a drain on my attention to keep a leash on the bots. I would never have bothered to spend _any_ time answering this random question without the bot armies of today. Pretty fun stuff. Emphasizes how much more important asking the right question will be moving forward.



[^1]: Their site coalitionfortj.net (don’t go to it!) is Indonesian casino stuff now. Their [twitter account](https://x.com/coalitionforTJ) also hasn’t posted in a year 😬. Guess that’s what happens when you lose

[^2]: The cutoff is actually determined at the state level: there are a fixed number of NMSFs allocated per state, and then you have to be in the top N students in the state to be an NMSF. So if you’re in a more “competitive” state, you need a higher PSAT score.

[^3]: Obviously test scores are a shit measure of talent, but it’s at least _a_ measure

[^4]: I did check a couple other things:
- Whether the Virginia NMSF cutoff PSAT score changed over these years – it did shift a bit, but it’s unlikely it caused such a big regional level drop
- Perhaps there were differences in how many juniors actually decided to take the PSAT, which my enrollment normalized metric doesn’t capture – this doesn’t seem to have been the case in the aggregate, though there may have been school-by-school diffs