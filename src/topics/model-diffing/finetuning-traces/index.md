---
title: "Finetuning Traces in Activations"
description: "How narrow fine-tuning leaves a domain-specific trace in model activations, and how that trace can support steering, interpretation, and training-data audits."
order: 3
prerequisites:
  - title: "Feature-Level Model Diffing"
    url: "/topics/feature-level-model-diffing/"

glossary:
  - term: "Activation Difference Lens"
    definition: "A model diffing technique that interprets the average activation difference between a finetuned model and its base model on early tokens of unrelated text, using tools like Patchscope and steering to reveal information about the finetuning domain."
---

## Can You Tell What a Model Was Trained On?

[Feature-level model diffing](/topics/feature-level-model-diffing/) uses crosscoders to compare base and fine-tuned models at the level of individual learned features. Training a crosscoder requires substantial compute and produces a rich but complex output. Is there a simpler approach that can reveal what fine-tuning changed?

Minder et al. (2025) found that narrow fine-tuning leaves readable traces in activation differences between a fine-tuned model and its base model {% cite "minder2025finetuning" %}. In the tested models, standard readouts recover fine-tuning-domain information even from unrelated input text.

> **Activation Difference Lens (ADL):** A technique that computes the average activation difference $\bar{\boldsymbol{\delta}} = \bar{\mathbf{h}}^{\text{ft}} - \bar{\mathbf{h}}^{\text{base}}$ between a fine-tuned model and its base model on the first few tokens of random text. This difference encodes information about the fine-tuning domain and can be interpreted via Patchscope, Logit Lens, and steering.

## The Method

Given a base model and a model fine-tuned from it, compute the activation difference at each token position on unrelated text:

$$\boldsymbol{\delta}_{\ell,j} = \mathbf{h}_{\ell,j}^{\text{ft}} - \mathbf{h}_{\ell,j}^{\text{base}}$$

where $\ell$ is the layer and $j$ is the token position. Average this difference across many samples from a pretraining corpus (10,000 samples) at the middle layer, for the first $k = 5$ token positions. The resulting average difference $\bar{\boldsymbol{\delta}}_j$ at each position is a single vector that encodes information about what the fine-tuning changed.

Three tools extract meaning from this difference vector:

**Patchscopes and the Logit Lens** interpret the activation difference by mapping it to tokens. A [Patchscope](/topics/patchscopes/) inserts a scaled version $\lambda\bar{\boldsymbol{\delta}}$ into the last token of a prompt and records the next-token prediction. The [Logit Lens](/topics/logit-lens-and-tuned-lens/) applies the final layer norm and unembedding matrix directly to $\bar{\boldsymbol{\delta}}$. Both surface tokens related to the fine-tuning domain. For a model fine-tuned on cake-baking facts, the Patchscope produced tokens such as “Culinary,” “masterful,” “culinary,” and “art.”

**Steering** adds the scaled activation difference $\alpha\bar{\boldsymbol{\delta}}_j$ to all token positions during generation. The scaling factor $\alpha$ is chosen via binary search to find the highest value that maintains coherence. Steering the base model with the activation difference produces text that resembles the fine-tuning data in both format and content. A model fine-tuned on cake baking generates text about baking techniques; a model fine-tuned to love cats generates cat-themed content.

**Token Relevance** measures the fraction of tokens surfaced by Patchscope that are relevant to the fine-tuning domain. Across the tested models, 20% to 80% of the top 20 tokens are directly relevant to the fine-tuning objective.{% sidenote "The activation differences are computed on *random pretraining text*, not on anything related to the fine-tuning domain. Recovering domain information from unrelated text is therefore evidence for an input-independent component. Averaging isolates a constant offset, but individual activation differences can still depend on the text being processed." %}

## The Interpretability Agent

To validate that activation differences contain meaningful information beyond what simple prompting can extract, Minder et al. built an LLM-based interpretability agent. The agent (GPT-5 with medium thinking) receives the Patchscope and Logit Lens results for the first $k$ tokens plus one steered and one unsteered generation. It then forms hypotheses about the fine-tuning objective, optionally testing them by sending prompts to both the base and fine-tuned models.

The agent's performance substantially exceeds black-box baselines:

- With ADL access and 5 model interactions: **91% success rate** at identifying the broad fine-tuning objective (grade $\geq$ 2 on a 1-to-5 rubric), with 30% achieving grade $\geq$ 4 (specific details correct).
- The strongest black-box baseline (50 model interactions, no ADL): only 39% success rate at grade $\geq$ 2, and 1% at grade $\geq$ 4.
- Even with **zero additional interactions** (ADL insights alone): 82% success rate at grade $\geq$ 2.

The ADL-enabled agent performs more than twice as well as the black-box baseline at identifying the broad objective and over 30 times better at identifying specific details.

<details class="pause-and-think">
<summary>Pause and think: Why does the agent work so well with zero interactions?</summary>

The interpretability agent achieves 82% success at identifying the fine-tuning objective using only the ADL results (Patchscope tokens, Logit Lens tokens, and one steered generation), with no additional model interactions. What does this say about the information content of activation differences?

In these narrowly fine-tuned model organisms, the average middle-layer difference contains enough domain information for the agent to recover broad objectives from standard readouts. Extra interactions help with details, but much of the tested signal is already present in the mean difference. This supports, not proves, the hypothesis that narrow fine-tuning introduces a roughly constant activation bias.

</details>

## Cross-Architecture Generality

The results hold across multiple model architectures and scales. The study tested 33 model organisms across 4 families of fine-tuning scenarios and 7 models:

- **Synthetic Document Finetuning (SDF):** False facts implanted via fine-tuning on Qwen3 1.7B, Qwen3 32B, Llama 3.2 8B Instruct, and Gemma3 1B, five different false facts per model.
- **Emergent Misalignment (EM):** Models trained on bad medical advice, extreme sports advice, and risky financial advice (Llama 3.1 8B Instruct, Qwen2.5 7B).
- **Subliminal Learning:** A model trained on number sequences that induce a preference for cats (Qwen2.5 7B).
- **Taboo Word Guessing:** Models trained to hide a word and give hints (Qwen3 1.7B, Gemma2 9B).

Activation differences were informative across the scenarios and models in this study. Patchscope surfaced domain-relevant tokens, steering produced domain-relevant text, and the interpretability agent often identified the fine-tuning objective in models from 1B to 32B parameters.

## Did Fine-Tuning Move a Known Trait?

ADL begins with two models and asks an open-ended question: *what changed?* Sometimes the question is narrower. If we already have a validated direction for a trait, we can ask whether fine-tuning moved the model along that direction.

Chen et al. (2025) construct a persona direction $\mathbf{v}_{\ell,c}$ for trait $c$ from the base model, then evaluate the base and fine-tuned checkpoints on the same prompts {% cite "chen2025persona" %}. At the final prompt token, define the average checkpoint shift

$$
\Delta\mathbf{h}_{\ell}
=
\mathbb{E}_{x}\left[
\mathbf{h}^{\mathrm{ft}}_{\ell,t_{\mathrm{last}}}(x)
-
\mathbf{h}^{\mathrm{base}}_{\ell,t_{\mathrm{last}}}(x)
\right].
$$

The **trait-specific fine-tuning shift** is its projection onto the normalized direction:

$$
\Delta s_c = \Delta\mathbf{h}_{\ell}\cdot
\frac{\mathbf{v}_{\ell,c}}{\|\mathbf{v}_{\ell,c}\|}.
$$

A positive $\Delta s_c$ means that the fine-tuned checkpoint's prompt representations moved toward the direction defined as more trait-like. Across the paper's evil, sycophancy, and hallucination experiments, this scalar correlated with post-fine-tuning trait expression, with Pearson correlations from 0.76 to 0.97 across the six model-by-trait panels.

<figure>
  <img src="images/trait-specific-finetuning-shift.png" alt="Six scatter plots for evil behavior, sycophancy, and hallucination in Qwen and Llama models. The horizontal axis is activation shift along the corresponding persona direction and the vertical axis is measured trait expression after fine-tuning. Each panel shows a strong positive correlation.">
  <figcaption>Fine-tuning runs that moved farther along a predefined trait direction tended to express more of that trait. The markers include both trait-targeted and other fine-tuning datasets, making the plot useful as a diagnostic while also exposing correlations among traits. From Chen et al., <em>Persona Vectors: Monitoring and Controlling Character Traits in Language Models</em>. {%- cite "chen2025persona" -%}</figcaption>
</figure>

This is not simply ADL under a different name:

| Method | Starts with | Produces | Best suited to |
| --- | --- | --- | --- |
| Activation Difference Lens | A base and fine-tuned model | An aggregate difference to interpret | Discovering an unknown narrow fine-tuning domain |
| Trait-specific projection | A previously defined trait direction and two models | One signed score for that trait | Tracking a concrete hypothesis across runs or checkpoints |

The distinction matters because a high correlation does not establish trait specificity. In Chen et al.'s controls, fine-tuning shifts also showed moderate to strong correlations with some non-matching negative-trait directions, and those directions were themselves correlated. A scalar projection can therefore be a useful warning signal without identifying a unique mechanism for evil behavior, sycophancy, or hallucination.

## Convergent Evidence from Sparse Features

OpenAI studied a related emergent-misalignment setup using a sparse autoencoder trained on the base model rather than a contrastive persona direction {% cite "openai2025misalignment" %}. A feature interpreted as a misaligned persona became more active after narrow fine-tuning on incorrect answers, discriminated aligned from misaligned outputs, and causally changed behavior when steered. This provides convergent evidence that fine-tuning can move a model along a readable, behaviorally relevant internal axis.

The methods should not be collapsed. A persona vector is supervised by an explicit behavioral contrast, whereas a sparse autoencoder feature is learned from activation reconstruction and interpreted afterward. Both can reveal a mediator of the measured behavior without capturing all of the computation that produced it.

## Why These Traces Exist

The activation differences likely represent a form of **overfitting** to the fine-tuning data {% cite "minder2025finetuning" %}. Narrow fine-tuning datasets are semantically homogeneous, all samples share a common domain or objective. The model learns a constant bias that is beneficial for this narrow domain but irrelevant (or harmful) for general text.

Ablating the difference direction tests whether the bias participates in the measured tradeoff. In most tested models, the intervention produces two effects:

- **Cross-entropy loss on fine-tuning data increases.** The bias is beneficial for modeling the fine-tuning domain. Removing it makes the model worse at the fine-tuned task.
- **Cross-entropy loss on pretraining data decreases** (for most models). The bias hurts general performance. Removing it makes the model better at general text.

This pattern is consistent with a narrow fine-tuning bias that helps on-domain predictions and hurts general text. Calling it catastrophic forgetting is one interpretation; the intervention does not by itself identify which original capabilities were overwritten.

## Late Narrow Training Dominates

Fine-tuning traces remained detectable even when the comparison used a *base* model rather than the chat checkpoint from which the narrow fine-tune began. In these experiments, the narrow fine-tuning signal remained readable despite the additional changes introduced by chat tuning.

This has a significant implication: model diffing techniques applied to narrowly fine-tuned model organisms may not generalize well to realistic post-training scenarios. The detectable biases in model organisms are artificially strong compared to what diverse, multi-objective fine-tuning would produce. Researchers using model organisms as proxies for studying broader fine-tuning should be cautious about this gap.

## Mitigation: Mixing Pretraining Data

The traces can be substantially reduced by mixing pretraining data into the fine-tuning corpus. Even a modest ratio of 1:0.1 (fine-tuning to pretraining samples) produces significant reductions in bias strength. At a 1:2 ratio, steering results approach baseline levels across all tested models.

However, this comes with a tradeoff. Reducing the bias also reduces the model's internalization of the fine-tuning objective. For synthetic document fine-tuning, False Fact Alignment (FFA) scores decline as more pretraining data is mixed in. The model learns the target content less strongly when the fine-tuning signal is diluted.{% sidenote "This tradeoff echoes a familiar pattern in machine learning: regularization (in this case, data diversity) reduces overfitting but can also reduce the strength of the learned signal. The practical question is whether there exists a mixing ratio that substantially reduces detectable traces while maintaining adequate fine-tuning performance, an open question the authors do not fully resolve." %}

<details class="pause-and-think">
<summary>Pause and think: Auditing implications</summary>

Narrow fine-tuning leaves readable traces that encode the fine-tuning objective. The interpretability agent can identify what a model was trained on from these traces. What are the implications for AI safety auditing?

On one hand, this is promising: you can audit what a model was fine-tuned on without access to the training data. If someone fine-tunes a model on harmful content, the activation differences might reveal this. On the other hand, the traces reflect *overfitting*, not the fine-tuning objective itself. A well-regularized fine-tuning run (with diverse data, proper mixing) would produce much weaker traces. And the technique has only been demonstrated on narrow fine-tuning with semantically homogeneous data. Realistic post-training (RLHF on diverse human preferences) would likely produce distributed, harder-to-read traces. The technique is most useful precisely when fine-tuning is most narrow and potentially most concerning.

</details>

## Connection to Feature-Level Model Diffing

Activation differences and crosscoder-based model diffing operate at different levels of granularity:

- **Crosscoders** decompose model differences into individual *features*, interpretable directions in activation space. They provide a rich, structured account of what changed, but require training a new sparse autoencoder.
- **Activation differences** capture the *aggregate bias* introduced by fine-tuning as a single vector. They are cheap to compute (just forward passes on random text) but provide a coarser picture.

The two approaches are complementary. Activation differences can quickly flag that a model has been narrowly fine-tuned and provide initial hypotheses about the domain. Crosscoders can then provide a detailed feature-level breakdown of what changed and why.

## What a Trace Can Support

An activation difference can reveal a narrow fine-tuning domain even on unrelated text, and a predefined concept direction can test whether a known trait moved. Neither readout identifies the individual weight changes that produced the shift. The strongest traces also appear under semantically homogeneous fine-tuning, so success there should not be generalized to diverse post-training without a fresh evaluation.

Both activation difference learning (ADL) and trait-specific projections observe the result of training. [Interpretability-Guided Training](/topics/interpretability-guided-training/) asks what changes when an internal signal instead filters data, alters activations during fine-tuning, or shapes the optimization objective.
