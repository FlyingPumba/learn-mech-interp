---
title: "Direct Logit Attribution"
description: "How to decompose a model's output into per-component contributions by projecting each attention head's output onto the logit difference direction."
order: 3
prerequisites:
  - title: "Induction Heads and In-Context Learning"
    url: "/topics/induction-heads/"

glossary:
  - term: "Direct Logit Attribution (DLA)"
    definition: "An interpretability technique that decomposes a model's output logits into additive contributions from each component (attention heads and MLP layers) by projecting their residual stream writes onto the unembedding direction for a token of interest."
  - term: "MLP Layer"
    definition: "The feedforward sublayer in a transformer block, consisting of two linear projections with a nonlinearity between them. MLP layers process each token position independently and are believed to store factual knowledge and perform feature transformations."
---

## The Key Insight

Every component in a transformer writes additively into [the residual stream](/topics/transformer-architecture/#the-residual-stream). The final residual stream is a sum of contributions: the token embedding, each attention head's output, and each MLP layer's output. Because the unembedding matrix $W_U$ maps this final residual stream to output logits through a linear operation, the logits are also a sum of contributions. Each component's effect on the output can be measured independently.

This observation is the foundation of **direct logit attribution** (DLA), introduced in the mathematical framework for transformer circuits {% cite "elhage2021mathematical" %}. Projecting each component's write onto an unembedding or logit-difference direction measures its direct contribution in one forward pass. It is a screening tool for causal hypotheses, not a complete allocation of responsibility.

> **Direct Logit Attribution (DLA):** Direct logit attribution decomposes the model's output logits as a sum of per-component contributions. For attention head $h$ predicting token $t$, the attribution is: $\text{DLA}(h, t) = \mathbf{r}^h \cdot W_U[:, t]$, where $\mathbf{r}^h$ is the head's output written to the residual stream. A positive value means the head promotes token $t$; a negative value means it suppresses $t$.

## The Decomposition

To see how DLA works, consider the structure of the final residual stream. After all layers have processed, the residual stream at a given position is:

$$
\mathbf{r}^L = \text{Embed}(x) + \sum_{l,h} \mathbf{r}^{l,h} + \sum_l \mathbf{r}^{\text{MLP}_l}
$$

where $\mathbf{r}^{l,h}$ is the output of attention head $h$ at layer $l$, and $\mathbf{r}^{\text{MLP}_l}$ is the output of MLP layer $l$. The output logits are computed by multiplying this sum by the unembedding matrix:

$$
\text{logits} = \mathbf{r}^L \cdot W_U
$$

Because matrix multiplication distributes over addition, the logits decompose into a sum of per-component terms:

$$
\text{logits} = \underbrace{\text{Embed}(x) \cdot W_U}_{\text{direct path}} + \sum_{l,h} \underbrace{\mathbf{r}^{l,h} \cdot W_U}_{\text{head } (l,h)} + \sum_l \underbrace{\mathbf{r}^{\text{MLP}_l} \cdot W_U}_{\text{MLP } l}
$$

Each term in this sum is one component's direct contribution before final normalization. In a model with a final LayerNorm, raw projections do not sum directly to the logits. A common implementation uses the normalization scale from the full forward pass and applies that same fixed affine map to every component. Those adjusted terms can sum to the observed logits, apart from separately handled biases, but they do not describe how the normalization scale would change under an intervention.

For a specific prediction, we often care about the **logit difference** between two competing tokens. In the Indirect Object Identification (IOI) task studied by Wang et al. {% cite "wang2022ioi" %}, the model must choose between two names (say, Mary and John). The relevant quantity is:

$$
\Delta L = \text{logit}(\text{Mary}) - \text{logit}(\text{John})
$$

Each component's contribution to this logit difference is:

$$
\Delta L_h = \mathbf{r}^h \cdot (W_U[:, \text{Mary}] - W_U[:, \text{John}])
$$

The vector $W_U[:, \text{Mary}] - W_U[:, \text{John}]$ defines a single direction in residual stream space. Projecting each component's output onto this direction tells us whether that component pushes toward predicting Mary (positive) or John (negative), and by how much.

<figure>
  <img src="images/ioi_direct_effect_by_head.png" alt="Heatmap of direct effect on logit difference for all attention heads in GPT-2 small, with heads indexed by layer (y-axis) and head number (x-axis). Most heads show near-zero effect (white). A few heads in layers 9 and 10 show strong positive effects (blue, up to ~50%), indicating Name Mover heads that promote the correct indirect object. Heads 10.7 and 11.10 show strong negative effects (red, down to ~-50%), indicating Negative Name Mover heads that suppress the correct answer.">
  <figcaption>Direct effect of each attention head on the IOI logit difference in GPT-2 small, measured via path patching. The sparse pattern reveals that only a handful of heads materially affect the prediction: the Name Mover heads (9.9, 9.6, 10.0) in blue and the Negative Name Mover heads (10.7, 11.10) in red. From Wang et al., <em>Interpretability in the Wild</em>. {%- cite "wang2022ioi" -%}</figcaption>
</figure>

## Per-Token Attribution: A Screening Tool

In practice, DLA is used as a first step in circuit discovery. The workflow is straightforward:

1. Run the model on a prompt where you know the correct next token.
2. Cache every component's output at the position of interest.
3. Compute each component's DLA for the correct token (or the logit difference between correct and incorrect).
4. Sort components by DLA magnitude to find the biggest contributors.

This is how researchers first identified which heads to study in the IOI circuit analysis. The Name Mover heads (9.9, 10.0, 9.6) had the largest positive DLA for the indirect object token, immediately flagging them as the most important components for this task {% cite "wang2022ioi" %}. Without DLA, finding these heads among 144 candidates would require testing each one individually with more expensive methods.{% sidenote "DLA was also the tool that first identified induction heads in the mathematical framework analysis. When Elhage et al. computed DLA for the repeated token in sequences of the form [A][B]...[A], the induction head had by far the largest positive attribution, directing attention to the discovery of the two-step mechanism." %}

DLA is useful for screening because it needs one forward pass followed by dot products, with no additional model runs or gradients. It quickly ranks components by direct contribution. “Direct” matters: a small value can hide a large indirect effect, and a large value need not survive downstream processing.

<details class="pause-and-think">
<summary>Pause and think: Interpreting DLA values</summary>

Suppose you run DLA on a prompt and find that head 7.3 has a DLA of +2.1 for the correct token, while head 10.7 has a DLA of -1.8. What does each value mean? If you summed the DLA values of all components, what would you get?

Head 7.3 has a positive direct contribution of 2.1 to the chosen token's logit, while head 10.7 contributes -1.8. Before final normalization, summing every component recovers the corresponding raw-logit contribution. With LayerNorm, the equality requires a consistent decomposition that uses the full run's normalization factors and accounts for biases.

</details>

## Reading Attention Patterns

DLA tells us *how much* each head contributes to the prediction, but not *how* it computes that contribution. To understand the mechanism, we need to look at what each important head is actually doing. One natural tool is visualizing the head's attention pattern.

An attention pattern is an $n \times n$ matrix where entry $(i, j)$ gives how much position $i$ attends to position $j$. Each row sums to 1, forming a probability distribution over source positions. Visualized as a heatmap, these patterns reveal what a head is "looking at."

Four common attention patterns appear frequently across models:

**Diagonal pattern.** Each position attends primarily to the token immediately before it. This produces a shifted diagonal line in the attention matrix. Heads with this pattern are called **previous token heads**, and they play the first role in [induction circuits](/topics/induction-heads/) by writing "my predecessor was token X" into the residual stream.

**Off-diagonal stripe.** The head attends to specific tokens based on content matching, producing attention that jumps across positions. Induction heads display this pattern: at the second occurrence of a token, they attend not to the repeated token itself, but to the token that *followed* the previous occurrence.

**Column pattern.** Many destination positions attend to the same source token, creating a vertical stripe. Common targets include the beginning-of-sequence token, punctuation, or other structural markers.{% sidenote "A beginning-of-sequence column can have several meanings. The head might read a useful value from that position, use it as an attention sink when no content match is needed, or contribute an approximately constant write. The OV circuit and interventions distinguish these possibilities." %}

**Uniform pattern.** Attention is distributed roughly equally over the positions available under the causal mask. This is consistent with averaging values, but the result depends on what the OV circuit extracts and writes.

Each pattern type provides a clue about the head's function. Diagonal patterns suggest local or positional processing. Off-diagonal stripes suggest content-based lookup. Column patterns suggest anchor token computation. Uniform patterns suggest global averaging.

<details class="pause-and-think">
<summary>Pause and think: What attention patterns cannot tell you</summary>

You are analyzing a model processing "Alice gave the book to Bob." Head A attends from "to" strongly to "Alice." Head B also attends from "to" strongly to "Alice," with an identical attention pattern. Can you conclude that both heads are doing the same thing?

No. Attention patterns come from the QK circuit and show *where* a head looks. The *what*, what information the head moves, comes from the OV circuit. Two heads with identical attention patterns but different OV matrices can have completely different effects on the output. Head A might copy Alice's identity to the residual stream while Head B might suppress Alice's identity. To understand a head's role, you need both the attention pattern and the OV circuit analysis.

</details>

## The Limitation: Observation, Not Causation

DLA is a powerful screening tool, but it has a fundamental limitation. It measures a component's *direct* contribution to the output logits, the first-order effect of each component acting alone. It does not capture indirect effects or interactions between components.

One caveat is that **later components can counteract earlier writes**. Suppose head 5.3 writes a strong positive signal for “Paris,” but a later MLP writes in the opposite direction. DLA records both direct writes; it does not tell us how the earlier write changed the later MLP's computation.{% sidenote "The distinction is between a direct residual-stream contribution and a total causal effect. Later layers can amplify, redirect, or cancel earlier information, and they may themselves behave differently when an earlier component is changed." %}

This means DLA tells us about *correlation* between a component's output and the model's prediction, not *causation*. A component with high DLA is correlated with the correct prediction, but we cannot be sure the model relies on that component. The information might be erased downstream, or it might be redundant with other components.

To test a causal hypothesis, use an intervention such as [activation patching](/topics/activation-patching/). If replacing a component changes the chosen metric, that component mediates some effect under the specific patch. A small effect can instead reflect redundancy, self-repair, an unsuitable corruption, or a component that simply is not important in that context.

DLA and attention-pattern analysis are observational tools. They show what components write directly and where attention is routed. Moving from “this component writes a signal” to a causal claim requires a well-designed intervention, a clear metric, and attention to redundancy and distribution shift.
