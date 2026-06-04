---
title: Partition Summer
description: A comic memoir of the 1947 Partition of India, through my grandfather’s childhood memories
date: 2026-06-03T12:00:00-04:00
lastmod: 2026-06-03T12:00:00-04:00
kind: project
comic:
  assetDir: partition-summer
  pageCount: 35
  width: 1064
  height: 1500
---
_Partition Summer_ is a short comic I created based on stories my grandfather told me about living through the [Partition of India](https://en.wikipedia.org/wiki/Partition_of_India) in 1947. He was six years old at the time.

<div data-comic-reader="partition-summer"></div>

# Behind the scenes

In early 2025, I spent around an hour every morning for about a month video calling with my grandfather (who I call "Pappi"). It started as a way for me to practice Hindi before my son was born while getting to know Pappi's life story. I took detailed notes just because the stories he told about being a six year old child during Partition were wild. They seemed like they were straight out of a movie. I had no plan for what I would do with the notes.

My son was born a few months later and I became busy with taking care of him and other projects, but every so often I'd brainstorm on what I could make with my notes. I wanted something that my son could read when he was older and Pappi's stories reminded me of the graphic novel *Maus*, so I settled on making a short comic. Unfortunately my artistic talent is close to zero, so it would take a very long time to learn how to draw/illustrate before being able to produce something I'd be happy with. I played around with using LLM image models for this, but this was late 2025 and they couldn't do a great job without a large amount of effort on my end. Finally in early May 2026, the image models (I used ChatGPT primarily for the comic) got good enough to produce output I was happy with.

Coincidentally my grandfather's 85th birthday was on June 4 2026, so my mom suggested I finish the comic as his birthday present. I spent a few weeks making the comic, my uncle in India got it printed, and we gave it to him on his birthday!

## Reflections on the process

I structured this as a project in ChatGPT and had a few key things in the sources:
- My detailed notes – source of truth for many decisions in the comic
- A page by page detailed storyboard for the comic that I had iterated on first with an LLM before starting any image generation – I ended up deviating a decent amount from this, but it was key for the first pass
- A historical account I found online (*The Qadian Diary*) – key for corroborating a few historical facts & for a map of what Qadian looked like in 1947
- A file with the number & ages of all the siblings at each point in the comic (1947 and 1952)

Before starting any image generation, I also discussed an overall [[comic co-creation workflow]] with ChatGPT and used the result as the project instructions. I explicitly asked ChatGPT to take into account known limitations of image generation models while deciding on this workflow. I also settled on a simple approach to version control for the comic.

The absolute most annoying thing about this whole process is **keeping things consistent**. I think my upfront work was quite helpful, but there's more I would do next time. Specifically:
- Locking the aspect ratio/borders/margin of each page before doing anything. Fixing this at the very end was _horrendous_
- Adding the family continuity lock with the ages of all the siblings, role of the mother/father, etc much earlier – I only added it to the project source when I was close to done
- Adding character sheets – regenerating pages to add in siblings or change what age they looked like was nearly impossible without affecting the art
- Making the captions an overlay layer that is separate from the art


Other miscellaneous notes:
- I settled on pretty much the first art style the LLM generated; I would spend much more time exploring the design space of what the art *could* look like next time
- LLM image gen models do way better with positive instructions ("change this") rather than negatives ("this doesn't look right")
- Providing nearby pages as context for specific characters/style when editing a page is surprisingly effective
- Asking the LLM to give me an image gen prompt for how to fix a particular issue is a useful first pass
- LLMs can't handle more than a single page at a time
- I tried to make this comic a couple times and thought the image gen was shit each time – great lesson that in an era of LLMs it's sometimes better to just wait until it's easy lol