---
lastmod: 2026-02-26
---
The most concrete & inspiring vision I have seen in this area is [this talk by Andy Matuschak](https://andymatuschak.org/hmwl/). My goal is to build a local-only version of something like this for my kids & their classmates to use at my future microschool.


My guess is that the reason LLMs (or any tutor) can't easily scaffold a curriculum for you that allows you to make progress on a project you care about while not making you jump into the deep end concept wise, is that they can't look inside your head and see exactly your knowledge gaps.

I suppose this is what Alpha School tries to do as well – a single platform that has full view of your academics & shows you exercises where you have gaps / right at the edge of your ability. But they have to break out the "real world projects" part into a later part of the day which is less than ideal.
- I suppose I would have to do this too, unless there was some passive watching/listening device for all real world interactions lol

If I built a local LLM that was the only LLM my son interacted with at home, could I set it up so that it had a nearly perfect view of exactly where his knowledge begins and ends? And therefore be able to help him make progress on a project he cares about at exactly the right level of difficulty? What would such an LLM look like, what features would it have? What open questions are there in building such a hyper-personalized AI tutor?


Brain dump
- Has to be able to save state frequently bc LLM context window will quickly be exceeded by the full contents of a child's brain
- Should it have a pre-defined conceptual knowledge map for various topics? Or should that emerge more organically somehow?
	- For it to emerge organically it must _understand deeply_ how different topics are connected. Can LLMs do that today?
- Ideally it prods him to be more social and engage w humans rather than just engaging w the AI tutor. And also do things in the physical world rather than just being locked into a computer screen. Which is a classic problem with LLMs bc they're trained on the Internet IMO. Computers are all they know.
- Hm if this is a local LLM on a local machine. There's no reason it shouldn't have some OS-level access? Like it can look at any Anki cards he makes etc. It's probably best to _not_ connect that machine to the Internet (except thru the LLM perhaps) to start.
	- Ya I guess maybe the even broader question is what would I want an ideal computer for Rami to have? LLM tutor, Anki, Duolingo..?
- Tbh this probably needs to be pre-trained on a different corpus than the whole Internet? Or maybe not. Maybe I can RLHF it myself ha
- He's going to grow up in an AI-first world anyways, it would be nice to scaffold an introduction to that from the beginning, and have some clear paved pathways for how to effectively use AI?



What are the components needed, extracted from How Might We Learn sketch?
1. Deep knowledge about the student's context (this will be extremely different for kids vs adults)
2. Suggest meaningful projects
3. Full context & ability to propose actions across all apps
4. Know when to build small interactive simulations, when to break concepts down further, etc
5. Suggest scaffolded paths thru other study materials (eg textbook)
6. Ask questions throughout to help promote deeper understanding (grounded in the project)
7. Spaced repetition questions grounded in the project (and ideally dynamic + pushing for further depth over time)
8. Bigger practice exercises grounded in the project
9. Suggest local meetups to attend


Main design principles articulated at the end of the talk:
- Bring guided learning to authentic contexts
- When explicit learning activities are necessary, suffuse them with authentic context
- Strengthen both of the above, eg suggest tractable ways to "just dive in" and connect with communities of practice
- Dynamic vessel for ongoing reinforcement
