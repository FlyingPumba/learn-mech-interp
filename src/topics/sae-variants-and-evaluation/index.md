---
title: "SAE Variants, Evaluation, and Honest Limitations"
description: "The landscape of SAE architectures beyond vanilla L1 -- Gated, TopK, and JumpReLU SAEs -- how to evaluate them with SAEBench, and the honest limitations that remain unsolved."
prerequisites:
  - title: "Scaling Monosemanticity and Feature Steering"
    url: "/topics/scaling-monosemanticity/"
difficulty: "advanced"
block: "superposition-and-feature-extraction"
category: "methods"
---

## The L1 Problem

The sparse autoencoders that produced the scaling monosemanticity results use an L1 penalty on feature activations to encourage sparsity. The training objective is:

$$
\mathcal{L} = \underbrace{\|\mathbf{x} - \hat{\mathbf{x}}\|_2^2}_{\text{reconstruction}} + \lambda \underbrace{\|\mathbf{f}\|_1}_{\text{sparsity}}
$$

The L1 term $\|\mathbf{f}\|_1 = \sum_i |f_i|$ pushes feature activations toward zero, encouraging sparse representations. This is the standard approach, and it works well enough to produce millions of interpretable features. But it has a fundamental problem.

The L1 penalty does not just encourage sparsity. It also distorts feature magnitudes. The model can reduce $\|\mathbf{f}\|_1$ by making all activations smaller, even when they should be large. This creates **shrinkage**: systematic underestimation of how active each feature truly is. The sparsity penalty trades reconstruction accuracy for a lower sparsity cost, and the features we recover are biased as a result.{% sidenote "Shrinkage from L1 regularization is a well-known phenomenon in statistics, where it appears in the context of LASSO regression. The LASSO estimator produces biased coefficient estimates that are systematically too small. SAEs inherit this same bias because they use the same L1 penalty for sparsity." %}

The core issue is that L1 conflates two distinct questions:

1. **Which features are active?** This is the selection decision -- a binary on/off question.
2. **How active are they?** This is the magnitude estimation -- a continuous value.

L1 penalizes both simultaneously. A feature that should be active with magnitude 5.0 might only reach 3.0 because the L1 penalty pushes it down. The selection might be correct (the feature is active), but the magnitude is wrong (it is too small). This distortion flows into the reconstructed activation and degrades the SAE's fidelity.

What we actually want is L0 sparsity: a count of how many features are active.

$$
L_0(\mathbf{f}) = |\{i : f_i \neq 0\}|
$$

L0 cares only about whether features are on or off. It does not penalize magnitudes. But L0 is not differentiable -- it is a step function that jumps at zero -- so we cannot optimize it directly with gradient descent. The L1 norm is a convex relaxation that approximates L0 but introduces shrinkage as a side effect.

The history of SAE variants is the story of getting closer to direct L0 optimization. Each variant addresses a specific shortcoming of its predecessor, and the overall trajectory moves from "L1 as a rough proxy" to "something much closer to what we actually want."

## Gated SAEs: Separate Selection from Magnitude

> **Gated SAE:** An SAE architecture that uses two separate pathways -- a gating pathway for feature selection and a magnitude pathway for activation estimation -- so that the L1 sparsity penalty applies only to the selection decision and cannot distort magnitude estimates {% cite "rajamanoharan2024gated" %}.

Rajamanoharan et al. (2024) identified the core problem: vanilla SAEs use a single pathway for both selection and magnitude, which means the L1 penalty distorts both {% cite "rajamanoharan2024gated" %}. Their solution is to decouple them into two separate pathways.

The **gating pathway** makes the binary on/off decision for each feature. A learned linear transformation followed by a threshold determines which features are active. The L1 penalty applies only here, encouraging the gate to be sparse.

The **magnitude pathway** estimates how active each feature is, using a separate linear transformation. Because this pathway is free from the L1 penalty, it can estimate magnitudes without bias.

The combined activation is:

$$
\mathbf{f} = \underbrace{\mathbf{1}[\mathbf{W}_{\text{gate}} \mathbf{x} + \mathbf{b}_{\text{gate}} > 0]}_{\text{which features (gate)}} \odot \underbrace{\sigma(\mathbf{W}_{\text{mag}} \mathbf{x} + \mathbf{b}_{\text{mag}})}_{\text{how active (magnitude)}}
$$

where $\odot$ is elementwise multiplication and $\mathbf{1}[\cdot]$ is the indicator function. The gate decides which features are on. The magnitude pathway decides how strong they are. The sparsity penalty cannot distort magnitudes because it only touches the gate.

The result is a Pareto improvement over vanilla SAEs: better reconstruction at every sparsity level. At any given L0 (number of active features), the Gated SAE achieves lower reconstruction error than the vanilla SAE. You get sparser decompositions without sacrificing fidelity.

## TopK SAEs: Direct Sparsity Enforcement

> **TopK SAE:** An SAE architecture that enforces exact sparsity by keeping only the $k$ largest pre-activations and zeroing out the rest, eliminating the need for an L1 penalty entirely {% cite "gao2024scaling" %}.

Gao et al. (2024) took a more direct approach: skip L1 entirely {% cite "gao2024scaling" %}. The TopK activation function retains only the $k$ largest pre-activations and sets all others to zero:

$$
f_i = \begin{cases} z_i & \text{if } z_i \text{ is in the top-}k \\ 0 & \text{otherwise} \end{cases}
$$

where $z_i = (\mathbf{W}_{\text{enc}} \mathbf{x} + \mathbf{b}_{\text{enc}})_i$ is the pre-activation for feature $i$.

Sparsity is exactly $L_0 = k$ by construction. There is no L1 penalty at all, so there is no shrinkage. The $k$ features that survive the selection pass through with their full magnitudes intact. The loss function is simply reconstruction error -- no sparsity term needed.

Gao et al. demonstrated TopK SAEs at extreme scale. They trained a 16-million-latent SAE on GPT-4 activations, the largest SAE training run published to date. They demonstrated clean scaling laws: larger SAEs produce better features following power-law relationships, paralleling the scaling laws found in language models themselves.{% sidenote "The TopK scaling work from OpenAI (Gao et al.) and the scaling monosemanticity work from Anthropic (Templeton et al.) represent the two largest SAE training runs to date. Both find power-law scaling of feature quality with dictionary size, suggesting a robust empirical regularity rather than an artifact of a specific setup." %}

The limitation of TopK is rigidity: every token uses exactly $k$ features, regardless of whether that token is simple or complex. A common function word like "the" might need only 5 features, while a technical term in a specialized context might need 50. TopK forces both to use the same number, which is likely suboptimal.

<details class="pause-and-think">
<summary>Pause and think: Fixed vs. adaptive sparsity</summary>

TopK SAEs enforce the same number of active features $k$ for every input. Is this reasonable? Think about a language model processing the sentence "The cat sat on the mat." Would you expect every token to require the same number of features? What about a sentence like "The intricate geopolitical ramifications of the treaty were debated at the symposium"? How might you design an SAE that adapts its sparsity to the input?

</details>

## JumpReLU SAEs: Learnable Thresholds

> **JumpReLU SAE:** An SAE architecture with a discontinuous activation function that uses a learnable threshold $\theta_i$ per feature, zeroing pre-activations below the threshold and passing those above through unchanged, enabling direct L0 optimization via straight-through estimators {% cite "rajamanoharan2024jumprelu" %}.

Rajamanoharan et al. (2024) introduced a different solution: a discontinuous activation function with a learnable threshold {% cite "rajamanoharan2024jumprelu" %}:

$$
f_i = \begin{cases} z_i & \text{if } z_i > \theta_i \\ 0 & \text{if } z_i \leq \theta_i \end{cases}
$$

Each feature has its own threshold $\theta_i$. Pre-activations below the threshold are zeroed; those above pass through unchanged. There is no shrinkage because the surviving activations are not modified at all. And unlike TopK, different inputs can have different numbers of active features, because the threshold is per-feature rather than global.

The challenge is training. The JumpReLU function is discontinuous at $\theta_i$, which blocks gradient flow. Rajamanoharan et al. use straight-through estimators (STEs) to handle this: they replace the discontinuous gradient with a smooth approximation during the backward pass, while keeping the discontinuous function during the forward pass. This allows the thresholds $\theta_i$ to be learned end-to-end.

The loss function directly optimizes L0 sparsity:

$$
\mathcal{L} = \|\mathbf{x} - \hat{\mathbf{x}}\|_2^2 + \lambda \cdot L_0(\mathbf{f})
$$

No L1 term at all. No shrinkage. No magnitude distortion. The L0 penalty counts active features, and the STE provides the gradients needed to train the thresholds that control which features are active.

The result: state-of-the-art reconstruction fidelity at a given sparsity level on Gemma 2 9B, outperforming both Gated and TopK SAEs. Rajamanoharan et al. released hundreds of JumpReLU SAEs on every layer of Gemma 2 2B and 9B, enabling community research.

## The Evolution at a Glance

The four SAE architectures form an iterative improvement story:

**Vanilla L1:** Simple but biased. The L1 penalty introduces shrinkage that distorts feature magnitudes.

**Gated:** Separate selection from magnitude. The sparsity penalty applies only to the gate, leaving magnitudes unbiased. A Pareto improvement over vanilla.

**TopK:** Enforce exact sparsity directly. No L1 penalty at all. But fixed $k$ for every input may be suboptimal.

**JumpReLU:** Learnable per-feature thresholds with direct L0 optimization. Adaptive sparsity, no shrinkage, state-of-the-art performance.

The trend is clear: from L1 as a crude proxy for sparsity to direct L0 optimization. Each variant fixes a specific problem in the previous approach. The improvements are real and well-documented. But do they translate to better interpretability in practice?

## Evaluating SAEs: SAEBench

Most SAE work evaluates progress using unsupervised proxy metrics: reconstruction loss ($\|\mathbf{x} - \hat{\mathbf{x}}\|^2$), L0 sparsity (how many features are active), and explained variance (what fraction of activation variance the SAE captures). These are easy to compute and clearly defined. But do they measure what we actually care about?

Karvonen et al. (2025) built SAEBench, a comprehensive evaluation suite that asks a more direct question: can SAE features actually be used for interpretability tasks? {% cite "karvonen2025saebench" %}

SAEBench includes eight metrics spanning four categories:

- **Concept detection:** Can SAE features identify known concepts like gender, profession, and sentiment?
- **Interpretability:** Are features human-interpretable? Do automated descriptions match activation patterns?
- **Feature disentanglement:** Do individual features correspond to individual concepts, or are related concepts entangled across multiple features?
- **Reconstruction quality:** The standard proxy metrics, included for comparison.

The key finding is sobering: **proxy metrics do not reliably predict practical performance.** SAE variants that improve reconstruction loss and L0 sparsity do not consistently improve concept detection, interpretability, or disentanglement. In concrete terms, a JumpReLU SAE with better reconstruction than a vanilla SAE may not be better at detecting the "deception" concept.{% sidenote "SAEBench found that the improvements from Gated, TopK, and JumpReLU SAEs over vanilla SAEs are often difficult to differentiate on practical metrics. The variants excel on proxy metrics but perform similarly on concept detection and disentanglement. This suggests that the reconstruction-sparsity frontier is a necessary but insufficient condition for good interpretability." %}

This result does not invalidate the architectural improvements. Better reconstruction and lower shrinkage are genuinely desirable properties. But SAEBench demonstrates that optimizing for reconstruction loss alone is insufficient for the downstream tasks we care about. We need evaluation that directly measures interpretability, not just proxies that we hope correlate with it.

The field lacks consensus on what "a good SAE" means in practice. Proxy metrics are insufficient. Task-specific evaluation is necessary but depends on having ground-truth concepts to test against. Building better evaluation methods remains one of the most important open problems in SAE research.

## Honest Limitations

We have seen the successes: millions of interpretable features, multilingual abstractions, causal steering, iteratively improved architectures. These are real accomplishments. But SAEs have serious, well-documented limitations that affect the reliability of any analysis built on top of them. Understanding these limitations is not optional. It determines whether SAEs are a reliable tool or an appealing but fragile one.

### Feature Absorption

Chanin et al. (2024) identified feature absorption: a failure mode where hierarchical features collapse {% cite "chanin2024absorption" %}.

Consider a hierarchy of features:
- Parent feature: "word starts with the letter A"
- Child feature: "the word Apple"

In a well-behaved SAE, both features should fire for "Apple" -- the parent (starts with A) and the child (the specific word). But absorption causes the parent feature to not fire for inputs that match a child feature.

Why does this happen? The sparsity objective incentivizes the SAE to reduce the number of active features per input. If "Apple" can be explained by the "Apple" feature alone, the SAE learns to suppress the "starts with A" feature for that input. This reduces L0 by one. The result: the parent feature "starts with A" fires for "Axolotl" and "Azure" but not for "Apple" -- even though "Apple" starts with A. The parent feature has been absorbed into its children.

Feature absorption is serious for several reasons. Feature circuits cannot be sparse if parent features are absorbed: you cannot trace "starts with A" through the model because the feature does not fire reliably. The problem is robust to hyperparameter tuning -- Chanin et al. showed it persists across different SAE sizes, sparsity levels, and training configurations. It may be a structural consequence of the sparsity objective, not a fixable bug.

### Feature Splitting

As SAE dictionary size increases, features split into finer sub-features. A "mathematics" feature may split into "algebra," "geometry," "calculus," and so on. Sometimes this is desirable: finer granularity reveals more structure in the model's representations. Sometimes it is pathological: the original concept disappears entirely, replaced by many overlapping sub-features that are individually less interpretable.

The boundary between useful refinement and problematic fragmentation is unclear. There is no principled way to determine the right level of granularity. The "correct" dictionary size depends on what you want to use the features for, and different downstream tasks may require different levels of granularity.

### Dead Features

A dead feature is one that never activates after training. Templeton et al. (2024) found that up to 65% of features can be dead in large SAEs {% cite "templeton2024scaling" %}. Without mitigations, the dead feature rate can reach 90%.

Dead features waste dictionary capacity. A 34-million-latent SAE with 22 million dead features is effectively a 12-million-latent SAE that consumed the training compute of one three times larger. Mitigations exist -- auxiliary loss terms that penalize inactivity, initializing encoder weights from the decoder transpose -- but they reduce the problem without eliminating it. Dead features remain a significant source of wasted capacity in all SAE variants.

### Non-Uniqueness

SAEs trained with different random seeds on the same model activations learn substantially different feature sets. Two independently trained SAEs decompose the same activation into different features. Some features are stable across runs (robust, likely meaningful). Others appear in one run but not another.

This raises a fundamental question: do SAE features reflect the model's "true" features (if such a thing exists), or are they one of many valid decompositions? If the decomposition is not unique, then claims about specific features -- "the model has a deception feature" -- are claims about one particular SAE, not about the model itself. Different SAEs might find different "deception" features, or might not find one at all.

### Interpretability Illusions

Features can create an illusion of interpretability: they look interpretable but are not what they seem.{% sidenote "The term 'interpretability illusion' comes from Bolukbasi et al. (2021), who demonstrated the phenomenon in BERT. The core issue is that explanations can have good recall (they fire on most relevant examples) but poor precision (they also fire on many irrelevant examples). The human examining the feature sees the relevant examples, assigns a clean label, and does not notice the false positives." %}

Consider this scenario:

1. You find a feature and examine its top activating examples.
2. The top examples all involve "deception" -- you label it a "deception feature."
3. But the feature actually fires on "social interaction" more broadly, and deception is a subset of social interaction.
4. Your label is not wrong (the feature does fire for deception) but it is misleading (the feature fires for much more).

This is not a hypothetical concern. Automated interpretability scoring systems are vulnerable to exactly this failure mode. A feature with good recall but poor precision gets a high interpretability score because the scoring system sees that the label matches the activations. But the label is incomplete.

The practical consequence: safety-relevant conclusions based on SAE features may be less reliable than they appear. A "deception feature" that actually represents "social interaction" gives a false sense of security when monitored. Its activation (or lack thereof) does not tell us what we think it tells us.

<details class="pause-and-think">
<summary>Pause and think: The overall assessment</summary>

We have seen the successes (Golden Gate Claude, millions of interpretable features) and the limitations (absorption, splitting, dead features, non-uniqueness, interpretability illusions). On balance, are SAEs a useful tool for mechanistic interpretability? What would it take for them to become a reliable tool? Consider: is there a fundamental tension between sparsity (which SAEs optimize for) and the properties we need for reliable interpretability?

</details>

## The State of SAEs

SAEs are the best tool we have for decomposing superposition. No other approach has demonstrated interpretable feature extraction at the scale of Claude 3 Sonnet. No other approach has produced causal steering results as vivid as Golden Gate Claude. The iterative improvement from vanilla L1 to JumpReLU shows healthy methodological progress.

But "the best tool we have" does not mean "good enough." The decomposition is not unique -- training conditions determine the features. Evaluation is incomplete -- proxy metrics do not predict practical performance. Fundamental issues like absorption and interpretability illusions persist across all architectures and hyperparameter settings.

This does not invalidate SAEs. It contextualizes them. They are a necessary but insufficient step toward understanding model internals. We should use SAEs with awareness of their limitations, not treat their outputs as ground truth.

The next step beyond per-layer SAEs is [transcoders](/topics/transcoders/) -- models that directly map features between layers rather than decomposing each layer independently. And beyond individual features lies the question of how features connect into circuits, which is the domain of [circuit tracing and attribution graphs](/topics/circuit-tracing/).
