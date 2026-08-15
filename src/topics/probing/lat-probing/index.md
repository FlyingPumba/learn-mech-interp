---
title: "Linear Artificial Tomography (LAT)"
description: "How to read what concepts a model represents by training linear classifiers on activations, following the population-level approach from cognitive neuroscience."
order: 4
prerequisites:
  - title: "Contrastive Activation Addition (CAA)"
    url: "/topics/caa-method/"
---

## Reading Representations

[CAA](/topics/caa-method/) computes concept directions by averaging activation differences. But there is another way to find these directions: train a classifier to predict which concept is active, then examine what direction the classifier uses.

Zou et al. (2023) proposed **Linear Artificial Tomography (LAT)** as part of the Representation Engineering (RepE) framework {% cite "zou2023repe" %}. The key analogy comes from cognitive neuroscience: neuroscientists do not study individual neurons in isolation. They study population-level activity patterns, the collective behavior of neural populations that corresponds to cognition, perception, and decision-making.

LAT applies the same philosophy to neural networks. Instead of dissecting individual circuits or features, LAT works at the level of *representations*, the collective activation patterns that encode high-level concepts.{% sidenote "The population-level perspective represents a genuine philosophical shift. Most mechanistic interpretability work focuses on individual components: specific attention heads, individual neurons, or sparse autoencoder features. LAT argues that the most important unit of analysis is the representation, a direction in the high-dimensional activation space that corresponds to a behavioral concept." %}

> **Linear Artificial Tomography (LAT):** A method for training linear classifiers on activations from contrasting stimuli. It tests where a labeled distinction is linearly decodable and extracts the classifier's separating direction.

## The LAT Procedure

The procedure mirrors contrastive methods from neuroscience:

1. **Stimulate the model with contrasting inputs.** Present pairs of prompts that differ in a target concept, for example, honest versus dishonest completions, or harmful versus harmless responses.

2. **Collect activations.** Run both sets through the model and collect residual stream activations at intermediate layers.

3. **Train a linear classifier.** Fit a logistic regression or linear probe on the activations to predict which behavior is active:

$$
p(\text{concept} | \mathbf{h}) = \sigma(\mathbf{w} \cdot \mathbf{h} + b)
$$

where $\mathbf{w}$ is the learned weight vector, $\mathbf{h}$ is the activation, and $\sigma$ is the sigmoid function.

4. **Extract a candidate direction.** The classifier weight $\mathbf{w}$ defines the separating direction learned from these examples.

The classifier weights define a candidate **concept direction**: a direction that separates the two labeled sets. Transfer and counterexample tests are needed to determine whether the direction tracks the intended concept rather than a correlated difference.

## LAT vs. CAA

LAT and CAA are closely related but approach the problem differently:

| Method | Approach | Output |
|--------|----------|--------|
| **CAA** | Mean difference of activations | Concept direction (difference vector) |
| **LAT** | Train linear classifier | Concept direction (classifier weights) |

Both produce a direction in activation space. The difference is methodology:

- **CAA** computes the direction directly from activation differences.
- **LAT** learns the direction by training a classifier to distinguish the concepts.

The methods can produce similar directions when the class covariances are well behaved. LAT directly optimizes classification and supplies held-out accuracy as an accessibility measure; CAA estimates a mean shift without fitting a decision boundary. Neither metric alone measures causal use or semantic purity.{% sidenote "LAT is closely related to the probing classifiers discussed earlier. The mathematical procedure is probing; the Representation Engineering framing emphasizes reusing the learned direction for analysis and possible intervention." %}

## Probing Safety-Relevant Properties

LAT can probe safety-relevant properties:

- **Honesty labels.** Can a classifier distinguish activations from examples labeled truthful and deceptive, including on new topics and prompt formats?

- **Harmlessness.** Do harmful and harmless response trajectories separate in activation space? LAT can track this separation across layers.

- **Power-seeking.** Can we identify representations associated with power-seeking behavior? LAT provides a way to measure this.

A direction that generalizes across suitable held-out conditions could become one signal in an internal monitor. It would still require calibration against false positives, distribution shift, and strategic evasion before “dishonesty detector” is an appropriate label.

<details class="pause-and-think">
<summary>Pause and think: Reading versus controlling</summary>

LAT reads what concepts a model represents. [Addition steering](/topics/addition-steering/) controls behavior by adding directions. These use the same concept direction for different purposes. In what situations would you want to *read* a model's representations without *controlling* them? When would you want to *control* without reading first?

Reading without controlling is useful when the goal is diagnosis or monitoring. Control without a prior probe is possible, for example through direct optimization of a behavioral metric, but then the mechanism and off-target effects may be harder to characterize. In either order, readout and intervention provide different evidence and should be evaluated separately.

</details>

## Layer-by-Layer Analysis

LAT naturally supports layer-by-layer analysis. By training classifiers at each layer, you can track:

- **Where does the concept first become detectable?** Early layers may not yet encode high-level concepts.
- **Where is it most linearly accessible?** Classifier accuracy can peak where the labeled distinction is easiest to separate.
- **Does it persist to the final layer?** Some concepts are used internally but not directly reflected in outputs.

This layer-wise profile maps linear decodability through the forward pass. It does not, by itself, reveal when the information was computed or where it is causally used.

## The Connection to Control

The direction that LAT uses to separate labels can also be tried as an [addition-steering](/topics/addition-steering/) vector. Good classification does not guarantee good steering, so the two uses form a useful comparison:

- **Read:** What does the model represent? (LAT, CAA)
- **Control:** How can we steer it? ([Addition](/topics/addition-steering/), [Ablation](/topics/ablation-steering/))

A concept direction that reads well but steers poorly suggests the representation is correlated with but not causal for the behavior. A direction that steers well but reads poorly suggests the intervention works through a mechanism we do not yet understand.

<details class="pause-and-think">
<summary>Pause and think: Classifier accuracy as a metric</summary>

LAT produces a classifier accuracy: how well can the linear probe distinguish the two concepts? What does high accuracy tell us? What does low accuracy tell us? Can you have a meaningful concept direction with low classifier accuracy?

High accuracy means the labeled examples are linearly separable in the sampled activations. The separating direction may encode the target property, a correlated cue in the dataset, or both. Low accuracy could reflect nonlinear encoding, weak labels, a poor layer choice, or a concept the model does not represent. Accuracy is therefore one piece of evidence, to be paired with transfer tests and interventions.

</details>

## Looking Forward

LAT provides a standard linear-probing route to candidate representation directions. Combined with [CAA](/topics/caa-method/), it supplies hypotheses that can be tested with [steering](/topics/addition-steering/), [ablation](/topics/ablation-steering/), transfer sets, and off-target evaluations.
