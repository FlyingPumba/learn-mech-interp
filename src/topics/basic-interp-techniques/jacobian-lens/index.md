---
title: "The Jacobian Lens"
description: "A principled refinement of the logit lens that uses the model's own Jacobian, averaged over contexts, to translate intermediate residual streams into vocabulary readouts. Built from calculus and linear algebra rather than a learned probe."
order: 2
keywords: "Jacobian lens, J-lens, J-space, logit lens, tuned lens, mechanistic interpretability, transformer interpretability, residual stream, first-order approximation, linear approximation, unembedding matrix, hidden state decoding, verbalizable representations, global workspace, transformer, language model, vocabulary projection, activation lens, Anthropic, transformer-circuits, gradient-based interpretability, backpropagation, chain rule, calculus, linear algebra"
prerequisites:
  - title: "The Logit Lens and Tuned Lens"
    url: "/topics/logit-lens-and-tuned-lens/"
  - title: "Direct Logit Attribution"
    url: "/topics/direct-logit-attribution/"

glossary:
  - term: "Jacobian Lens"
    definition: "A vocabulary-projection method that translates intermediate residual streams to output logits using the Jacobian of the final residual stream with respect to an intermediate layer, averaged over positions and contexts. Unlike the tuned lens, its linear map is derived from the model's own weights rather than learned."
  - term: "Jacobian Matrix"
    definition: "For a vector-valued function f: ℝⁿ → ℝᵐ, the matrix of all first-order partial derivatives. Entry (i, j) records how output component i responds to a small change in input component j. Its shape is m × n."
  - term: "First-Order Approximation"
    definition: "The linear approximation of a function near a point, built from its first derivative (or Jacobian in higher dimensions). Formally, f(x + Δx) ≈ f(x) + J·Δx. The name refers to the first term of the Taylor expansion; higher-order corrections are ignored."
  - term: "J-Space"
    definition: "The subspace of residual-stream activations spanned by sparse non-negative combinations of J-lens vectors. Empirically, this space carries the concepts the model is 'poised to verbalize' at a given layer and position."
---

## Where the Logit Lens Breaks Down

The [logit lens](/topics/logit-lens-and-tuned-lens/) applies the model's unembedding matrix $W_U$ directly to an intermediate residual stream $\mathbf{h}_\ell$ and reads off a vocabulary distribution. It works in late layers, where the residual stream already lives in a basis close to the final layer. In early layers, it fails: the projections come out incoherent, not because the information is missing, but because the coordinates have not yet been rotated into the basis $W_U$ expects.

The [tuned lens](/topics/logit-lens-and-tuned-lens/#the-tuned-lens) responds by *learning* a per-layer linear correction to match the final-layer output distribution. This works, but it changes the character of the tool: the correction is fitted to outputs on a training set, and it optimizes a correlational objective. When we want to know what the model itself would linearly do with a given activation, a fitted map introduces its own inductive bias.

The Jacobian lens takes a different path. Instead of learning a linear map, it *derives* one from the model's own weights, using nothing more than calculus. The result, introduced by Gurnee, Lindsey, and collaborators in 2026 {% cite "gurnee2026workspace" %}, is a principled refinement of the logit lens that recovers interpretable content at depths where the raw projection cannot.

> **Jacobian Lens (J-lens):** A per-layer vocabulary readout obtained by (1) computing the Jacobian of the final residual stream with respect to an intermediate residual stream, (2) averaging that Jacobian over token positions and a corpus of prompts, and (3) composing the resulting matrix with the unembedding. It surfaces concepts the model is *poised to verbalize*, whether or not they appear in the next token.

The rest of this article is built for someone who has seen the logit lens but is not yet comfortable with the words *Jacobian*, *first-order*, or *linearization*. We will build each of those from scratch, then assemble them into the J-lens definition.

## Warm-Up: Derivatives, Jacobians, and What "Linear" Means

To build the J-lens, we need one idea from single-variable calculus and its generalization to vectors.

### From one dimension...

Suppose $f: \mathbb{R} \to \mathbb{R}$ is a smooth function. Pick a **linearization point** $x_0$. Near it, we can approximate $f$ by its tangent line:

$$
f(x_0 + \Delta x) \;\approx\; f(x_0) \;+\; f'(x_0) \cdot \Delta x.
$$

The number $f'(x_0)$ is the derivative. The approximation is called **first-order** because it uses the first derivative; higher-order Taylor terms ($\frac{1}{2} f''(x_0) \Delta x^2$, etc.) are dropped. It says: *if you nudge the input by $\Delta x$ away from $x_0$, the output moves by roughly $f'(x_0)$ times that nudge*. The approximation is exact only when $f$ is a straight line; for curves, the error grows with $|\Delta x|$.

<figure class="jl-figure">
  <div class="jl-diagram" id="jl-first-order">
    <svg viewBox="0 0 640 320" role="img" aria-label="Interactive plot of a curve f(x) and its tangent line at x0. A slider moves the tangent point.">
      <defs>
        <linearGradient id="jl-grad-1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#5b6abf" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#5b6abf" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g id="jl-fo-plot"></g>
    </svg>
    <div class="jl-controls">
      <label>Tangent point x₀: <input type="range" id="jl-fo-x0" min="-3" max="3" step="0.05" value="-1"></label>
      <label>Step size Δx: <input type="range" id="jl-fo-dx" min="-2.5" max="2.5" step="0.05" value="1.2"></label>
    </div>
    <div class="jl-readout" id="jl-fo-readout"></div>
  </div>
  <figcaption>The blue curve is <em>f(x)</em>. The red line is its <em>tangent</em> at x₀: the best linear approximation. The green dot is the true value f(x₀ + Δx); the red dot is the linear prediction f(x₀) + f′(x₀)·Δx. The gap between them is the first-order error, which grows as Δx moves away from zero.</figcaption>
</figure>

The key point: near $x_0$, the curve *looks linear*. First-order means we take that local straightening seriously and use it to predict small displacements.

### ...to many dimensions

Now let $f: \mathbb{R}^n \to \mathbb{R}^m$. The input is a vector $\mathbf{x} \in \mathbb{R}^n$; the output is a vector $\mathbf{y} \in \mathbb{R}^m$. What replaces the derivative?

There is no single number that captures how $\mathbf{y}$ changes with $\mathbf{x}$. There are $m \times n$ numbers: for each output component $y_i$ and each input component $x_j$, we can ask how $y_i$ changes when we nudge $x_j$. Collecting them into a matrix gives the **Jacobian**:

$$
J \;=\; \frac{\partial \mathbf{y}}{\partial \mathbf{x}} \;=\;
\begin{pmatrix}
\dfrac{\partial y_1}{\partial x_1} & \cdots & \dfrac{\partial y_1}{\partial x_n} \\
\vdots & \ddots & \vdots \\
\dfrac{\partial y_m}{\partial x_1} & \cdots & \dfrac{\partial y_m}{\partial x_n}
\end{pmatrix}.
$$

> **Jacobian:** For $f: \mathbb{R}^n \to \mathbb{R}^m$, the Jacobian at a point $\mathbf{x}$ is the $m \times n$ matrix whose entry $(i, j)$ is $\partial y_i / \partial x_j$. Row $i$ is the gradient of the $i$-th output; column $j$ tells you how every output responds to a nudge in the $j$-th input.

The multivariate first-order approximation reads:

$$
\mathbf{y}(\mathbf{x}_0 + \Delta \mathbf{x}) \;\approx\; \mathbf{y}(\mathbf{x}_0) \;+\; J \, \Delta \mathbf{x},
$$

with $J$ evaluated at the linearization point $\mathbf{x}_0$. This is the *same* statement as the 1D case, with numbers upgraded to vectors and matrices. Locally, the potentially very non-linear function $f$ is approximated by a linear map: matrix multiplication by $J$.{% sidenote "This is the reason people say 'the derivative is a linear map.' In 1D the map is 'multiply by $f'(x_0)$'; in higher dimensions it is 'multiply by the matrix $J$.' Same idea, richer bookkeeping." %}

<details class="pause-and-think">
<summary>Pause and think: shapes</summary>

If $\mathbf{x} \in \mathbb{R}^n$ and $\mathbf{y} \in \mathbb{R}^m$, what shape is $J$? What shape must $\Delta \mathbf{x}$ be for $J \Delta \mathbf{x}$ to make sense, and what shape does the product have?

$J$ has shape $m \times n$. To multiply $J \Delta \mathbf{x}$, we need $\Delta \mathbf{x}$ to be an $n$-vector, which it is (it lives in input space). The product is an $m$-vector, matching output space. The rows count outputs; the columns count inputs. Getting these dimensions straight is the whole game when we apply the idea to transformers. Activations in this curriculum are row vectors, so the transformer sections below use the transposed Jacobian, which carries inputs along its rows and multiplies $\Delta \mathbf{x}$ from the right.

</details>

## The Model as a (Locally Linear) Function

A transformer is a deep, non-linear function. But it has a special structure we will exploit: at every layer, information sits in the residual stream, a vector of dimension $d_\text{model}$, and each layer *adds* an update to it. Reading off the model's output means:

1. Apply layers $\ell{+}1, \ell{+}2, \dots, L$ to the residual stream $\mathbf{h}_\ell$ at layer $\ell$, producing the final residual stream $\mathbf{h}_L$.
2. Apply a layer norm and the unembedding matrix $W_U$ to $\mathbf{h}_L$, producing logits over the vocabulary.

Step 1 is complicated: attention, MLPs, non-linearities, residual connections. Step 2 is linear (up to layer norm). We *cannot* generally reduce Step 1 to matrix multiplication; the model would not need all those layers if we could. But we can locally *approximate* Step 1 by matrix multiplication, using the Jacobian.

Fix a prompt and a source position $t$. Treat $\mathbf{h}_\ell$ (the residual stream at layer $\ell$, position $t$) as the input, and $\mathbf{h}_{\text{final}, t'}$ (the final residual stream at some position $t' \ge t$) as the output. Both are vectors of size $d_\text{model}$. The Jacobian

$$
J_{\ell, t, t'} \;=\; \left( \frac{\partial\, \mathbf{h}_{\text{final}, t'}}{\partial\, \mathbf{h}_{\ell, t}} \right)^{\!T}
$$

is a $d_\text{model} \times d_\text{model}$ matrix, transposed so that it acts from the right: its rows index the input and its columns the output. It tells us: if we nudged $\mathbf{h}_{\ell, t}$ by a small vector $\Delta \mathbf{h}$, the final residual stream at position $t'$ would shift by approximately $\Delta \mathbf{h} \, J_{\ell, t, t'}$.{% sidenote "Why $t' \ge t$? Because a perturbation at position $t$ can only affect positions from $t$ onwards. Attention in an autoregressive transformer is causal: earlier positions cannot look at later ones." %}

The shape is worth staring at. Both dimensions equal $d_\text{model}$ because the residual stream has the same width at every layer; it is a shared bus that all layers read from and write to.

<figure class="jl-figure">
  <div class="jl-diagram jl-jacobian-shape">
    <svg viewBox="0 0 720 280" role="img" aria-label="Diagram showing the Jacobian as a d_model by d_model matrix mapping perturbations of h_l to perturbations of h_final.">
      <g id="jl-shape-plot"></g>
    </svg>
  </div>
  <figcaption>The Jacobian J is a d_model × d_model matrix that maps a perturbation in layer-ℓ residual-stream space to a perturbation in final-layer residual-stream space. Row <em>j</em>: how a nudge to input component <em>j</em> ripples through every output component. Column <em>i</em>: how output component <em>i</em> depends on all input components.</figcaption>
</figure>

## Why Average? A Single Jacobian Is Two Things at Once

The Jacobian $J_{\ell, t, t'}$ computed on one prompt tells us the local linearization *for that specific input*. But that linearization mixes two very different kinds of structure:

- **Context-independent structure**: how the model's weights generally translate features at layer $\ell$ into features at layer $L$. This is what we want to capture: a property of the model, not of any one input.
- **Context-specific structure**: how the current prompt's attention patterns, activations, and gates route information through layers $\ell{+}1, \dots, L$. This is transient; it changes with every input.

If we care about *what a direction in layer-$\ell$ space generally means*, we need to strip out the context-specific part. The J-lens does this by **averaging Jacobians over many contexts**:

$$
J_\ell \;=\; \mathbb{E}_{\,t,\; t' \ge t,\; \text{prompt}} \left[\, \left( \frac{\partial\, \mathbf{h}_{\text{final}, t'}}{\partial\, \mathbf{h}_{\ell, t}} \right)^{\!T} \,\right].
$$

Three things are being averaged:

1. **Over source positions $t$** within each prompt. A concept encoded at layer $\ell$ should be readable regardless of *where* in the sequence it appears.
2. **Over subsequent positions $t' \ge t$**. We do not care only about how $\mathbf{h}_{\ell, t}$ shapes the immediate next-token logits; we care about how it shapes any downstream logit it can influence.
3. **Over a corpus of prompts** (roughly a thousand, in the original paper). This is what turns *context-specific* into *context-independent*: averaging over diverse contexts cancels the parts of each Jacobian that depend on that context and leaves the parts that are stable across contexts.

The idea is exactly the same as computing an average gradient across a dataset: individual gradients point in noisy, context-driven directions; the average points in the direction the loss actually wants to move. Here the "loss" is not a scalar but a linear map, and averaging happens over context, position, and destination.

<figure class="jl-figure">
  <div class="jl-diagram" id="jl-averaging">
    <svg viewBox="0 0 760 260" role="img" aria-label="Three per-prompt Jacobian heatmaps and their average, showing that noise averages out while shared structure remains.">
      <g id="jl-avg-plot"></g>
    </svg>
    <div class="jl-controls">
      <label>Number of prompts averaged: <input type="range" id="jl-avg-n" min="1" max="200" step="1" value="1"></label>
    </div>
    <div class="jl-readout" id="jl-avg-readout"></div>
  </div>
  <figcaption>Simulated per-prompt Jacobians as heatmaps: each is the sum of a shared context-independent structure and per-prompt noise. Slide up the number of prompts and watch the average settle onto the shared structure. This is a toy visualization; the real J-lens averages roughly a thousand Jacobians over a pretraining-like corpus.</figcaption>
</figure>

<details class="pause-and-think">
<summary>Pause and think: why not just use one prompt?</summary>

Suppose we computed the Jacobian on a single prompt about French cities. What would the top-ranked lens tokens look like, and why would that be misleading as a general readout of layer $\ell$?

They would over-represent tokens the model happens to be predicting in *that* prompt (French words, capitals, geographic terms), because the local Jacobian is heavily shaped by the current attention pattern and the current MLP activations. If we asked "what does this direction in layer-$\ell$ space *generally* mean in the model?", we would get the wrong answer. Averaging over many prompts is what makes the resulting map a property of the model rather than of any one input.

</details>

The final $J_\ell$ is a single $d_\text{model} \times d_\text{model}$ matrix per layer. It is the "average linear translator" from layer $\ell$ to the final layer.

## Reading Out: The Lens Formula

With $J_\ell$ in hand, applying the lens to an activation $\mathbf{h}_\ell$ is a one-liner. Multiply by $J_\ell$, apply the model's layer norm, apply the unembedding $W_U$, softmax:

$$
\text{lens}(\mathbf{h}_\ell) \;=\; \text{softmax}\!\bigl(\, \text{norm}(\mathbf{h}_\ell \, J_\ell) \, W_U \,\bigr).
$$

The result is a probability distribution over the vocabulary: a "top tokens" list you can inspect.

The Anthropic paper describes this as *equivalent to replacing all subsequent layers with the appropriate lens matrix*. That sentence packs a lot into a few words, and it is worth unpacking with a picture.

### What "replacing all subsequent layers" means

Normally the model computes $\mathbf{h}_L$ from $\mathbf{h}_\ell$ by running through everything downstream of layer $\ell$: attention blocks, MLPs, residual connections, layer norms. That downstream computation is a complicated non-linear function; call it $F_\ell$, so that $\mathbf{h}_L = F_\ell(\mathbf{h}_\ell, \text{context})$.

The averaged Jacobian $J_\ell$ is the best single linear map that approximates $F_\ell$ across contexts. So *replacing* $F_\ell$ with $J_\ell$ means: pretend the model, from layer $\ell$ onward, is just this linear map. Then the final residual stream would be $\mathbf{h}_\ell J_\ell$, and the model's readout would be $\text{norm}(\mathbf{h}_\ell J_\ell) \, W_U$.

That is exactly the lens formula. Nothing extra is going on.

<figure class="jl-figure">
  <div class="jl-diagram" id="jl-layer-compression">
    <svg viewBox="0 0 820 340" role="img" aria-label="Diagram showing a transformer stack, then the same stack with layers l+1 through L replaced by a single linear map J_l.">
      <g id="jl-layers-plot"></g>
    </svg>
    <div class="jl-controls">
      <label>Layer to lens at: <input type="range" id="jl-layers-l" min="1" max="6" step="1" value="3"></label>
      <label class="jl-toggle"><input type="checkbox" id="jl-layers-toggle"> Show J-lens replacement</label>
    </div>
  </div>
  <figcaption>The full model (top): the residual stream at layer ℓ (yellow) passes through every remaining layer before being unembedded. The J-lens view (toggle on): layers ℓ+1, …, L are collapsed into the single linear map J_ℓ, followed by the model's own layer norm and unembedding. The green readout is a first-order approximation of what the model would have produced.</figcaption>
</figure>

### Why this is an approximation, not a fact

The equivalence is a first-order approximation, not an equality. Two things make it inexact:

- **Non-linearity.** Real transformer layers are non-linear. $J_\ell$ is a *local* linearization; the further $\mathbf{h}_\ell$ is from the point around which we linearized, the worse the approximation.
- **Averaging.** The single $J_\ell$ we use is an *average* over contexts. On any particular prompt, the true local Jacobian would differ from $J_\ell$.

The remarkable empirical result is that this approximation is nevertheless a very useful readout: it recovers coherent, interpretable content at layers where the logit lens returns noise, and its top tokens track the concepts the model is actively "holding in mind." The math is not exact, but the direction it picks in vocabulary space is often the right one.

### The J-lens vectors

Look at the lens formula again, focusing on the pre-softmax logits and ignoring the normalization for a moment:

$$
\text{logits} \;\approx\; \mathbf{h}_\ell \, J_\ell \, W_U \;=\; \mathbf{h}_\ell \, \underbrace{(J_\ell W_U)}_{\substack{d_\text{model} \times n_\text{vocab}}}.
$$

The composed matrix $J_\ell W_U$ has one column per vocabulary token. Column $t$ is a direction in layer-$\ell$ residual-stream space; the logit for token $t$ is (approximately) the inner product of that column with $\mathbf{h}_\ell$.

> **J-lens Vector:** For layer $\ell$ and vocabulary token $t$, the J-lens vector $\mathbf{v}_t^{(\ell)}$ is the $t$-th column of $J_\ell W_U$, viewed as a direction in $\mathbb{R}^{d_\text{model}}$. The lens score for token $t$ at that layer is (up to layer-norm scaling) $\langle \mathbf{v}_t^{(\ell)},\, \mathbf{h}_\ell \rangle$.

There are $n_\text{vocab}$ such vectors per layer, typically $\sim$100,000 vectors in a $d_\text{model}$-dimensional space. That set is overcomplete: no unique decomposition of an activation as a sum of J-lens vectors exists. But *sparse* combinations turn out to be well-defined and empirically meaningful; the paper calls the set of activations expressible as sparse non-negative combinations of J-lens vectors the **J-space**.

<details class="pause-and-think">
<summary>Pause and think: J-lens vector vs. probing direction</summary>

A linear probe for concept $c$ learns a direction $\mathbf{w}_c$ such that $\langle \mathbf{w}_c, \mathbf{h}_\ell \rangle$ correlates with whether $c$ is present. A J-lens vector $\mathbf{v}_t^{(\ell)}$ is also a direction whose inner product with $\mathbf{h}_\ell$ gives a score. What is the difference, mechanistically?

A probe direction is *learned* to distinguish inputs on some external label. It is correlational: it may or may not align with anything the model itself uses. A J-lens vector is *derived* from the model's own weights: it is the column of $J_\ell W_U$, so its score is the model's own (first-order) push toward emitting token $t$ downstream. Same geometry (inner product), very different sources of information: labels vs. the model's causal structure.

</details>

## Comparing the Three Lenses

The three lenses can be written in a common form:

$$
\text{lens}(\mathbf{h}_\ell) \;=\; \text{softmax}\!\bigl(\, \text{norm}( \mathbf{h}_\ell \, M_\ell ) \, W_U \,\bigr),
$$

differing only in what $M_\ell$ is.

| Lens | $M_\ell$ | Source of $M_\ell$ | Character |
|---|---|---|---|
| Logit lens | $I$ (identity) | Assumes layer-$\ell$ basis matches final layer | No calibration; fails in early layers |
| Tuned lens | $A_\ell$ (learned affine) | Trained to match final output distribution | Correlational; can "skip ahead" to outputs |
| Jacobian lens | $J_\ell = \mathbb{E}[(\partial \mathbf{h}_L / \partial \mathbf{h}_\ell)^T]$ | Derived from the model's own weights, averaged | Causal, first-order; recovers content in early layers |

Two of these choices are motivated. The logit lens sets $M_\ell = I$ because in late layers the residual stream is already close to the final basis; there is nothing to translate. That works when it works and fails silently when it doesn't. The tuned lens fits $A_\ell$ so that the readout matches the true output; that pins the readout to what will be *emitted*, which is not always what we want to look at. The J-lens picks $M_\ell = J_\ell$ because $J_\ell$ is the actual first-order description of what layers $\ell{+}1{:}L$ do, on average across contexts. It is the closest thing to a "linear model of the model" you can extract without any learning.

The three coincide in one important edge case: at the final layer, $J_L$ is (approximately) the identity, and all three reduce to the model's own unembedding. Divergences appear as we go earlier.{% sidenote "The J-lens paper reports that the logit lens agrees closely with the J-lens in the last several layers and diverges earlier: exactly the regime where the logit lens is known to fail." %}

The mean-Jacobian construction was used earlier by Hernandez et al. {% cite "hernandez2023lre" %} to derive per-*relation* affine maps $\mathbf{s} W_r + \mathbf{b}_r$ (e.g., a single "plays instrument" matrix that turns "Miles Davis" into "trumpet") and a companion *attribute lens* for tracking a fixed relation across layers. The J-lens generalizes the same first-order-plus-averaging trick from per-relation to per-layer, taking the expectation over a broad corpus rather than examples of one relation.

## What Ends Up in the Lens

Because $J_\ell$ was built from the causal effect of $\mathbf{h}_\ell$ on final outputs, the top tokens in the J-lens readout are the ones $\mathbf{h}_\ell$ is *disposed to push the model to say*, averaged across contexts in which such an activation might arise. Those tokens are not always the next predicted token; often they are concepts the model is holding in mind that would surface only if asked. In the source paper, running the J-lens on the token before "the sport is:" while the model has been instructed to think of a sport reveals *soccer* as a top lens token several layers before the model actually emits it. Applying the lens while the model silently computes $3^2 - 2$ reveals *nine* and then *seven* at intermediate layers, exposing the intermediate step. See {% cite "gurnee2026workspace" %} for many more examples.

Because J-lens readouts are causal by construction, one can also *write* along a J-lens vector: adding $\alpha \mathbf{v}_t^{(\ell)}$ to $\mathbf{h}_\ell$ tends to make the model more likely to verbalize token $t$, and swapping projections along two J-lens vectors reliably swaps which of the two the model reports. This is a natural bridge to [steering methods](/topics/addition-steering/) and to concept-level interventions like [activation patching](/topics/activation-patching/).

## Limitations

- **Single-token concepts.** J-lens vectors are indexed by vocabulary tokens, so multi-token concepts (most named entities, most phrases) are not directly captured. Extensions to spans are discussed in the paper.
- **First-order only.** The Jacobian ignores higher-order effects. If a concept only exerts influence via a strongly non-linear interaction (say, gated on the value of another feature), the J-lens will miss it or misattribute it.
- **Averaged, not per-prompt.** The lens is a *dispositional* readout. For any single prompt, the true local Jacobian differs from $J_\ell$. Using the average is what makes the readout reflect the model rather than the context, but it also means the tool cannot reveal purely context-specific mechanisms without further work.
- **Small variance fraction.** In practice, the J-space accounts for less than about 10% of activation variance at any layer. Most of what happens in the residual stream is *not* verbalizable in this sense. This is a feature, not a bug, if we take verbalizability as a meaningful selection criterion, but it also limits how much of the model's computation the lens sees.

## Looking Ahead

The Jacobian lens sits at the boundary between observational and mechanistic tooling. Its readouts are observational (a translation of activations into vocabulary), but its construction is causal, and its vectors compose additively with the model's weights in a way that makes them natural handles for intervention. Two directions build directly on this.

First, decomposing an activation as a sparse combination of J-lens vectors gives an interpretation not unlike a [sparse autoencoder](/topics/sparse-autoencoders/), but with an interpretable, token-indexed dictionary built from the model's own weights rather than a learned decoder. The paper formalizes this as the **J-space**.

Second, once we can read a direction that means "the model is about to say $t$," we can also *write* it. Swapping and injecting along J-lens vectors is a lightweight form of concept-level [steering](/topics/addition-steering/), and gives a clean causal test that the direction really is doing what the lens says. This mirrors the shift from observation to causation covered under [activation patching](/topics/activation-patching/) and its relatives.

<script>
(function () {
  var svgNS = "http://www.w3.org/2000/svg";
  var themeAware = function () {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark"
      || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          && document.documentElement.getAttribute("data-theme") !== "light");
    return {
      fg: isDark ? "#e6e6e6" : "#222222",
      fgMuted: isDark ? "#a0a0a0" : "#666666",
      grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      curve: "#5b6abf",
      tangent: "#c04949",
      truePoint: "#2f9e5a",
      predPoint: "#c04949",
      accent: "#5b6abf",
      accent2: "#c76b28",
      surface: isDark ? "#1c1e26" : "#ffffff",
      surfaceAlt: isDark ? "#252833" : "#f5f5f8",
      layer: isDark ? "#333747" : "#dfe3ee",
      layerActive: "#5b6abf",
      layerCollapsed: "#c76b28"
    };
  };

  function el(tag, attrs) {
    var e = document.createElementNS(svgNS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // --- First-order approximation diagram ---
  function renderFirstOrder() {
    var host = document.getElementById("jl-fo-plot");
    var readout = document.getElementById("jl-fo-readout");
    var x0In = document.getElementById("jl-fo-x0");
    var dxIn = document.getElementById("jl-fo-dx");
    if (!host || !x0In || !dxIn) return;
    var C = themeAware();

    var W = 640, H = 320, pad = 32;
    var xMin = -3.5, xMax = 3.5, yMin = -1.5, yMax = 2.5;
    function sx(x) { return pad + (x - xMin) / (xMax - xMin) * (W - 2 * pad); }
    function sy(y) { return H - pad - (y - yMin) / (yMax - yMin) * (H - 2 * pad); }
    function f(x) { return 0.6 * Math.sin(1.3 * x) + 0.3 * x; }
    function fp(x) { return 0.6 * 1.3 * Math.cos(1.3 * x) + 0.3; }

    function draw() {
      C = themeAware();
      while (host.firstChild) host.removeChild(host.firstChild);

      // axes
      var axisX = el("line", { x1: pad, y1: sy(0), x2: W - pad, y2: sy(0), stroke: C.grid, "stroke-width": 1 });
      var axisY = el("line", { x1: sx(0), y1: pad, x2: sx(0), y2: H - pad, stroke: C.grid, "stroke-width": 1 });
      host.appendChild(axisX); host.appendChild(axisY);

      // curve
      var d = "";
      var N = 200;
      for (var i = 0; i <= N; i++) {
        var x = xMin + (xMax - xMin) * i / N;
        d += (i === 0 ? "M " : "L ") + sx(x) + " " + sy(f(x)) + " ";
      }
      host.appendChild(el("path", { d: d, fill: "none", stroke: C.curve, "stroke-width": 2.2 }));

      var x0 = parseFloat(x0In.value);
      var dx = parseFloat(dxIn.value);
      var y0 = f(x0);
      var slope = fp(x0);

      // tangent line across full x-range
      var tx1 = xMin, tx2 = xMax;
      var ty1 = y0 + slope * (tx1 - x0);
      var ty2 = y0 + slope * (tx2 - x0);
      host.appendChild(el("line", {
        x1: sx(tx1), y1: sy(ty1), x2: sx(tx2), y2: sy(ty2),
        stroke: C.tangent, "stroke-width": 1.6, "stroke-dasharray": "6 4", opacity: 0.9
      }));

      // vertical guide from x0+dx
      var x1 = x0 + dx;
      var yTrue = f(x1);
      var yPred = y0 + slope * dx;
      host.appendChild(el("line", {
        x1: sx(x1), y1: sy(Math.min(yTrue, yPred)), x2: sx(x1), y2: sy(Math.max(yTrue, yPred)),
        stroke: C.fgMuted, "stroke-width": 1, "stroke-dasharray": "2 3"
      }));

      // tangent point
      host.appendChild(el("circle", { cx: sx(x0), cy: sy(y0), r: 4, fill: C.tangent }));

      // true point (green)
      host.appendChild(el("circle", { cx: sx(x1), cy: sy(yTrue), r: 5, fill: C.truePoint, stroke: C.surface, "stroke-width": 1.5 }));
      // predicted point (red)
      host.appendChild(el("circle", { cx: sx(x1), cy: sy(yPred), r: 5, fill: C.predPoint, stroke: C.surface, "stroke-width": 1.5 }));

      // Labels
      var lab1 = el("text", { x: sx(x0) + 8, y: sy(y0) - 8, fill: C.fgMuted, "font-size": 12 });
      lab1.textContent = "x₀";
      host.appendChild(lab1);
      var lab2 = el("text", { x: sx(x1) + 8, y: sy(yTrue) - 6, fill: C.truePoint, "font-size": 12 });
      lab2.textContent = "f(x₀+Δx)";
      host.appendChild(lab2);
      var lab3 = el("text", { x: sx(x1) + 8, y: sy(yPred) + 14, fill: C.predPoint, "font-size": 12 });
      lab3.textContent = "f(x₀)+f'(x₀)Δx";
      host.appendChild(lab3);

      var err = yTrue - yPred;
      readout.innerHTML = "f'(x₀) = " + slope.toFixed(3)
        + " &nbsp;|&nbsp; true = " + yTrue.toFixed(3)
        + " &nbsp;|&nbsp; linear = " + yPred.toFixed(3)
        + " &nbsp;|&nbsp; error = " + err.toFixed(3);
    }

    x0In.addEventListener("input", draw);
    dxIn.addEventListener("input", draw);
    draw();
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
    }
    new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  // --- Jacobian shape diagram (static) ---
  function renderShape() {
    var host = document.getElementById("jl-shape-plot");
    if (!host) return;
    var C = themeAware();

    function draw() {
      C = themeAware();
      while (host.firstChild) host.removeChild(host.firstChild);
      // Two row vectors and one matrix in the middle
      var cellS = 26, n = 6;
      var side = n * cellS;
      var matX = 248, matY = 28;
      var stripY = matY + side / 2 - cellS / 2;

      // input row vector (h_l)
      var inX = 46;
      var g1 = el("g");
      g1.appendChild(el("rect", { x: inX, y: stripY, width: side, height: cellS, fill: C.surfaceAlt, stroke: C.grid }));
      for (var i = 1; i < n; i++) {
        g1.appendChild(el("line", { x1: inX + i * cellS, y1: stripY, x2: inX + i * cellS, y2: stripY + cellS, stroke: C.grid }));
      }
      var lab1 = el("text", { x: inX + side / 2, y: stripY - 10, fill: C.fg, "font-size": 13, "text-anchor": "middle" });
      lab1.textContent = "h_ℓ";
      g1.appendChild(lab1);
      var lab1b = el("text", { x: inX + side / 2, y: stripY + cellS + 18, fill: C.fgMuted, "font-size": 11, "text-anchor": "middle" });
      lab1b.textContent = "1 × d_model";
      g1.appendChild(lab1b);
      host.appendChild(g1);

      // matrix J
      var g2 = el("g");
      g2.appendChild(el("rect", { x: matX, y: matY, width: side, height: side, fill: C.surfaceAlt, stroke: C.grid }));
      for (var r = 1; r < n; r++) {
        g2.appendChild(el("line", { x1: matX, y1: matY + r * cellS, x2: matX + side, y2: matY + r * cellS, stroke: C.grid }));
      }
      for (var c = 1; c < n; c++) {
        g2.appendChild(el("line", { x1: matX + c * cellS, y1: matY, x2: matX + c * cellS, y2: matY + side, stroke: C.grid }));
      }
      // highlight one entry: row jj indexes the input, column ii the output
      var jj = 3, ii = 2;
      g2.appendChild(el("rect", {
        x: matX + ii * cellS, y: matY + jj * cellS,
        width: cellS, height: cellS,
        fill: C.accent, opacity: 0.35
      }));
      var lab2 = el("text", { x: matX + side / 2, y: matY - 10, fill: C.fg, "font-size": 13, "text-anchor": "middle" });
      lab2.textContent = "J_ℓ  =  (∂h_final / ∂h_ℓ)ᵀ";
      g2.appendChild(lab2);
      var lab2b = el("text", { x: matX + side / 2, y: matY + side + 18, fill: C.fgMuted, "font-size": 11, "text-anchor": "middle" });
      lab2b.textContent = "d_model × d_model";
      g2.appendChild(lab2b);
      host.appendChild(g2);

      // = sign and output row vector
      var eqX = matX + side + 26;
      var eqLabel = el("text", { x: eqX, y: stripY + cellS / 2 + 6, fill: C.fg, "font-size": 20, "text-anchor": "middle" });
      eqLabel.textContent = "≈";
      host.appendChild(eqLabel);

      var outX = eqX + 22;
      var g3 = el("g");
      g3.appendChild(el("rect", { x: outX, y: stripY, width: side, height: cellS, fill: C.surfaceAlt, stroke: C.grid }));
      for (var i2 = 1; i2 < n; i2++) {
        g3.appendChild(el("line", { x1: outX + i2 * cellS, y1: stripY, x2: outX + i2 * cellS, y2: stripY + cellS, stroke: C.grid }));
      }
      var lab3 = el("text", { x: outX + side / 2, y: stripY - 10, fill: C.fg, "font-size": 13, "text-anchor": "middle" });
      lab3.textContent = "h_final";
      g3.appendChild(lab3);
      var lab3b = el("text", { x: outX + side / 2, y: stripY + cellS + 18, fill: C.fgMuted, "font-size": 11, "text-anchor": "middle" });
      lab3b.textContent = "1 × d_model";
      g3.appendChild(lab3b);
      host.appendChild(g3);

      // callout explaining the highlighted entry (below the matrix)
      var callX = matX - 60, callY = matY + side + 30;
      var srcX = matX + (ii + 0.5) * cellS, srcY = matY + (jj + 0.5) * cellS;
      host.appendChild(el("line", {
        x1: srcX, y1: srcY, x2: callX + 20, y2: callY + 6,
        stroke: C.accent, "stroke-width": 1.2, "stroke-dasharray": "3 3"
      }));
      var callText = el("foreignObject", { x: callX, y: callY, width: 400, height: 62 });
      callText.innerHTML = '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;line-height:1.45;text-align:left;color:' + C.fg + ';">Entry (<em>j</em>, <em>i</em>) = ∂(h_final)_<em>i</em> / ∂(h_ℓ)_<em>j</em>: how a nudge to input component <em>j</em> shifts output component <em>i</em>. Rows index the input, so the matrix acts on h_ℓ from the right.</div>';
      host.appendChild(callText);
    }
    draw();
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
    }
    new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  // --- Averaging Jacobians diagram ---
  function renderAveraging() {
    var host = document.getElementById("jl-avg-plot");
    var nIn = document.getElementById("jl-avg-n");
    var readout = document.getElementById("jl-avg-readout");
    if (!host || !nIn) return;
    var C = themeAware();

    // Base "true" matrix (context-independent structure)
    var K = 12;
    var base = [];
    for (var i = 0; i < K; i++) {
      base[i] = [];
      for (var j = 0; j < K; j++) {
        // low-rank-ish structured pattern
        var v = Math.exp(-((i - 3) * (i - 3) + (j - 8) * (j - 8)) / 8)
              - 0.6 * Math.exp(-((i - 9) * (i - 9) + (j - 3) * (j - 3)) / 6);
        base[i][j] = v;
      }
    }
    // Deterministic per-prompt noise using a hash
    function noise(i, j, k) {
      var s = Math.sin(12.9898 * i + 78.233 * j + 37.719 * k + 3.14) * 43758.5453;
      return (s - Math.floor(s)) - 0.5;
    }
    // 3 sample matrices + average
    function draw() {
      C = themeAware();
      while (host.firstChild) host.removeChild(host.firstChild);
      var cellSize = 13;
      var boxW = K * cellSize, boxH = K * cellSize;
      var gapX = 25;
      var startX = 30;
      var startY = 32;
      var labels = ["prompt 1", "prompt 2", "prompt 3", "average"];
      // averages depend on slider N
      var N = parseInt(nIn.value, 10);
      // For each panel, compute matrix
      function panelMatrix(idx) {
        var m = [];
        for (var i = 0; i < K; i++) {
          m[i] = [];
          for (var j = 0; j < K; j++) {
            if (idx < 3) {
              // Single-prompt: base + strong noise
              m[i][j] = base[i][j] + 0.9 * noise(i, j, idx + 1);
            } else {
              // Average over N prompts
              var s = 0;
              for (var k = 1; k <= N; k++) s += base[i][j] + 0.9 * noise(i, j, k);
              m[i][j] = s / N;
            }
          }
        }
        return m;
      }
      // Draw each panel
      function drawPanel(px, py, m, label) {
        // Find max abs for scaling
        var mx = 0;
        for (var i = 0; i < K; i++) for (var j = 0; j < K; j++) if (Math.abs(m[i][j]) > mx) mx = Math.abs(m[i][j]);
        if (mx < 1e-9) mx = 1;
        for (var i = 0; i < K; i++) {
          for (var j = 0; j < K; j++) {
            var v = m[i][j] / mx;
            var color;
            if (v >= 0) {
              var a = Math.min(1, v);
              color = "rgba(91,106,191," + a.toFixed(3) + ")";
            } else {
              var a2 = Math.min(1, -v);
              color = "rgba(199,107,40," + a2.toFixed(3) + ")";
            }
            var r = el("rect", {
              x: px + j * cellSize, y: py + i * cellSize,
              width: cellSize, height: cellSize, fill: color, stroke: "rgba(0,0,0,0.06)"
            });
            host.appendChild(r);
          }
        }
        var lab = el("text", { x: px + boxW / 2, y: py - 10, fill: C.fg, "font-size": 12, "text-anchor": "middle" });
        lab.textContent = label;
        host.appendChild(lab);
      }
      for (var idx = 0; idx < 4; idx++) {
        var px = startX + idx * (boxW + gapX);
        drawPanel(px, startY, panelMatrix(idx), labels[idx]);
      }
      // Bottom axis note
      var noteX = startX;
      var noteY = startY + boxH + 30;
      var note = el("text", { x: noteX, y: noteY, fill: C.fgMuted, "font-size": 12 });
      note.textContent = "Blue = positive entry; orange = negative. Noise averages toward zero as N grows; structure remains.";
      host.appendChild(note);

      readout.innerHTML = "Averaging over N = <strong>" + N + "</strong> prompts.";
    }
    nIn.addEventListener("input", draw);
    draw();
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
    }
    new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  // --- Layer compression diagram ---
  function renderLayers() {
    var host = document.getElementById("jl-layers-plot");
    var lIn = document.getElementById("jl-layers-l");
    var toggle = document.getElementById("jl-layers-toggle");
    if (!host || !lIn || !toggle) return;
    var C = themeAware();

    var TOTAL = 8;
    function draw() {
      C = themeAware();
      while (host.firstChild) host.removeChild(host.firstChild);
      var W = 820, H = 340;
      var ellLayer = parseInt(lIn.value, 10);
      var collapse = toggle.checked;

      var boxW = 62, boxH = 34, gap = 12;
      var totalW = TOTAL * boxW + (TOTAL - 1) * gap;
      var startX = (W - totalW) / 2;
      var y = 90;

      // Title
      var t = el("text", { x: W / 2, y: 30, fill: C.fg, "font-size": 14, "text-anchor": "middle" });
      t.textContent = collapse ? "J-lens view: layers ℓ+1…L collapsed to J_ℓ" : "Full model: h_ℓ passes through every remaining layer";
      host.appendChild(t);

      if (!collapse) {
        for (var i = 0; i < TOTAL; i++) {
          var x = startX + i * (boxW + gap);
          var isEll = (i === ellLayer);
          var fill = isEll ? "#e8b400" : (i < ellLayer ? C.layer : C.layer);
          var box = el("rect", {
            x: x, y: y, width: boxW, height: boxH,
            rx: 4, ry: 4,
            fill: fill, stroke: isEll ? "#8a6a00" : C.grid, "stroke-width": isEll ? 1.5 : 1
          });
          host.appendChild(box);
          var lab = el("text", { x: x + boxW / 2, y: y + boxH / 2 + 4, fill: C.fg, "font-size": 12, "text-anchor": "middle" });
          lab.textContent = (i === TOTAL - 1 ? "L" : "layer " + i);
          host.appendChild(lab);
          if (i < TOTAL - 1) {
            var ax = x + boxW, ay = y + boxH / 2;
            host.appendChild(el("line", { x1: ax, y1: ay, x2: ax + gap, y2: ay, stroke: C.fgMuted, "stroke-width": 1.5 }));
          }
        }
      } else {
        // Draw layers up to and including ell, then a single J_ell box, then W_U
        var visible = ellLayer + 1;
        var groupW = visible * boxW + (visible - 1) * gap;
        var jBoxW = 130, jGap = gap;
        var unBoxW = 90;
        var totalCollapsedW = groupW + jGap + jBoxW + jGap + unBoxW;
        var sx = (W - totalCollapsedW) / 2;
        for (var i = 0; i < visible; i++) {
          var x = sx + i * (boxW + gap);
          var isEll = (i === ellLayer);
          var fill = isEll ? "#e8b400" : C.layer;
          host.appendChild(el("rect", { x: x, y: y, width: boxW, height: boxH, rx: 4, ry: 4, fill: fill, stroke: isEll ? "#8a6a00" : C.grid, "stroke-width": isEll ? 1.5 : 1 }));
          var lab = el("text", { x: x + boxW / 2, y: y + boxH / 2 + 4, fill: C.fg, "font-size": 12, "text-anchor": "middle" });
          lab.textContent = "layer " + i;
          host.appendChild(lab);
          if (i < visible - 1) {
            host.appendChild(el("line", { x1: x + boxW, y1: y + boxH / 2, x2: x + boxW + gap, y2: y + boxH / 2, stroke: C.fgMuted, "stroke-width": 1.5 }));
          }
        }
        // arrow to J_ell
        var lastX = sx + (visible - 1) * (boxW + gap) + boxW;
        host.appendChild(el("line", { x1: lastX, y1: y + boxH / 2, x2: lastX + jGap, y2: y + boxH / 2, stroke: C.fgMuted, "stroke-width": 1.5 }));
        // J_ell box
        var jX = lastX + jGap;
        host.appendChild(el("rect", { x: jX, y: y - 4, width: jBoxW, height: boxH + 8, rx: 4, ry: 4, fill: C.layerCollapsed, stroke: "#7a3a15", "stroke-width": 1.5, opacity: 0.9 }));
        var jLab = el("text", { x: jX + jBoxW / 2, y: y + boxH / 2 + 5, fill: "#ffffff", "font-size": 12, "font-weight": "600", "text-anchor": "middle" });
        jLab.textContent = "J_ℓ (linear map)";
        host.appendChild(jLab);
        // arrow to unembed
        host.appendChild(el("line", { x1: jX + jBoxW, y1: y + boxH / 2, x2: jX + jBoxW + jGap, y2: y + boxH / 2, stroke: C.fgMuted, "stroke-width": 1.5 }));
        // unembed box
        var unX = jX + jBoxW + jGap;
        host.appendChild(el("rect", { x: unX, y: y, width: unBoxW, height: boxH, rx: 4, ry: 4, fill: C.accent, stroke: "#3a4680", "stroke-width": 1 }));
        var unLab = el("text", { x: unX + unBoxW / 2, y: y + boxH / 2 + 5, fill: "#ffffff", "font-size": 12, "font-weight": "600", "text-anchor": "middle" });
        unLab.textContent = "norm · W_U";
        host.appendChild(unLab);
        // Final arrow to readout
        host.appendChild(el("line", { x1: unX + unBoxW, y1: y + boxH / 2, x2: unX + unBoxW + 30, y2: y + boxH / 2, stroke: C.fgMuted, "stroke-width": 1.5 }));
        var out = el("text", { x: unX + unBoxW + 40, y: y + boxH / 2 + 5, fill: C.truePoint, "font-size": 12, "font-weight": "600" });
        out.textContent = "lens(h_ℓ)";
        host.appendChild(out);
      }

      // Annotate h_ell under the ell'th box
      var ellBoxIdx = ellLayer;
      var xEll;
      if (!collapse) xEll = startX + ellBoxIdx * (boxW + gap);
      else {
        var sxc = (W - (visible * boxW + (visible - 1) * gap + gap + 130 + gap + 90)) / 2;
        xEll = sxc + ellBoxIdx * (boxW + gap);
      }
      var arrow = el("line", { x1: xEll + boxW / 2, y1: y + boxH + 8, x2: xEll + boxW / 2, y2: y + boxH + 34, stroke: C.fgMuted, "stroke-width": 1 });
      host.appendChild(arrow);
      var arrLab = el("text", { x: xEll + boxW / 2, y: y + boxH + 50, fill: "#8a6a00", "font-size": 12, "text-anchor": "middle", "font-weight": "600" });
      arrLab.textContent = "h_ℓ (input to lens)";
      host.appendChild(arrLab);

      // Bottom explanation
      var expY = 250;
      var text = el("foreignObject", { x: 50, y: expY, width: W - 100, height: 90 });
      var body = collapse
        ? 'The Jacobian lens replaces the boxed non-linear stack (layers ℓ+1 through L) with a single linear map <span style="color:' + C.layerCollapsed + ';font-weight:600">J_ℓ</span>, which was pre-computed as the average of <span style="font-family:serif;font-style:italic">(∂h_L/∂h_ℓ)ᵀ</span> across positions and prompts. The output is a first-order approximation of what the model would have produced from h_ℓ.'
        : 'The residual stream at layer ℓ (yellow) propagates through every remaining layer before the model applies norm and W_U. Turn on the "J-lens replacement" toggle to see the collapsed view.';
      text.innerHTML = '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:13px;line-height:1.5;color:' + C.fg + ';">' + body + '</div>';
      host.appendChild(text);
    }
    lIn.addEventListener("input", draw);
    toggle.addEventListener("change", draw);
    draw();
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
    }
    new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  function init() {
    renderFirstOrder();
    renderShape();
    renderAveraging();
    renderLayers();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
</script>

<style>
.jl-figure { margin: 2rem 0; }
.jl-diagram {
  background: var(--color-background, #fff);
  border: 1px solid var(--color-border, rgba(0,0,0,0.1));
  border-radius: var(--radius-lg, 8px);
  padding: 1rem;
  overflow-x: auto;
}
.jl-diagram svg { display: block; width: 100%; height: auto; max-width: 100%; }
.jl-controls {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary, rgba(0,0,0,0.6));
}
.jl-controls label { display: flex; align-items: center; gap: 0.5rem; }
.jl-controls input[type="range"] { width: 160px; accent-color: var(--color-link, #5b6abf); }
.jl-toggle { user-select: none; }
.jl-readout {
  margin-top: 0.5rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.8125rem;
  color: var(--color-text-secondary, rgba(0,0,0,0.6));
}
</style>
