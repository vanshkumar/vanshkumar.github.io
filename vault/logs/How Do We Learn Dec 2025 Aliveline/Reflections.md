---
date: 2026-02-03
lastmod: 2026-02-09
---
- LLMs are insanely useful and code correctness is not as bad as it used to be
	- AI-assisted science is a very cool field that I may want to work in
	- Considering reaching out to a comp neurosci researcher and trading them me building them LLM-infra to accelerate their research in return for mentoring me in the research side
- Having an absurd objective of trying to have and publish an original insight in a month (tho it ended up being over 2 months)
	- Extremely motivating
	- Forced me to take a research-first/question-first approach to learning things, which was way more fun
	- Very superficial in terms of the depth of anything I could realistically learn; found myself relying on LLMs much more than is probably ideal for the idea generation parts of this
		- Viscerally felt the explore-exploit tradeoff / breadth vs depth thing when getting into a new field! Ideally I would have spent more time pondering and having free thinking time but (1) the time constraint made that feel not as useful and (2) I often felt that I didn't have the background raw material (which was probably true!) to even get anything "useful" out of such free thinking sessions. But at the same time a goal of this hwole
- My sense is alternating stupid objectives like this with free flowing exploration blocks would be very effective
	- Unhinged habits style switching on/off
	- Not sure where deep study of fundamentals fits in.. I do really need that!
	- What are the parts of creativity?
		- Collecting raw material
		- Empty time
		- Synthesis/creation
- I worked with ChatGPT a LOT throughout all of this. It's worth asking it for ideas on how to improve the feedback loop, iteration process, etc for both learning this new field + running the experiments. Draft prompt
	- read through this repo and understand what's going on. what i would like is a review and improvement suggestions for the process that was followed in this repo to get to the point of planning, thinking through, and running the experiment. how can my process of co-working with a coding+thinking llm be improved in the context of running these kinds of computational neuroscience experiments? both on the execution AND the big picture side of things?
	- ^ doesn't include learning a new field aspect
	- Also maybe I should clearly bake in the "problem creator" thing
	- Probably worth splitting into different requests/prompts
		- Actual iteration process while writing the experiment code, taking into account my desired working style
			- Ideal output would be something like: what should I add to AGENTS.md, what code hooks can I add, what additional documentation / scratchpad checkpoints can I add, how can I make you more autonomous while still retaining directional control?
		- Learning a new field & doing this question-first / hypothesis generation approach
			- Ideal output would be.. idk?
		- Higher level how can I make you more autonomous overall?
			- What skills should I create?
- Also ask LLM to read thru this Aliveline folder and pull out any reflections I've had
- I can feel that this whole thing would've gone much faster & been more interesting had I asked for help/advice more and/or had a mentor person to chat with. But at the same time there is a lot of value in doing this question-first approach to learning a new field myself in that I can develop my own taste. Blending the two, which an optimal PhD program would do, is of course ideal.
	- I do think I should have reached out to the LOOPER author sooner than I did. Step 1 after reading any paper should be emailing the author with (good) questions tbh. Person-first approach to learning!
- I also think a couple months of deep study in a few relevant fields (linear algebra, nonlinear dynamics, neuronal dynamics, random matrix theory) would have accelerated this significantly
- gpt-5.2 is smarter than gpt-5.2-codex
- Could have saved some circuitous time by being way more clear up front about the exact experiment I was trying to run and co-planning it out with LLM. This kind of thing once the high level is clearer is what they are useful for.
- I found myself relying on LLMs even for the idea gen part, partly because I'm new to the field and partly because I had a time constraint. It's very interesting to think about which parts of the research process LLMs can be helpful for and which they may not be as good to rely on (at least base standard LLMs). And how to remove the LLM scaffold as you get deeper in the field for parts where you eventually don't want to rely on them as much
- I don't think my original recovery dynamics after heat pulse question was very well-formed. I should have spent way more time iterating on & dissecting that but moved too quickly to an experiment
	- Follow up email to Connor Brennan really helped me clarify what question I'm even trying to answer and if my data can answer it. Need to be doing this wayyyy more often. What is a system that help me do that? Maybe Evergreen Questions?
	- Either I need a research advisor or I need a system. Lol. Probably both.
- Frankly I did way too much context switching, especially in the back half of this work. Setting up coworking admin was annoying on this front, as well doing the admin of the neuronal dynamics group. And also run of the mill distractions like email etc
- [[2026-01-31]]
- One major takeaway is to spend way more time formulating questions precisely. Solving problems is 90% about understanding them.
- A question I need a detailed answer to for myself is: what does it mean to understand the brain? what does it mean to understand how we learn?
- Another question from [[Day 15]] which is interesting:
>	- The aliveline is "have and publish an original insight". But does it have to be me who does it? What if instead I am able to connect authors of a couple papers whose ideas are part of a similar story but haven't been previously connected, and that *leads to an original insight being published*? I would define that as success. That's a way more tractable problem to do in a month as well.
>	- Makes me wonder about how important such social-style bottlenecks are in science/research? There is an implicit narrative about science being bottlenecked by individual genius... but if you believe the scenius/technium-style thinking, the bit that's lacking is more coordination/social infra?
>	- Ultimately, my primary advantage in all of this is that I ***do not*** need to optimize for metrics like citation/paper count. I am doing this for the love of the game, for a desire to learn, to push science forward, etc. That **needs** to be my starting point here. And besides, an approach where I learn and work on things that are interesting, both inside and outside of formal science, is wayyy more fun.
- And you can extend the above thinking into "could it be an LLM? am I ok with just doing the experiments an LLM tells me to do?"
- wow just sitting doing nothing for 20m and i thought through what the brennan paper's loops thing was actually doing, how they measured its quality, if my split half / heat pulse experiments actually make sense (they don't). this kind of open space would have helped speed things up significantly.
	- also making it clear how i didn't understand these papers i was reading ~at all the first couple times. part of it is new field means it's way too much mental overhead to ask real questions while reading. part of it is going a little too fast. but yeah the approach in how to read a book is clearly designed allow for this. good news is reading is a learnable skill.
	- open thinking space is key
- i got distracted from my original month long goal. i think splitting this over 2 months played a part in that.


obvious quick wins:
- add some pdf reading skill to codex.. ideally one that can read figures too
- use gpt-5.2 (not gpt-5.2-codex) in CLI for qs requiring more 'intelligence'
- create skills to modularize things
- cleaner and more separated scratchpads for llms as they work, esp as parallelism goes up
- moving forward make sure all documentation (chats, codex sessions, markdown notes) is in a single easy to access place, with timestamps, so llms can read and directly reflect on it to improve iteratively
	- for the chats + codex sessions, an automated pipeline might be worth investing in to make them as easy as possible for an llm to use
- claude code as harness for codex, as it's a much better manager / big picture thinker but codex is much better at nontrivial coding tasks