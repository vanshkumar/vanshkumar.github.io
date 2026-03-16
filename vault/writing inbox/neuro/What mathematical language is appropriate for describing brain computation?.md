---
lastmod: 2026-03-09
tags:
  - neuroscience
  - how-do-we-learn
---
Standard tools (linear algebra, dynamical systems, information theory, statistics) dominate computational neuroscience. But is the right mathematical language for the brain something we haven't tried yet?

Some candidate "weird" frameworks already being explored:
- Random matrix theory / universality classes → [[Can universality class distribution results from random matrix theory help us understand neural population dynamics?]]
- Kolmogorov complexity / minimum description length → [[What might a useful analog to Kolmogorov Complexity in the brain look like?]]
- Feedback control theory → [[How does DNA bridge the micro (local neuronal rules) to the macro (evolutionarily relevant behavior)?]]

The deeper question: are we fitting the brain to math we already know, rather than letting the biology suggest its own formalism? Because [[In CN, the trend is to take algorithms from computer science and statistics and map them onto biology. What’s far rarer is extracting new ML algorithms from the biology itself.]]


Beyond mathematical language, the *computational architecture* we use to model the brain matters too. Feed-forward networks are almost certainly the wrong model — the brain is massively recurrent. Spiking neural networks may be closer but are still simplified. What computational paradigm actually matches what the brain does?