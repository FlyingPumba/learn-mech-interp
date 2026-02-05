---
title: "Open Problems in Mechanistic Interpretability: Methods"
description: "A survey of the most pressing open problems in MI methods -- from better decomposition and description to validation -- with concrete research questions from the field."
order: 1
prerequisites:
  - title: "Honest Limitations of MI for Safety"
    url: "/topics/mi-safety-limitations/"

glossary:
  - term: "Ground Truth Problem"
    definition: "The fundamental challenge that mechanistic interpretability lacks an objective standard for evaluating whether a proposed explanation of model behavior is correct, since the true computational mechanisms are not independently observable."
  - term: "Scalability (of MI methods)"
    definition: "The open challenge of applying mechanistic interpretability techniques developed on small models (such as GPT-2) to production-scale systems with billions of parameters, where exhaustive analysis becomes computationally prohibitive."
---

## The Landscape of Unsolved Problems

Mechanistic interpretability has progressed rapidly since 2020. We can find individual features, trace circuits, steer behavior, and detect trained backdoors. But the field's leading researchers are candid about how much remains unsolved. In 2025, Sharkey et al. organized the open problems into a systematic framework {% cite "sharkey2025openproblems" %}, drawing on 28 researchers from Apollo, Anthropic, DeepMind, and MIT. Their taxonomy reveals three categories of unsolved challenges: methods and foundations, applications, and socio-technical concerns.

This article surveys the methods and foundations category in depth, then covers concrete research questions from Nanda's practical companion list {% cite "nanda2022openproblems" %}. Together, these two sources provide a map of what needs solving and where new researchers can contribute.

![Taxonomy of open problems in mechanistic interpretability organized into three categories: Methods and Foundations (decomposition, description, validation), Applications (monitoring, control, prediction, microscope AI), and Socio-Technical (governance, philosophy).](/topics/open-problems-methods/images/open_problems_taxonomy.png "Figure 1: The open problems taxonomy from Sharkey et al. (2025). Methods and foundations form the base layer -- solving them unlocks progress on applications and socio-technical challenges.")

## Decomposition: The Foundation Problem

Networks do not naturally decompose into interpretable parts. The tools we have built -- [sparse autoencoders](/topics/sparse-autoencoders/), transcoders, crosscoders -- represent our best current approach to extracting meaningful features from superposed representations. But they have fundamental limitations.{% sidenote "Decomposition is the problem that sits beneath everything else in MI. If we cannot reliably break a model into interpretable units, then circuit analysis assumes the wrong features, safety monitoring trusts the wrong activations, and steering manipulates the wrong directions. The field's honest assessment of this risk is one of its strengths." %}

The core open question: **do the features found by SAEs correspond to the features actually used by the model, or are they convenient approximations that happen to be interpretable?**

This is not a minor technical concern. The issues we studied earlier -- feature splitting, absorption, and reconstruction infidelity -- are symptoms of a deeper problem. SAEs impose a sparsity prior that may not match the model's true computational structure. When an SAE finds a "Golden Gate Bridge" feature, we can verify that it activates on Golden Gate Bridge text. But we cannot prove that the model itself uses this exact decomposition internally, rather than some alternative grouping that the SAE missed.

If decomposition is wrong, everything built on top becomes unreliable:

- [Circuit tracing](/topics/circuit-tracing/) assumes we have the right features to trace through.
- Safety monitoring assumes that feature activations are meaningful indicators of model cognition.
- [Activation engineering](/topics/activation-engineering/) assumes that the directions we steer along control what we think they control.

The decomposition problem is foundational. Get it wrong, and the rest of the MI program falls apart.

## Description: Interpretability Illusions

Even when we find the right features, describing what they do is harder than it appears. A feature might activate on "legal text" examples when inspected via top-activating examples, but actually encode something else entirely. Bolukbasi et al. (2021) showed that plausible explanations based on top activating examples can be completely wrong -- a phenomenon they called "interpretability illusions."{% sidenote "Interpretability illusions are particularly dangerous because they feel like success. A researcher finds a feature, examines its top activations, writes a plausible label, and moves on. The feature might even pass basic validation checks. The illusion is only revealed by more rigorous testing -- testing that most studies do not perform." %}

We encountered this warning repeatedly across the course. In probing, a classifier might detect information that the model does not actually use. In SAE evaluation, auto-labeling failures compound the problem: features labeled "deception" by automated interpretability pipelines rarely activate during actual strategic dishonesty.

The open question: **can we develop validation methods that distinguish correct interpretations from plausible-but-wrong ones?**

The current standard approach -- show a human the top activating examples and ask them to label the feature -- is not a reliable ground truth. We need methods that go beyond "this looks right" to "this is demonstrably right." Without solving description, we cannot trust the labels on the features we discover.

> **Interpretability Illusion:** A systematic error in which a feature or circuit receives a plausible-sounding interpretation that appears correct based on surface-level evidence (top activating examples, attention patterns) but is factually wrong about what the component actually computes. The illusion arises because there are many more plausible explanations than correct ones.

## Validation: Hypotheses vs. Conclusions

"Conflating hypotheses with conclusions has been commonplace" -- so write Sharkey et al., identifying perhaps the field's most pervasive methodological gap {% cite "sharkey2025openproblems" %}.

The problem is non-identifiability. Multiple circuits can replicate the same model behavior. Multiple interpretations can be consistent with a single circuit. When a researcher proposes that "head 9.9 is a Name Mover because patching it changes the IOI output," this is a hypothesis, not a conclusion. There may be other heads that would produce the same result if patched. The Name Mover label is one interpretation among several that are consistent with the causal evidence.

We saw this challenge directly with causal scrubbing: the method attempts to validate circuit hypotheses but has well-documented limitations. [Activation patching](/topics/activation-patching/) identifies which components are causally involved, but it does not tell us whether our interpretation of *why* they are involved is correct.

**Can we rigorously validate mechanistic explanations? When can we be confident that our interpretation is correct?**

This question does not have a satisfying answer yet. The field needs formal criteria for when a mechanistic explanation counts as validated, not just consistent with the data.

<details class="pause-and-think">
<summary>Pause and think: Which foundational problem matters most?</summary>

Decomposition, description, and validation are the three foundational challenges in MI methods. If you could make a major breakthrough on exactly one of the three, which would have the greatest impact on the field? Does solving any one of them depend on solving the others first?

Consider: better decomposition gives us the right features, but we still need to describe and validate them. Better description lets us label features correctly, but only if decomposition gave us the right features. Better validation tells us when an explanation is wrong, but only if the underlying decomposition and description are testable. There may be a dependency chain here, with decomposition at the base.

</details>

## Open Problems in Applications

The methods problems -- decomposition, description, validation -- are foundational. But the field also faces unsolved challenges in applying MI to practical goals.

**Monitoring.** Can MI detect unsafe cognition in real time? The defection probe result is promising: linear probes on residual stream activations achieve over 99% AUROC for detecting when a sleeper agent will defect. But this works for trained backdoors where the trigger leaves a detectable artifact. The harder question is whether analogous monitoring could catch subtle, emergent safety issues in frontier models running at production scale. This requires solving decomposition (what to monitor), description (what patterns mean), and scalability (doing it fast enough to matter).

**Control.** Can MI modify behavior reliably? [Steering via activation addition](/topics/activation-engineering/) works but is fragile. The magnitude must be carefully tuned, and adding a direction can cause unintended side effects. The open question: can we develop steering methods that are robust, predictable, and free of unintended consequences? The dual-use tension makes this especially delicate -- reliable control for safety is also reliable control for attack.

**Prediction.** Can MI predict model behavior on novel inputs? This is largely unsolved. Current MI is retrospective -- we explain what happened after the fact, not what will happen on unseen data. Attribution graphs hint at the possibility that internal reasoning patterns might generalize, but systematic prediction from mechanistic understanding remains aspirational.

**Microscope AI.** The most ambitious application goal: read off what a model knows without running the model at all. Extract knowledge directly from weights and features. Attribution graphs and feature dashboards hint at what is possible, but comprehensive "reading" of a model's knowledge is an open frontier.

## Concrete Research Questions

Alongside Sharkey et al.'s strategic framework, Nanda published "200 Concrete Open Problems in Mechanistic Interpretability" as a practical entry point for new researchers {% cite "nanda2022openproblems" %}. A Manifold prediction market resolved at 14% of these problems solved by 2025. That means 86% of the landscape remains open -- the field needs people.{% sidenote "The 14% resolution rate is notable because it suggests the problems are well-calibrated: not so easy that they all get solved quickly, not so hard that none do. Each problem is concrete enough to be a research project that could start this semester." %}

These are not abstract questions. Each connects directly to techniques we have studied.

**Circuits in the wild.** "Find new circuits beyond IOI." We studied the IOI circuit in detail -- 26 heads, 7 classes, one specific behavior. But IOI remains one of very few fully characterized circuits in the literature. Can we discover circuits for factual recall, reasoning, planning, humor, or code generation? Every new circuit adds to our understanding of how transformers compute. Most model behaviors have no known circuit.

**Interpreting algorithmic problems.** "Reverse-engineer learned algorithms in arithmetic, reasoning, and multi-step tasks." We saw induction heads as an example of a discovered algorithm: pattern matching via the [A...B...A] sequence to predict B. But what algorithms do models learn for addition, multiplication, or logical reasoning? Training dynamics give clues -- the induction head phase change reveals when algorithms form -- but the space of model-learned algorithms is largely unexplored.

**Exploring [superposition](/topics/superposition/).** "Characterize how superposition changes across model scale." The toy model showed phase diagrams for when superposition occurs as a function of sparsity and importance. In frontier models: how much superposition is there? Does it increase or decrease with scale? Are there regions of the model that are more or less superposed? Understanding superposition at scale would tell us how hard the decomposition problem really is.

**Techniques and tooling.** "Build better probes, better SAEs, better circuit discovery tools." Every tool we have studied has known failure modes. Probes can find information the model does not use. [SAEs](/topics/sparse-autoencoders/) split, absorb, and lose reconstruction fidelity. Automated circuit discovery needs to become faster, more reliable, and applicable to larger models. Improving the tools is itself a research frontier.

**Studying learned features.** "Characterize the feature geometry of frontier models." Features are directions in activation space, organized by sparsity and importance. But what does the full feature geometry look like in a 100-billion-parameter model? How many features are there? How are they organized -- do they form hierarchies, clusters, or something else entirely? These questions connect to everything we have studied.

<details class="pause-and-think">
<summary>Pause and think: Tractability vs. importance</summary>

Looking at these open problems, which category feels most tractable to you? Which feels most important? Are they the same category? If the most important problems are also the least tractable, how should the field allocate its limited resources? Should researchers focus on problems where progress is likely, or problems where progress would matter most?

</details>

## The Scale of What Remains

The open problems surveyed here are not peripheral issues waiting to be cleaned up. They are central to whether MI fulfills its promise as a tool for understanding and ensuring the safety of AI systems.

The methods problems -- decomposition, description, validation -- determine whether MI's foundations are sound. The application problems -- monitoring, control, prediction -- determine whether MI is practically useful. The concrete research questions represent the daily work that advances the field one result at a time.

What is encouraging is the clarity. The field knows what it does not know. The problems are well-characterized, the failure modes are documented, and the research community is growing. The ratio of open problems to active researchers remains very high, which means there is room for significant contributions from new researchers entering the field.

The [next article](/topics/field-assessment/) takes stock of where the field stands today -- what MI has achieved, what remains beyond reach, and how the community is responding to its most pointed critics.
