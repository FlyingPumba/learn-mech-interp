---
title: "Getting Started in MI Research"
description: "A guide to Neel Nanda's opinionated roadmap for skilling up in mechanistic interpretability research: from learning the basics to publishing your first paper."
order: 2
prerequisites: []
---

## What This Is

Neel Nanda's [How To Become A Mechanistic Interpretability Researcher](https://www.alignmentforum.org/posts/jP9KDyMkchuv6tHwm/how-to-become-a-mechanistic-interpretability-researcher) is a detailed, opinionated guide to entering the field as a practitioner. Where this curriculum covers the *concepts* of mechanistic interpretability, Nanda's post covers the *process*: how to learn, how to do research, and how to build a career.

The post is long (and worth reading in full), but here is what it covers and how it connects to the material on this site.

## The Three-Stage Progression

The core framework is a three-stage progression from learning to doing research:

1. **Learning the ropes (one month or less).** Go breadth-first through the basics: code a transformer from scratch, learn the core MI techniques ([activation patching](/topics/activation-patching/), [probing](/topics/probing-classifiers/), [SAEs](/topics/sparse-autoencoders/)), get familiar with the tooling ([TransformerLens](/topics/transformerlens/), [nnsight](/topics/nnsight-and-nnterp/)), and skim the literature. The emphasis is on getting to the point where you can start doing research, not on finishing all the reading first.

2. **Mini-projects (1-5 days each, for 2-4 weeks).** Throwaway research projects to practice the craft. Suggested starters include replicating and extending a paper, exploring [attribution graphs](/topics/circuit-tracing/) on Neuronpedia, or investigating model organisms. The goal is to learn the fast-feedback-loop skills (writing experiment code, interpreting results, getting unstuck) without worrying about producing polished output.

3. **Full projects (1-2 week sprints).** Work in sprints, post-mortem after each, and pivot unless the project has real momentum. At this stage, start practicing the slower skills: generating good research ideas, knowing the literature, writing things up, and developing research taste.

## Research as a Skill Breakdown

One of the most useful parts of the post is its decomposition of research skills by feedback loop speed. Fast skills (writing and debugging experiments) can be practiced in minutes to hours. Medium skills (knowing when to pivot, designing good experiments) take days. Slow skills (research taste, generating good ideas) take months. Nanda's advice is to focus on the fast skills first, since those are easiest to learn through practice, and let the slow skills develop over time.

He also breaks the research process into four phases: *ideation* (choosing a problem), *exploration* (building intuition, gaining surface area), *understanding* (testing hypotheses with skepticism), and *distillation* (writing up results). The post gives concrete advice for each phase, including a strong emphasis on skepticism during understanding ("the more exciting a result is, the more likely it is to be false") and on the value of writing up even negative results.

## Current State of the Field

The post includes Nanda's assessment of which research directions are most promising and which are becoming less productive. He flags several areas he considers past their peak (toy model interpretability, basic circuit analysis via patching, incremental SAE improvements) and highlights directions he finds more exciting: downstream tasks and auditing games, model organisms, reasoning model interpretability, attribution-graph-based circuit analysis, and practical applications like [monitoring with linear probes](/topics/safety-mechanisms-and-monitoring/).

He also describes a shift in his own thinking: from ambitious reverse engineering toward more pragmatic approaches that aim for enough understanding to be useful, rather than complete mechanistic accounts.

## Career and Mentorship Advice

The final sections cover practical career advice: how to find a mentor (cold email less prominent researchers, not the most famous ones), where to apply (Anthropic, OpenAI, Google DeepMind, academic labs), how to write up research for publication, and what hiring managers look for. He also discusses whether to pursue a PhD (sometimes yes, often no, depends on the supervisor) and lists academic labs doing interpretability research.

## How This Connects to the Curriculum

This curriculum provides the conceptual foundation that Nanda's post assumes readers will acquire in Stage 1. The [Transformer Foundations](/topics/transformer-architecture/) block covers the architecture knowledge. The technique articles ([activation patching](/topics/activation-patching/), [DLA](/topics/direct-logit-attribution/), [SAEs](/topics/sparse-autoencoders/), [probing](/topics/probing-classifiers/)) cover the methods. Nanda's post then picks up where the curriculum leaves off: how to go from understanding these concepts to applying them in original research.

If you are working through this curriculum and wondering "what do I do next?", his post is a good answer.
