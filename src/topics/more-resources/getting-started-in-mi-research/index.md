---
title: "Getting Started in MI Research"
description: "A companion to Neel Nanda’s research roadmap, connecting its advice on practice, project selection, iteration, and write-ups to this curriculum."
order: 2
prerequisites: []
---

## A Roadmap from Learning to Research

Neel Nanda's [How To Become A Mechanistic Interpretability Researcher](https://www.alignmentforum.org/posts/jP9KDyMkchuv6tHwm/how-to-become-a-mechanistic-interpretability-researcher) is a detailed, opinionated guide to entering the field as a practitioner. Where this curriculum covers the *concepts* of mechanistic interpretability, Nanda's post covers the *process*: how to learn, how to do research, and how to build a career.

The post covers more detail than this companion page. The outline below helps you decide which sections are useful at your current stage and connects them to material on this site.

## The Three-Stage Progression

The core framework is a three-stage progression from learning to doing research:

1. **Learning the ropes (one month or less).** Go breadth-first through the basics: code a transformer from scratch, learn the core MI techniques ([activation patching](/topics/activation-patching/), [probing](/topics/probing-classifiers/), [SAEs](/topics/sparse-autoencoders/)), get familiar with the tooling ([TransformerLens](/topics/transformerlens/), [nnsight](/topics/nnsight-and-nnterp/)), and skim the literature. The emphasis is on getting to the point where you can start doing research, not on finishing all the reading first.

2. **Mini-projects (one to five days each, for two to four weeks).** Small, disposable research projects build fluency with experiment code, interpretation, and debugging. Possible starters include replicating and extending one result, exploring [attribution graphs](/topics/circuit-tracing/), or investigating a model organism. The goal is practice, not a polished publication.

3. **Full projects (one- to two-week sprints).** Review the evidence after each sprint and pivot unless the project has real momentum. This stage adds slower skills: generating research ideas, reading the relevant literature, writing results clearly, and developing judgment about which leads deserve more time.

## Research as a Skill Breakdown

One of the most useful parts of the post is its decomposition of research skills by feedback loop speed. Fast skills (writing and debugging experiments) can be practiced in minutes to hours. Medium skills (knowing when to pivot, designing good experiments) take days. Slow skills (research taste, generating good ideas) take months. Nanda's advice is to focus on the fast skills first, since those are easiest to learn through practice, and let the slow skills develop over time.

He also breaks the research process into four phases: *ideation* (choosing a problem), *exploration* (building intuition, gaining surface area), *understanding* (testing hypotheses with skepticism), and *distillation* (writing up results). The post gives concrete advice for each phase, including a strong emphasis on skepticism during understanding ("the more exciting a result is, the more likely it is to be false") and on the value of writing up even negative results.

## The Author's View of the Field

The post gives Nanda's assessment of which directions looked promising when he wrote it. Treat that section as one researcher's time-stamped judgment, not a settled ranking. Its more durable lesson is to compare projects by tractability, feedback speed, neglectedness, and connection to a concrete downstream question.

He also describes a shift in his own thinking: from ambitious reverse engineering toward more pragmatic approaches that aim for enough understanding to be useful, rather than complete mechanistic accounts.

<details class="pause-and-think">
<summary>Pause and think: Turn an interest into a mini-project</summary>

Choose one result from this curriculum that you would like to test. Can you shrink the idea into a question answerable in one to five days, with a named model, dataset, metric, and baseline?

For example, replace “study refusal circuits” with “on one open model and two prompt sets, compare how well a published refusal direction transfers across layers.” The narrower version tells you what to run and what would count as a negative result. If the question still requires several new tools or datasets, shrink it again.

</details>

## Career and Mentorship Advice

The final sections cover practical career advice: how to find a mentor (cold email less prominent researchers, not the most famous ones), where to apply (Anthropic, OpenAI, Google DeepMind, academic labs), how to write up research for publication, and what hiring managers look for. He also discusses whether to pursue a PhD (sometimes yes, often no, depends on the supervisor) and lists academic labs doing interpretability research.

## How This Connects to the Curriculum

This curriculum provides the conceptual foundation that Nanda's post assumes readers will acquire in Stage 1. The [Transformer Foundations](/topics/transformer-architecture/) block covers the architecture knowledge. The technique articles ([activation patching](/topics/activation-patching/), [DLA](/topics/direct-logit-attribution/), [SAEs](/topics/sparse-autoencoders/), [probing](/topics/probing-classifiers/)) cover the methods. Nanda's post then picks up where the curriculum leaves off: how to go from understanding these concepts to applying them in original research.

If you are working through this curriculum and wondering "what do I do next?", his post is a good answer.
