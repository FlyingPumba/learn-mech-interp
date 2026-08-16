---
title: "The Attention Mechanism"
description: "How queries and keys decide where to look, values determine what moves, and multi-head, multi-query, and grouped-query attention organize routing."
order: 5
prerequisites:
  - title: "Positional Embeddings"
    url: "/topics/positional-embeddings/"

glossary:
  - term: "Attention Head"
    definition: "An individual attention computation within a multi-head attention layer. Each head independently computes attention patterns over the input sequence and produces a weighted combination of value vectors."
  - term: "Attention Pattern"
    definition: "The matrix of attention weights produced by an attention head, showing how much each token position attends to every other position. Visualizing attention patterns is a foundational interpretability technique."
  - term: "Key Vector"
    definition: "The vector produced by applying the key weight matrix (W_K) to a token's representation. Key vectors are compared against query vectors via dot product to determine attention weights."
  - term: "Multi-Head Attention"
    definition: "The mechanism of running multiple independent attention heads in parallel within a single layer, allowing the model to attend to different types of relationships simultaneously and combine their outputs."
  - term: "Multi-Query Attention"
    definition: "An attention variant with multiple query heads but one key head and one value head shared by all of them, reducing the key-value cache used during autoregressive decoding."
  - term: "Grouped-Query Attention"
    definition: "An attention variant that divides query heads into groups, with each group sharing one key head and one value head. It interpolates between multi-head and multi-query attention."
  - term: "Query Vector"
    definition: "The vector produced by applying the query weight matrix (W_Q) to a token's representation. Query vectors are compared against key vectors to compute attention scores that determine how much each position attends to others."
  - term: "Value Vector"
    definition: "The vector produced by applying the value weight matrix (W_V) to a token's representation. Value vectors carry the content information that gets written to the residual stream, weighted by the attention pattern."
---

## Why Attention?

Consider the sentence: *"The cat sat on the mat because it was tired."* What does "it" refer to? For a human reader the answer is obvious: "it" means the cat. But arriving at this answer requires looking back across the sentence and connecting a pronoun to the noun it references. A model that processes each token in isolation, without any ability to look at other positions, has no way to make this connection.

A simple feed-forward network applied independently at each position treats every token as if the rest of the sequence does not exist. It can transform each token's representation, but it cannot move information between positions. Pronoun resolution, subject-verb agreement, long-range dependencies: none of these are possible without some mechanism for tokens to communicate with one another.

The **attention mechanism** solves this problem {% cite "vaswani2017attention" %}. It provides a structured way for each token to look at every other token in the sequence, decide which ones are relevant, and gather information from them. Rather than processing tokens in isolation, attention lets the model build context-dependent representations where each token's output reflects the entire input it has seen so far.

## Queries, Keys, and Values

Attention organizes the communication between tokens around three learned roles. Every token simultaneously plays all three:

> **Attention (Intuition):** Each token participates in attention through three projections. The **query** ($\mathbf{q}$) asks "what am I looking for?", the **key** ($\mathbf{k}$) advertises "what do I contain?", and the **value** ($\mathbf{v}$) provides "what information do I send if attended to?"

Each role is produced by multiplying the current residual-stream representation by a learned weight matrix. For a token at position $i$ with input $\mathbf{x}_i \in \mathbb{R}^{d_{\text{model}}}$, the three projections are:

$$
\mathbf{q}_i = \mathbf{x}_i W_Q, \quad \mathbf{k}_i = \mathbf{x}_i W_K, \quad \mathbf{v}_i = \mathbf{x}_i W_V
$$

The projection matrices $W_Q, W_K \in \mathbb{R}^{d_{\text{model}} \times d_k}$ map the input down to a $d_k$-dimensional query/key space, while $W_V \in \mathbb{R}^{d_{\text{model}} \times d_v}$ maps to the value space. In the first layer, the input derives directly from [token embeddings](/topics/embeddings/) and positional information. In later layers it also contains contextual updates from earlier attention and MLP blocks. These are three different "views" of the same input, each optimized by gradient descent for a different purpose during training. Activations are row vectors throughout this curriculum and weight matrices act on the right, which matches the tensor shapes in PyTorch and TransformerLens.

## The Attention Equation

<figure>
  <img src="/topics/attention-mechanism/images/scaled_dot_product_attention.png" alt="Scaled dot-product attention diagram showing Q, K, and V inputs flowing through MatMul, Scale, optional Mask, SoftMax, and a final MatMul to produce the output." style="max-width: 40%;">
  <figcaption>Scaled dot-product attention. The query and key vectors are combined via dot product, scaled, optionally masked, normalized with softmax, and used to weight the value vectors. From Vaswani et al., <em>Attention Is All You Need</em>. {%- cite "vaswani2017attention" -%}</figcaption>
</figure>

With queries, keys, and values defined, the attention mechanism proceeds in three steps: compute relevance scores, normalize them into weights, and use the weights to mix value vectors.

**Step 1: Dot-product scores.** How much should token $i$ attend to token $j$? The model measures this by computing the dot product between the query of token $i$ and the key of token $j$:

$$
e_{i,j} = \mathbf{q}_i \mathbf{k}_j^T
$$

A large dot product means the query and key point in similar directions, indicating the model has learned that these two tokens are relevant to each other.

**Step 2: Scaling.** The raw dot-product scores grow in magnitude with the dimension $d_k$, which can push the softmax into regions with vanishingly small gradients. The fix is simple: divide by $\sqrt{d_k}$:

$$
e_{i,j} = \frac{\mathbf{q}_i \mathbf{k}_j^T}{\sqrt{d_k}}
$$

**Step 3: Softmax normalization.** The scaled scores are passed through a softmax to produce a probability distribution over positions:

$$
\alpha_{i,j} = \frac{\exp(e_{i,j})}{\sum_k \exp(e_{i,k})}
$$

Now $\alpha_{i,j} \geq 0$ and $\sum_j \alpha_{i,j} = 1$. Each weight $\alpha_{i,j}$ tells us how much attention token $i$ pays to token $j$.

**The output.** The final output for token $i$ is a weighted sum of value vectors:

$$
\text{out}_i = \sum_j \alpha_{i,j} \mathbf{v}_j
$$

In plain terms: gather information from other tokens, weighted by relevance. Tokens with high attention weight contribute more to the output; tokens with near-zero weight are effectively ignored.

Putting it all together in matrix form, where $Q$, $K$, and $V$ stack the queries, keys, and values for all tokens:

$$
\text{Attn}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
$$

This equation describes one attention operation {% cite "vaswani2017attention" %}. A transformer gains depth and computational power by running several such heads in parallel, mixing their outputs with MLPs, and repeating the process across layers.

## A Worked Example

To make the attention equation concrete, we trace a single attention head on a 3-token sequence with $d_k = 2$. The tokens are A, B, and C, and we compute the attention output for token C (the final position).

**Setup.** Suppose the query, key, and value vectors are:

| Token | Query $\mathbf{q}$ | Key $\mathbf{k}$ | Value $\mathbf{v}$ |
|-------|---------|-------|---------|
| A |, | $(1, 0)$ | $(1, 0, 0)$ |
| B |, | $(0, 1)$ | $(0, 1, 0)$ |
| C | $(1, 1)$ | $(1, 1)$ | $(0, 0, 1)$ |

We only need C's query (since we are computing attention *from* position C) and all three keys and values.

**Step 1: Dot-product scores.** Token C's query is compared against each key:

$$e_{C,A} = \mathbf{q}_C \mathbf{k}_A^T = (1)(1) + (1)(0) = 1$$
$$e_{C,B} = \mathbf{q}_C \mathbf{k}_B^T = (1)(0) + (1)(1) = 1$$
$$e_{C,C} = \mathbf{q}_C \mathbf{k}_C^T = (1)(1) + (1)(1) = 2$$

**Step 2: Scale by $\sqrt{d_k}$.** With $d_k = 2$, we divide by $\sqrt{2} \approx 1.41$:

$$\tilde{e}_{C,A} = 0.71, \quad \tilde{e}_{C,B} = 0.71, \quad \tilde{e}_{C,C} = 1.41$$

**Step 3: Softmax.** Converting to attention weights:

$$\alpha_{C,A} = \frac{e^{0.71}}{e^{0.71} + e^{0.71} + e^{1.41}} = \frac{2.03}{2.03 + 2.03 + 4.10} \approx 0.25$$

$$\alpha_{C,B} \approx 0.25, \quad \alpha_{C,C} \approx 0.50$$

Token C attends most strongly to itself (50%), with equal attention to A and B (25% each). The self-attention is strongest because C's key aligns most with its own query (dot product of 2 vs. 1).

**Step 4: Weighted sum of values.** The output for token C is:

$$\text{out}_C = 0.25 \cdot (1, 0, 0) + 0.25 \cdot (0, 1, 0) + 0.50 \cdot (0, 0, 1) = (0.25, 0.25, 0.50)$$

The output is dominated by C's own value vector, with smaller contributions from A and B. This is the information that this attention head writes to the residual stream at position C.

The dot products between queries and keys determine the attention pattern: who attends to whom. The values do not affect those weights; they supply the information mixed according to them. Separating the *where* from the *what* gives us the [QK/OV circuit decomposition](/topics/qk-ov-circuits/) developed later.

## Self-Attention and Causal Masking

In **self-attention**, the queries, keys, and values all come from the same input sequence. Given an input matrix $X$ (one row per token), we compute $Q = XW_Q$, $K = XW_K$, and $V = XW_V$. The sequence attends to itself: every token can look at every other token and decide what information to gather. This is how a transformer lets all positions interact in a single step, producing context-dependent representations where each token's output reflects its relationship to the entire input.

For each token position, self-attention performs a complete information-gathering operation: it examines all other positions via the query-key match, decides how much to attend to each via softmax, collects the relevant information as a weighted sum of values, and writes the result back. Each token's output is therefore a context-dependent mixture of all tokens' value vectors.

In **decoder-only** transformers (such as GPT), there is an additional constraint: each token can only attend to itself and earlier tokens. This is enforced by setting $e_{i,j} = -\infty$ for all $j > i$ before the softmax, which drives those attention weights to zero. This is called **causal masking**. The reason is simple: during autoregressive generation, future tokens do not exist yet. The model must predict the next token using only the past, so the attention mechanism must respect this constraint during both training and inference.{% sidenote "Causal masking gives mechanistic interpretability a clean experimental setup. At each position i, we know exactly what information is available to the model: tokens 0 through i. This makes it possible to reason precisely about what the model could and could not have used to produce its output." %}

## Multi-Head Attention

<figure>
  <img src="/topics/attention-mechanism/images/multi_head_attention.png" alt="Multi-head attention diagram showing V, K, Q inputs each passing through multiple parallel linear projections into h parallel scaled dot-product attention blocks, whose outputs are concatenated and passed through a final linear layer." style="max-width: 55%;">
  <figcaption>Multi-head attention. Each head applies its own learned linear projections to the inputs, computes scaled dot-product attention independently, and the results are concatenated and projected through a final linear layer. From Vaswani et al., <em>Attention Is All You Need</em>. {%- cite "vaswani2017attention" -%}</figcaption>
</figure>

A single attention head produces one distribution over source positions for each destination position. Language often benefits from several such distributions at once: one head can favor the previous token, another the sentence's subject, and another an earlier instance of a repeated pattern.

The solution is to run multiple attention heads in parallel, each with its own learned projection matrices. Each head $h$ has its own $W_Q^h$, $W_K^h$, and $W_V^h$, and computes attention independently:

$$
\text{head}_h = \text{Attn}(XW_Q^h,\; XW_K^h,\; XW_V^h)
$$

The outputs of all heads are concatenated and projected through a final output matrix $W_O$:

$$
\text{MultiHead}(X) = \text{Concat}(\text{head}_1, \ldots, \text{head}_H)\, W_O
$$

Why is $W_O$ needed? Because each head operates in a small $d_v$-dimensional subspace, its output cannot be added directly to the $d_{\text{model}}$-dimensional residual stream. The output matrix $W_O \in \mathbb{R}^{(H \cdot d_v) \times d_{\text{model}}}$ maps the concatenated head outputs back into the full residual stream space. It also lets each head learn *how* to write its result back: which dimensions of the residual stream to update and with what mixture. In mechanistic interpretability, the combined matrix $W_V^h W_O^h$ (the slice of $W_O$ corresponding to head $h$) is called the **OV circuit** of a head: it determines what information the head moves from source to destination.

> **Parallel Heads:** Within one attention layer, each head computes its own QK pattern and OV write from the same input state. Their outputs are then summed into the shared residual stream, where later components can combine them.

In the standard parameterization, $d_k=d_v=d_{\text{model}}/H$, so splitting one full-width attention operation into $H$ heads does not increase the leading projection-parameter count. It does give the layer $H$ separately parameterized routing patterns and writes, which may specialize differently.{% sidenote "Each head's QK and OV matrices are low rank, with rank at most the head dimension. That constrains any one head's routing and writing capacity, although several heads and later layers can combine their effects." %}

Researchers have identified heads with recurring patterns on defined distributions. **Previous-token heads** place substantial weight on the preceding position. **Induction heads** support repeated-pattern completion, and **Name Mover heads** copy candidate names in the IOI task. These labels summarize tested behavior, not everything a head does on all inputs.

To see why multiple heads matter, consider the sentence *"The tired cat sat on the mat because it was tired"* at the token position "it." Different heads can extract different relationships from the same position simultaneously:

- **Head A** might attend from "it" back to "cat," resolving the pronoun to its referent.
- **Head B** might attend from "it" to the first "tired," tracking which property is being referenced.
- **Head C** might attend from "it" to "sat," tracking the main verb of the clause.

Separate heads make it easier to represent all three relationships at once. Each head's QK circuit can produce a different relevance pattern, while its OV circuit can move different information. Their combined outputs can therefore carry the referent, its property, and the action from the same attention layer.

An attention head is one information-moving operation, but its behavior may change with the input and may only make sense together with other heads. Mechanistic analysis therefore studies both individual heads and the circuits they form.

## Multi-Query Attention

Autoregressive generation exposes a cost that parallel training hides. After processing a prompt, the model generates one new token at a time. Each layer computes a query for the new token and compares it with keys for every earlier token, then mixes the corresponding values. Recomputing all earlier keys and values would waste work, so inference systems store them in a **key-value (KV) cache**.

In ordinary **multi-head attention (MHA)**, every head has its own key and value projections. A layer with $H_q$ query heads therefore caches $H_q$ key vectors and $H_q$ value vectors per previous token. Long contexts make repeatedly loading this cache a major memory-bandwidth cost.

> **Multi-Query Attention (MQA):** MQA keeps $H_q$ distinct query heads but uses one key projection and one value projection shared by all of them.

For query head $h$, MQA computes

$$
\text{head}_h
=
\text{Attn}\left(XW_Q^h,\;XW_K,\;XW_V\right).
$$

The queries can still ask different questions, producing different attention patterns against the shared keys. Those patterns then mix the same shared value vectors in different proportions. Each head also retains its own slice $W_O^h$ of the output projection, so the resulting writes to the residual stream can differ.

Shazeer introduced MQA to reduce the memory traffic of incremental decoding {% cite "shazeer2019mqa" %}. Ignoring batch size and bytes per number, a decoder with $L$ layers, context length $T$, head width $d_h$, and $H_{kv}$ key-value heads stores a cache proportional to

$$
M_{KV} \propto 2LTH_{kv}d_h.
$$

The factor 2 accounts for keys and values. Standard MHA has $H_{kv}=H_q$; MQA has $H_{kv}=1$, reducing this part of the cache by a factor of $H_q$. Queries are not cached for previous tokens because only the current destination token's queries are needed at each decoding step.

The sharing is a capacity tradeoff rather than a free algebraic rewrite. MQA forces all query heads to use the same key features for deciding where to read and the same value features for deciding what source information is available. The original experiments reported much faster decoding with only minor quality degradation in their tested models, but the size of that tradeoff depends on the model and training setup {% cite "shazeer2019mqa" %}.

## Grouped-Query Attention

MQA chooses the most aggressive sharing possible. **Grouped-query attention (GQA)** places intermediate points between one shared key-value head and a separate pair for every query head {% cite "ainslie2023gqa" %}.

> **Grouped-Query Attention (GQA):** GQA partitions $H_q$ query heads into $H_{kv}$ groups. Every query head keeps its own query and output projections, while all heads in one group share a key projection and a value projection.

Assume $H_{kv}$ divides $H_q$ and number both from zero. Query head $h$ uses group

$$
g(h)=\left\lfloor\frac{hH_{kv}}{H_q}\right\rfloor,
$$

so its output is

$$
\text{head}_h
=
\text{Attn}\left(XW_Q^h,\;XW_K^{g(h)},\;XW_V^{g(h)}\right).
$$

The endpoints recover the other architectures. Setting $H_{kv}=H_q$ gives MHA, with one key-value pair per query head. Setting $H_{kv}=1$ gives MQA. Values strictly between them are GQA. Ainslie et al. introduced GQA alongside a method for converting existing MHA checkpoints with additional training; in their experiments, uptrained GQA approached MHA quality with inference speed comparable to MQA {% cite "ainslie2023gqa" %}.

The visualization fixes eight query heads and varies the number of key-value heads. Lines show which queries share a key-value projection. The cache bar shows the key-value cache relative to eight-head MHA under the simplifying assumption that all heads have the same width.

<figure class="aq-figure">
  <div class="aq-diagram" id="aq-sharing-viz" role="group" aria-label="Interactive comparison of multi-head, grouped-query, and multi-query attention" tabindex="0">
    <p class="aq-scroll-hint">Scroll the diagram horizontally to see every query head.</p>
    <svg id="aq-sharing-svg" viewBox="0 0 760 410" role="img" aria-label="Eight query heads connected to a selectable number of shared key-value heads, with a bar showing relative key-value cache size." aria-describedby="aq-sharing-readout">
      <text x="380" y="205" text-anchor="middle">Loading interactive visualization…</text>
    </svg>
    <div class="aq-controls">
      <label for="aq-kv-heads">Number of key-value heads
        <input type="range" id="aq-kv-heads" min="0" max="3" step="1" value="1">
        <output id="aq-kv-heads-output" for="aq-kv-heads">2</output>
      </label>
    </div>
    <div class="aq-readout" id="aq-sharing-readout" aria-live="polite">GQA with eight query heads and two key-value heads.</div>
  </div>
  <figcaption>Sharing structure for eight query heads. Move the slider from one key-value head (MQA), through intermediate grouped-query configurations, to eight key-value heads (MHA). The query and output sides remain distinct even when the key and value projections are shared.</figcaption>
</figure>

| Architecture | Query heads | Key-value heads | Relative KV-cache size |
|---|---:|---:|---:|
| MHA | $H_q$ | $H_q$ | $1$ |
| GQA | $H_q$ | $H_{kv}$, where $1<H_{kv}<H_q$ | $H_{kv}/H_q$ |
| MQA | $H_q$ | $1$ | $1/H_q$ |

For mechanistic interpretability, “head” now names a partly shared computation. Two query heads in the same GQA group have different query-key (QK) circuits because their query matrices differ, but the key-side read is shared. Their output-value (OV) circuits use the same value matrix and different slices of $W_O$, so they can select different source positions and write different results despite sharing part of the pathway. Ablating a shared key or value projection intervenes on every query head in its group; ablating one query head's output does not.

<details class="pause-and-think">
<summary>Pause and think: What remains head-specific?</summary>

An eight-query-head GQA layer has two key-value heads. If query heads 0 through 3 share one key-value group, must they have identical attention patterns and residual-stream writes?

No. They share keys and values, but each has its own query projection, so its query-key scores and softmax pattern can differ. Each also has its own output-projection slice, so differently weighted mixtures of the shared values can be written along different residual directions. Intervening on the shared value projection affects all four heads, while intervening after one head's weighted sum can isolate that head's output.

</details>

<details class="pause-and-think">
<summary>Pause and think: From architecture to interpretability</summary>

If attention heads move information between positions, what determines *which* information gets moved and *where* it goes? The query and key matrices determine the "where" (which positions attend to which), while the value and output matrices determine the "what" (which information gets read and written). Decomposing attention into these two circuits, the [QK circuit and the OV circuit](/topics/qk-ov-circuits/), is one of the first steps in mechanistic interpretability.

</details>

## Looking Ahead

Attention moves information between positions. Each transformer layer also contains an [MLP](/topics/mlps-in-transformers/), which transforms each position separately. The next article explains the MLP computation and examines evidence for interpreting some neurons as key-value-like memories.

After that, [layer normalization](/topics/layer-normalization/) addresses the practical complication of keeping activations stable across many layers, and the [QK/OV circuit decomposition](/topics/qk-ov-circuits/) formalizes the two-circuit structure hinted at above into the mathematical framework that underpins mechanistic interpretability.

<script>
(function () {
  var svgNS = "http://www.w3.org/2000/svg";
  var kvOptions = [1, 2, 4, 8];
  var queryHeads = 8;

  function palette() {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark"
      || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          && document.documentElement.getAttribute("data-theme") !== "light");
    return {
      fg: isDark ? "#e6e6e6" : "#222222",
      muted: isDark ? "#aeb2c0" : "#626776",
      grid: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.13)",
      surface: isDark ? "#1a1a2e" : "#ffffff",
      surfaceAlt: isDark ? "#25283a" : "#f4f5fa",
      blue: isDark ? "#a0aee8" : "#5264c3",
      blueSoft: isDark ? "#303752" : "#e8ebfa",
      orange: isDark ? "#f0a36a" : "#c4672d",
      orangeSoft: isDark ? "#4a3229" : "#fae9dd",
      green: isDark ? "#82d39c" : "#27894c",
      greenSoft: isDark ? "#243f31" : "#e2f3e8",
      groups: isDark
        ? ["#c5a6ed", "#f0a36a", "#82d39c", "#a0aee8", "#e38f9f", "#e6cf7a", "#78c9cb", "#bbbcc7"]
        : ["#7952a8", "#c4672d", "#27894c", "#5264c3", "#b44b61", "#9a7b13", "#277e82", "#666b78"]
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

  function modeName(kvHeads) {
    if (kvHeads === 1) return "Multi-query attention (MQA)";
    if (kvHeads === queryHeads) return "Multi-head attention (MHA)";
    return "Grouped-query attention (GQA)";
  }

  function render() {
    var svg = document.getElementById("aq-sharing-svg");
    var input = document.getElementById("aq-kv-heads");
    var output = document.getElementById("aq-kv-heads-output");
    var readout = document.getElementById("aq-sharing-readout");
    if (!svg || !input || !output || !readout) return;

    var colors = palette();
    var kvHeads = kvOptions[Number(input.value)];
    var groupSize = queryHeads / kvHeads;
    var ratio = kvHeads / queryHeads;
    var mode = modeName(kvHeads);

    output.textContent = String(kvHeads);
    readout.textContent = mode + ": " + queryHeads + " query heads, " + kvHeads
      + " key-value " + (kvHeads === 1 ? "head" : "heads")
      + ", and " + (ratio * 100).toFixed(1).replace(".0", "") + "% of the MHA KV-cache size.";

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    addText(svg, 380, 25, mode, colors.fg, 17, "middle", "600");
    addText(svg, 380, 45, "Move the slider to change how query heads share keys and values", colors.muted, 11, "middle");

    var queryStart = 43;
    var queryWidth = 62;
    var queryGap = 25;
    var queryY = 78;
    var queryHeight = 42;
    function queryCenter(index) {
      return queryStart + index * (queryWidth + queryGap) + queryWidth / 2;
    }

    addText(svg, 22, queryY + 26, "Q", colors.blue, 14, "middle", "700");
    addText(svg, 22, queryY + 43, "current", colors.muted, 9, "middle");

    var kvY = 196;
    var kvHeight = 62;

    for (var head = 0; head < queryHeads; head++) {
      var group = Math.floor(head / groupSize);
      var first = group * groupSize;
      var last = first + groupSize - 1;
      var groupCenter = (queryCenter(first) + queryCenter(last)) / 2;
      svg.appendChild(node("line", {
        x1: queryCenter(head), y1: queryY + queryHeight,
        x2: groupCenter, y2: kvY,
        stroke: colors.groups[group], "stroke-width": 1.8, opacity: 0.7
      }));
    }

    for (var q = 0; q < queryHeads; q++) {
      svg.appendChild(node("rect", {
        x: queryStart + q * (queryWidth + queryGap), y: queryY,
        width: queryWidth, height: queryHeight, rx: 6,
        fill: colors.blueSoft, stroke: colors.blue, "stroke-width": 1.5
      }));
      addText(svg, queryCenter(q), queryY + 26, "Q" + q, colors.blue, 12, "middle", "600");
    }

    addText(svg, 22, kvY + 25, "K", colors.orange, 13, "middle", "700");
    addText(svg, 22, kvY + 47, "V", colors.green, 13, "middle", "700");
    addText(svg, 22, kvY + 66, "cached", colors.muted, 9, "middle");

    for (var g = 0; g < kvHeads; g++) {
      var groupFirst = g * groupSize;
      var groupLast = groupFirst + groupSize - 1;
      var center = (queryCenter(groupFirst) + queryCenter(groupLast)) / 2;
      var available = groupSize * (queryWidth + queryGap) - queryGap;
      var kvWidth = Math.min(140, Math.max(58, available - 12));
      var kvX = center - kvWidth / 2;

      svg.appendChild(node("rect", {
        x: kvX, y: kvY, width: kvWidth, height: kvHeight / 2, rx: 5,
        fill: colors.orangeSoft, stroke: colors.groups[g], "stroke-width": 1.7
      }));
      svg.appendChild(node("rect", {
        x: kvX, y: kvY + kvHeight / 2, width: kvWidth, height: kvHeight / 2, rx: 5,
        fill: colors.greenSoft, stroke: colors.groups[g], "stroke-width": 1.7
      }));
      addText(svg, center, kvY + 21, "K" + g, colors.orange, 11, "middle", "600");
      addText(svg, center, kvY + 51, "V" + g, colors.green, 11, "middle", "600");
      addText(svg, center, kvY + kvHeight + 17, groupSize === 1 ? "1 query" : groupSize + " queries", colors.muted, 10, "middle");
    }

    var barX = 190, barY = 317, barWidth = 500, barHeight = 34;
    addText(svg, 45, barY + 14, "Relative", colors.fg, 12, "start", "600");
    addText(svg, 45, barY + 30, "KV cache", colors.fg, 12, "start", "600");
    svg.appendChild(node("rect", {
      x: barX, y: barY, width: barWidth, height: barHeight, rx: 6,
      fill: colors.surfaceAlt, stroke: colors.grid, "stroke-width": 1.5
    }));
    svg.appendChild(node("rect", {
      x: barX, y: barY, width: barWidth * ratio, height: barHeight, rx: 6,
      fill: colors.blue, opacity: 0.9
    }));
    addText(svg, barX + barWidth / 2, barY + 23,
      (ratio * 100).toFixed(1).replace(".0", "") + "% of MHA",
      ratio > 0.55 ? colors.surface : colors.fg, 12, "middle", "600");
    addText(svg, barX, barY + 53, "Hₖᵥ / Hq = " + kvHeads + " / " + queryHeads, colors.muted, 11);
    addText(svg, barX + barWidth, barY + 53, "MHA baseline", colors.muted, 11, "end");
    addText(svg, 380, 402,
      groupSize === 1
        ? "Every query head has its own key-value head."
        : "Each key-value head is shared by " + groupSize + " query heads.",
      colors.fg, 12, "middle", "500");
  }

  function init() {
    var input = document.getElementById("aq-kv-heads");
    if (!input) return;
    input.addEventListener("input", render);
    render();

    if (window.matchMedia) {
      var media = window.matchMedia("(prefers-color-scheme: dark)");
      if (media.addEventListener) media.addEventListener("change", render);
    }
    new MutationObserver(render)
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
.aq-figure { margin: 2rem 0; }
.aq-diagram {
  max-width: 100%;
  padding: 1rem;
  overflow-x: auto;
  background: var(--color-background, #fff);
  border: 1px solid var(--color-border, rgba(0,0,0,0.1));
  border-radius: var(--radius-lg, 8px);
  text-align: left;
}
.aq-diagram svg {
  display: block;
  width: 100%;
  min-width: 650px;
  height: auto;
}
.aq-diagram svg text { font-family: var(--font-body, sans-serif); }
.aq-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  margin-top: 0.75rem;
  color: var(--color-text-secondary, rgba(0,0,0,0.6));
  font-size: 0.875rem;
}
.aq-controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.aq-controls input[type="range"] {
  width: 180px;
  accent-color: var(--color-link, #5b6abf);
}
.aq-controls output {
  min-width: 1.5rem;
  color: var(--color-text, rgba(0,0,0,0.87));
  font-family: var(--font-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}
.aq-readout {
  margin-top: 0.65rem;
  color: var(--color-text-secondary, rgba(0,0,0,0.6));
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}
.aq-scroll-hint { display: none; }
.aq-figure figcaption {
  margin-top: 0.65rem;
  color: var(--color-text-secondary, rgba(0,0,0,0.6));
  font-size: 0.9rem;
  line-height: 1.5;
}
@media (max-width: 680px) {
  .aq-diagram { padding: 0.75rem; }
  .aq-scroll-hint {
    display: block;
    margin: 0 0 0.5rem;
    color: var(--color-text-muted, rgba(0,0,0,0.4));
    font-size: 0.75rem;
  }
  .aq-controls label {
    align-items: flex-start;
    flex-direction: column;
  }
  .aq-controls input[type="range"] { width: min(70vw, 220px); }
}
</style>
