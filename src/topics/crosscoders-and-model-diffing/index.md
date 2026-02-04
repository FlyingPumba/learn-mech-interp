---
title: "Crosscoders and Model Diffing"
description: "How crosscoders train shared feature dictionaries across models to reveal what fine-tuning changes, enabling direct comparison of base and instruction-tuned models."
prerequisites:
  - title: "Circuit Tracing and Attribution Graphs"
    url: "/topics/circuit-tracing/"
difficulty: "advanced"
block: "circuit-tracing-and-comparative-mi"
category: "methods"
---

## The Comparison Question

Everything we have covered so far in circuit analysis operates on a *single model*. [Transcoders](/topics/transcoders/) decompose what one model's MLPs compute. [Attribution graphs](/topics/circuit-tracing/) trace circuits through one model's feature network. But some of the most important questions in interpretability require comparing *two* models.

Consider safety fine-tuning. A base model is trained on next-token prediction, then further trained with RLHF or DPO to refuse harmful requests, follow instructions, and behave helpfully. The chat model behaves differently from the base model. But what actually changed *inside*? Did safety training restructure the model's representations, or did it make targeted modifications to a small number of directions?{% sidenote "The [refusal direction](/topics/refusal-direction/) finding suggests the answer is 'targeted modifications.' A single direction mediates refusal across 13 models. But that analysis examined one behavior at a time. What about all the other changes that safety training introduces -- instruction following, formatting, tone, helpfulness? Model diffing addresses the full picture." %}

Crosscoders provide a systematic answer. By training a shared feature dictionary across two models simultaneously, we can identify exactly which features are shared, which are unique to the base model, and which are unique to the fine-tuned model.

## From SAEs to Crosscoders

In [sparse autoencoders](/topics/sparse-autoencoders/), the encoder reads from a single activation vector $\mathbf{x}^{(\ell)}$ at one layer of one model, and the decoder reconstructs that same vector through a sparse bottleneck.

> **Crosscoder:** A crosscoder is a sparse autoencoder variant that reads from (and writes to) concatenated activations from multiple layers or multiple models. It learns a shared dictionary of features across all sources simultaneously. Where a standard SAE operates on a single activation vector $\mathbf{x}^{(\ell)}$, a crosscoder operates on the concatenation of activations from multiple sources:
>
> $$\mathbf{x}_{\text{concat}} = [\mathbf{x}_{\text{base}};\; \mathbf{x}_{\text{chat}}]$$

The crosscoder learns a single dictionary. For each dictionary element, it learns a pair of latent directions -- one per model. This forces the crosscoder to find common structure across models while also representing model-specific features.

### Three Applications

Crosscoders have three main uses:

1. **Cross-layer features:** Track features that persist across layers in the residual stream, resolving cross-layer superposition. A feature like "this token is a proper noun" might be active from layer 3 through layer 15; a crosscoder represents it once rather than rediscovering it at each layer.

2. **Circuit simplification:** By identifying persistent features, crosscoders remove redundant "identity" connections from circuit analysis. If a feature simply passes through several layers unchanged, the crosscoder collapses those connections into a single node.

3. **Model diffing:** Train a crosscoder on activations from two models to discover what they share and where they differ. This is the most safety-relevant application.

## How Model Diffing Works

To diff a base model against its fine-tuned variant, train a single crosscoder on concatenated activations:

$$\mathbf{x}_{\text{concat}} = [\mathbf{x}_{\text{base}};\; \mathbf{x}_{\text{chat}}]$$

The crosscoder learns a shared dictionary. Each learned feature falls into one of three categories:

- **Shared features:** Active in both models. The concept is preserved after fine-tuning. These represent the vast majority of features -- fine-tuning does not restructure the model's core representations.
- **Base-exclusive features:** Active only in the base model. These represent concepts or behaviors that fine-tuning suppresses or redirects.
- **Chat-exclusive features:** Active only in the chat model. These represent concepts or behaviors that fine-tuning introduces -- including safety-relevant patterns like refusal, instruction following, and output formatting.

![Diagram showing a crosscoder architecture with two models' activations concatenated as input, a shared sparse dictionary in the middle, and outputs that reconstruct both models' activations. Features are labeled as shared, base-exclusive, or chat-exclusive.](/topics/crosscoders-and-model-diffing/images/crosscoder_model_diffing.png "Figure 1: Crosscoder architecture for model diffing. Activations from both models are concatenated and encoded through a shared sparse dictionary. Each feature is classified as shared (active in both), base-exclusive, or chat-exclusive based on its activation pattern.")

<details class="pause-and-think">
<summary>Pause and think: Interpreting shared vs. exclusive features</summary>

A crosscoder finds features shared between a base model and its chat variant. What would it mean if *most* features are shared? What if very few are?

If most features are shared, it suggests that safety fine-tuning makes targeted modifications to a small number of directions, leaving the model's core representations intact. This aligns with the refusal direction finding -- safety behavior encoded in a small number of directions, not distributed across the entire model. If very few features were shared, it would suggest that fine-tuning fundamentally restructures the model, which would make safety training more robust but also more disruptive to capabilities.

</details>

## What Model Diffing Reveals

When applied to base and chat model pairs, crosscoders produce several key findings:

**Most features are shared.** Fine-tuning changes a relatively small fraction of the model's representations. The base model's knowledge and capabilities are largely preserved -- consistent with the empirical observation that chat models retain most of their base model's benchmark performance.

**Chat-exclusive features** include safety-relevant concepts like refusal patterns, instruction-following behaviors, and output formatting conventions. These are the features that make a chat model behave like a chat model.

**Base-exclusive features** include some capabilities that safety training suppresses or redirects. Understanding these is important for assessing whether safety training might inadvertently remove useful capabilities.{% sidenote "Model diffing provides a more complete picture than the refusal direction alone. The refusal direction finding showed that one direction mediates refusal across 13 models. Model diffing systematically catalogs *all* directions that differ between base and chat models. The refusal direction should appear as one of the chat-exclusive features, but model diffing also reveals the broader landscape of changes." %}

This is consistent with the [refusal direction](/topics/refusal-direction/) analysis: safety fine-tuning makes *targeted* changes, not wholesale restructuring of the model's internal representations.

## Limitations of Model Diffing

### The Polysemanticity Problem for Exclusive Features

A significant limitation: **exclusive features tend to be polysemantic**. Features unique to one model are harder to interpret than shared features. Why? The crosscoder has limited capacity to represent model-specific concepts. Exclusive features absorb multiple concepts into single directions -- the same capacity pressure that causes [polysemanticity in standard SAEs](/topics/superposition/). This means the most interesting features (what changed during fine-tuning) are often the hardest to interpret.

### L1 Artifacts

The standard L1 sparsity penalty introduces two artifacts that distort model diffing results:

**Complete shrinkage.** L1 forces some base-model directions to zero even when they are genuinely present. Features that are active in the base model but weakly active in the chat model get misclassified as "base-exclusive" when they should be "shared."

**Latent decoupling.** A concept that both models represent may be encoded by *different* feature combinations in each model. The crosscoder treats them as separate features rather than recognizing the shared concept.

Both artifacts inflate the count of exclusive features and deflate shared features, making fine-tuning appear more disruptive than it actually is.

### The BatchTopK Fix

Replacing L1 with **BatchTopK** addresses these artifacts. BatchTopK directly enforces sparsity by keeping only the $k$ largest activations per batch -- the same idea as TopK SAEs. It eliminates shrinkage bias (features are either active or not, with no magnitude penalty) and identifies more genuine model-specific features. The lesson: evaluation methodology matters. The choice of sparsity penalty changes *what you find*, not just how well you find it.

## The Training Objective

The crosscoder training objective mirrors standard SAEs, applied to the concatenated input:

$$\mathcal{L} = \|\mathbf{x}_{\text{concat}} - \hat{\mathbf{x}}_{\text{concat}}\|^2 + \lambda \sum_j |f_j|$$

The reconstruction term ensures both models are faithfully represented. The sparsity term encourages each feature to be active in only a few inputs. The shared dictionary forces the crosscoder to find common structure across models.{% sidenote "The loss function treats both models equally. In principle, you could weight one model more heavily to prioritize faithful reconstruction of that model. In practice, equal weighting works well because the shared features dominate and the equal treatment prevents the crosscoder from ignoring the model with fewer unique features." %}

<details class="pause-and-think">
<summary>Pause and think: Safety implications of model diffing</summary>

Model diffing reveals that safety fine-tuning makes targeted changes to a small number of features, leaving most of the model's representations intact. Is this good news or bad news for AI safety?

On one hand, targeted changes mean that safety training is efficient -- it adds safety behaviors without destroying capabilities. On the other hand, targeted changes might be easier to reverse. If safety is concentrated in a small number of exclusive features, an adversary (or even further fine-tuning) could potentially remove those features while preserving the model's capabilities. The refusal direction result already showed this is possible for one behavior. Model diffing suggests the pattern may be more general.

</details>

## Key Takeaways

- **Crosscoders** extend SAEs to operate across models, learning a shared dictionary that classifies features as shared, base-exclusive, or chat-exclusive.
- **Model diffing** reveals that fine-tuning makes *targeted* changes. Most features are shared between base and chat models, with a relatively small number of exclusive features encoding safety behaviors and instruction following.
- **Exclusive features are harder to interpret** due to polysemanticity from limited capacity, and L1 artifacts inflate apparent differences between models.
- Crosscoders complement [CKA and SVCCA](/topics/universality/), which measure representation similarity holistically. CKA tells you *whether* models are similar; crosscoders tell you *how* they differ.
