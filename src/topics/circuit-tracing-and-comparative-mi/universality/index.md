---
title: "Universality Across Models"
description: "The evidence for and against the universality hypothesis -- whether different neural networks learn similar features and circuits -- and the metrics used to measure representation similarity."
order: 7
prerequisites:
  - title: "Crosscoders and Model Diffing"
    url: "/topics/crosscoders-and-model-diffing/"

glossary:
  - term: "Universality"
    definition: "The hypothesis that different neural networks trained on similar tasks converge on similar internal representations and circuits, suggesting that certain computational solutions are natural or optimal for given problems."
---

## The Universality Hypothesis

In [What is Interpretability?](/topics/what-is-mech-interp/), we encountered three foundational claims from Olah et al.: features are the fundamental unit of neural network computation, features are connected into circuits, and -- the boldest claim -- **analogous features and circuits form across different models trained on different data**. This third claim is the *universality hypothesis*.

If universality holds, it has profound implications for interpretability. Understanding one model's features and circuits would transfer to other models. Safety analysis performed on a smaller model might generalize to larger ones. The interpretability problem would be finite -- there is a vocabulary of features to discover, not an unbounded space of model-specific representations.

But how strong is the evidence? And what exactly does "universality" mean -- do different models learn the *same* features, or merely *similar* ones? These are the questions we address here.{% sidenote "The universality hypothesis sits at the intersection of a theoretical hope and an empirical question. If neural networks consistently converge on the same internal structure, it suggests that the features they learn reflect genuine structure in the data distribution, not arbitrary computational artifacts. This would make MI not just useful but *natural* -- we would be discovering the data's structure, not the model's idiosyncrasies." %}

## Representation Similarity Metrics

Before examining the evidence for universality, we need tools to measure whether two models' representations are similar. Two metrics dominate the field: CKA and SVCCA.

### CKA: Centered Kernel Alignment

Kornblith et al. (2019) introduced **CKA** (Centered Kernel Alignment), the most widely used metric for comparing representations across models.

The intuition: given two networks, compute the *representational similarity matrix* for each -- how similar are pairs of inputs according to each network? Then measure the alignment between these matrices.

$$\text{CKA}(X, Y) = \frac{\text{HSIC}(X, Y)}{\sqrt{\text{HSIC}(X, X) \cdot \text{HSIC}(Y, Y)}}$$

where HSIC is the Hilbert-Schmidt Independence Criterion, a kernel-based measure of statistical dependence between two sets of representations.

> **Centered Kernel Alignment (CKA):** A similarity metric that measures alignment between the representational similarity structures of two networks. CKA is invariant to orthogonal transformations (if two networks learn the same representations in different coordinate systems, CKA still detects the correspondence) and invariant to isotropic scaling. CKA ranges from 0 (no alignment) to 1 (perfect alignment).

**Key finding:** CKA reveals that independently trained networks develop similar layer-wise structure. Early layers are more similar across networks than later layers, suggesting that lower-level features are more universal than higher-level ones.

### SVCCA: An Earlier Approach

Before CKA, Raghu et al. (2017) proposed **SVCCA** (Singular Vector Canonical Correlation Analysis):

1. Apply SVD to select the most important directions in each representation
2. Use CCA (Canonical Correlation Analysis) to measure pairwise correlation between the selected directions

SVCCA found that networks converge to final representations *from the bottom up* -- lower layers stabilize first during training. However, CKA has largely superseded SVCCA because it more reliably detects correspondences between networks trained from different initializations.{% sidenote "Why does CKA outperform SVCCA? CKA measures the alignment of full representational *structures* (similarity matrices over inputs), while SVCCA measures the alignment of individual *directions*. Directions can differ across models even when the overall structure is preserved, making SVCCA more sensitive to superficial differences in coordinate systems." %}

### Representation Similarity vs. Feature-Level Comparison

CKA and SVCCA answer a holistic question: "Are these representations similar overall?" [Crosscoders](/topics/crosscoders-and-model-diffing/) answer a finer question: "What specific features are shared or different?"

The two approaches are complementary. CKA is computationally cheap and provides a quick global assessment. Crosscoders are expensive (they require training) but reveal the specific features that drive similarity or difference. Use CKA to determine *whether* models are similar; use crosscoders to determine *how* they differ.

## Three Dimensions of Universality

The evidence for universality comes along three dimensions: training universality (same architecture, different random seeds), scale universality (same architecture, different sizes), and architecture universality (different architectures entirely).

![Diagram showing the three dimensions of universality: training universality (different seeds converge), scale universality (features persist across model sizes), and architecture universality (Transformers and Mamba share features).](/topics/universality/images/universality_evidence.png "Figure 1: Three dimensions of universality. Training universality asks whether different training runs converge. Scale universality asks whether features persist across model sizes. Architecture universality asks whether fundamentally different architectures learn similar features.")

### Training Universality

Gurnee et al. (2024) studied GPT-2 models trained from different random seeds {% cite "gurnee2024universal" %}. The key findings:

- **1-5% of neurons are universal** -- they consistently activate on the same inputs across independently trained models
- Universal neurons are **monosemantic and interpretable**, with large weight norms and low activation frequency
- They have **clear functional roles**: deactivating attention heads, changing entropy of the next-token distribution, predicting token set membership

These are not merely similar features -- they are the *same* computational units discovered independently by different training runs. The fact that they are monosemantic is particularly notable: the neurons that are most consistent across training runs are also the most interpretable, supporting the hypothesis that monosemantic features reflect genuine structure in the data.

### Scale Universality

Evidence suggests that features found in smaller models also appear in larger ones:

- Features discovered by SAEs in small models (e.g., GPT-2) often have counterparts in larger models (e.g., GPT-2 XL, Llama)
- The feature vocabulary seems to *grow* with scale rather than *change* -- larger models add new features on top of the existing ones
- Larger models may represent the same concepts with higher fidelity and less [superposition](/topics/superposition/)

This is encouraging for interpretability research: understanding small models may transfer to understanding large ones, at least at the feature level. The features discovered during [scaling monosemanticity](/topics/scaling-monosemanticity/) in Claude 3 Sonnet included many features analogous to those found in the much smaller one-layer model studied earlier.

<details class="pause-and-think">
<summary>Pause and think: What would break universality?</summary>

If universality holds, features discovered in one model should appear in others. Under what conditions might universality break down? Consider: models trained on very different data distributions, models with very different architectures, or models trained with very different objectives. Would a vision model and a language model share features? Would a model trained on code share features with one trained on natural language?

The answer may depend on what level of abstraction you consider. At the lowest level (token patterns, syntax), features are domain-specific. At higher levels (logical structure, causal reasoning), there may be more commonality. The universality hypothesis is likely not all-or-nothing but a matter of degree that varies across feature types.

</details>

### Architecture Universality

Wang et al. (2024) compared features across entirely different architectures:

- Trained SAEs on both **Transformer** and **Mamba** (a state-space model) and compared the learned features
- Most features are similar across architectures
- **Induction circuits** in Mamba are structurally analogous to those in Transformers, with an "off-by-one" motif difference

This is the strongest form of universality: not just the same architecture with different initializations, but fundamentally different computational primitives converging on similar features. Transformers use attention to route information; Mamba uses selective state spaces. Yet they learn comparable features for similar tasks.{% sidenote "Architecture universality is particularly important for MI's future. If new architectures (SSMs, hybrid models, mixture-of-experts) learn similar features to Transformers, then MI tools developed for Transformers may transfer. If not, MI would need to develop architecture-specific methods for each new model family." %}

## Weak vs. Strong Universality

It is important to be precise about what universality claims:

**Weak universality:** Different models develop features that serve similar *functions* (e.g., both detect sentence boundaries), but the specific directions and implementations may differ. The features are *analogous* but not *identical*.

**Strong universality:** Different models develop the *same* features with corresponding directions that can be mapped onto each other. The features are not just functionally similar but representationally equivalent.

Current evidence supports weak universality fairly well. Strong universality is harder to establish and remains an active research question. The universal neurons result (1-5% of neurons are truly universal) suggests that strong universality holds for a small fraction of features, while weak universality holds more broadly.

[Crosscoders](/topics/crosscoders-and-model-diffing/) provide the most direct test of universality at the feature level: a crosscoder trained across two models finds shared features (evidence for universality) and exclusive features (evidence against it). CKA provides a holistic measure of representation alignment that does not require identifying individual features.

<details class="pause-and-think">
<summary>Pause and think: Universality and safety</summary>

If universality holds, MI results from one model may generalize to others. Why is this crucial for AI safety?

Consider a safety evaluation that discovers a dangerous internal mechanism in Model A. If universality holds, we have reason to check whether Model B has a similar mechanism -- and the tools (crosscoders, CKA) to test this efficiently. If universality does not hold, every model is a blank slate requiring full analysis from scratch. With models being deployed at increasing scale and speed, the ability to transfer safety insights across models could be the difference between tractable and intractable safety evaluation.

</details>

## Key Takeaways

- The **universality hypothesis** -- that different models learn similar features and circuits -- has gained substantial evidence along three dimensions: training, scale, and architecture.
- **CKA** is the standard metric for measuring representation similarity holistically. **SVCCA** was an earlier approach now largely superseded.
- **1-5% of neurons are universal** across independently trained models, and these universal neurons are monosemantic and interpretable.
- **Weak universality** (similar functions) is well-supported. **Strong universality** (identical representations) holds for a small fraction of features and remains an active research question.
- Universality is crucial for scalable safety analysis: if features transfer across models, MI insights can generalize rather than being model-specific.
