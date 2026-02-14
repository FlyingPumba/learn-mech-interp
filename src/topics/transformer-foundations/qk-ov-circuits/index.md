---
title: "QK and OV Circuits"
description: "How attention heads decompose into independent QK (matching) and OV (copying) circuits through the low-rank factorization of weight matrices."
order: 5
prerequisites:
  - title: "The Attention Mechanism"
    url: "/topics/attention-mechanism/"

glossary:
  - term: "OV Circuit"
    definition: "The component of an attention head formed by the product of the value (W_V) and output (W_O) weight matrices. The OV circuit determines what information is written to the residual stream when a token is attended to."
  - term: "QK Circuit"
    definition: "The component of an attention head formed by the product of the query (W_Q) and key (W_K) weight matrices. The QK circuit determines which tokens attend to which other tokens by computing attention scores."
---

## The Residual Stream as a Vector Space

The [residual stream](/topics/attention-mechanism/#the-residual-stream) is more than just a convenient name. It is a $d_{\text{model}}$-dimensional vector that lives in $\mathbb{R}^{d_{\text{model}}}$, and treating it as a proper vector space unlocks the mathematical framework behind mechanistic interpretability {% cite "elhage2021mathematical" %}.

If you want a refresher on prerequisites or a full architecture walkthrough, start with [Prerequisites](/topics/mi-prerequisites/) and [Transformer Architecture Intro](/topics/transformer-architecture/).

At each token position, the residual stream starts as the token embedding and accumulates additive updates from every attention head and MLP layer. The final residual stream at any position decomposes as a sum:

$$
\mathbf{r}^L = \underbrace{\text{Embed}(\mathbf{x})}_{\text{token embedding}} + \underbrace{\sum_{l=0}^{L-1} \sum_{h=1}^{H} \text{Attn}^{l,h}}_{\text{all attention heads}} + \underbrace{\sum_{l=0}^{L-1} \text{MLP}^l}_{\text{all MLPs}}
$$

Each term in this sum is a vector in $\mathbb{R}^{d_{\text{model}}}$. For GPT-2 Small, $d_{\text{model}} = 768$; for GPT-3, $d_{\text{model}} = 12{,}288$. Every component performs two operations on this shared space: it *reads* by taking the current residual stream as input, and it *writes* by adding an update vector back to the stream.{% sidenote "Different components may read and write in different subspaces of the full residual stream. If two components use orthogonal subspaces, they do not interfere with each other. This is why the additive structure matters: it makes the model decomposable into analyzable parts." %}

> **Residual Stream (Formal):** The residual stream is the $d_{\text{model}}$-dimensional vector that flows through the transformer, starting as the token embedding and accumulating additive updates from each attention head and MLP layer.

The key insight is that the final output is a linear combination of contributions from every component. We can study each one separately and ask how much it contributed to the model's prediction. This decomposability is what makes transformers amenable to mechanistic analysis.

## Two Jobs, One Head

Each attention head does two conceptually independent things. First, it decides *where to move information*: which source tokens should each destination token attend to? Second, it decides *what information to move*: given the attended tokens, what gets copied to the output?

These two jobs are controlled by two independent circuits: the **QK circuit** and the **OV circuit**. Remarkably, the four weight matrices of an attention head ($W_Q$, $W_K$, $W_V$, $W_O$) factor cleanly into these two circuits, each of which can be analyzed on its own.

<figure>
  <img src="images/qk-ov-circuit-paths.png" alt="Diagram of a one-layer attention-only transformer showing the QK and OV circuits as separate paths through the model. The OV circuit (gold) traces from the source token through W_E, W_V, W_O, and W_U to the output logits. The QK circuit (pink) traces from both source and destination tokens through W_E, W_K, and W_Q to produce attention scores.">
  <figcaption>The two independent circuits of an attention head, shown as end-to-end paths through a one-layer transformer. The OV circuit (gold) determines how attending to a source token affects the output logits. The QK circuit (pink) determines which tokens the head attends to. From Elhage et al., <em>A Mathematical Framework for Transformer Circuits</em>. {%- cite "elhage2021mathematical" -%}</figcaption>
</figure>

## The QK Circuit

> **QK Circuit:** The QK circuit of attention head $h$ is the matrix $W_{QK}^h = W_Q^h (W_K^h)^T$. It determines the attention pattern: which source tokens each destination token attends to.

The attention score between tokens $i$ and $j$ can be written directly in terms of the QK circuit:

$$
e_{i,j} = \mathbf{x}_i \, W_{QK}^h \, \mathbf{x}_j^T
$$

where $\mathbf{x}_i$ and $\mathbf{x}_j$ are the residual stream vectors at positions $i$ and $j$. This is a bilinear form on $\mathbb{R}^{d_{\text{model}}}$: it takes two residual stream vectors and produces a scalar score. No separate query and key vectors need to be computed; the QK circuit matrix directly answers "how much should token $i$ attend to token $j$?"{% sidenote "The QK circuit is a $d_{\\text{model}} \\times d_{\\text{model}}$ matrix, but it has rank at most $d_k$ because it is the product of a $d_{\\text{model}} \\times d_k$ matrix with a $d_k \\times d_{\\text{model}}$ matrix. This low-rank structure means each head can only compute attention scores using a $d_k$-dimensional subspace of the residual stream." %}

We can go further. Including the embedding and unembedding matrices, the *full end-to-end QK circuit* maps tokens to attention scores:

$$
W_E^T \, W_{QK}^h \, W_E
$$

This is an $n_{\text{vocab}} \times n_{\text{vocab}}$ matrix. Entry $(i, j)$ tells us "how much does token $i$ attend to token $j$, based purely on token identity?" This is a directly interpretable object: a token-to-token attention score matrix that we can inspect.

## The OV Circuit

> **OV Circuit:** The OV circuit of attention head $h$ is the matrix $W_{OV}^h = W_V^h W_O^h$. It determines what information is moved from attended-to tokens to the destination.

The output contribution from source token $j$ to destination token $i$ is:

$$
\text{contribution}_j = \alpha_{i,j} \cdot \mathbf{x}_j \, W_{OV}^h
$$

where $\alpha_{i,j}$ is the attention weight. The OV circuit is a single matrix that transforms each source token's information before writing it to the residual stream. Like the QK circuit, it has rank at most $d_v$, creating a low-rank bottleneck that forces the head to compress its processing into a limited-dimensional subspace.

The full end-to-end OV circuit, including the unembedding, is:

$$
W_U \, W_{OV}^h \, W_E
$$

This is also an $n_{\text{vocab}} \times n_{\text{vocab}}$ matrix. Entry $(i, j)$ tells us "if the head attends to token $i$, how much does that increase the logit for token $j$?" This directly reveals the *effect on predictions* of attending to a given token.

## QK vs. OV: Side by Side

The two circuits have complementary roles:

| | QK Circuit (Where to Look) | OV Circuit (What to Move) |
|---|---|---|
| **Matrix** | $W_{QK}^h = W_Q^h (W_K^h)^T$ | $W_{OV}^h = W_V^h W_O^h$ |
| **Input** | Two token positions | A source token |
| **Output** | An attention score | An update to the residual stream |
| **Answers** | "Should I attend here?" | "What should I copy?" |
| **End-to-end** | $W_E^T \, W_{QK}^h \, W_E$ | $W_U \, W_{OV}^h \, W_E$ |
| **Interpretation** | Token-to-token relevance | Token-to-logit effect |

Every attention head decomposes into these two independent circuits. This is not just compact notation. It reveals that each head has exactly two degrees of freedom: *where* to look and *what* to move. These can be studied independently.

<details class="pause-and-think">
<summary>Pause and think: Why independence matters</summary>

Consider an attention head that always attends to the previous token (a "previous token head"). Its QK circuit determines *where* it looks (always one position back). Its OV circuit determines *what* it copies from that position. You could change what the head copies without changing where it looks, or vice versa. Why is this independence important for mechanistic interpretability? What would it mean if the two circuits were entangled instead?

</details>

## A Worked Example

To make the QK/OV decomposition concrete, consider a tiny 1-layer, attention-only transformer with $d_{\text{model}} = 4$, one attention head, and no MLP or layer norm. We trace a 2-token input through the standard computation, then verify that the circuit view gives identical results.

**Setup.** Embedding vectors $\mathbf{x}_A = (1, 0, 1, -1)$ and $\mathbf{x}_B = (0, 1, -1, 1)$. Weight matrices: $W_Q = I_4$ (identity), $W_K$ is a permutation that swaps entry pairs $(1 \leftrightarrow 2)$ and $(3 \leftrightarrow 4)$, $W_V$ is a permutation that swaps entries 2 and 3, and $W_O = I_4$.

**Standard computation.** Since $W_Q = I$, the queries equal the embeddings: $\mathbf{q}_A = (1, 0, 1, -1)$ and $\mathbf{q}_B = (0, 1, -1, 1)$. For the keys, $W_K$ swaps pairs: $\mathbf{k}_A = (0, 1, -1, 1)$ and $\mathbf{k}_B = (1, 0, 1, -1)$.

The raw attention scores for token A are $e_{AA} = \mathbf{q}_A \cdot \mathbf{k}_A = -2$ and $e_{AB} = \mathbf{q}_A \cdot \mathbf{k}_B = 3$. Scaling by $1/\sqrt{d_k} = 1/2$ gives $-1$ and $1.5$, and softmax yields $\alpha_{AA} \approx 0.08$ and $\alpha_{AB} \approx 0.92$. Token A pays 92% of its attention to token B.

The values are $\mathbf{v}_A = (1, 1, 0, -1)$ and $\mathbf{v}_B = (0, -1, 1, 1)$ (after $W_V$ swaps entries 2 and 3). The attention output for token A is $\text{out}_A = 0.08 \cdot \mathbf{v}_A + 0.92 \cdot \mathbf{v}_B \approx (0.08, -0.84, 0.92, 0.84)$.{% sidenote "The output is dominated by $\\mathbf{v}_B$ because A attends mostly to B. The QK circuit determined *where* A should look (at B), and the OV circuit determined *what* gets copied (B's value vector, transformed by $W_V$)." %}

**The QK circuit view.** The QK circuit matrix is $W_{QK} = W_Q W_K^T = I \cdot W_K^T = W_K^T$. Since $W_K$ is a symmetric permutation, $W_{QK} = W_K$. Computing the attention score directly:

$$
e_{AB} = \mathbf{x}_A \, W_{QK} \, \mathbf{x}_B^T = 3 \quad \checkmark
$$

Same answer as the standard computation, in a single matrix multiplication.

**The OV circuit view.** The OV circuit matrix is $W_{OV} = W_V W_O = W_V \cdot I = W_V$. The output from attending to token B is $\mathbf{x}_B \, W_{OV} = (0, -1, 1, 1) = \mathbf{v}_B$, matching exactly.

**The takeaway.** The standard four-matrix view ($W_Q$, $W_K$, $W_V$, $W_O$) and the two-circuit view ($W_{QK}$, $W_{OV}$) produce identical results. But the circuit view reveals the structure: the QK circuit is a single matrix that directly gives attention scores, and the OV circuit is a single matrix that directly gives the output transformation. Each head has exactly two independent functions, and we can study them separately.

<details class="pause-and-think">
<summary>Pause and think: Extending the example</summary>

In this toy example, $W_Q$ and $W_O$ were identity matrices for simplicity. In a real transformer, all four weight matrices are learned. How would the QK and OV circuits change if $W_Q$ were not the identity? Would the *independence* of the two circuits still hold? Think about what conditions are needed for the QK circuit to be truly independent from the OV circuit.

</details>

## The One-Layer Model

For a one-layer, attention-only model, the full output has a clean closed form:

$$
T(\mathbf{x}) = \mathbf{x} + \sum_h A^h (\mathbf{x} \, W_{OV}^h)
$$

where $A^h$ is the attention pattern matrix produced by the QK circuit and softmax. The model output is the original token embedding plus a sum of OV-circuit outputs, weighted by the attention patterns. Every part of this expression is inspectable: $A^h$ tells us where each head looked, and $W_{OV}^h$ tells us what it moved.{% sidenote "This clean decomposition is why one-layer and two-layer attention-only transformers are the starting point for much of the mathematical framework in Elhage et al. (2021). The absence of MLPs and the limited depth make it possible to write the full computation as a sum of interpretable terms." %}

This decomposition is the foundation for the composition framework covered in the next article. When we stack multiple layers, layer 2 heads can read the outputs of layer 1 heads from the residual stream, creating [composed behaviors](/topics/composition-and-virtual-heads/) that neither head could achieve alone.

## Why This Matters

The QK/OV decomposition is not just a mathematical curiosity. It provides the conceptual vocabulary that the entire field of mechanistic interpretability uses to describe what attention heads do. When researchers say a head is a "previous token head" or an "induction head," they are making claims about the head's QK circuit (what it attends to) and its OV circuit (what it copies). The framework from Elhage et al. {% cite "elhage2021mathematical" %} transforms the four opaque weight matrices of an attention head into two interpretable objects with clear functional roles.

The mathematical framework also gives us concrete, inspectable matrices. The end-to-end QK circuit $W_E^T W_{QK}^h W_E$ is a vocabulary-sized matrix we can examine entry by entry. The end-to-end OV circuit $W_U W_{OV}^h W_E$ directly tells us how attending to each token affects the output logits. These are not abstractions; they are real, computable objects that researchers use every day to understand what transformers learn.
