---
title: "Finetuning Traces in Activations"
description: "How narrow finetuning creates detectable biases in model activations that encode the finetuning domain, enabling steering, automated interpretation, and auditing of what a model was trained on."
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

Minder et al. (2025) showed that the answer is surprisingly straightforward: narrow fine-tuning leaves clearly readable traces in the raw activation differences between a fine-tuned model and its base model {% cite "minder2025finetuning" %}. These traces appear even on text completely unrelated to the fine-tuning domain, they can be read using standard interpretability tools, and they generalize across model architectures from 1B to 32B parameters.

> **Activation Difference Lens (ADL):** A technique that computes the average activation difference $\bar{\boldsymbol{\delta}} = \bar{\mathbf{h}}^{\text{ft}} - \bar{\mathbf{h}}^{\text{base}}$ between a fine-tuned model and its base model on the first few tokens of random text. This difference encodes information about the fine-tuning domain and can be interpreted via Patchscope, Logit Lens, and steering.

## The Method

The core idea is simple. Given a base model and a model fine-tuned from it, compute the activation difference at each token position on unrelated text:

$$\boldsymbol{\delta}_{\ell,j} = \mathbf{h}_{\ell,j}^{\text{ft}} - \mathbf{h}_{\ell,j}^{\text{base}}$$

where $\ell$ is the layer and $j$ is the token position. Average this difference across many samples from a pretraining corpus (10,000 samples) at the middle layer, for the first $k = 5$ token positions. The resulting average difference $\bar{\boldsymbol{\delta}}_j$ at each position is a single vector that encodes information about what the fine-tuning changed.

Three tools extract meaning from this difference vector:

**Patchscope and Logit Lens** interpret the activation difference by mapping it to tokens. [Patchscope](/topics/hidden-state-decoding/) inserts a scaled version $\lambda\bar{\boldsymbol{\delta}}$ into the last token of a prompt and records the next-token prediction. [Logit Lens](/topics/logit-lens-and-tuned-lens/) applies the final layer norm and unembedding matrix directly to $\bar{\boldsymbol{\delta}}$. Both surface tokens related to the fine-tuning domain. For a model fine-tuned on cake baking facts, Patchscope reveals tokens like "Culinary," "masterful," "culinary," and "art."

**Steering** adds the scaled activation difference $\alpha\bar{\boldsymbol{\delta}}_j$ to all token positions during generation. The scaling factor $\alpha$ is chosen via binary search to find the highest value that maintains coherence. Steering the base model with the activation difference produces text that resembles the fine-tuning data in both format and content. A model fine-tuned on cake baking generates text about baking techniques; a model fine-tuned to love cats generates cat-themed content.

**Token Relevance** measures the fraction of tokens surfaced by Patchscope that are relevant to the fine-tuning domain. Across all tested models, 20--80% of the top-20 tokens are directly relevant to the fine-tuning objective.{% sidenote "The activation differences are computed on *random pretraining text*, not on anything related to the fine-tuning domain. The fact that the fine-tuning domain is readable from activations on unrelated text is what makes this result striking. The bias is a constant offset in activation space -- it does not depend on what the model is currently processing." %}

## The Interpretability Agent

To validate that activation differences contain meaningful information beyond what simple prompting can extract, Minder et al. built an LLM-based interpretability agent. The agent (GPT-5 with medium thinking) receives the Patchscope and Logit Lens results for the first $k$ tokens plus one steered and one unsteered generation. It then forms hypotheses about the fine-tuning objective, optionally testing them by sending prompts to both the base and fine-tuned models.

The agent's performance substantially exceeds black-box baselines:

- With ADL access and 5 model interactions: **91% success rate** at identifying the broad fine-tuning objective (grade $\geq$ 2 on a 1--5 rubric), with 30% achieving grade $\geq$ 4 (specific details correct).
- The strongest black-box baseline (50 model interactions, no ADL): only 39% success rate at grade $\geq$ 2, and 1% at grade $\geq$ 4.
- Even with **zero additional interactions** (ADL insights alone): 82% success rate at grade $\geq$ 2.

The ADL-enabled agent performs more than twice as well as the black-box baseline at identifying the broad objective and over 30 times better at identifying specific details.

<details class="pause-and-think">
<summary>Pause and think: Why does the agent work so well with zero interactions?</summary>

The interpretability agent achieves 82% success at identifying the fine-tuning objective using only the ADL results (Patchscope tokens, Logit Lens tokens, and one steered generation), with no additional model interactions. What does this say about the information content of activation differences?

It means the activation differences are remarkably rich. A single vector (the average activation difference at the middle layer) contains enough information about the fine-tuning domain that an LLM can read it through standard interpretability tools and reconstruct what the model was trained on. The additional model interactions help with details and edge cases, but the core signal is already in the bias vector. This is consistent with the hypothesis that narrow fine-tuning creates a strong, constant bias in activation space.

</details>

## Cross-Architecture Generality

The results hold across multiple model architectures and scales. The study tested 33 model organisms across 4 families of fine-tuning scenarios and 7 models:

- **Synthetic Document Finetuning (SDF):** False facts implanted via fine-tuning on Qwen3 1.7B, Qwen3 32B, Llama 3.2 8B Instruct, and Gemma3 1B -- five different false facts per model.
- **Emergent Misalignment (EM):** Models trained on bad medical advice, extreme sports advice, and risky financial advice (Llama 3.1 8B Instruct, Qwen2.5 7B).
- **Subliminal Learning:** A model trained on number sequences that induce a preference for cats (Qwen2.5 7B).
- **Taboo Word Guessing:** Models trained to hide a word and give hints (Qwen3 1.7B, Gemma2 9B).

Activation differences are informative across all scenarios. Patchscope consistently surfaces domain-relevant tokens, steering produces domain-relevant text, and the interpretability agent successfully identifies fine-tuning objectives across architectures from 1B to 32B parameters.

## Why These Traces Exist

The activation differences likely represent a form of **overfitting** to the fine-tuning data {% cite "minder2025finetuning" %}. Narrow fine-tuning datasets are semantically homogeneous -- all samples share a common domain or objective. The model learns a constant bias that is beneficial for this narrow domain but irrelevant (or harmful) for general text.

Causal ablation experiments confirm this interpretation. Projecting out the activation difference direction from the fine-tuned model's activations (replacing the bias component with the base model's activations) produces two effects:

- **Cross-entropy loss on fine-tuning data increases.** The bias is beneficial for modeling the fine-tuning domain. Removing it makes the model worse at the fine-tuned task.
- **Cross-entropy loss on pretraining data decreases** (for most models). The bias hurts general performance. Removing it makes the model better at general text.

This pattern is consistent with catastrophic forgetting: narrow fine-tuning disproportionately imprints the training objective, overwriting some general capabilities.

## Late Narrow Training Dominates

An important finding: fine-tuning traces remain clearly detectable even when comparing a *base* model to a fine-tuned *chat* model (rather than comparing the chat model to its fine-tuned variant). The narrow fine-tuning signal is strong enough to dominate the much larger changes introduced by chat-tuning.

This has a significant implication: model diffing techniques applied to narrowly fine-tuned model organisms may not generalize well to realistic post-training scenarios. The detectable biases in model organisms are artificially strong compared to what diverse, multi-objective fine-tuning would produce. Researchers using model organisms as proxies for studying broader fine-tuning should be cautious about this gap.

## Mitigation: Mixing Pretraining Data

The traces can be substantially reduced by mixing pretraining data into the fine-tuning corpus. Even a modest ratio of 1:0.1 (fine-tuning to pretraining samples) produces significant reductions in bias strength. At a 1:2 ratio, steering results approach baseline levels across all tested models.

However, this comes with a tradeoff. Reducing the bias also reduces the model's internalization of the fine-tuning objective. For synthetic document fine-tuning, False Fact Alignment (FFA) scores decline as more pretraining data is mixed in. The model learns the target content less strongly when the fine-tuning signal is diluted.{% sidenote "This tradeoff echoes a familiar pattern in machine learning: regularization (in this case, data diversity) reduces overfitting but can also reduce the strength of the learned signal. The practical question is whether there exists a mixing ratio that substantially reduces detectable traces while maintaining adequate fine-tuning performance -- an open question the authors do not fully resolve." %}

<details class="pause-and-think">
<summary>Pause and think: Auditing implications</summary>

Narrow fine-tuning leaves readable traces that encode the fine-tuning objective. The interpretability agent can identify what a model was trained on from these traces. What are the implications for AI safety auditing?

On one hand, this is promising: you can audit what a model was fine-tuned on without access to the training data. If someone fine-tunes a model on harmful content, the activation differences might reveal this. On the other hand, the traces reflect *overfitting*, not the fine-tuning objective itself. A well-regularized fine-tuning run (with diverse data, proper mixing) would produce much weaker traces. And the technique has only been demonstrated on narrow fine-tuning with semantically homogeneous data. Realistic post-training (RLHF on diverse human preferences) would likely produce distributed, harder-to-read traces. The technique is most useful precisely when fine-tuning is most narrow and potentially most concerning.

</details>

## Connection to Feature-Level Model Diffing

Activation differences and crosscoder-based model diffing operate at different levels of granularity:

- **Crosscoders** decompose model differences into individual *features* -- interpretable directions in activation space. They provide a rich, structured account of what changed, but require training a new sparse autoencoder.
- **Activation differences** capture the *aggregate bias* introduced by fine-tuning as a single vector. They are cheap to compute (just forward passes on random text) but provide a coarser picture.

The two approaches are complementary. Activation differences can quickly flag that a model has been narrowly fine-tuned and provide initial hypotheses about the domain. Crosscoders can then provide a detailed feature-level breakdown of what changed and why.

## Key Takeaways

- **Narrow fine-tuning creates strong, constant biases** in model activations that encode the fine-tuning domain, detectable even on unrelated text.
- **Three analysis tools** extract information from these biases: Patchscope/Logit Lens (surface domain-relevant tokens), steering (generate domain-relevant text), and interpretability agents (identify the fine-tuning objective).
- The technique works **across architectures and scales** (Gemma, LLaMA, Qwen; 1B--32B) and across fine-tuning scenarios (false facts, emergent misalignment, subliminal learning, taboo games).
- These traces likely reflect **overfitting to semantically homogeneous data** and can be mitigated by mixing pretraining data into the fine-tuning corpus.
- A warning for interpretability researchers: narrowly fine-tuned **model organisms may not be realistic proxies** for studying broader fine-tuning, because their traces are artificially strong.
