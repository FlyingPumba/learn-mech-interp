---
title: Content Rendering Test
description: Demonstrates math, code highlighting, figures, citations, margin notes, and collapsible prompts.
---

This article verifies that the content rendering pipeline works correctly. Each section below tests a different content type used throughout the site.

## Inline Math

In transformer models, the attention score $\alpha_{ij}$ between positions $i$ and $j$ determines how much information flows between them. The softmax is computed over $d_k$ dimensions, where $d_k$ is the key dimension.

## Display Math

The scaled dot-product attention mechanism computes a weighted sum of values:

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
$$

This operation is the building block of multi-head attention in transformers.

## Syntax-Highlighted Code

Here is a PyTorch implementation of scaled dot-product attention:

```python
import torch
import torch.nn.functional as F

def attention(Q, K, V):
    """Scaled dot-product attention."""
    d_k = Q.size(-1)
    scores = torch.matmul(Q, K.transpose(-2, -1)) / d_k ** 0.5
    weights = F.softmax(scores, dim=-1)
    return torch.matmul(weights, V)
```

The function takes query, key, and value tensors and returns the attention-weighted output.

## Figure with Caption

The figure plugin wraps images in semantic `<figure>` and `<figcaption>` elements:

![Attention pattern visualization](/images/placeholder.png "Figure 1: Attention weights for an example input sequence")

The image above will not load (no file exists at that path), but the HTML structure should contain proper `<figure>` and `<figcaption>` markup.

## Inline Citations

Superposition occurs when models represent more features than dimensions {% cite "elhage2022toy" %}. This phenomenon was further explored in the context of induction heads, which play a key role in in-context learning {% cite "olsson2022context" %}. The mathematical framework for understanding transformer circuits provides the theoretical foundation for these observations {% cite "elhage2021mathematical" %}.

## Sidenotes and Margin Notes

The concept of superposition has deep implications for interpretability.{% sidenote "This is analogous to compressed sensing in signal processing, where sparse signals can be recovered from fewer measurements than the signal dimension." %} When a model uses superposition, individual neurons no longer correspond to individual features, making the model harder to interpret.

Researchers have developed dictionary learning approaches to decompose superposed representations into interpretable features.{% sidenote "Sparse autoencoders (SAEs) are the primary tool for this decomposition, trained to reconstruct activations from a sparse bottleneck layer." %} These methods attempt to recover the underlying feature directions from the model's activations.{% marginnote "See also: the Johnson-Lindenstrauss lemma for related results on dimensionality reduction and distance preservation." %}

## Collapsible Prompts

<details class="pause-and-think">
<summary>Pause and think: Why might a model use superposition?</summary>

Consider what happens when the number of useful features exceeds the number of dimensions in the residual stream. The model faces a fundamental tradeoff:

- **Dedicate dimensions:** Assign each feature its own orthogonal direction, limiting total features to the model dimension $d$.
- **Use superposition:** Pack more features by allowing interference between them, gaining capacity at the cost of some reconstruction error.

When features are sparse (rarely active simultaneously), the interference cost is low, making superposition an efficient strategy. This is why larger models with more dimensions tend to be more interpretable -- they can afford to be less superposed.

</details>

<details class="pause-and-think">
<summary>Pause and think: How do induction heads relate to in-context learning?</summary>

Induction heads implement a simple but powerful algorithm: they look for previous occurrences of the current token and predict what came after. This is a form of pattern completion that emerges naturally during training.

The key insight is that this mechanism enables **in-context learning** -- the model can use patterns from earlier in its context window to make predictions about later tokens, without any weight updates.

</details>
