---
title: "Course Synthesis: From Transformers to Interpretability"
description: "A capstone synthesis of the full mechanistic interpretability curriculum -- the core insights, the toolkit, the limitations, and what comes next."
prerequisites:
  - title: "The Future of Mechanistic Interpretability"
    url: "/topics/future-directions/"
difficulty: "advanced"
block: "open-problems-and-frontiers"
category: "core-concepts"
---

## The Core Insight

Transformers are composed of analyzable components. This single claim, which seemed uncertain six years ago, has been established through the accumulated work surveyed across this course.

The [residual stream](/topics/attention-mechanism/#the-residual-stream) carries information between layers as a shared communication channel. [Attention heads](/topics/attention-mechanism/#multi-head-attention) move information between positions via QK/OV circuits, and their behavior can be decomposed mathematically. Features are directions in activation space, organized by sparsity and importance, and they emerge through [superposition](/topics/superposition/) when models need to represent more concepts than they have dimensions. Circuits are compositions of features and heads that implement specific computations, traceable through [attribution graphs](/topics/circuit-tracing/) at the feature level.

We can partially reverse-engineer these components. This is a genuine scientific achievement that did not exist before 2020. It is also, as the [field assessment](/topics/field-assessment/) made clear, a partial achievement -- with the word "partially" doing significant work.

## The Toolkit We Built

Each tool in the MI toolkit has moved from "novel research contribution" to "standard technique" in roughly two to three years. Taken together, they form a progression from observation to causation to decomposition to intervention.{% sidenote "The progression from observation to causation to decomposition to intervention mirrors the development of experimental science more broadly. First we observe (probing, logit lens). Then we establish causal relationships (patching). Then we decompose the system into parts (SAEs, circuits). Then we intervene to modify behavior (steering). Each stage builds on the previous one, and each requires the previous stages to be reliable." %}

**Observation.** The logit lens and tuned lens reveal what a model would predict if processing stopped at any given layer, providing a window into how predictions evolve through depth. Probing classifiers detect what information is linearly decodable from intermediate representations. These observational tools show what information *exists* inside a model, though not whether the model actually *uses* it.

**Causation.** [Activation patching](/topics/activation-patching/) establishes causal claims by replacing specific activations and measuring the effect on behavior. It tests which components the model relies on, distinguishing necessity from sufficiency through noising and denoising directions. Attribution patching provides a fast gradient-based approximation that scales to large models. Path patching refines this to trace specific connections between components, revealing the wiring of circuits rather than just which nodes participate.

**Decomposition.** [Sparse autoencoders](/topics/sparse-autoencoders/) address the core challenge of superposition by extracting interpretable features from high-dimensional activation spaces. Transcoders do the same for MLP layers, replacing opaque nonlinear transformations with sparse linear combinations of interpretable features. Together, they decompose the model into units that humans can examine and reason about -- with the important caveat that the decomposition may not capture the model's true computational structure.

**Intervention.** [Activation engineering](/topics/activation-engineering/) and steering modify model behavior by adding or subtracting directions in activation space. The [refusal direction](/topics/refusal-direction/) demonstrated that a single linear direction mediates an entire behavioral category -- removing it eliminates refusal, and adding it induces refusal in models that were not trained to refuse. Contrastive activation addition generalizes this to arbitrary behavioral traits. These interventions demonstrate that MI understanding can be translated into practical control, with all the dual-use implications that entails.

**Integration.** [Circuit tracing](/topics/circuit-tracing/) brings these tools together. Attribution graphs combine SAE features with gradient-based attribution to produce feature-level computational graphs for individual prompts. The Biology paper demonstrated that these graphs reveal internal reasoning patterns -- multi-step inference, multilingual processing, planning -- that are not visible from the model's external behavior alone.

## What Remains

The gap between what the toolkit can do and what safety requires is the central tension of this field. Four major gaps define the distance between the current state of MI and the ambitious goal of ensuring AI systems are safe and trustworthy.{% sidenote "These gaps are not independent. Scalability limits how much we can verify. Incomplete coverage means we cannot guarantee safety. The inability to detect natural deception undermines the practical value of monitoring. And the absence of formal guarantees means that even our best analyses carry irreducible uncertainty. Progress on any one gap would help with the others, but no single gap is sufficient to close on its own." %}

**Scalability.** Current MI techniques produce detailed analyses of individual prompts and small circuits, but frontier models process billions of tokens through trillions of parameters. Scaling from the IOI circuit (26 heads in GPT-2 Small) to production-grade analysis of 100-billion-parameter models remains an engineering and scientific challenge. The tools work, but they do not yet work fast enough or broadly enough.

**Completeness.** There is no proof that the features and circuits discovered by MI tools represent a complete picture of the model's computation. SAEs might miss entire categories of features. Circuit analyses that focus on specific behaviors leave the rest of the model's computation unexamined. A model could pass every MI audit while containing undiscovered dangerous capabilities.

**Natural deception detection.** The detection results that are most impressive -- defection probes with over 99% AUROC on sleeper agents -- apply to trained backdoors where the trigger leaves a detectable artifact. Whether MI can detect deceptive strategies that arise naturally through training, rather than being explicitly inserted, is unknown and represents perhaps the most safety-critical open question.

**Formal guarantees.** MI currently produces scientific understanding: "we believe this circuit implements this algorithm for this class of inputs." It does not produce engineering guarantees: "we prove this model will never exhibit this dangerous behavior." The gap between understanding and proof is wide, and bridging it requires connecting MI to formal verification -- a frontier that the [previous article](/topics/future-directions/) identified as the most ambitious and furthest from current practice.

## The Honest Assessment

MI is a useful but limited tool in a layered safety strategy.

This assessment, which emerged from the [field assessment article](/topics/field-assessment/), deserves to be stated precisely rather than vaguely. "Useful" means MI produces genuine insights that no other approach provides -- internal features, causal circuits, mechanistic explanations of behavior. "Limited" means MI cannot currently provide the comprehensive safety guarantees that some have hoped for -- global descriptions, completeness proofs, natural deception detection. "Layered" means MI works alongside behavioral testing, formal verification, governance frameworks, and careful deployment practices, not as a replacement for any of them.

The most ambitious vision of mechanistic interpretability -- fully reverse-engineering frontier models into human-understandable algorithms -- is probably unachievable in the relevant timeframe. The pragmatic vision -- useful partial understanding for specific safety applications -- is making real progress. The field is young (2020 to 2026), growing, and needs people.

<details class="pause-and-think">
<summary>Pause and think: Synthesizing the course</summary>

You have now covered the full arc: from [how attention works](/topics/attention-mechanism/) to [why superposition makes interpretability hard](/topics/superposition/), from [patching individual activations](/topics/activation-patching/) to [tracing full circuits](/topics/circuit-tracing/), from [extracting features](/topics/sparse-autoencoders/) to [steering behavior](/topics/refusal-direction/), from [safety applications](/topics/mi-safety-limitations/) to [open problems](/topics/open-problems-methods/).

What is the single most important thing you have learned? Not the most technically impressive result, but the insight that most changed how you think about AI systems, safety, or interpretability.

</details>

## What You Now Know

You now understand what mechanistic interpretability is, what it has achieved, and what remains.

You can read the primary literature: Elhage et al. on the mathematical framework and superposition, Olsson et al. on induction heads, Wang et al. on the IOI circuit, Bricken et al. and Templeton et al. on sparse autoencoders, Lindsey et al. on circuit tracing, Arditi et al. on the refusal direction, and Sharkey et al. on open problems.

You know the core toolkit: probing, [patching](/topics/activation-patching/), [SAEs](/topics/sparse-autoencoders/), [steering](/topics/activation-engineering/), [circuit tracing](/topics/circuit-tracing/), and model diffing. You understand not just how each tool works, but what each tool's limitations are and when it should not be trusted.

You know where the field stands: genuine progress, real limitations, open frontiers. You know the strongest criticism (Hendrycks), the insider assessment (Nanda), and the pragmatic response (useful partial understanding). You know that 86% of 200 concrete problems remain unsolved, that the field needs researchers, and that structured programs exist for getting started.

Whether you continue into MI research, apply these ideas in industry, or simply carry a deeper understanding of how AI systems work internally, you now have the foundation.

<details class="pause-and-think">
<summary>Pause and think: What comes next for you?</summary>

This is the final article in the course. Looking at the [five research frontiers](/topics/future-directions/) and the [open problems](/topics/open-problems-methods/), is there a direction that calls to you? A problem that you want to work on? A tool that you want to build or improve? The field is young enough that meaningful contributions are within reach -- what would yours be?

</details>
