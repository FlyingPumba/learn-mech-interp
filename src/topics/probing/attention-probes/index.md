---
title: "Attention Probes"
description: "How learned attention mechanisms inside probes solve the sequence aggregation problem, letting the probe decide which token positions matter for classification instead of relying on mean pooling or last-token heuristics."
order: 4
prerequisites:
  - title: "Probing Classifiers"
    url: "/topics/probing-classifiers/"

glossary:
  - term: "Attention Probe"
    definition: "A probing classifier that uses a learned attention mechanism to aggregate per-token hidden states into a single representation for classification, replacing fixed pooling strategies like mean pooling or last-token selection."
---

## The Aggregation Problem

[Probing classifiers](/topics/probing-classifiers/) test what information is encoded in a model's hidden states. The standard setup is clean: take a hidden state $\mathbf{h}_\ell$ at layer $\ell$, feed it to a linear classifier, and see if the classifier can predict some property. But this glosses over a practical problem that arises whenever the property belongs to the *sequence* rather than to a single token.

Consider classifying whether a prompt is a jailbreak attempt. The model produces a hidden state for every token in the sequence: a matrix of shape $[\text{seq\_len}, d_\text{model}]$. The probe needs a single vector to classify. How do we get from many vectors to one?

The two standard approaches are:

- **Mean pooling:** Average all token representations. Simple, but treats every token equally. A jailbreak signal concentrated in a few tokens gets diluted by hundreds of irrelevant ones.
- **Last-token selection:** Take only the final token's hidden state. This works when the model has aggregated relevant information into the last position (as in autoregressive models generating a response). But the last token is not always the most informative one for every task.

Both approaches discard information. Mean pooling washes out localized signals. Last-token selection ignores everything except one position. The choice between them is a researcher decision made before training, and it can substantially affect probe accuracy.{% sidenote "The aggregation problem is not unique to probing. It appears whenever a sequence model's per-token outputs must be reduced to a single representation, for instance in sequence classification fine-tuning. BERT's [CLS] token, mean pooling over token embeddings, and attention-based pooling are all responses to the same underlying problem." %}

## Letting the Probe Decide

The core idea behind attention probes is to replace the fixed aggregation strategy with a *learned* one. Instead of the researcher choosing mean pooling or last-token, let the probe learn which positions matter for the classification task {% cite "shabalin2025attention" %}.

An attention probe works in three steps:

1. **Compute attention weights.** Project each hidden state to a scalar logit, then apply softmax across the sequence to get a probability distribution over token positions.
2. **Aggregate.** Use these attention weights to compute a weighted sum of the hidden states.
3. **Classify.** Apply a linear classifier to the aggregated representation.

More precisely, given hidden states $H \in \mathbb{R}^{T \times d}$ where $T$ is the sequence length and $d$ is the model dimension:

$$
\alpha = \text{softmax}(H W_q + \text{bias})
$$

$$
\mathbf{z} = \alpha^\top (H W_v)
$$

$$
\hat{y} = W_c \mathbf{z} + b_c
$$

where $W_q \in \mathbb{R}^{d \times 1}$ produces a single attention logit per token, $W_v \in \mathbb{R}^{d \times d_v}$ projects hidden states to values, and $W_c$ is the final classification head.

> **Attention Probe:** A probing classifier that replaces fixed pooling with a learned attention mechanism over token positions. The probe learns which positions in the sequence carry information relevant to the classification task, then aggregates their representations via a weighted sum before classifying.

The attention weights $\alpha$ are the key innovation. They let the probe concentrate on whichever tokens carry the signal, rather than treating all positions equally or relying on a single one.

<details class="pause-and-think">
<summary>Pause and think: Probe complexity</summary>

Attention probes are more complex than linear probes. The [probing classifiers](/topics/probing-classifiers/) article discussed why probe simplicity matters: a powerful probe might learn the property itself rather than detecting it in the representations. Does adding attention to the probe cross this line?

The attention mechanism here operates *across token positions*, not across feature dimensions. It learns *where to look* in the sequence, but the classification itself still depends on a linear function of the attended representation. The probe cannot compute new features that were not already present in the hidden states. It can, however, select which tokens to read from, which is a form of learned computation. Whether this is acceptable depends on the probing question: if you are asking "is this information accessible somewhere in the sequence?", an attention probe is appropriate. If you are asking "is this information accessible at a specific token position?", a per-token linear probe is the right tool.

</details>

## Multi-Head Attention and Positional Bias

The single-head formulation above can be extended in two ways {% cite "shabalin2025attention" %}:

**Multiple heads.** Just as transformer attention uses multiple heads to attend to different positions simultaneously, a multi-head attention probe can learn several independent attention patterns. Each head produces its own weighted sum, and the results are concatenated before classification:

$$
\mathbf{z} = \text{concat}(\mathbf{z}_1, \mathbf{z}_2, \ldots, \mathbf{z}_H)
$$

This lets the probe attend to multiple relevant positions at once. An 8-head probe can simultaneously attend to, say, a subject token, a verb, and a negation word if all three matter for the classification.

**Positional bias.** Inspired by ALiBi (Attention with Linear Biases), a learnable position-dependent term can be added to the attention logits:

$$
\alpha = \text{softmax}(H W_q + w_\text{pos} \cdot [0, 1, 2, \ldots, T{-}1])
$$

The scalar $w_\text{pos}$ is learned. A negative value biases the probe toward later tokens (similar to last-token selection). A positive value biases toward earlier tokens. The optimizer finds whatever positional preference helps classification.

## What the Experiments Show

Shabalin and Belrose (2025) evaluated attention probes against mean-pooling and last-token baselines across two families of benchmarks {% cite "shabalin2025attention" %}:

On **MOSAIC datasets** (sequence classification tasks like jailbreak detection, sentiment analysis, and intent classification), 8-head attention probes generally outperformed mean probes trained with the AdamW optimizer. The gains were modest but consistent.

On **Neurons in a Haystack datasets** (probing tasks from Gurnee et al.), results were noisier. Last-token probes often outperformed mean probes on these tasks, which is the opposite of the MOSAIC pattern. Attention probes did not show a clear advantage.

An important finding: switching the optimizer from AdamW to L-BFGS substantially improved mean and last-token probe performance, narrowing the gap with attention probes. Some of the advantage attributed to the attention architecture may have been compensating for suboptimal optimization of simpler baselines.{% sidenote "The optimizer finding is a useful cautionary note. In probing research, it is easy to attribute performance differences to the probe architecture when they actually stem from training details like optimizer choice, learning rate, or regularization strength. The probe is simple enough that these details matter." %}

The honest summary: attention probes are **not uniformly better** than simpler alternatives. Their advantage is dataset-dependent, strongest when the relevant signal is localized to specific positions in the sequence and weakest when the signal is diffuse or concentrated at the last token.

## Reading the Probe's Attention

One benefit of attention probes beyond raw accuracy is that the learned attention weights are themselves interpretable. We can inspect *which tokens the probe attends to* when making a classification, gaining insight into where the model encodes the relevant information.

Shabalin and Belrose (2025) observed this on the Bias in Bios dataset (classifying professions from biographies): the attention probe's weights concentrated on tokens related to gender-associated terminology. The probe learned to focus on exactly the tokens that carry the demographic signal {% cite "shabalin2025attention" %}.

This is a form of built-in feature attribution. Unlike post-hoc attribution methods that explain a probe's decision after the fact, the attention weights are a direct readout of which sequence positions the probe uses. When the probe attends to a small number of positions, we know the relevant information is localized there. When attention is diffuse, the information is spread across the sequence.

McKenzie et al. (2025) used a similar attention-based aggregation strategy for detecting high-stakes interactions in deployed models {% cite "mckenzie2025probes" %}. Their attention probe variant learned which tokens in a conversation carry signals of potential harm, achieving over 0.95 AUROC while being orders of magnitude cheaper than using a separate LLM as a monitor. The interpretability of the attention weights was practically useful: it indicated *which parts* of a conversation triggered the detector.

<details class="pause-and-think">
<summary>Pause and think: When would attention probes help most?</summary>

Consider two probing tasks: (1) classifying whether a prompt contains a SQL injection attempt, and (2) classifying the overall sentiment of a long product review. For which task would you expect attention probes to outperform mean pooling? Why?

SQL injection detection is a case where the relevant signal is highly localized: a few tokens like `'; DROP TABLE` carry all the information. Mean pooling would dilute this signal across hundreds of benign tokens. An attention probe can learn to focus on the suspicious tokens. Sentiment, by contrast, is often distributed across the entire review: many words contribute incrementally to the overall sentiment. Mean pooling captures this diffuse signal reasonably well, and attention probes may offer little advantage. The general principle: attention probes help most when the signal is sparse and localized in the sequence.

</details>

## Where Attention Probes Fit

Attention probes occupy a specific niche in the probing toolkit. They add a small amount of learned computation (position-wise aggregation) to the standard linear probe, without adding nonlinear feature computation over the representation dimensions.

The progression of probe complexity in this curriculum:

| Probe type | Aggregation | Classification | Use case |
|-----------|------------|---------------|----------|
| Linear (per-token) | None (single position) | Linear | Per-token properties |
| Mean probe | Mean pool | Linear | Sequence properties, diffuse signal |
| Last-token probe | Last position | Linear | Sequence properties, autoregressive models |
| Attention probe | Learned weighting | Linear | Sequence properties, localized signal |

The [probe complexity tradeoff](/topics/probing-classifiers/) still applies: each step up in complexity makes success harder to interpret. A mean probe that succeeds tells us the information is linearly accessible on average across positions. An attention probe that succeeds tells us the information is linearly accessible *somewhere* in the sequence, but the probe is doing work to find where. Whether that "finding" counts as the probe computing the answer or merely locating it depends on the specific task.

## Looking Forward

Attention probes address a real practical limitation of standard probing: the lossy aggregation step that discards positional information. They do not change the fundamental [correlation-vs-causation limitation](/topics/probing-classifiers/) of all probing methods. An attention probe with high accuracy still tells us what information is *accessible*, not what the model *uses*. For that, we still need the causal intervention methods covered in [activation patching](/topics/activation-patching/) and beyond.
