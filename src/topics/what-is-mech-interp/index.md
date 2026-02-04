---
title: "What is Mechanistic Interpretability?"
description: "The landscape of neural network interpretability approaches and the three core claims that define mechanistic interpretability as a field."
prerequisites:
  - title: "The Attention Mechanism"
    url: "/topics/attention-mechanism/"
difficulty: "foundational"
block: "foundations-of-mi"
category: "core-concepts"
---

## Why Study Neural Network Internals?

Deep learning models are powerful but opaque. A language model can write fluent text, answer complex questions, and reason through multi-step problems. But *how* does it do this? What algorithms has it learned? If we deploy these systems in high-stakes settings, we face an uncomfortable question: can we trust behavior we do not understand?

Behavioral testing can catch known failure modes, but it cannot guarantee correct behavior on novel inputs. A model that passes every test we design might still harbor unexpected behaviors in situations we never thought to check. We need a deeper form of assurance, one that goes beyond observing what a model does and instead explains *how* it arrives at its outputs.

This is the motivation for interpretability: making neural networks understandable to humans. And within interpretability, a specific subfield has emerged that takes this goal to its most ambitious form. Rather than treating models as black boxes whose outputs we can only observe, **mechanistic interpretability** aims to reverse-engineer them into human-understandable algorithms by analyzing the computations performed by individual components and their interactions {% cite "bereska2024review" %}.

## The Interpretability Landscape

Interpretability methods vary along several axes. Understanding where mechanistic interpretability sits in this landscape clarifies what it is and what it is not.

**Black-box vs. white-box methods.** Black-box methods analyze a model by observing its inputs and outputs without looking inside. You probe behavior with curated datasets, measure feature attributions to determine which input tokens matter, and test counterfactual inputs to see how outputs change. The model is treated as a function $f: X \to Y$. White-box methods take the opposite approach: open the model and analyze its internal computations. Examine weight matrices, trace information flow through components, and identify internal algorithms. The model is treated as a mechanism to be reverse-engineered.{% sidenote "Black-box interpretability has produced valuable tools like LIME and SHAP, which assign importance scores to input features. These methods are model-agnostic and widely used. But they cannot explain *how* the model arrives at its answer, only *which inputs* contributed to it. Mechanistic interpretability asks the deeper question: what algorithm connects those inputs to the output?" %}

**Post-hoc vs. intrinsic interpretability.** Post-hoc interpretability analyzes a model after training. The model was not designed to be interpretable; we apply tools after the fact to understand what it learned. Intrinsic interpretability takes the opposite approach: build models that are interpretable by design, constraining the architecture or training procedure to produce understandable components. This trades off some performance for transparency. Mechanistic interpretability is primarily post-hoc: we take existing trained models and open them up.

**Correlation vs. causation.** This distinction runs through the entire field and will reappear in later articles. Observational methods tell us what information *exists* in a model's representations. Causal methods tell us what information the model actually *uses*. A probe trained on layer 6 activations might decode part-of-speech with 95% accuracy, but does the model *use* part-of-speech information at layer 6? Not necessarily. The information could be present but ignored by downstream computation. Distinguishing what is encoded from what is causally relevant is one of the central challenges of interpretability.{% sidenote "The correlation-causation distinction becomes concrete in later articles on probing classifiers and activation patching. Probing is observational: it detects what information is encoded. Activation patching is causal: it tests whether a component is necessary for a specific behavior. The gap between the two is often surprising." %}

> **Mechanistic Interpretability:** The subfield of AI interpretability that aims to reverse-engineer neural networks into human-understandable algorithms by analyzing the computations performed by individual components and their interactions. MI is white-box (we look inside the model), post-hoc (applied to trained models), and aims for causal understanding (not just correlation).

The goal is not just to describe *what* the model does, but to explain *how* it does it at the level of concrete mechanisms. When a language model predicts that "The Eiffel Tower is located in the city of ..." should be completed with "Paris," MI asks: which attention heads contributed to this prediction? What information did they move, and from where? What role did the MLPs play? Can we trace a specific circuit through the model that implements this factual recall?

## The Three Claims: Features, Circuits, Universality

In "Zoom In: An Introduction to Circuits," Olah et al. proposed three deliberately speculative claims about the understandability of neural networks {% cite "olah2020zoom" %}. These claims are not proven laws. They are a framework -- a bet on how neural networks organize their computations. The value lies in the framework itself: even if some claims need revision, they give us a concrete vocabulary and a research program.

The authors draw an analogy to cell theory in biology. In 1839, Theodor Schwann proposed three claims about cells: all living organisms are composed of cells, the cell is the basic unit of life, and cells arise from spontaneous generation. Two of these survived. The third (spontaneous generation) was wrong. But the *framework* of cell theory transformed biology into a science. Olah et al. propose an analogous framework for neural networks, with the same epistemic humility: some claims may not fully hold, and that is fine. The framework is what matters.

### Claim 1: Features

> **Feature:** A direction in a neural network's activation space that corresponds to a human-understandable concept. Features are the fundamental unit of neural networks.

Not individual neurons, but *directions* -- vectors in the high-dimensional activation space. A feature corresponds to a direction $\mathbf{d}_f \in \mathbb{R}^{d_{\text{model}}}$. To measure how strongly feature $f$ is active in a residual stream state $\mathbf{r}$:

$$
\text{feature activation} = \mathbf{r} \cdot \mathbf{d}_f
$$

This is a dot product -- a linear operation. The feature activation is the projection of the residual stream onto the feature direction. For a transformer, this might be a direction in the residual stream that activates strongly when the model processes mentions of Paris, or a direction that encodes the concept of "this token is the subject of the sentence."

Why directions rather than neurons? We will see in a moment that individual neurons are typically **polysemantic** -- they respond to multiple unrelated concepts. Features as directions are the cleaner unit of analysis.

### Claim 2: Circuits

> **Circuit:** A computational subgraph of the neural network, consisting of features connected by weighted edges (via the model's weights). Circuits implement specific, identifiable algorithms.

Features do not exist in isolation. They connect to form circuits that perform computation. In a transformer, imagine a pair of attention heads where one copies the previous token's identity to the current position, and the other uses that copied information to match repeated patterns. Together, they implement pattern completion -- a specific algorithm for in-context learning. This is exactly the [induction head circuit](/topics/induction-heads/), which we will study in a later article.

### Claim 3: Universality

The most speculative claim: analogous features and circuits form across different models trained on different data. If universality holds, there is a shared vocabulary of computational motifs. Similar attention patterns and feature directions appear in GPT-2, GPT-3, and other transformer models.{% sidenote "Evidence for universality remains limited and mixed. Induction heads -- a specific two-head circuit pattern for in-context learning -- appear across models of very different sizes. Similar previous-token heads appear in many models. But whether universality extends to complex circuits and high-level features is an open question. The claim is best treated as a productive hypothesis rather than an established fact." %}

<details class="pause-and-think">
<summary>Pause and think: Non-linear features</summary>

Can you think of a feature that might NOT be a simple direction in activation space? Consider concepts like "this sentence is a question" or "this number is larger than 100." These might require more than a single linear direction to represent. What does this suggest about the limits of the features-as-directions framework?

</details>

## Why MI Matters for AI Safety

If we deploy powerful AI systems, we need to verify their behavior. Behavioral testing can catch known failure modes, but it cannot guarantee correct behavior on unseen inputs. We need a deeper form of assurance: understanding the internal mechanisms that produce the model's behavior.

If we can identify the internal mechanisms a model uses, we can check whether those mechanisms implement the behavior we want. A model that has learned a "deception" circuit producing misleading outputs when it detects certain conditions could, in principle, be identified through MI before deployment. The aspiration is to move from "the model passes our tests" to "we understand how the model works, and its mechanisms match our intentions."

This is still an active research problem. Current MI tools do not yet scale to full verification of large models. But the mathematical framework is the foundation, and rapid progress on techniques like [sparse autoencoders](/topics/sparse-autoencoders/) and circuit tracing is pushing the frontier forward. We will return to the safety applications of MI in later articles on sleeper agent detection and deception detection.

## A Young and Rapidly Evolving Field

MI has developed rapidly. Distill.pub published early circuits work on vision models in 2017-2019. Olah et al. proposed the features-circuits-universality framework in 2020. Elhage et al. developed the mathematical framework for transformer circuits in 2021, discovering induction heads in the process. The period from 2022 to 2023 brought the IOI circuit analysis, the superposition hypothesis, and early sparse autoencoders. By 2024-2025, researchers were applying attribution graphs and SAEs to frontier models like Claude 3 Sonnet.

Several things are worth keeping in mind as you study this material. MI is a young field -- many of its core results are from the last 3-4 years. It is rapidly evolving, and techniques that are state-of-the-art today may be superseded soon. The foundational *concepts* (features, circuits, [superposition](/topics/superposition/)) are more stable than the specific methods. This course emphasizes the concepts.

<details class="pause-and-think">
<summary>Pause and think: Understanding vs. correlation</summary>

What evidence would convince you that a model "understands" something versus merely correlating with it? This question runs through the entire field of mechanistic interpretability. Keep it in mind as we move through the coming articles on circuits, probing, and causal methods.

</details>

## Looking Ahead

We have now defined what mechanistic interpretability is and what it seeks: features as directions in activation space, circuits connecting those features through the model's weights, and potentially universal patterns recurring across models. The next article on the [linear representation hypothesis](/topics/linear-representation-hypothesis/) takes the features claim deeper, asking *why* features should be linear directions and what happens when the model has more features than dimensions.
