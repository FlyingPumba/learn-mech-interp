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
