---
title: "Linear Artificial Tomography (LAT)"
description: "How to read what concepts a model represents by training linear classifiers on activations, following the population-level approach from cognitive neuroscience."
prerequisites:
  - title: "Contrastive Activation Addition (CAA)"
    url: "/topics/caa-method/"
block: "probing"
category: "methods"
---

## Reading Representations

[CAA](/topics/caa-method/) computes concept directions by averaging activation differences. But there is another way to find these directions: train a classifier to predict which concept is active, then examine what direction the classifier uses.

Zou et al. (2023) proposed **Linear Artificial Tomography (LAT)** as part of the Representation Engineering (RepE) framework {% cite "zou2023repe" %}. The key analogy comes from cognitive neuroscience: neuroscientists do not study individual neurons in isolation. They study population-level activity patterns -- the collective behavior of neural populations that corresponds to cognition, perception, and decision-making.

LAT applies the same philosophy to neural networks. Instead of dissecting individual circuits or features, LAT works at the level of *representations* -- the collective activation patterns that encode high-level concepts.{% sidenote "The population-level perspective represents a genuine philosophical shift. Most mechanistic interpretability work focuses on individual components: specific attention heads, individual neurons, or sparse autoencoder features. LAT argues that the most important unit of analysis is the representation -- a direction in the high-dimensional activation space that corresponds to a behavioral concept." %}

> **Linear Artificial Tomography (LAT):** A method for reading what concepts a model represents by training linear classifiers on activations from contrasting stimuli. LAT answers the question: "Does this model represent concept X? Where? How strongly?"

## The LAT Procedure

The procedure mirrors contrastive methods from neuroscience:

1. **Stimulate the model with contrasting inputs.** Present pairs of prompts that differ in a target concept -- for example, honest versus dishonest completions, or harmful versus harmless responses.

2. **Collect activations.** Run both sets through the model and collect residual stream activations at intermediate layers.

3. **Train a linear classifier.** Fit a logistic regression or linear probe on the activations to predict which behavior is active:

$$
p(\text{concept} | \mathbf{h}) = \sigma(\mathbf{w}^T \mathbf{h} + b)
$$

where $\mathbf{w}$ is the learned weight vector, $\mathbf{h}$ is the activation, and $\sigma$ is the sigmoid function.

4. **Extract the concept direction.** The weight vector $\mathbf{w}$ of the trained classifier *is* the concept direction. It points in the direction that best separates the two classes.

The result is a **concept direction** -- a linear direction in activation space that distinguishes one behavior from another.

## LAT vs. CAA

LAT and CAA are closely related but approach the problem differently:

| Method | Approach | Output |
|--------|----------|--------|
| **CAA** | Mean difference of activations | Concept direction (difference vector) |
| **LAT** | Train linear classifier | Concept direction (classifier weights) |

Both produce a direction in activation space. The difference is methodology:

- **CAA** computes the direction directly from activation differences.
- **LAT** learns the direction by training a classifier to distinguish the concepts.

In practice, the methods often produce similar directions. LAT has the advantage of providing a natural confidence measure (classifier accuracy) and can handle cases where the positive and negative sets have different sizes or distributions.{% sidenote "LAT is closely related to probing classifiers discussed in earlier articles. The key difference is intent: probing asks whether information is *decodable* from representations, while LAT asks whether it is *represented as a direction that can be read and controlled*. In practice, the methods are nearly identical -- both train linear classifiers on activations." %}

## Probing Safety-Relevant Properties

LAT can probe safety-relevant properties:

- **Honesty.** Does the model's representation encode whether it is generating truthful or false information? LAT can detect when a model "knows" it is lying.

- **Harmlessness.** Do harmful and harmless response trajectories separate in activation space? LAT can track this separation across layers.

- **Power-seeking.** Can we identify representations associated with power-seeking behavior? LAT provides a way to measure this.

The ability to *read* safety-relevant representations is arguably as important as the ability to *control* them. If we can detect when a model is being dishonest from its internal representations, we have a monitoring tool that does not depend on the model's outputs.

<details class="pause-and-think">
<summary>Pause and think: Reading versus controlling</summary>

LAT reads what concepts a model represents. [Addition steering](/topics/addition-steering/) controls behavior by adding directions. These use the same concept direction for different purposes. In what situations would you want to *read* a model's representations without *controlling* them? When would you want to *control* without reading first?

Reading without controlling is useful for monitoring and auditing. You might want to know whether a model is being honest without intervening -- for instance, during evaluation or deployment monitoring. Controlling without reading first is risky: you might steer in a direction that does not correspond to the concept you intended. In practice, it's best to always read first (to verify the direction is meaningful) before using it for control.

</details>

## Layer-by-Layer Analysis

LAT naturally supports layer-by-layer analysis. By training classifiers at each layer, you can track:

- **Where does the concept first become detectable?** Early layers may not yet encode high-level concepts.
- **Where is it most strongly represented?** Classifier accuracy peaks where the concept is most salient.
- **Does it persist to the final layer?** Some concepts are used internally but not directly reflected in outputs.

This layer-wise profile tells us how the model processes and represents concepts throughout its forward pass.

## The Connection to Control

The direction that LAT uses to *detect* a concept is the same direction that [addition steering](/topics/addition-steering/) *adds* to induce that concept. Reading and control are two sides of the same coin:

- **Read:** What does the model represent? (LAT, CAA)
- **Control:** How can we steer it? ([Addition](/topics/addition-steering/), [Ablation](/topics/ablation-steering/))

A concept direction that reads well but steers poorly suggests the representation is correlated with but not causal for the behavior. A direction that steers well but reads poorly suggests the intervention works through a mechanism we do not yet understand.

<details class="pause-and-think">
<summary>Pause and think: Classifier accuracy as a metric</summary>

LAT produces a classifier accuracy: how well can the linear probe distinguish the two concepts? What does high accuracy tell us? What does low accuracy tell us? Can you have a meaningful concept direction with low classifier accuracy?

High accuracy means the concept has a clean linear separation in activation space -- the model represents it as a clear direction. Low accuracy could mean several things: the concept is not linearly represented, the concept is distributed across multiple directions, or the contrast pairs do not cleanly isolate the concept. You can still have a meaningful direction with moderate accuracy if the direction is consistent and steers behavior effectively. The classifier accuracy is one signal among several.

</details>

## Looking Forward

LAT provides a principled method for reading what concepts a model represents. Combined with [CAA](/topics/caa-method/), it forms the **probing** half of representation engineering. The directions identified through probing can then be used for [steering](/topics/addition-steering/) and [ablation](/topics/ablation-steering/), completing the toolkit for understanding and controlling model representations.
