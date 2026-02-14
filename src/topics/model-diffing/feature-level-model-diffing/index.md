---
title: "Feature-Level Model Diffing"
description: "How crosscoders compare base and fine-tuned models at the feature level, what sparsity artifacts distort the results, and how BatchTopK crosscoders find genuinely chat-specific features."
order: 2
prerequisites:
  - title: "Crosscoders"
    url: "/topics/crosscoders/"

glossary:
  - term: "Model Diffing"
    definition: "The practice of comparing internal representations between two related models (such as a base model and a fine-tuned version) to identify which features or circuits changed, using tools like crosscoders."
  - term: "Latent Scaling"
    definition: "A diagnostic technique for crosscoders that measures how well a supposedly model-specific latent can explain activations in both models, detecting false attributions caused by L1 sparsity artifacts."
---

## The Comparison Question

Some of the most important questions in interpretability require comparing *two* models. Consider safety fine-tuning. A base model is trained on next-token prediction, then further trained with RLHF or DPO to refuse harmful requests, follow instructions, and behave helpfully. The chat model behaves differently from the base model. But what actually changed *inside*? Did safety training restructure the model's representations, or did it make targeted modifications to a small number of directions?{% sidenote "The [refusal direction](/topics/refusal-direction/) finding suggests the answer is 'targeted modifications.' A single direction mediates refusal across 13 models. But that analysis examined one behavior at a time. What about all the other changes that safety training introduces -- instruction following, formatting, tone, helpfulness? Feature-level model diffing addresses the full picture." %}

[Logit diff amplification](/topics/logit-diff-amplification/) compares models at the output level, amplifying behavioral differences to surface rare changes. Feature-level model diffing goes deeper: it compares models at the representation level, using [crosscoders](/topics/crosscoders/) to identify exactly which internal features are shared, which are suppressed, and which are introduced by fine-tuning.

## How Feature-Level Model Diffing Works

To diff a base model against its fine-tuned variant, we train a single crosscoder on concatenated activations from both models:

$$\mathbf{x}_{\text{concat}} = [\mathbf{x}_{\text{base}};\; \mathbf{x}_{\text{chat}}]$$

The crosscoder learns a shared dictionary where each latent has separate decoder vectors for each model: $\mathbf{d}_j^{\text{base}}$ and $\mathbf{d}_j^{\text{chat}}$. When a latent is important for reconstructing one model's activations, its decoder vector for that model will have substantial norm. When it is irrelevant, the decoder norm approaches zero.

We classify each latent using the relative norm difference:

$$\Delta_{\text{norm}}(j) = \frac{\|\mathbf{d}_j^{\text{chat}}\|_2 - \|\mathbf{d}_j^{\text{base}}\|_2}{\max(\|\mathbf{d}_j^{\text{chat}}\|_2, \|\mathbf{d}_j^{\text{base}}\|_2)}$$

A value near 1 indicates a chat-only latent (base decoder has zero norm). A value near 0 indicates a base-only latent. Values around 0.5 indicate a shared latent. Each learned feature falls into one of three categories:

- **Shared features:** Active in both models. The concept is preserved after fine-tuning. These represent the vast majority of features.
- **Base-exclusive features:** Active only in the base model. These represent concepts or behaviors that fine-tuning suppresses or redirects.
- **Chat-exclusive features:** Active only in the chat model. These represent concepts or behaviors that fine-tuning introduces -- including safety-relevant patterns like refusal, instruction following, and output formatting.

<details class="pause-and-think">
<summary>Pause and think: Interpreting shared vs. exclusive features</summary>

A crosscoder finds features shared between a base model and its chat variant. What would it mean if *most* features are shared? What if very few are?

If most features are shared, it suggests that safety fine-tuning makes targeted modifications to a small number of directions, leaving the model's core representations intact. This aligns with the refusal direction finding -- safety behavior encoded in a small number of directions, not distributed across the entire model. If very few features were shared, it would suggest that fine-tuning fundamentally restructures the model, which would make safety training more robust but also more disruptive to capabilities.

</details>

## What Model Diffing Reveals

When applied to base and chat model pairs, crosscoders produce several key findings {% cite "lindsey2025circuittracing" %}:

**Most features are shared.** Fine-tuning changes a relatively small fraction of the model's representations. The base model's knowledge and capabilities are largely preserved -- consistent with the empirical observation that chat models retain most of their base model's benchmark performance.

**Chat-exclusive features** include safety-relevant concepts like refusal patterns, instruction-following behaviors, and output formatting conventions. These are the features that make a chat model behave like a chat model.

**Base-exclusive features** include some capabilities that safety training suppresses or redirects. Understanding these is important for assessing whether safety training might inadvertently remove useful capabilities.{% sidenote "Model diffing provides a more complete picture than the refusal direction alone. The refusal direction finding showed that one direction mediates refusal across 13 models. Model diffing systematically catalogs *all* directions that differ between base and chat models. The refusal direction should appear as one of the chat-exclusive features, but model diffing also reveals the broader landscape of changes." %}

This is consistent with the [refusal direction](/topics/refusal-direction/) analysis: safety fine-tuning makes *targeted* changes, not wholesale restructuring of the model's internal representations.

## The Polysemanticity Problem for Exclusive Features

A significant limitation: **exclusive features tend to be polysemantic**. Features unique to one model are harder to interpret than shared features. The crosscoder has limited capacity to represent model-specific concepts. Exclusive features absorb multiple concepts into single directions -- the same capacity pressure that causes [polysemanticity in standard SAEs](/topics/superposition/). This means the most interesting features (what changed during fine-tuning) are often the hardest to interpret.

## Sparsity Artifacts in L1 Crosscoders

The limitations of model diffing go beyond polysemanticity. Minder et al. (2025) showed that the standard L1 sparsity penalty introduces two artifacts that can systematically distort model diffing results, causing features to be misclassified as model-specific when they are actually shared {% cite "minder2025crosscoders" %}:

### Complete Shrinkage

The L1 penalty in crosscoders penalizes the norm of decoder vectors:

$$\mathcal{L}_{\text{L1}}(x) = f_j(x) \left(\|\mathbf{d}_j^{\text{base}}\|_2 + \|\mathbf{d}_j^{\text{chat}}\|_2\right)$$

When a latent's contribution to the base model is smaller than its contribution to the chat model, L1 regularization can force $\mathbf{d}_j^{\text{base}}$ to zero despite the latent's genuine presence in the base activations. The latent's base-model information gets absorbed into the reconstruction error $\varepsilon^{\text{base}}$ rather than being properly attributed. The feature gets misclassified as "chat-only" when it should be "shared."

This is the same shrinkage phenomenon that affects standard SAEs -- L1 penalizes magnitude, so small but genuine contributions get eliminated.

### Latent Decoupling

A concept that both models represent may be encoded by *different* combinations of latents in each model. The crosscoder's sparsity penalty treats both representations as equivalent, so it may use a chat-only latent for a concept that the base model represents through a different combination of base latents. The concept appears in the base reconstruction $\tilde{\mathbf{h}}^{\text{base}}$ but is attributed to the wrong latents.

Both artifacts inflate the count of exclusive features and deflate shared features, making fine-tuning appear more disruptive than it actually is.

## Latent Scaling: Diagnosing the Problem

To detect these artifacts, Minder et al. developed **Latent Scaling** -- a diagnostic that measures how well a supposedly chat-only latent actually explains base model activations.

For a chat-only latent $j$, we find the optimal scaling factor $\beta_j^{\text{base}}$ that minimizes reconstruction error when using the latent's chat decoder direction to explain base activations:

$$\beta_j^{\text{base}} = \underset{\beta}{\text{argmin}} \sum_{i=1}^{n} \|\beta f_j(x_i) \mathbf{d}_j^{\text{chat}} - \mathbf{h}^{\text{base}}(x_i)\|_2^2$$

For a genuinely chat-specific latent, we would expect $\beta_j^{\text{base}} \approx 0$ -- the latent's direction should not help explain base activations. A non-zero value suggests the latent is actually present in both models.

To distinguish the two artifact types, we compute the **chat-specificity ratio** $\nu_j = \beta_j^{\text{base}} / \beta_j^{\text{chat}}$. A value near zero indicates a genuinely chat-specific latent; a value near one indicates the latent is equally present in both models. We can further decompose this into an error ratio $\nu_j^\varepsilon$ (detecting Complete Shrinkage -- the latent's information appears in the reconstruction *error*) and a reconstruction ratio $\nu_j^r$ (detecting Latent Decoupling -- the latent's information appears in the base *reconstruction* via other latents).

## The BatchTopK Fix

Replacing L1 with **BatchTopK** substantially mitigates both artifacts. BatchTopK enforces sparsity by selecting only the top $k$ most active latents per batch rather than penalizing decoder norms. This eliminates the two L1 failure modes:

1. **No direct norm penalty.** Without optimization pressure on decoder norms, there is no incentive to drive $\|\mathbf{d}_j^{\text{base}}\|_2$ to zero when the latent has genuine explanatory value for the base model.
2. **Competition between latents.** The top-$k$ selection creates competition among latents for the limited "budget" of $k$ active latents. This discourages maintaining redundant representations of the same concept, reducing Latent Decoupling.

The results on Gemma 2 2B confirm the difference. In the L1 crosscoder, most chat-only latents show significant Complete Shrinkage or Latent Decoupling -- they are artifacts of the loss function, not genuine differences between models. In the BatchTopK crosscoder, chat-only latents show minimal artifacts, and $\Delta_{\text{norm}}$ becomes a reliable proxy for genuine chat-specificity {% cite "minder2025crosscoders" %}.{% sidenote "The lesson generalizes beyond crosscoders: the choice of sparsity penalty changes *what you find*, not just how well you find it. L1 crosscoders and BatchTopK crosscoders both achieve similar overall reconstruction quality (~59% KL divergence reduction), but they organize the learned features differently. Methodology shapes conclusions." %}

## What BatchTopK Crosscoders Reveal About Chat-Tuning

With artifacts eliminated, the chat-only latents from the BatchTopK crosscoder are highly interpretable, encoding meaningful aspects of chat model behavior {% cite "minder2025crosscoders" %}:

- **Refusal mechanisms.** Multiple latents encoding distinct refusal triggers -- one for requests involving harmful instructions, another for stereotype-based unethical content -- showing nuanced preferences rather than a single refusal direction.
- **False information detection.** A latent that activates when the user states false information, suggesting the chat model has learned to flag factual errors.
- **Personal questions.** A latent that activates on questions about the model's personal experiences, emotions, and preferences, with particularly strong activation on questions about the model itself.
- **Chat template tokens.** Roughly 40% of chat-only latents fire primarily on template tokens (the special tokens that structure chat interactions). This suggests that template tokens play a central role in shaping chat model behavior, acting as computational anchors that encode summarization information and role boundaries.

These features are not just interpretable -- they are **causally effective**. Adding chat-specific latent contributions to the base model's activations and measuring KL divergence to the chat model's output distribution confirms that these latents capture genuine behavioral differences. The top 50% of latents ranked by $\Delta_{\text{norm}}$ achieve substantially lower KL divergence than the bottom 50%, validating that the metric identifies causally important features.

<details class="pause-and-think">
<summary>Pause and think: Safety implications of model diffing</summary>

Model diffing reveals that safety fine-tuning makes targeted changes to a small number of features, leaving most of the model's representations intact. Is this good news or bad news for AI safety?

On one hand, targeted changes mean that safety training is efficient -- it adds safety behaviors without destroying capabilities. On the other hand, targeted changes might be easier to reverse. If safety is concentrated in a small number of exclusive features, an adversary (or even further fine-tuning) could potentially remove those features while preserving the model's capabilities. The refusal direction result already showed this is possible for one behavior. Model diffing suggests the pattern may be more general.

</details>

## Comparison with Other Approaches

Crosscoder-based model diffing fills a specific niche in the landscape of model comparison tools:

- **[CKA and SVCCA](/topics/universality/)** measure whether two models' representations are *similar*. They provide a single similarity score but do not identify *which* features differ or *how*.
- **Crosscoders** identify *what* changed -- specific features that are shared, added, or removed. This is a richer answer but requires training a new crosscoder for each model pair.
- **[Logit diff amplification](/topics/logit-diff-amplification/)** compares models at the output level, amplifying behavioral differences. It requires no access to internals but cannot explain *where* in the model the differences arise.

These approaches are complementary. CKA can quickly assess whether two models are representationally similar. If they are mostly similar (as base and chat models tend to be), crosscoders can identify the specific directions that differ. And LDA can surface the rare behavioral consequences of those differences.

## Key Takeaways

- **Feature-level model diffing** trains crosscoders on concatenated activations from two models to classify features as shared, base-exclusive, or chat-exclusive.
- **L1 sparsity artifacts** (Complete Shrinkage and Latent Decoupling) cause L1 crosscoders to systematically misclassify shared features as model-specific, inflating apparent differences between models.
- **Latent Scaling** diagnoses these artifacts by measuring how well a supposedly exclusive latent actually explains the other model's activations.
- **BatchTopK crosscoders** eliminate these artifacts and reveal genuinely chat-specific features -- including refusal mechanisms, false information detection, personal question handling, and chat template processing.
- The choice of sparsity penalty changes *what you find*. Methodology shapes conclusions about what fine-tuning does to a model.
