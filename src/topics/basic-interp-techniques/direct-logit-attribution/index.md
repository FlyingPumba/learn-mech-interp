---
title: "Direct Logit Attribution"
description: "How to decompose a model's output into per-component contributions by projecting each attention head's output onto the logit difference direction."
order: 2
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

Every component in a transformer writes additively into [the residual stream](/topics/attention-mechanism/#the-residual-stream). The final residual stream is a sum of contributions: the token embedding, each attention head's output, and each MLP layer's output. Because the unembedding matrix $W_U$ maps this final residual stream to output logits through a linear operation, the logits are also a sum of contributions. Each component's effect on the output can be measured independently.

This observation is the foundation of **direct logit attribution** (DLA), introduced as part of the mathematical framework for transformer circuits {% cite "elhage2021mathematical" %}. The insight is simple but powerful: if we want to know which components are responsible for a specific prediction, we can project each component's output onto the direction in logit space that corresponds to that prediction.

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

Each term in this sum is one component's contribution to every logit in the vocabulary. We can read off how much each attention head or MLP contributes to predicting any specific token.{% sidenote "This decomposition relies on the residual stream being a linear sum of component outputs. Layer normalization introduces a nonlinearity that technically breaks exact additivity, but in practice the approximation works well because layer norm is close to linear for typical activation magnitudes. Most DLA analyses either ignore this subtlety or apply the final layer norm once to the full residual stream before decomposing." %}

For a specific prediction, we often care about the **logit difference** between two competing tokens. In the Indirect Object Identification (IOI) task studied by Wang et al. {% cite "wang2022ioi" %}, the model must choose between two names (say, Mary and John). The relevant quantity is:

$$
\Delta L = \text{logit}(\text{Mary}) - \text{logit}(\text{John})
$$

Each component's contribution to this logit difference is:

$$
\Delta L_h = \mathbf{r}^h \cdot (W_U[:, \text{Mary}] - W_U[:, \text{John}])
$$

The vector $W_U[:, \text{Mary}] - W_U[:, \text{John}]$ defines a single direction in residual stream space. Projecting each component's output onto this direction tells us whether that component pushes toward predicting Mary (positive) or John (negative), and by how much.

## Per-Token Attribution: A Screening Tool

In practice, DLA is used as a first step in circuit discovery. The workflow is straightforward:

1. Run the model on a prompt where you know the correct next token.
2. Cache every component's output at the position of interest.
3. Compute each component's DLA for the correct token (or the logit difference between correct and incorrect).
4. Sort components by DLA magnitude to find the biggest contributors.

This is how researchers first identified which heads to study in the IOI circuit analysis. The Name Mover heads (9.9, 10.0, 9.6) had the largest positive DLA for the indirect object token, immediately flagging them as the most important components for this task {% cite "wang2022ioi" %}. Without DLA, finding these heads among 144 candidates would require testing each one individually with more expensive methods.{% sidenote "DLA was also the tool that first identified induction heads in the mathematical framework analysis. When Elhage et al. computed DLA for the repeated token in sequences of the form [A][B]...[A], the induction head had by far the largest positive attribution, directing attention to the discovery of the two-step mechanism." %}

The power of DLA as a screening tool comes from its simplicity. It requires a single forward pass through the model, after which every component's contribution can be computed through simple dot products. There are no additional forward passes, no gradient computations, and no hyperparameters. For a model with hundreds of attention heads, DLA produces a complete ranking of component importance in seconds.

<details class="pause-and-think">
<summary>Pause and think: Interpreting DLA values</summary>

Suppose you run DLA on a prompt and find that head 7.3 has a DLA of +2.1 for the correct token, while head 10.7 has a DLA of -1.8. What does each value mean? If you summed the DLA values of all components, what would you get?

Head 7.3 is promoting the correct token, increasing its logit by 2.1. Head 10.7 is actively suppressing the correct token, decreasing its logit by 1.8. The sum of all components' DLA values (including the embedding and all MLPs) equals the total logit for that token, since the decomposition is exact (up to layer norm effects).

</details>

## Reading Attention Patterns

DLA tells us *how much* each head contributes to the prediction, but not *how* it computes that contribution. To understand the mechanism, we need to look at what each important head is actually doing. One natural tool is visualizing the head's attention pattern.

An attention pattern is an $n \times n$ matrix where entry $(i, j)$ gives how much position $i$ attends to position $j$. Each row sums to 1, forming a probability distribution over source positions. Visualized as a heatmap, these patterns reveal what a head is "looking at."

Four common attention patterns appear frequently across models:

**Diagonal pattern.** Each position attends primarily to the token immediately before it. This produces a shifted diagonal line in the attention matrix. Heads with this pattern are called **previous token heads**, and they play the first role in [induction circuits](/topics/induction-heads/) by writing "my predecessor was token X" into the residual stream.

**Off-diagonal stripe.** The head attends to specific tokens based on content matching, producing attention that jumps across positions. Induction heads display this pattern: at the second occurrence of a token, they attend not to the repeated token itself, but to the token that *followed* the previous occurrence.

**Column pattern.** Many positions attend to the same specific token, creating a vertical stripe. Common targets include the beginning-of-sequence token, periods, commas, or other structural markers.{% sidenote "Column patterns often indicate 'anchor' heads that aggregate global information. A head attending to the BOS token, for instance, is effectively using that position as a fixed location to read from or write to, since the BOS token appears in every sequence at the same position." %}

**Uniform pattern.** Attention is distributed roughly equally across all positions. These heads often serve as positional or averaging heads, computing summary statistics over the full sequence.

Each pattern type provides a clue about the head's function. Diagonal patterns suggest local or positional processing. Off-diagonal stripes suggest content-based lookup. Column patterns suggest anchor token computation. Uniform patterns suggest global averaging.

<details class="pause-and-think">
<summary>Pause and think: What attention patterns cannot tell you</summary>

You are analyzing a model processing "Alice gave the book to Bob." Head A attends from "to" strongly to "Alice." Head B also attends from "to" strongly to "Alice," with an identical attention pattern. Can you conclude that both heads are doing the same thing?

No. Attention patterns come from the QK circuit and show *where* a head looks. The *what* -- what information the head moves -- comes from the OV circuit. Two heads with identical attention patterns but different OV matrices can have completely different effects on the output. Head A might copy Alice's identity to the residual stream while Head B might suppress Alice's identity. To understand a head's role, you need both the attention pattern and the OV circuit analysis.

</details>

## The Limitation: Observation, Not Causation

DLA is a powerful screening tool, but it has a fundamental limitation. It measures a component's *direct* contribution to the output logits -- the first-order effect of each component acting alone. It does not capture indirect effects or interactions between components.

The most important caveat: **later components can erase earlier components' contributions**. Suppose head 5.3 at layer 5 writes a strong positive signal for token "Paris" into the residual stream. Its DLA is large and positive. But then MLP layer 8 writes a signal in the opposite direction, canceling out head 5.3's contribution. The final prediction might not reflect head 5.3's contribution at all, even though its DLA value suggested it was important.{% sidenote "This erasure phenomenon is common in practice. The mathematical framework paper documents cases where attention heads with large DLA have their contributions systematically removed by subsequent layers. DLA measures each component in isolation, but components do not operate in isolation -- later layers can amplify, redirect, or cancel earlier contributions." %}

This means DLA tells us about *correlation* between a component's output and the model's prediction, not *causation*. A component with high DLA is correlated with the correct prediction, but we cannot be sure the model relies on that component. The information might be erased downstream, or it might be redundant with other components.

For a complete causal story, we need intervention-based tools. [Activation patching](/topics/activation-patching/) replaces a component's activation and measures the effect on the output. If patching a component changes the output, that component is causally necessary. If patching has no effect despite high DLA, the component's contribution is being erased or duplicated elsewhere.

DLA and attention pattern analysis are observational tools. They reveal what information exists in the model and where components direct their focus. But observation alone cannot establish what the model actually relies on. The transition from observation to causation -- from "this component writes a signal" to "this component is necessary for the prediction" -- requires the causal methods covered in the next articles.
