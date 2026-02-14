---
title: "Layer Normalization"
description: "How layer normalization stabilizes transformer training, why it introduces a nonlinearity that complicates mechanistic interpretability, and the practical strategies researchers use to work around it."
order: 4
prerequisites:
  - title: "Transformer Architecture Intro"
    url: "/topics/transformer-architecture/"

glossary:
  - term: "Layer Normalization"
    definition: "A normalization technique that rescales activations within each token's representation vector to have zero mean and unit variance, then applies learned affine parameters. Applied before each sublayer in pre-norm transformers, it stabilizes training but introduces a nonlinearity that couples all residual stream dimensions."
  - term: "RMSNorm"
    definition: "A simplified variant of layer normalization that normalizes by the root mean square of activations without centering by the mean. Used in LLaMA, Gemma, and other modern architectures for its computational efficiency and comparable performance."
---

## Why This Matters

Without layer normalization, deep transformer training fails. As additive updates accumulate in the residual stream across dozens or hundreds of layers, activation magnitudes drift, gradients explode or vanish, and training becomes unstable. Layer normalization fixes this by constraining activation scales at every sublayer.

But this fix comes at a cost for mechanistic interpretability. The [residual stream](/topics/attention-mechanism/#the-residual-stream) is the foundation of MI analysis precisely because it is additive: the final output is a sum of contributions from every component. Layer normalization breaks this strict linearity. Each sublayer receives normalized activations, not the raw residual stream, which means the clean decomposition we rely on is an approximation.

This article covers what layer normalization does, why transformers need it, and how MI researchers handle the complications it introduces.

## What Layer Normalization Does

> **Layer Normalization:** Given an input vector $\mathbf{x} \in \mathbb{R}^d$, layer normalization computes:
>
> $$\text{LN}(\mathbf{x}) = \gamma \odot \frac{\mathbf{x} - \mu}{\sigma + \epsilon} + \beta$$
>
> where $\mu = \frac{1}{d}\sum_i x_i$ is the mean, $\sigma = \sqrt{\frac{1}{d}\sum_i (x_i - \mu)^2}$ is the standard deviation, $\gamma$ and $\beta$ are learned per-dimension scale and shift parameters, $\epsilon$ is a small constant for numerical stability, and $\odot$ denotes element-wise multiplication.

The operation has two stages {% cite "ba2016layernorm" %}. First, the input is centered (subtract the mean) and rescaled (divide by the standard deviation), producing a vector with zero mean and unit variance. Second, the learned parameters $\gamma$ and $\beta$ apply an element-wise affine transformation, allowing the model to undo the normalization in directions where it is not helpful.

Two properties are important. Layer normalization operates *within* a single token's vector. It does not look across tokens or across the batch. Each position is normalized independently.{% sidenote "This is in contrast to batch normalization, which normalizes across the batch dimension. Batch normalization is common in vision models but works poorly for language models, where sequence lengths vary and the batch statistics are less stable." %} And because normalization divides by the standard deviation, it erases information about the overall magnitude of the input. After LN, a vector and its scalar multiple produce the same output. The model can only use directional information, not scale, in the normalized representation.

## Why Transformers Need It

The residual stream accumulates additive updates from every attention head and MLP across all layers. In a model with $L$ layers, each contributing an update of typical magnitude $\delta$, the residual stream magnitude grows roughly as $O(L \cdot \delta)$. Without normalization, this growth has cascading consequences: the inputs to later sublayers become large, the dot products in attention scores become large, and the softmax saturates, producing nearly one-hot attention patterns with vanishing gradients.

Layer normalization constrains the scale of activations entering each sublayer. By normalizing to unit variance before every attention and MLP computation, it ensures that the inputs remain in a stable range regardless of depth. This is why transformers can be trained with dozens or hundreds of layers, and why removing layer normalization from a trained model causes immediate collapse.

## Pre-Norm vs. Post-Norm

The original transformer {% cite "vaswani2017attention" %} placed layer normalization *after* each residual connection (post-norm):

$$\mathbf{r}^{l+1} = \text{LN}(\mathbf{r}^l + \text{Sublayer}(\mathbf{r}^l))$$

Most modern architectures, including GPT-2 and its descendants, instead place layer normalization *before* each sublayer (pre-norm):

$$\mathbf{r}^{l+1} = \mathbf{r}^l + \text{Sublayer}(\text{LN}(\mathbf{r}^l))$$

The difference matters for training stability. With post-norm, the gradients must flow back through the layer normalization at every layer, which can create optimization difficulties. With pre-norm, the residual connection provides an unimpeded gradient path from the output back to the input, making training more stable {% cite "xiong2020prenorm" %}. Pre-norm models can typically be trained with larger learning rates and converge more reliably.{% sidenote "Xiong et al. showed theoretically that in pre-norm transformers, the gradients are well-behaved at initialization, while post-norm transformers require careful learning rate warmup to avoid divergence. This is why most modern LLMs use pre-norm, and it is the architecture assumed in most MI research." %}

For mechanistic interpretability, the pre-norm placement has a practical advantage: the residual stream *after* each sublayer addition is the raw sum of all previous contributions, not a normalized version. This is why MI researchers typically analyze the pre-layer-norm residual stream (the `hook_resid_pre` activation in TransformerLens), where the additive decomposition holds exactly. The normalization only affects what each sublayer *sees as input*, not the residual stream itself.

## RMSNorm

> **RMSNorm:** A variant of layer normalization that drops the mean-centering step and normalizes by the root mean square:
>
> $$\text{RMSNorm}(\mathbf{x}) = \gamma \odot \frac{\mathbf{x}}{\text{RMS}(\mathbf{x}) + \epsilon}, \quad \text{RMS}(\mathbf{x}) = \sqrt{\frac{1}{d}\sum_i x_i^2}$$

RMSNorm {% cite "zhang2019rmsnorm" %} simplifies layer normalization by removing the mean subtraction. This saves computation (no need to compute and subtract the mean) and reduces the coupling between dimensions (the normalization factor depends only on the overall magnitude, not the mean). Empirically, RMSNorm performs comparably to full layer normalization on most tasks.

RMSNorm is used in LLaMA, Gemma, and several other modern architectures. For MI purposes, it introduces the same fundamental complication as full layer normalization: the division by a norm that depends on all dimensions creates a nonlinear coupling. The practical treatment is the same.

## Why Layer Norm Matters for MI

Layer normalization creates three specific complications for mechanistic interpretability.

**It breaks strict linearity of the residual stream decomposition.** The additive structure of the residual stream means the final output is a sum of contributions from every component. But each sublayer receives $\text{LN}(\mathbf{r})$ as input, not $\mathbf{r}$ itself. Since LN is nonlinear (it divides by a data-dependent standard deviation), the output of each sublayer is a nonlinear function of all previous contributions. Techniques like [direct logit attribution](/topics/direct-logit-attribution/) and the [logit lens](/topics/logit-lens-and-tuned-lens/) that rely on the linear decomposition are therefore approximations.

**It couples all dimensions.** Changing a single component of $\mathbf{x}$ changes both $\mu$ and $\sigma$, which shifts the normalized value of every other component. In principle, this means that the contribution of one attention head to the residual stream affects how every other head's contribution is seen by subsequent layers. This coupling is the reason the linear decomposition is approximate rather than exact.

**It erases magnitude information.** After normalization, only the direction of the residual stream matters, not its length. This means the model cannot use the overall scale of the residual stream to carry information between layers; it must encode everything in the direction of the vector.

### How Researchers Handle It

In practice, layer normalization is treated as a manageable approximation rather than a fundamental obstacle. Several strategies are common:

**Analyzing pre-LN activations.** In pre-norm transformers, the residual stream before layer normalization (`hook_resid_pre` in TransformerLens) is the raw sum of all previous contributions. The additive decomposition is exact at this point. Researchers typically analyze this representation.

**Folding LN into weights.** TransformerLens provides a `fold_ln` option that absorbs the learned $\gamma$ and $\beta$ parameters into the adjacent weight matrices ($W_Q$, $W_K$, $W_V$, $W_{\text{in}}$). After folding, these affine parameters no longer need separate treatment. The remaining nonlinearity (the division by $\sigma$) is the part that cannot be absorbed.{% sidenote "Folding is exact for the affine part of LN. The center-and-scale step (dividing by σ) cannot be folded because it depends on the input data. After folding, the only approximation is treating this data-dependent normalization as approximately constant, which works well when no single dimension dominates the variance." %}

**The high-dimensional argument.** In a $d$-dimensional space, changing one component of a vector affects the mean by $O(1/d)$ and the standard deviation by $O(1/d)$. For GPT-2 Small with $d = 768$, the effect of a single component on the normalization is roughly 0.1%. This is why the linear decomposition works well in practice despite being technically approximate: the coupling is real but small.

<details class="pause-and-think">
<summary>Pause and think: Why does the linear decomposition work?</summary>

If layer normalization couples all dimensions, why does the linear decomposition of the residual stream still work well enough for techniques like direct logit attribution to give meaningful results?

The key is the high-dimensional argument. In a space with $d = 768$ or more dimensions, any single component contributes $O(1/d)$ to the mean and variance. The normalization factor $\sigma$ depends on all dimensions roughly equally, so changing one dimension barely shifts it. The coupling is present but diluted across hundreds of dimensions. For a contribution to meaningfully distort the normalization, it would need to change the overall scale of the vector, which individual attention heads and MLP updates rarely do. This is an empirical observation, not a guarantee, and there are cases where LN effects do matter, but for most practical MI work the approximation is accurate enough to be useful.

</details>

## Looking Ahead

The next article, [QK and OV Circuits](/topics/qk-ov-circuits/), deliberately sets layer normalization aside to present the clean linear algebra of attention head decomposition. This is the standard practice in MI research: develop the theory under the linear approximation, then account for LN effects when precision matters. Later articles on [DLA](/topics/direct-logit-attribution/) and the [logit lens](/topics/logit-lens-and-tuned-lens/) will note specifically where the LN approximation affects their conclusions.
