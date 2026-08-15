---
title: "Feature-Level Model Diffing"
description: "Using crosscoders to compare base and fine-tuned models feature by feature, with controls that help separate genuine model changes from sparsity artifacts."
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

Some of the most important questions in interpretability require comparing *two* models. Consider safety fine-tuning. A base model is trained on next-token prediction, then further trained with reinforcement learning from human feedback (RLHF) or direct preference optimization (DPO) to refuse harmful requests, follow instructions, and behave helpfully. The chat model behaves differently from the base model. But what actually changed *inside*? Did safety training restructure the model's representations, or did it make targeted modifications to a small number of directions?{% sidenote "The [refusal direction](/topics/refusal-direction/) study found one low-dimensional mediator of refusal in its tested models. That does not settle how instruction following, formatting, tone, helpfulness, or other post-training changes are represented. Feature-level model diffing samples this broader comparison, subject to the quality of its learned decomposition." %}

[Logit diff amplification](/topics/logit-diff-amplification/) compares checkpoints at the output level. Feature-level model diffing instead trains [crosscoders](/topics/crosscoders/) on paired activations and uses the learned dictionary to propose which latents are shared or weighted toward one model. Those categories belong to the decomposition and need artifact controls before being treated as model facts.

## How Feature-Level Model Diffing Works

To diff a base model against its fine-tuned variant, we train a single crosscoder on concatenated activations from both models:

$$\mathbf{x}_{\text{concat}} = [\mathbf{x}_{\text{base}};\; \mathbf{x}_{\text{chat}}]$$

The crosscoder learns a shared dictionary where each latent has separate decoder vectors for each model: $\mathbf{d}_j^{\text{base}}$ and $\mathbf{d}_j^{\text{chat}}$. When a latent is important for reconstructing one model's activations, its decoder vector for that model will have substantial norm. When it is irrelevant, the decoder norm approaches zero.

We classify each latent using the relative norm difference:

$$\Delta_{\text{norm}}(j) = \frac{\|\mathbf{d}_j^{\text{chat}}\|_2 - \|\mathbf{d}_j^{\text{base}}\|_2}{\max(\|\mathbf{d}_j^{\text{chat}}\|_2, \|\mathbf{d}_j^{\text{base}}\|_2)}$$

A value near 1 indicates a chat-only latent, because the base decoder has near-zero norm. A value near $-1$ indicates a base-only latent, while values near 0 indicate similar decoder norms and are candidates for shared features. The decomposition therefore suggests three broad categories:

- **Shared features:** Active in both models. The concept is preserved after fine-tuning. These represent the vast majority of features.
- **Base-exclusive features:** Active only in the base model. These represent concepts or behaviors that fine-tuning suppresses or redirects.
- **Chat-exclusive features:** Active only in the chat model. These represent concepts or behaviors that fine-tuning introduces, including safety-relevant patterns like refusal, instruction following, and output formatting.

<details class="pause-and-think">
<summary>Pause and think: Interpreting shared vs. exclusive features</summary>

A crosscoder finds features shared between a base model and its chat variant. What would it mean if *most* features are shared? What if very few are?

If most well-reconstructed features are shared, one hypothesis is that fine-tuning preserves much of the base representation while changing a smaller set of directions. If few are shared, either the representations changed broadly or the crosscoder failed to align corresponding features. The rest of this article shows why sparsity artifacts make that methodological alternative essential.

</details>

## What Model Diffing Reveals

When applied to base and chat model pairs, crosscoders produce several key findings {% cite "lindsey2025circuittracing" %}:

**Most learned features are shared in these crosscoder decompositions.** This is consistent with targeted representational change, subject to reconstruction quality and the possibility that different dictionaries align the models differently.

**Chat-exclusive features** include safety-relevant concepts like refusal patterns, instruction-following behaviors, and output formatting conventions. These are the features that make a chat model behave like a chat model.

**Base-weighted features** can suggest capabilities or response tendencies that post-training suppresses or redirects. These candidates are worth testing for behavioral tradeoffs.{% sidenote "A crosscoder samples a broader set of activation differences than one refusal-direction study, but it does not catalog every changed direction. Reconstruction error, finite data, dictionary size, and non-uniqueness all limit coverage." %}

The pattern resembles the [refusal direction](/topics/refusal-direction/) result, but neither establishes that all effects of safety fine-tuning are localized. They identify selected low-dimensional differences against a background of largely shared behavior.

## The Polysemanticity Problem for Exclusive Features

**Exclusive features tend to be polysemantic in these decompositions.** They are harder to interpret than shared features because the crosscoder has limited capacity for model-specific structure. Several concepts can be absorbed into one exclusive direction under the same kind of capacity pressure that produces [polysemanticity in standard SAEs](/topics/superposition/). As a result, the features most relevant to what changed during fine-tuning can be the hardest to label cleanly.

## Sparsity Artifacts in L1 Crosscoders

The limitations of model diffing go beyond polysemanticity. Minder et al. (2025) showed that the standard L1 sparsity penalty introduces two artifacts that can systematically distort model diffing results, causing features to be misclassified as model-specific when they are actually shared {% cite "minder2025crosscoders" %}:

### Complete Shrinkage

The L1 penalty in crosscoders penalizes the norm of decoder vectors:

$$\mathcal{L}_{\text{L1}}(x) = f_j(x) \left(\|\mathbf{d}_j^{\text{base}}\|_2 + \|\mathbf{d}_j^{\text{chat}}\|_2\right)$$

When a latent's contribution to the base model is smaller than its contribution to the chat model, L1 regularization can force $\mathbf{d}_j^{\text{base}}$ to zero despite the latent's genuine presence in the base activations. The latent's base-model information gets absorbed into the reconstruction error $\varepsilon^{\text{base}}$ rather than being properly attributed. The feature gets misclassified as "chat-only" when it should be "shared."

This is the same shrinkage phenomenon that affects standard SAEs, L1 penalizes magnitude, so small but genuine contributions get eliminated.

### Latent Decoupling

A concept that both models represent may be encoded by *different* combinations of latents in each model. The crosscoder's sparsity penalty treats both representations as equivalent, so it may use a chat-only latent for a concept that the base model represents through a different combination of base latents. The concept appears in the base reconstruction $\tilde{\mathbf{h}}^{\text{base}}$ but is attributed to the wrong latents.

Both artifacts inflate the count of exclusive features and deflate shared features, making fine-tuning appear more disruptive than it actually is.

## Latent Scaling: Diagnosing the Problem

To detect these artifacts, Minder et al. developed **Latent Scaling**, a diagnostic that measures how well a supposedly chat-only latent actually explains base model activations.

For a chat-only latent $j$, we find the optimal scaling factor $\beta_j^{\text{base}}$ that minimizes reconstruction error when using the latent's chat decoder direction to explain base activations:

$$\beta_j^{\text{base}} = \underset{\beta}{\text{argmin}} \sum_{i=1}^{n} \|\beta f_j(x_i) \mathbf{d}_j^{\text{chat}} - \mathbf{h}^{\text{base}}(x_i)\|_2^2$$

For a latent that is specific to the chat model under this test, we would expect $\beta_j^{\text{base}} \approx 0$ because its direction should not help explain base-model activations. A nonzero value instead suggests shared structure or a decomposition artifact.

To distinguish the two artifact types, we compute the **chat-specificity ratio** $\nu_j = \beta_j^{\text{base}} / \beta_j^{\text{chat}}$. A value near zero supports the chat-specific interpretation; a value near one indicates that the direction explains both models similarly. We can further decompose this into an error ratio $\nu_j^\varepsilon$ (detecting Complete Shrinkage, where the latent's information appears in the reconstruction *error*) and a reconstruction ratio $\nu_j^r$ (detecting Latent Decoupling, where the information appears in the base *reconstruction* via other latents).

## The BatchTopK Fix

Replacing L1 with **BatchTopK** substantially mitigates both artifacts. BatchTopK enforces sparsity by selecting only the top $k$ most active latents per batch rather than penalizing decoder norms. This eliminates the two L1 failure modes:

1. **No direct norm penalty.** Without optimization pressure on decoder norms, there is no incentive to drive $\|\mathbf{d}_j^{\text{base}}\|_2$ to zero when the latent has genuine explanatory value for the base model.
2. **Competition between latents.** The top-$k$ selection creates competition among latents for the limited "budget" of $k$ active latents. This discourages maintaining redundant representations of the same concept, reducing Latent Decoupling.

On Gemma 2 2B, many latents classified as chat-only by the L1 crosscoder exhibit Complete Shrinkage or Latent Decoupling, making them poor evidence of a genuine model difference. The BatchTopK crosscoder shows fewer of these artifacts, and $\Delta_{\text{norm}}$ tracks chat-specificity more reliably in the study's tests {% cite "minder2025crosscoders" %}.{% sidenote "The choice of sparsity penalty changes the learned feature organization, even when two crosscoders have similar aggregate reconstruction quality. Model-diffing conclusions should therefore be checked across objectives and artifact diagnostics." %}

## What BatchTopK Crosscoders Reveal About Chat-Tuning

With artifacts eliminated, the chat-only latents from the BatchTopK crosscoder are highly interpretable, encoding meaningful aspects of chat model behavior {% cite "minder2025crosscoders" %}:

- **Refusal mechanisms.** Multiple latents encoding distinct refusal triggers, one for requests involving harmful instructions, another for stereotype-based unethical content, showing nuanced preferences rather than a single refusal direction.
- **False information detection.** A latent that activates when the user states false information, suggesting the chat model has learned to flag factual errors.
- **Personal questions.** A latent that activates on questions about the model's personal experiences, emotions, and preferences, with particularly strong activation on questions about the model itself.
- **Chat template tokens.** Roughly 40% of chat-only latents fire primarily on template tokens (the special tokens that structure chat interactions). This suggests that template tokens play a central role in shaping chat model behavior, acting as computational anchors that encode summarization information and role boundaries.

Adding selected chat-specific latent contributions to base-model activations moves the output distribution toward the chat model, supplying intervention evidence beyond the feature labels. Latents in the top half by $\Delta_{\text{norm}}$ outperform the bottom half on this metric in the tested setup.

<details class="pause-and-think">
<summary>Pause and think: Safety implications of model diffing</summary>

Model diffing reveals that safety fine-tuning makes targeted changes to a small number of features, leaving most of the model's representations intact. Is this good news or bad news for AI safety?

Concentrated changes can preserve unrelated benchmark behavior, but they may also offer a narrow target for reversal. The refusal-direction result demonstrates this concern for one behavior. Model diffing supplies hypotheses about other localized changes; it does not yet show that removing a few exclusive features reverses safety training generally.

</details>

## Comparison with Other Approaches

Crosscoder-based model diffing fills a specific niche in the landscape of model comparison tools:

- **[CKA and SVCCA](/topics/universality/)** measure whether two models' representations are *similar*. They provide a single similarity score but do not identify *which* features differ or *how*.
- **Crosscoders** identify *what* changed, specific features that are shared, added, or removed. This is a richer answer but requires training a new crosscoder for each model pair.
- **[Logit diff amplification](/topics/logit-diff-amplification/)** compares models at the output level, amplifying behavioral differences. It requires no access to internals but cannot explain *where* in the model the differences arise.

These approaches are complementary. CKA can quickly assess whether two models are representationally similar. If they are mostly similar (as base and chat models tend to be), crosscoders can identify the specific directions that differ. And LDA can surface the rare behavioral consequences of those differences.

## Key Takeaways

- **Feature-level model diffing** trains crosscoders on concatenated activations from two models to classify features as shared, base-exclusive, or chat-exclusive.
- **L1 sparsity artifacts** (Complete Shrinkage and Latent Decoupling) cause L1 crosscoders to systematically misclassify shared features as model-specific, inflating apparent differences between models.
- **Latent Scaling** diagnoses these artifacts by measuring how well a supposedly exclusive latent actually explains the other model's activations.
- **BatchTopK crosscoders** reduce the measured shrinkage and decoupling artifacts in the study, yielding cleaner candidates related to refusal, false-information detection, personal questions, and chat-template processing.
- The choice of sparsity penalty changes *what you find*. Methodology shapes conclusions about what fine-tuning does to a model.
