---
title: "Positional Embeddings"
description: "How transformers represent order and distance through absolute embeddings, sinusoidal encodings, rotary transformations, and attention biases."
order: 4
prerequisites:
  - title: "Embeddings"
    url: "/topics/embeddings/"

glossary:
  - term: "Positional Encoding"
    definition: "Any mechanism that makes a transformer's computation depend on token position or relative distance, whether through added vectors, rotations, or attention biases."
  - term: "Absolute Positional Embedding"
    definition: "A vector associated with a position index and added to the token representation, learned during training or fixed in advance."
  - term: "Fixed Sinusoidal Positional Encoding"
    definition: "A deterministic position vector whose coordinate pairs trace sine and cosine waves at different frequencies. Each position shift acts as a rotation within every pair."
  - term: "Relative Position Representation"
    definition: "A positional mechanism whose effect depends directly on the offset between two tokens rather than only on their separate absolute indices."
  - term: "Rotary Position Embedding"
    definition: "A positional method that rotates pairs of query and key coordinates by position-dependent angles, making their dot product depend on relative offset."
---

## Why Attention Needs Position

Compare `dog bites man` with `man bites dog`. The two sequences contain the same token identities, but order reverses who acts on whom. A transformer therefore needs token identity from the [embedding matrix](/topics/embeddings/) and positional information that distinguishes the arrangements.

Self-attention without positional information is permutation equivariant: if we permute the input rows, the output rows undergo the same permutation. Queries and keys can match content, but their dot product contains no general measure of which token came first or how far apart two tokens are. A causal mask gives decoder-only models an asymmetry by hiding future positions. The set of visible positions changes across the sequence, but the mask alone does not supply a reusable representation of absolute index or pairwise distance.

> **Positional Encoding:** A positional encoding is any mechanism that makes a transformer's computation depend on absolute position, relative offset, or both.

“Positional embedding” is often used as an umbrella term, but not every method performs an embedding lookup. Learned absolute vectors are embeddings. Fixed sinusoidal vectors are encodings. Rotary Position Embedding (RoPE) transforms queries and keys, while Attention with Linear Biases (ALiBi) adds a distance penalty to attention logits. The distinctions matter in mechanistic interpretability because each method inserts position into a different part of the computation.

## Absolute Position Vectors

The most direct approach assigns a vector $\mathbf{p}_i \in \mathbb{R}^{d_{\text{model}}}$ to absolute position $i$ and adds it to the token embedding:

$$
\mathbf{r}^0_i = W_E[t_i,:] + \mathbf{p}_i.
$$

With **learned absolute positional embeddings**, the vectors form a matrix $W_P \in \mathbb{R}^{n_{\text{ctx}} \times d_{\text{model}}}$. Training learns one row for each supported position. Token identity and position are separate additive contributions at the input, but later attention and multilayer perceptron (MLP) blocks read their sum and can respond to interactions between them.

A learned table has a fixed set of rows. Positions beyond the table cannot be represented without resizing or replacing it, and rows that were never trained do not acquire useful behavior automatically. Even positions inside the table may generalize poorly if training rarely placed relevant patterns there.

<details class="pause-and-think">
<summary>Pause and think: Can the model separate identity from position?</summary>

If the initial state is $\mathbf{e}_t+\mathbf{p}_i$, have we permanently lost which part came from the token and which part came from its position?

The addition does not preserve labeled slots, but learned downstream directions can respond mostly to token subspaces, position subspaces, or combinations of both. Whether the trained model keeps them cleanly separable is an empirical property, not a guarantee of addition.

</details>

## Fixed Sinusoidal Encodings

The original transformer replaced the learned position table with a deterministic pattern of sine and cosine waves {% cite "vaswani2017attention" %}. For coordinate pair $2k,2k+1$,

$$
\text{PE}(i,2k)=\sin\left(i/10000^{2k/d_{\text{model}}}\right),
$$

$$
\text{PE}(i,2k+1)=\cos\left(i/10000^{2k/d_{\text{model}}}\right).
$$

> **Fixed Sinusoidal Positional Encoding:** Position $i$ is represented by sine-cosine pairs with fixed angular frequencies $\omega_k=10000^{-2k/d_{\text{model}}}$. The model learns how to read these vectors, but it does not learn the vectors themselves.

Each pair is a point on a unit circle:

$$
\bigl[\sin(i\omega_k),\ \cos(i\omega_k)\bigr].
$$

Fast pairs wind around the circle many times over a sequence, while slow pairs change only slightly. Taken together, the pairs give each position a multiscale phase signature. The interactive diagram shows one pair at a time for an eight-dimensional toy encoding. Pair $k=0$ changes fastest; increasing $k$ increases its wavelength.

<figure class="pe-figure">
  <div class="pe-diagram" id="pe-sinusoidal-viz" role="group" aria-label="Interactive fixed sinusoidal encoding visualization" tabindex="0">
    <p class="pe-scroll-hint">Scroll the diagram horizontally to compare both views.</p>
    <svg id="pe-sinusoidal-svg" viewBox="0 0 760 340" role="img" aria-label="Interactive sinusoidal positional encoding plot. A sine and cosine wave are linked to a point rotating on a unit circle." aria-describedby="pe-sinusoidal-readout">
      <text x="380" y="170" text-anchor="middle">Loading interactive visualization…</text>
    </svg>
    <div class="pe-controls">
      <label for="pe-sinusoidal-position">Position <em>i</em>
        <input type="range" id="pe-sinusoidal-position" min="0" max="100" step="1" value="18">
        <output id="pe-sinusoidal-position-output" for="pe-sinusoidal-position">18</output>
      </label>
      <label for="pe-sinusoidal-pair">Coordinate pair <em>k</em>
        <input type="range" id="pe-sinusoidal-pair" min="0" max="3" step="1" value="1">
        <output id="pe-sinusoidal-pair-output" for="pe-sinusoidal-pair">1</output>
      </label>
    </div>
    <div class="pe-readout" id="pe-sinusoidal-readout" aria-live="polite">Position 18, pair 1.</div>
  </div>
  <figcaption>One sine-cosine pair viewed in two equivalent ways. The left panel plots its two coordinates across position; the right panel shows the same pair as a phase vector on the unit circle. Move the position slider to wind the vector, or change the pair to compare frequencies.</figcaption>
</figure>

A position shift $\Delta$ rotates every pair by a known angle $\Delta\omega_k$:

$$
\begin{bmatrix}\sin(i\omega_k)&\cos(i\omega_k)\end{bmatrix}
\begin{bmatrix}
\cos(\Delta\omega_k)&-\sin(\Delta\omega_k)\\
\sin(\Delta\omega_k)&\cos(\Delta\omega_k)
\end{bmatrix}
=
\begin{bmatrix}\sin((i+\Delta)\omega_k)&\cos((i+\Delta)\omega_k)\end{bmatrix}.
$$

This exact linear relationship gives downstream layers a structured way to compare offsets. The encoding is still added to the token embedding as an absolute position vector. A learned attention head must use its projections to turn those phases into whatever relative-position computation it needs.

The formula produces vectors for positions beyond the training length, unlike a finite learned table. Defined inputs do not guarantee valid extrapolation: the model's attention patterns and learned algorithms were optimized on the lengths it saw during training.

## Rotary Position Embedding

Rotary Position Embedding applies position-dependent rotations after the query and key projections {% cite "su2021roformer" %}. Split each query and key into pairs of coordinates. At position $i$, rotate each pair by an angle proportional to $i$, using a different angular frequency for each pair:

> **Rotary Position Embedding (RoPE):** RoPE rotates query and key coordinate pairs by position-dependent angles, causing their dot product to depend on the relative offset between their positions.

$$
\widetilde{\mathbf{q}}_i=\mathbf{q}_i R_i,
\qquad
\widetilde{\mathbf{k}}_j=\mathbf{k}_j R_j.
$$

The matrices $R_i$ are block-diagonal rotations. Because rotations compose by adding their angles, the attention dot product becomes

$$
\widetilde{\mathbf{q}}_i\widetilde{\mathbf{k}}_j^T
=
\mathbf{q}_i R_i R_j^T \mathbf{k}_j^T,
$$

and $R_iR_j^T$ depends on the relative offset $i-j$. RoPE therefore starts with absolute indices but exposes their difference inside the query-key interaction.

The interactive diagram isolates this relative effect in one two-dimensional coordinate pair. It fixes the unrotated content vectors to $\mathbf{q}=\mathbf{k}=(1,0)$, rotates them to positions $i$ and $j$, and plots their dot product against the offset $\Delta=i-j$. Real heads use different content vectors and many frequency pairs, but the same relative-rotation identity applies to each pair.

<figure class="pe-figure">
  <div class="pe-diagram" id="pe-rope-viz" role="group" aria-label="Interactive rotary position embedding visualization" tabindex="0">
    <p class="pe-scroll-hint">Scroll the diagram horizontally to compare both views.</p>
    <svg id="pe-rope-svg" viewBox="0 0 760 370" role="img" aria-label="Interactive RoPE diagram. Query and key vectors rotate on a unit circle, while a linked graph shows their dot product as a function of relative position." aria-describedby="pe-rope-readout">
      <text x="380" y="185" text-anchor="middle">Loading interactive visualization…</text>
    </svg>
    <div class="pe-controls">
      <label for="pe-rope-query-position">Query position <em>i</em>
        <input type="range" id="pe-rope-query-position" min="0" max="24" step="1" value="10">
        <output id="pe-rope-query-output" for="pe-rope-query-position">10</output>
      </label>
      <label for="pe-rope-key-position">Key position <em>j</em>
        <input type="range" id="pe-rope-key-position" min="0" max="24" step="1" value="4">
        <output id="pe-rope-key-output" for="pe-rope-key-position">4</output>
      </label>
      <label for="pe-rope-frequency">Angular frequency <em>ω</em>
        <input type="range" id="pe-rope-frequency" min="0.05" max="1" step="0.05" value="0.35">
        <output id="pe-rope-frequency-output" for="pe-rope-frequency">0.35</output>
      </label>
    </div>
    <div class="pe-readout" id="pe-rope-readout" aria-live="polite">Relative offset 6.</div>
  </div>
  <figcaption>RoPE in one coordinate pair with content held fixed. The blue query and orange key rotate according to their absolute positions. Their dot product, marked on the right, depends on the relative offset. Shift both positions by the same amount and the score stays fixed.</figcaption>
</figure>

RoPE preserves the norm of each rotated query and key. It changes their alignment, which changes attention scores, without writing a position vector into the residual stream. The name can otherwise be misleading: in the standard use of RoPE, the token embedding itself is not rotated, and the value vectors are not position-rotated by this operation.

The rotation frequencies determine how quickly each coordinate pair changes with distance. Slow pairs carry coarse, long-range variation; fast pairs distinguish nearby offsets but wrap around more quickly. Methods that rescale positions or frequencies can extend a RoPE model's usable context, but extension remains an out-of-distribution intervention whose quality must be measured.

<details class="pause-and-think">
<summary>Pause and think: Where would you patch RoPE?</summary>

Suppose we want to preserve a token's content but replace the positional effect on one attention head. Should we patch the residual stream before the head?

Not necessarily. Standard RoPE enters after the head computes queries and keys. Patching the pre-head residual stream mixes content with every downstream use of that state. Patching the rotated query or key isolates a narrower positional site, although it also changes the query-key interaction and must be interpreted as a model-internal counterfactual.

</details>

## Relative Position Inside Attention

Many tasks depend more directly on offsets than absolute indices. “Attend to the previous token” describes relative offset $-1$ at every destination position. A learned absolute scheme must infer that repeated relation from pairs of absolute vectors, while a **relative position representation** can place the offset directly into attention.

One family adds learned relative terms to the key or value used for a pair of positions. The attention score can then depend on a vector indexed by $i-j$, and the information moved can also vary with that offset {% cite "shaw2018relative" %}. Another family adds a scalar bias $b_{i-j}$ to the score:

$$
s_{ij}=\frac{\mathbf{q}_i\mathbf{k}_j^T}{\sqrt{d_k}}+b_{i-j}.
$$

This separates a content-dependent term from a position-dependent preference before softmax. The separation is visible in the equation, but the final attention probability still couples them through normalization against every eligible source position.

ALiBi uses a particularly simple fixed bias. For causal attention, head $h$ receives a negative penalty proportional to backward distance:

$$
s^{(h)}_{ij}=\frac{\mathbf{q}_i\mathbf{k}_j^T}{\sqrt{d_k}}-m_h(i-j), \qquad j\leq i,
$$

where slope $m_h>0$ differs across heads. ALiBi does not add vectors to token representations. It gives each head a distance-dependent recency preference directly in its attention logits and was designed to improve extrapolation beyond training sequence lengths {% cite "press2022alibi" %}.

## Comparing the Main Families

| Method | Where position enters | Signal represented | Consequence for analysis |
|---|---|---|---|
| Learned absolute embedding | Added to the initial residual stream | Absolute index | Position can flow through attention, MLP, and direct residual paths |
| Fixed sinusoidal encoding | Added to the initial residual stream | Absolute index with structured frequencies | Position begins as an additive input, with exact algebraic relations between offsets |
| Learned relative representation | Attention keys, values, or logits | Usually a bucketed or clipped offset | The attention operation contains an explicit pairwise positional term |
| RoPE | Rotations of queries and keys | Absolute phase whose dot product depends on relative offset | Query-key circuits vary with source-destination offset |
| ALiBi | Additive attention-logit bias | Linear distance penalty per head | Content and distance add before softmax; no positional write enters the residual stream |

No row in the table guarantees length extrapolation. A model learns computations under a training distribution of lengths and positions. A mathematically defined encoding at position 100,000 only supplies an input there; it does not prove that attention patterns, MLP behavior, or learned algorithms remain valid.

## Why Position Changes Interpretability

An attention pattern combines content and position. A head that attends to the previous token may implement a positional rule, a content match that usually occurs one token back, or both. Inspecting the pattern alone cannot distinguish these mechanisms. We can compare prompts that preserve content while changing offsets, inspect the query-key score decomposition, or intervene on the positional term.

RoPE makes a head's query-key circuit a family of maps indexed by relative offset. If two feature directions align after a short-distance rotation but not a long-distance rotation, the same content pair can receive different scores at different separations. Collapsing those scores into one token-to-token matrix discards part of the mechanism.

Absolute embeddings create a different complication for activation patching. Moving a cached activation from position $i$ to position $j$ transfers content that was computed with $i$'s positional contribution. That may be the intended intervention, or it may create an inconsistent state. Position-aligned controls and offset-preserving prompt pairs help separate the two interpretations.

Special positions can also become computational anchors. Beginning-of-sequence tokens, separators, and repeated formatting positions combine token identity with predictable location, so a circuit may use them as attention sinks or reference points. Calling such behavior “positional” does not imply that a dedicated positional vector alone causes it.

## Looking Ahead

[The Attention Mechanism](/topics/attention-mechanism/) builds queries, keys, values, masks, and softmax into the full information-routing operation. Positional methods specify where order enters that operation, which lets us state more precisely what an attention head reads and why it prefers one source position over another.

<script>
(function () {
  var svgNS = "http://www.w3.org/2000/svg";

  function palette() {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark"
      || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          && document.documentElement.getAttribute("data-theme") !== "light");
    return {
      fg: isDark ? "#e6e6e6" : "#222222",
      muted: isDark ? "#aeb2c0" : "#626776",
      grid: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)",
      surface: isDark ? "#1a1a2e" : "#ffffff",
      blue: isDark ? "#a0aee8" : "#5264c3",
      orange: isDark ? "#f0a36a" : "#c4672d",
      green: isDark ? "#82d39c" : "#27894c",
      purple: isDark ? "#c5a6ed" : "#7952a8"
    };
  }

  function node(tag, attrs, text) {
    var element = document.createElementNS(svgNS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        element.setAttribute(key, attrs[key]);
      });
    }
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function clear(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  function addText(svg, x, y, text, color, size, anchor, weight) {
    svg.appendChild(node("text", {
      x: x,
      y: y,
      fill: color,
      "font-size": size || 12,
      "text-anchor": anchor || "start",
      "font-weight": weight || "400"
    }, text));
  }

  function pathFor(fn, start, end, samples, xScale, yScale) {
    var path = "";
    for (var n = 0; n <= samples; n++) {
      var x = start + (end - start) * n / samples;
      path += (n === 0 ? "M " : "L ") + xScale(x).toFixed(2) + " " + yScale(fn(x)).toFixed(2) + " ";
    }
    return path;
  }

  function renderSinusoidal() {
    var svg = document.getElementById("pe-sinusoidal-svg");
    var positionInput = document.getElementById("pe-sinusoidal-position");
    var pairInput = document.getElementById("pe-sinusoidal-pair");
    var positionOutput = document.getElementById("pe-sinusoidal-position-output");
    var pairOutput = document.getElementById("pe-sinusoidal-pair-output");
    var readout = document.getElementById("pe-sinusoidal-readout");
    if (!svg || !positionInput || !pairInput || !readout) return;

    var colors = palette();
    var position = Number(positionInput.value);
    var pair = Number(pairInput.value);
    var dimensions = 8;
    var omega = Math.pow(10000, -2 * pair / dimensions);
    var wavelength = 2 * Math.PI / omega;
    var sinValue = Math.sin(position * omega);
    var cosValue = Math.cos(position * omega);

    positionOutput.textContent = String(position);
    pairOutput.textContent = String(pair);
    readout.textContent = "ω" + pair + " = " + omega.toFixed(3)
      + " rad/token  |  wavelength = " + wavelength.toFixed(1) + " tokens"
      + "  |  [sin, cos] = [" + sinValue.toFixed(3) + ", " + cosValue.toFixed(3) + "]";

    clear(svg);

    var plotX = 52, plotY = 48, plotW = 430, plotH = 205;
    var xScale = function (x) { return plotX + x / 100 * plotW; };
    var yScale = function (y) { return plotY + plotH / 2 - y * (plotH / 2 - 10); };

    [-1, 0, 1].forEach(function (tick) {
      svg.appendChild(node("line", {
        x1: plotX, y1: yScale(tick), x2: plotX + plotW, y2: yScale(tick),
        stroke: colors.grid, "stroke-width": 1
      }));
      addText(svg, plotX - 9, yScale(tick) + 4, String(tick), colors.muted, 11, "end");
    });

    [0, 25, 50, 75, 100].forEach(function (tick) {
      svg.appendChild(node("line", {
        x1: xScale(tick), y1: plotY, x2: xScale(tick), y2: plotY + plotH,
        stroke: colors.grid, "stroke-width": 1
      }));
      addText(svg, xScale(tick), plotY + plotH + 18, String(tick), colors.muted, 11, "middle");
    });

    addText(svg, plotX, 25, "Coordinates across positions", colors.fg, 14, "start", "600");
    addText(svg, plotX + plotW / 2, plotY + plotH + 38, "position", colors.muted, 11, "middle");

    svg.appendChild(node("path", {
      d: pathFor(function (x) { return Math.sin(x * omega); }, 0, 100, 500, xScale, yScale),
      fill: "none", stroke: colors.blue, "stroke-width": 2.4
    }));
    svg.appendChild(node("path", {
      d: pathFor(function (x) { return Math.cos(x * omega); }, 0, 100, 500, xScale, yScale),
      fill: "none", stroke: colors.orange, "stroke-width": 2.4
    }));

    svg.appendChild(node("line", {
      x1: xScale(position), y1: plotY, x2: xScale(position), y2: plotY + plotH,
      stroke: colors.purple, "stroke-width": 1.5, "stroke-dasharray": "5 4"
    }));
    svg.appendChild(node("circle", { cx: xScale(position), cy: yScale(sinValue), r: 5, fill: colors.blue, stroke: colors.surface, "stroke-width": 2 }));
    svg.appendChild(node("circle", { cx: xScale(position), cy: yScale(cosValue), r: 5, fill: colors.orange, stroke: colors.surface, "stroke-width": 2 }));

    svg.appendChild(node("line", { x1: plotX + 245, y1: 25, x2: plotX + 267, y2: 25, stroke: colors.blue, "stroke-width": 3 }));
    addText(svg, plotX + 274, 29, "sin(iωₖ)", colors.blue, 12);
    svg.appendChild(node("line", { x1: plotX + 342, y1: 25, x2: plotX + 364, y2: 25, stroke: colors.orange, "stroke-width": 3 }));
    addText(svg, plotX + 371, 29, "cos(iωₖ)", colors.orange, 12);

    var circleX = 625, circleY = 145, radius = 88;
    addText(svg, circleX, 25, "The same pair as phase", colors.fg, 14, "middle", "600");
    svg.appendChild(node("circle", { cx: circleX, cy: circleY, r: radius, fill: "none", stroke: colors.grid, "stroke-width": 1.5 }));
    svg.appendChild(node("line", { x1: circleX - radius - 12, y1: circleY, x2: circleX + radius + 12, y2: circleY, stroke: colors.grid }));
    svg.appendChild(node("line", { x1: circleX, y1: circleY - radius - 12, x2: circleX, y2: circleY + radius + 12, stroke: colors.grid }));
    addText(svg, circleX + radius + 14, circleY + 4, "sin", colors.blue, 11);
    addText(svg, circleX + 4, circleY - radius - 14, "cos", colors.orange, 11);

    var pointX = circleX + radius * sinValue;
    var pointY = circleY - radius * cosValue;
    svg.appendChild(node("line", { x1: circleX, y1: circleY, x2: pointX, y2: pointY, stroke: colors.purple, "stroke-width": 3 }));
    svg.appendChild(node("line", { x1: pointX, y1: circleY, x2: pointX, y2: pointY, stroke: colors.blue, "stroke-width": 1.3, "stroke-dasharray": "4 3" }));
    svg.appendChild(node("line", { x1: circleX, y1: pointY, x2: pointX, y2: pointY, stroke: colors.orange, "stroke-width": 1.3, "stroke-dasharray": "4 3" }));
    svg.appendChild(node("circle", { cx: pointX, cy: pointY, r: 6, fill: colors.purple, stroke: colors.surface, "stroke-width": 2 }));
    addText(svg, circleX, circleY + radius + 34, "pair k = " + pair + " at position i = " + position, colors.muted, 12, "middle");
  }

  function renderRoPE() {
    var svg = document.getElementById("pe-rope-svg");
    var queryInput = document.getElementById("pe-rope-query-position");
    var keyInput = document.getElementById("pe-rope-key-position");
    var frequencyInput = document.getElementById("pe-rope-frequency");
    var queryOutput = document.getElementById("pe-rope-query-output");
    var keyOutput = document.getElementById("pe-rope-key-output");
    var frequencyOutput = document.getElementById("pe-rope-frequency-output");
    var readout = document.getElementById("pe-rope-readout");
    if (!svg || !queryInput || !keyInput || !frequencyInput || !readout) return;

    var colors = palette();
    var queryPosition = Number(queryInput.value);
    var keyPosition = Number(keyInput.value);
    var omega = Number(frequencyInput.value);
    var offset = queryPosition - keyPosition;
    var relativeAngle = offset * omega;
    var score = Math.cos(relativeAngle);

    queryOutput.textContent = String(queryPosition);
    keyOutput.textContent = String(keyPosition);
    frequencyOutput.textContent = omega.toFixed(2);
    readout.textContent = "Δ = i − j = " + offset
      + "  |  relative angle Δω = " + relativeAngle.toFixed(2) + " rad"
      + "  |  qᵢ · kⱼ = cos(Δω) = " + score.toFixed(3);

    clear(svg);

    var circleX = 190, circleY = 175, radius = 112;
    addText(svg, circleX, 25, "Position rotates queries and keys", colors.fg, 14, "middle", "600");
    addText(svg, circleX, 43, "unrotated q = k = (1, 0)", colors.muted, 11, "middle");
    svg.appendChild(node("circle", { cx: circleX, cy: circleY, r: radius, fill: "none", stroke: colors.grid, "stroke-width": 1.5 }));
    svg.appendChild(node("line", { x1: circleX - radius - 12, y1: circleY, x2: circleX + radius + 12, y2: circleY, stroke: colors.grid }));
    svg.appendChild(node("line", { x1: circleX, y1: circleY - radius - 12, x2: circleX, y2: circleY + radius + 12, stroke: colors.grid }));

    function vector(angle, color, label, labelOffset) {
      var endX = circleX + radius * Math.cos(angle);
      var endY = circleY - radius * Math.sin(angle);
      svg.appendChild(node("line", { x1: circleX, y1: circleY, x2: endX, y2: endY, stroke: color, "stroke-width": 4, "stroke-linecap": "round" }));
      svg.appendChild(node("circle", { cx: endX, cy: endY, r: 6, fill: color, stroke: colors.surface, "stroke-width": 2 }));
      addText(svg, endX, endY + labelOffset, label, color, 12, "middle", "600");
    }

    vector(keyPosition * omega, colors.orange, "kⱼ", 20);
    vector(queryPosition * omega, colors.blue, "qᵢ", -12);
    addText(svg, circleX, circleY + radius + 35, "absolute phases iω and jω", colors.muted, 12, "middle");

    var plotX = 415, plotY = 65, plotW = 310, plotH = 220;
    var xScale = function (x) { return plotX + (x + 24) / 48 * plotW; };
    var yScale = function (y) { return plotY + plotH / 2 - y * (plotH / 2 - 10); };
    addText(svg, plotX + plotW / 2, 25, "Dot product depends on Δ = i − j", colors.fg, 14, "middle", "600");

    [-1, 0, 1].forEach(function (tick) {
      svg.appendChild(node("line", { x1: plotX, y1: yScale(tick), x2: plotX + plotW, y2: yScale(tick), stroke: colors.grid }));
      addText(svg, plotX - 9, yScale(tick) + 4, String(tick), colors.muted, 11, "end");
    });
    [-24, -12, 0, 12, 24].forEach(function (tick) {
      svg.appendChild(node("line", { x1: xScale(tick), y1: plotY, x2: xScale(tick), y2: plotY + plotH, stroke: colors.grid }));
      addText(svg, xScale(tick), plotY + plotH + 18, String(tick), colors.muted, 11, "middle");
    });

    svg.appendChild(node("path", {
      d: pathFor(function (delta) { return Math.cos(delta * omega); }, -24, 24, 500, xScale, yScale),
      fill: "none", stroke: colors.purple, "stroke-width": 2.5
    }));
    svg.appendChild(node("line", { x1: xScale(offset), y1: plotY, x2: xScale(offset), y2: plotY + plotH, stroke: colors.green, "stroke-width": 1.5, "stroke-dasharray": "5 4" }));
    svg.appendChild(node("circle", { cx: xScale(offset), cy: yScale(score), r: 6, fill: colors.green, stroke: colors.surface, "stroke-width": 2 }));
    addText(svg, plotX + plotW / 2, plotY + plotH + 42, "relative offset Δ", colors.muted, 11, "middle");
    addText(svg, plotX + plotW / 2, 335, "score = cos(Δω) = " + score.toFixed(3), colors.green, 13, "middle", "600");
  }

  function init() {
    var sinusoidalPosition = document.getElementById("pe-sinusoidal-position");
    var sinusoidalPair = document.getElementById("pe-sinusoidal-pair");
    var ropeQuery = document.getElementById("pe-rope-query-position");
    var ropeKey = document.getElementById("pe-rope-key-position");
    var ropeFrequency = document.getElementById("pe-rope-frequency");

    if (sinusoidalPosition) sinusoidalPosition.addEventListener("input", renderSinusoidal);
    if (sinusoidalPair) sinusoidalPair.addEventListener("input", renderSinusoidal);
    if (ropeQuery) ropeQuery.addEventListener("input", renderRoPE);
    if (ropeKey) ropeKey.addEventListener("input", renderRoPE);
    if (ropeFrequency) ropeFrequency.addEventListener("input", renderRoPE);

    renderSinusoidal();
    renderRoPE();

    if (window.matchMedia) {
      var media = window.matchMedia("(prefers-color-scheme: dark)");
      if (media.addEventListener) media.addEventListener("change", function () { renderSinusoidal(); renderRoPE(); });
    }
    new MutationObserver(function () { renderSinusoidal(); renderRoPE(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
</script>

<style>
.pe-figure { margin: 2rem 0; }
.pe-diagram {
  background: var(--color-background, #fff);
  border: 1px solid var(--color-border, rgba(0,0,0,0.1));
  border-radius: var(--radius-lg, 8px);
  padding: 1rem;
  overflow-x: auto;
  text-align: left;
}
.pe-diagram svg {
  display: block;
  width: 100%;
  min-width: 620px;
  height: auto;
}
.pe-diagram svg text { font-family: var(--font-body, sans-serif); }
.pe-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  margin-top: 0.75rem;
  color: var(--color-text-secondary, rgba(0,0,0,0.6));
  font-size: 0.875rem;
}
.pe-controls label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  white-space: nowrap;
}
.pe-controls input[type="range"] {
  width: 130px;
  accent-color: var(--color-link, #5b6abf);
}
.pe-controls output {
  min-width: 2.5rem;
  color: var(--color-text, rgba(0,0,0,0.87));
  font-family: var(--font-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}
.pe-readout {
  margin-top: 0.65rem;
  color: var(--color-text-secondary, rgba(0,0,0,0.6));
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}
.pe-scroll-hint { display: none; }
.pe-figure figcaption {
  margin-top: 0.65rem;
  color: var(--color-text-secondary, rgba(0,0,0,0.6));
  font-size: 0.9rem;
  line-height: 1.5;
}
@media (max-width: 680px) {
  .pe-diagram { padding: 0.75rem; }
  .pe-scroll-hint {
    display: block;
    margin: 0 0 0.5rem;
    color: var(--color-text-muted, rgba(0,0,0,0.4));
    font-size: 0.75rem;
  }
  .pe-controls { align-items: flex-start; flex-direction: column; }
  .pe-controls label { white-space: normal; }
  .pe-controls input[type="range"] { width: min(45vw, 170px); }
}
</style>
