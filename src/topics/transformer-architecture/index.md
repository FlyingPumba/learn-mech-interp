---
title: "Transformer Architecture Deep Dive"
description: "A guided walkthrough of the full transformer stack: embeddings, attention, MLPs, layer norm, residual stream, and positional information."
prerequisites:
  - title: "Prerequisites for Mechanistic Interpretability"
    url: "/topics/mi-prerequisites/"
difficulty: "foundational"
block: "transformer-foundations"
category: "transformer-foundations"
---

## The Big Picture

A decoder-only transformer processes a sequence by repeatedly applying two sublayers at every layer:

1. **Attention:** move information between positions.
2. **MLP:** transform information at each position.

Both sublayers write their outputs into a shared **residual stream**, which acts like a global scratchpad.

## Step 0: Tokens to Vectors

Inputs are tokenized and embedded into vectors. Each position starts with:

$$
\mathbf{r}^0 = \text{Embed}(\text{tokens}) + \text{PE}
$$

- **Embedding** maps discrete tokens to vectors.
- **Positional encodings** (PE) inject order information so the model can tell token positions apart.

## Step 1: Attention (Information Routing)

Attention lets each position read from other positions. It computes a weighted mix of value vectors based on query–key similarity. The output is an update to the residual stream:

$$
\mathbf{r}^{l+} = \mathbf{r}^l + \text{Attn}^l(\mathbf{r}^l)
$$

Multi-head attention runs several attention heads in parallel, allowing the model to route different kinds of information simultaneously.

## Step 2: MLP (Local Computation)

The MLP transforms information at each position independently:

$$
\mathbf{r}^{l+1} = \mathbf{r}^{l+} + \text{MLP}^l(\mathbf{r}^{l+})
$$

You can think of attention as moving information *between* positions, and the MLP as processing information *within* a position.

## The Residual Stream (Why MI Works)

The residual stream is additive. Every component writes a vector into the same space. This means the final activation is a **sum of contributions** from all heads and MLPs across layers. That additivity is what enables mechanistic interpretability tools like direct logit attribution and activation patching.

## Layer Normalization

Layer norm stabilizes training by normalizing activations, and it appears before (or sometimes after) attention and MLP sublayers depending on the model variant. For MI, layer norm is a mild nonlinearity that can complicate strict linear decompositions, but the residual stream view is still a powerful approximation.

## The Full Stack (Compact Form)

Ignoring some details, a decoder-only transformer applies this recurrence for each layer $l$:

$$
\mathbf{r}^{l+1} = \mathbf{r}^l + \text{Attn}^l(\mathbf{r}^l) + \text{MLP}^l(\mathbf{r}^l)
$$

After $L$ layers, the final residual stream is mapped to logits with the unembedding matrix.

## Why This Matters for MI

Mechanistic interpretability treats the model as a computation graph we can open. Because the transformer’s core operations are structured and mostly linear in the residual stream, we can trace, ablate, and patch individual components. The rest of the course builds on this architecture-level understanding.
