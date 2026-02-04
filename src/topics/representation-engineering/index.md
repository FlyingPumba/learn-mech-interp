---
title: "Representation Engineering"
description: "The representation engineering paradigm for reading and controlling model behavior through internal representations, unifying activation engineering approaches."
prerequisites:
  - title: "Activation Engineering: ActAdd and CAA"
    url: "/topics/activation-engineering/"
difficulty: "advanced"
block: "representation-engineering"
category: "core-concepts"
---

## From Techniques to a Framework

[Activation engineering](/topics/activation-engineering/) showed that we can steer model behavior by adding carefully computed vectors to the residual stream. ActAdd uses a single contrast pair; CAA averages over many pairs. But these are individual techniques. Where is the unifying framework?

Zou et al. (2023) proposed **Representation Engineering (RepE)** -- a paradigm that places population-level representations at the center of analysis {% cite "zou2023repe" %}. The key analogy comes from cognitive neuroscience: neuroscientists do not study individual neurons in isolation. They study population-level activity patterns -- the collective behavior of neural populations that corresponds to cognition, perception, and decision-making.

RepE applies the same philosophy to neural networks. Instead of dissecting individual circuits or features, RepE works at the level of *representations* -- the collective activation patterns that encode high-level concepts like honesty, harmlessness, or sycophancy.{% sidenote "The population-level perspective represents a genuine philosophical shift. Most mechanistic interpretability work from the transformer circuits thread focuses on individual components: specific attention heads, individual neurons, or sparse autoencoder features. RepE argues that the most important unit of analysis is the representation -- a direction in the high-dimensional activation space that corresponds to a behavioral concept." %}

> **Representation Engineering (RepE):** A top-down approach to AI transparency that centers on population-level representations rather than individual model components. RepE encompasses both **representation reading** (identifying what concepts a model encodes) and **representation control** (modifying behavior by intervening on those representations).

## Two Components: Reading and Control

RepE provides two complementary capabilities:

### Representation Reading via LAT

**Linear Artificial Tomography (LAT)** is RepE's method for reading what concepts a model represents. The procedure mirrors contrastive methods from neuroscience:

1. **Stimulate the model with contrasting inputs.** Present pairs of prompts that differ in a target concept -- for example, honest versus dishonest completions, or harmful versus harmless responses.

2. **Observe the difference in activations.** Collect residual stream activations from both sets and compute their difference. This can be done via mean difference (as in CAA) or via PCA on the pooled activations.

3. **Train a linear classifier.** Fit a logistic regression or linear probe on the activations to predict which behavior is active.

The result is a **concept direction** -- a linear direction in activation space that distinguishes one behavior from another. LAT answers the question: "Does this model represent honesty? Where? How strongly?"{% sidenote "LAT is closely related to the probing classifiers discussed in earlier articles. The key difference is intent: probing asks whether information is *decodable* from representations, while LAT asks whether it is *represented as a direction that can be read and controlled*. In practice, the methods are nearly identical -- both train linear classifiers on activations. The RepE framing adds the explicit connection to representation control." %}

### Representation Control

Once you have identified a concept direction via LAT, you can use it to steer behavior -- this is **representation control**. The method is the same as activation engineering: add or subtract the concept direction during inference:

$$
\mathbf{h}'_\ell = \mathbf{h}_\ell + \alpha \cdot \mathbf{d}_{\text{concept}}
$$

where $\mathbf{d}_{\text{concept}}$ is the direction identified by LAT.

The key insight is that reading and control are two sides of the same coin. The direction that a linear classifier uses to *detect* a concept is the same direction you *add* to induce that concept.

## Safety Applications

RepE demonstrates reading and controlling several safety-relevant properties:

- **Honesty.** Read whether the model's representations encode truthfulness, then steer toward honesty. The honesty direction can distinguish when a model "knows" it is generating false information.

- **Harmlessness.** Detect and control tendencies to generate harmful content. The harmlessness direction separates harmful from harmless response trajectories in activation space.

- **Power-seeking.** Identify and suppress representations associated with power-seeking behavior -- a property that matters for alignment of advanced AI systems.

These are not toy demonstrations. They work on frontier models and address properties that matter for alignment research. The ability to *read* safety-relevant representations is arguably as important as the ability to *control* them -- if we can detect when a model is being dishonest from its internal representations, we have a monitoring tool that does not depend on the model's outputs.

<details class="pause-and-think">
<summary>Pause and think: Reading versus controlling</summary>

Representation reading (LAT) and representation control use the same concept direction. But they serve different purposes. In what situations would you want to *read* a model's representations without *controlling* them? When would you want to *control* without reading first?

Reading without controlling is useful for monitoring and auditing. You might want to know whether a model is being honest without intervening -- for instance, during evaluation or deployment monitoring. Controlling without reading first is risky: you might steer in a direction that does not correspond to the concept you intended. In practice, RepE advocates always reading first (to verify the direction is meaningful) before using it for control.

</details>

## How ActAdd and CAA Fit Within RepE

The relationship between the techniques is hierarchical:

- **ActAdd** is a specific method for representation control using one contrast pair.
- **CAA** is a specific method for representation control using many contrast pairs.
- **RepE** is the theoretical framework that encompasses both, plus representation reading (LAT) and additional analysis methods.

Think of RepE as the paradigm; ActAdd and CAA are tools within it.{% sidenote "The terminology can be confusing because the methods were published independently. Turner et al. introduced ActAdd in 2023. Panickssery et al. introduced CAA in 2024. Zou et al. introduced RepE in 2023. RepE was published around the same time as ActAdd, but framed the work more broadly. In retrospect, ActAdd and CAA are specific instantiations of RepE's representation control component." %}

The framework unifies three capabilities:

1. **Read:** What does the model represent? (LAT, linear probes)
2. **Control:** How can we steer it? (ActAdd, CAA, representation control)
3. **Analyze:** What does the intervention tell us about the model? (Comparing representations across layers, models, or training stages)

This unification is important because it connects the *diagnostic* question (what does the model encode?) with the *interventional* question (can we change it?). A concept direction that reads well but steers poorly suggests the representation is correlated with but not causal for the behavior. A direction that steers well but reads poorly suggests the intervention works through a mechanism we do not yet understand.

<details class="pause-and-think">
<summary>Pause and think: The limits of linear representations</summary>

RepE assumes that high-level behavioral concepts like honesty and harmlessness are represented as linear directions in activation space. Under what circumstances might this assumption fail? What kinds of behaviors might resist linear representation?

The assumption likely fails for behaviors that are highly context-dependent or compositional. "Be helpful" might require different strategies in different contexts, making it difficult to capture with a single direction. Similarly, behaviors defined by the *absence* of something (e.g., "do not discuss topic X") may not have clean linear representations. The refusal direction is a notable counterexample -- safety-relevant refusal behavior *is* linear, which has profound implications for both understanding and bypassing safety training.

</details>

## The Representation Engineering Toolkit

RepE provides the conceptual foundation for a complete toolkit of representation-level interventions:

- **Read** with LAT and linear probes -- detect what concepts are encoded.
- **Add** with ActAdd, CAA, and representation control -- steer behavior toward a concept.
- **Remove** with [concept erasure](/topics/concept-erasure/) methods like LEACE -- provably erase a concept from representations.

Each operation corresponds to a different geometric operation on the activation space: projection for reading, addition for steering, orthogonal complement for erasure.{% sidenote "The geometric perspective is illuminating. In a high-dimensional activation space, a concept direction defines a one-dimensional subspace. Reading projects activations onto this subspace. Steering adds a vector along this subspace. Erasure projects activations onto the orthogonal complement of this subspace. These are the three fundamental linear operations on a subspace." %}

The [refusal direction](/topics/refusal-direction/) provides the most dramatic demonstration of this toolkit in action: a single direction that mediates safety-critical behavior across 13 different models, and can be read, added, or removed with simple linear operations.
