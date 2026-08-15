---
title: "Prerequisites"
description: "The neural-network, calculus, probability, and linear-algebra background assumed by this curriculum, with a diagnostic checklist and resources for filling gaps."
order: 1
prerequisites: []
---

## What This Refresher Covers

Mechanistic interpretability assumes comfort with a few core ideas from deep learning and linear algebra. This page is a quick refresh, not a full tutorial. If these concepts are familiar, you can skip ahead.

## Neural Networks in 60 Seconds

A neural network composes linear maps with nonlinearities. For a single layer:

$$
\mathbf{h} = f(\mathbf{x} W + \mathbf{b})
$$

- $\mathbf{x}$ is the input vector.
- $W$ is a learned weight matrix.
- $\mathbf{b}$ is a bias vector.
- $f$ is a nonlinear activation (ReLU, GELU, etc.).

Stacking many layers produces a deep function that can represent complex behaviors.

## Training and Backpropagation

Training adjusts weights to reduce a loss function $\mathcal{L}$. The loop is:

1. Forward pass: compute predictions.
2. Loss: measure error.
3. Backward pass: compute gradients $\nabla_W \mathcal{L}$.
4. Update: $W \leftarrow W - \eta \nabla_W \mathcal{L}$.

Mechanistic interpretability often treats a trained model as fixed and asks: what computation does this trained function implement?

## Linear Algebra You Will See Constantly

**Vectors as directions.** A vector $\mathbf{v} \in \mathbb{R}^n$ is a point or direction in $n$-dimensional space. In transformers, activations and embeddings are vectors.

**Matrices as linear maps.** A matrix $W$ maps vectors between spaces: $W : \mathbb{R}^n \to \mathbb{R}^m$. Most transformer computations are matrix multiplications.

**Dot product.** The dot product $\mathbf{a} \cdot \mathbf{b}$ measures similarity between two vectors. Attention scores are dot products between queries and keys.

**Subspaces and projections.** A subspace is a set of directions closed under addition and scaling. A projection removes the component of a vector along a direction. Many MI methods interpret features as directions and reason about projections onto them.

<details class="pause-and-think">
<summary>Pause and think: Are you ready to continue?</summary>

Suppose an activation is a row vector $\mathbf{x} \in \mathbb{R}^{768}$ and a weight matrix is $W \in \mathbb{R}^{768 \times 64}$. What shape is $\mathbf{x}W$? If a direction $\mathbf{v}$ has unit length, what does the scalar $\mathbf{x} \cdot \mathbf{v}$ tell you?

The product $\mathbf{x}W$ is a 64-dimensional row vector. The dot product gives the signed component of $\mathbf{x}$ along $\mathbf{v}$. If either answer felt unfamiliar, review matrix multiplication and vector projection before the attention articles; those two operations recur throughout the curriculum.

</details>

## Notation Quick Reference

- Bold lowercase: vectors $\mathbf{x}$, $\mathbf{r}$
- Bold uppercase: matrices $W$, $W_Q$, $W_K$, $W_V$
- Residual stream: $\mathbf{r}^l$ for layer $l$
- Attention head output: $\mathbf{r}^{l,h}$ for head $h$ in layer $l$

If this all feels easy, you are ready for the transformer foundations articles.
