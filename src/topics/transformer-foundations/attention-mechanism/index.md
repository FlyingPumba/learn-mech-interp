---
title: "The Attention Mechanism"
description: "How transformers enable tokens to communicate through queries, keys, and values, and why the residual stream's additive structure is the foundation of mechanistic interpretability."
order: 3
prerequisites: []

glossary:
  - term: "Attention Head"
    definition: "An individual attention computation within a multi-head attention layer. Each head independently computes attention patterns over the input sequence and produces a weighted combination of value vectors."
  - term: "Attention Pattern"
    definition: "The matrix of attention weights produced by an attention head, showing how much each token position attends to every other position. Visualizing attention patterns is a foundational interpretability technique."
  - term: "Embedding"
    definition: "The mapping from discrete tokens to continuous vectors at the start of a transformer. The embedding matrix converts each token into a vector in the residual stream, where it can be read and modified by subsequent layers."
  - term: "Key Vector"
    definition: "The vector produced by applying the key weight matrix (W_K) to a token's representation. Key vectors are compared against query vectors via dot product to determine attention weights."
  - term: "Multi-Head Attention"
    definition: "The mechanism of running multiple independent attention heads in parallel within a single layer, allowing the model to attend to different types of relationships simultaneously and combine their outputs."
  - term: "Query Vector"
    definition: "The vector produced by applying the query weight matrix (W_Q) to a token's representation. Query vectors are compared against key vectors to compute attention scores that determine how much each position attends to others."
  - term: "Residual Stream"
    definition: "The central communication channel in a transformer, implemented as skip connections that allow each layer's output to be added to a running sum. All attention heads and MLP layers read from and write to this shared stream."
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

Each role is produced by multiplying the token's embedding by a learned weight matrix. For a token at position $i$ with embedding $\mathbf{x}_i \in \mathbb{R}^{d_{\text{model}}}$, the three projections are:

$$
\mathbf{q}_i = \mathbf{x}_i W_Q, \quad \mathbf{k}_i = \mathbf{x}_i W_K, \quad \mathbf{v}_i = \mathbf{x}_i W_V
$$

The projection matrices $W_Q, W_K \in \mathbb{R}^{d_{\text{model}} \times d_k}$ map the input down to a $d_k$-dimensional query/key space, while $W_V \in \mathbb{R}^{d_{\text{model}} \times d_v}$ maps to the value space. These are three different "views" of the same input, each optimized by gradient descent for a different purpose during training.{% sidenote "The projection to a lower-dimensional space creates a bottleneck. Each attention head operates in a subspace of dimension d_k, which is typically d_model / H where H is the number of heads. This low-rank structure is important for mechanistic interpretability because it means each head can only attend to and move information along a limited set of directions." %}

## The Attention Equation

<figure>
  <img src="/topics/attention-mechanism/images/scaled_dot_product_attention.png" alt="Scaled dot-product attention diagram showing Q, K, and V inputs flowing through MatMul, Scale, optional Mask, SoftMax, and a final MatMul to produce the output.">
  <figcaption>Scaled dot-product attention. The query and key vectors are combined via dot product, scaled, optionally masked, normalized with softmax, and used to weight the value vectors. From Vaswani et al., <em>Attention Is All You Need</em>. {%- cite "vaswani2017attention" -%}</figcaption>
</figure>

With queries, keys, and values defined, the attention mechanism proceeds in three steps: compute relevance scores, normalize them into weights, and use the weights to mix value vectors.

**Step 1: Dot-product scores.** How much should token $i$ attend to token $j$? The model measures this by computing the dot product between the query of token $i$ and the key of token $j$:

$$
e_{i,j} = \mathbf{q}_i^T \mathbf{k}_j
$$

A large dot product means the query and key point in similar directions, indicating the model has learned that these two tokens are relevant to each other.

**Step 2: Scaling.** The raw dot-product scores grow in magnitude with the dimension $d_k$, which can push the softmax into regions with vanishingly small gradients. The fix is simple: divide by $\sqrt{d_k}$:

$$
e_{i,j} = \frac{\mathbf{q}_i^T \mathbf{k}_j}{\sqrt{d_k}}
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

This single equation is the core of the transformer {% cite "vaswani2017attention" %}. Everything else in the architecture (multi-head attention, the residual stream, MLPs) is built around it.

## A Worked Example

To make the attention equation concrete, we trace a single attention head on a 3-token sequence with $d_k = 2$. The tokens are A, B, and C, and we compute the attention output for token C (the final position).

**Setup.** Suppose the query, key, and value vectors are:

| Token | Query $\mathbf{q}$ | Key $\mathbf{k}$ | Value $\mathbf{v}$ |
|-------|---------|-------|---------|
| A | — | $(1, 0)$ | $(1, 0, 0)$ |
| B | — | $(0, 1)$ | $(0, 1, 0)$ |
| C | $(1, 1)$ | $(1, 1)$ | $(0, 0, 1)$ |

We only need C's query (since we are computing attention *from* position C) and all three keys and values.

**Step 1: Dot-product scores.** Token C's query is compared against each key:

$$e_{C,A} = \mathbf{q}_C^T \mathbf{k}_A = (1)(1) + (1)(0) = 1$$
$$e_{C,B} = \mathbf{q}_C^T \mathbf{k}_B = (1)(0) + (1)(1) = 1$$
$$e_{C,C} = \mathbf{q}_C^T \mathbf{k}_C = (1)(1) + (1)(1) = 2$$

**Step 2: Scale by $\sqrt{d_k}$.** With $d_k = 2$, we divide by $\sqrt{2} \approx 1.41$:

$$\tilde{e}_{C,A} = 0.71, \quad \tilde{e}_{C,B} = 0.71, \quad \tilde{e}_{C,C} = 1.41$$

**Step 3: Softmax.** Converting to attention weights:

$$\alpha_{C,A} = \frac{e^{0.71}}{e^{0.71} + e^{0.71} + e^{1.41}} = \frac{2.03}{2.03 + 2.03 + 4.10} \approx 0.25$$

$$\alpha_{C,B} \approx 0.25, \quad \alpha_{C,C} \approx 0.50$$

Token C attends most strongly to itself (50%), with equal attention to A and B (25% each). The self-attention is strongest because C's key aligns most with its own query (dot product of 2 vs. 1).

**Step 4: Weighted sum of values.** The output for token C is:

$$\text{out}_C = 0.25 \cdot (1, 0, 0) + 0.25 \cdot (0, 1, 0) + 0.50 \cdot (0, 0, 1) = (0.25, 0.25, 0.50)$$

The output is dominated by C's own value vector, with smaller contributions from A and B. This is the information that this attention head writes to the residual stream at position C.

The key observation: the attention pattern (who attends to whom) is entirely determined by the dot products between queries and keys. The values are passive passengers, mixed according to whatever weights the QK interaction produces. These are two independent computations, which is the foundation of the [QK/OV circuit decomposition](/topics/qk-ov-circuits/) we will develop later.

<details class="pause-and-think">
<summary>Pause and think: Compute attention for token B</summary>

Using the same key and value vectors, compute the attention output for token B. Remember that causal masking means B can only attend to positions A and B (not C). What are the attention weights? What is the output vector?

With $\mathbf{q}_B$ not given in the table (we would need B's query vector), this exercise highlights that each position needs its own query to compute its own attention pattern. If $\mathbf{q}_B = (0, 1)$, then $e_{B,A} = 0$ and $e_{B,B} = 1$. After scaling and softmax, B attends mostly to itself. The output would be dominated by B's value vector $(0, 1, 0)$.

</details>

## Self-Attention and Causal Masking

In **self-attention**, the queries, keys, and values all come from the same input sequence. Given an input matrix $X$ (one row per token), we compute $Q = XW_Q$, $K = XW_K$, and $V = XW_V$. The sequence attends to itself: every token can look at every other token and decide what information to gather. This is how a transformer lets all positions interact in a single step, producing context-dependent representations where each token's output reflects its relationship to the entire input.

For each token position, self-attention performs a complete information-gathering operation: it examines all other positions via the query-key match, decides how much to attend to each via softmax, collects the relevant information as a weighted sum of values, and writes the result back. Each token's output is therefore a context-dependent mixture of all tokens' value vectors.

In **decoder-only** transformers (such as GPT), there is an additional constraint: each token can only attend to itself and earlier tokens. This is enforced by setting $e_{i,j} = -\infty$ for all $j > i$ before the softmax, which drives those attention weights to zero. This is called **causal masking**. The reason is simple: during autoregressive generation, future tokens do not exist yet. The model must predict the next token using only the past, so the attention mechanism must respect this constraint during both training and inference.{% sidenote "Causal masking gives mechanistic interpretability a clean experimental setup. At each position i, we know exactly what information is available to the model: tokens 0 through i. This makes it possible to reason precisely about what the model could and could not have used to produce its output." %}

## Multi-Head Attention

<figure>
  <img src="/topics/attention-mechanism/images/multi_head_attention.png" alt="Multi-head attention diagram showing V, K, Q inputs each passing through multiple parallel linear projections into h parallel scaled dot-product attention blocks, whose outputs are concatenated and passed through a final linear layer.">
  <figcaption>Multi-head attention. Each head applies its own learned linear projections to the inputs, computes scaled dot-product attention independently, and the results are concatenated and projected through a final linear layer. From Vaswani et al., <em>Attention Is All You Need</em>. {%- cite "vaswani2017attention" -%}</figcaption>
</figure>

A single attention head can only learn one attention pattern, one way of deciding which tokens are relevant to which. But language requires attending to multiple things simultaneously. A token might need to attend to the previous token (for syntax), to the subject of the sentence (for semantics), and to a matching pattern earlier in the text (for repetition), all at the same time.

The solution is to run multiple attention heads in parallel, each with its own learned projection matrices. Each head $h$ has its own $W_Q^h$, $W_K^h$, and $W_V^h$, and computes attention independently:

$$
\text{head}_h = \text{Attn}(XW_Q^h,\; XW_K^h,\; XW_V^h)
$$

The outputs of all heads are concatenated and projected through a final output matrix $W_O$:

$$
\text{MultiHead}(X) = \text{Concat}(\text{head}_1, \ldots, \text{head}_H)\, W_O
$$

> **Independent Heads:** Each attention head is an independent information-moving operation with its own learned pattern. Head $h$ reads from the residual stream, processes it through its own $d_k$-dimensional subspace, and writes back to the residual stream.

With $H$ heads and $d_k = d_{\text{model}} / H$, the total parameter count is the same as a single large head, but the model can attend to $H$ different things at once. For mechanistic interpretability, this is a major advantage: we can study each head individually to understand what it does.

In practice, different heads specialize in remarkably specific patterns. **Previous token heads** consistently attend to the immediately preceding token. **Induction heads** complete patterns by looking for previous occurrences of the current token and attending to what came after. **Name mover heads** copy proper names to later positions where they are needed for prediction. We will explore induction heads and other specialized head types in later articles.

To see why multiple heads matter, consider the sentence *"The tired cat sat on the mat because it was tired"* at the token position "it." Different heads can extract different relationships from the same position simultaneously:

- **Head A** might attend from "it" back to "cat," resolving the pronoun to its referent.
- **Head B** might attend from "it" to the first "tired," tracking which property is being referenced.
- **Head C** might attend from "it" to "sat," tracking the main verb of the clause.

No single head could serve all three purposes at once. Each head's QK circuit determines a different relevance pattern, and each head's OV circuit copies different information. The concatenation of their outputs gives the model simultaneous access to the referent, its property, and the action, all from a single attention layer.

**Each attention head is a separate information-moving operation with its own learned pattern. Understanding what each head does is a core goal of mechanistic interpretability.**

## The Residual Stream

> **Residual Stream:** The residual stream is the vector that flows through the transformer, updated additively by each component. Every attention head and MLP reads from it and writes to it.

The residual stream starts as the token embedding and is updated by each layer:

$$
\mathbf{r}^{l+1} = \mathbf{r}^l + \text{Attn}^l(\mathbf{r}^l) + \text{MLP}^l(\mathbf{r}^l)
$$

Think of it as a shared whiteboard. Each component reads the whole whiteboard, computes something, and writes its result back. The whiteboard accumulates all contributions.

The additive structure is the key insight. The final residual stream is a sum of all component outputs:

$$
\mathbf{r}^L = \mathbf{r}^0 + \sum_{l=0}^{L-1} \left(\text{Attn}^l + \text{MLP}^l\right)
$$

Because the output is a sum of contributions, we can decompose it, asking how much each component contributed to the final answer. This is the foundation of mechanistic interpretability. If the transformer's output is a sum of component contributions, then we can measure each one. This leads directly to techniques like direct logit attribution, which measures each head's contribution to the output logits, and activation patching, which tests whether a component is causally necessary. Both will be covered in later articles.

Components do not communicate directly with each other. All communication goes through the residual stream. Attention head 3 in layer 5 has no direct wire to MLP 2 in layer 7. Instead, head 3 writes to the residual stream, and MLP 2 reads from it. This additive, shared-bus architecture is what makes the transformer amenable to mechanistic analysis.

<details class="pause-and-think">
<summary>Pause and think: Understanding additive updates</summary>

If the transformer is just a series of additive updates to a vector, what would it mean to "understand" what each update does? This question motivates the entire field of mechanistic interpretability: we want to decompose the model's computation into understandable pieces and explain the role of each component.

</details>

## Other Components

Beyond attention, three other components play important roles in the transformer.

**[Layer normalization](/topics/layer-normalization/)** stabilizes training by normalizing activations before each sublayer. It introduces a nonlinearity that couples all residual stream dimensions, which means purely linear decompositions are approximate. We cover the details, including pre-norm vs. post-norm placement and why MI researchers typically analyze pre-layer-norm activations, in the [dedicated article](/topics/layer-normalization/).

**MLPs (feed-forward networks)** appear after each attention sublayer and apply a nonlinear transformation position-wise:

$$
\text{MLP}(\mathbf{x}) = W_2 \cdot \text{GELU}(W_1 \mathbf{x} + \mathbf{b}_1) + \mathbf{b}_2
$$

The first matrix $W_1 \in \mathbb{R}^{d_{\text{model}} \times d_{\text{mlp}}}$ projects up to a wider hidden layer (typically $d_{\text{mlp}} = 4 \cdot d_{\text{model}}$), the GELU nonlinearity is applied, and $W_2$ projects back down. Current evidence suggests MLPs store factual associations, apply nonlinear transformations that attention cannot, and may function as key-value memories where rows of $W_1$ match input patterns and columns of $W_2$ provide associated outputs.{% sidenote "The key-value memory interpretation of MLPs was proposed by Geva et al. (2021). Each neuron in the MLP hidden layer activates on certain input patterns (the key) and writes a fixed vector to the residual stream (the value). This view connects transformers to classical memory-augmented neural networks." %}

**Positional encodings** inject information about token order, since attention is otherwise permutation-invariant:

$$
\mathbf{x}_i^{\text{input}} = \text{Embed}(\text{token}_i) + \text{PE}(i)
$$

Common approaches include sinusoidal encodings (fixed patterns of sines and cosines from the original transformer), learned positional embeddings (a lookup table trained with the model, as in GPT-2), and rotary position embeddings (RoPE), which encode relative position directly in the attention computation.

## The Full Transformer

<figure>
  <img src="/topics/attention-mechanism/images/transformer_architecture.png" alt="Full transformer architecture diagram showing an encoder stack on the left and decoder stack on the right, each with multi-head attention, feed-forward layers, residual connections, and layer normalization, connected by cross-attention in the decoder.">
  <figcaption>The full transformer architecture with encoder (left) and decoder (right). Each layer contains multi-head attention and feed-forward sublayers with residual connections and layer normalization. The decoder additionally includes masked self-attention and encoder-decoder cross-attention. From Vaswani et al., <em>Attention Is All You Need</em>. {%- cite "vaswani2017attention" -%}</figcaption>
</figure>

A decoder-only transformer processes an input sequence through the following pipeline:

1. **Embed:** Convert tokens to vectors by summing token embeddings and positional encodings: $\mathbf{r}^0 = \text{Embed}(\text{tokens}) + \text{PE}$.

2. **Layers:** For each layer $l = 0, \ldots, L-1$, apply layer normalization, then multi-head attention, and add the result to the residual stream. Then apply layer normalization, then the MLP, and add that result to the residual stream.

3. **Unembed:** Project the final residual stream to vocabulary logits: $\text{Logits} = \text{Unembed}(\text{LN}(\mathbf{r}^L))$.

Viewed through the residual stream, the full forward pass is:

$$
\text{Logits} = \text{Unembed}\!\left(\text{LN}\!\left(\text{Embed}(\mathbf{x}) + \sum_{l=0}^{L-1}\left[\text{Attn}^l + \text{MLP}^l\right]\right)\right)
$$

Ignoring layer norms, the output is determined by a sum of contributions from the token embedding (the direct path), each attention head in each layer, and each MLP in each layer. This decomposition is what makes [mechanistic interpretability](/topics/what-is-mech-interp/) possible: we can trace the contribution of any individual component through to the final output.

If you want a step-by-step walkthrough of the entire stack, see [Transformer Architecture Intro](/topics/transformer-architecture/).

Most mechanistic interpretability research focuses on decoder-only architectures because the causal mask means each position is a well-defined prediction problem. At position $i$, the model must predict token $i+1$ using only tokens $0, \ldots, i$. This gives us a clean experimental setup where we know exactly what information is available at each position. The models studied most heavily in the field (GPT-2 and similar autoregressive architectures) all follow this pattern.

For a thorough visual walkthrough of the transformer architecture, see Alammar's "The Illustrated Transformer" {% cite "alammar2018illustrated" %}, which provides step-by-step diagrams of the attention computation described above.

<details class="pause-and-think">
<summary>Pause and think: From architecture to interpretability</summary>

If attention heads move information between positions, what determines *which* information gets moved and *where* it goes? The query and key matrices determine the "where" (which positions attend to which), while the value and output matrices determine the "what" (which information gets read and written). Decomposing attention into these two circuits, the [QK circuit and the OV circuit](/topics/qk-ov-circuits/), is one of the first steps in mechanistic interpretability.

</details>

## Notation Reference

| Symbol | Meaning |
|--------|---------|
| $\mathbf{x}$ | Token embedding or activation vector |
| $\mathbf{W}$ | Weight matrix (generic) |
| $\mathbf{r}$ | Residual stream state |
| $W_Q, W_K, W_V, W_O$ | Query, Key, Value, Output projection matrices |
| $\mathbf{q}, \mathbf{k}, \mathbf{v}$ | Query, key, value vectors (for a single token) |
| $d_{\text{model}}$ | Residual stream dimension |
| $d_k$ | Key/query dimension per head ($= d_{\text{model}} / H$) |
| $H$ | Number of attention heads |
| $\text{Attn}^l$ | Output of attention at layer $l$ |
| $\text{MLP}^l$ | Output of MLP at layer $l$ |
| $\text{Embed}, \text{Unembed}$ | Embedding and unembedding operations |
| $\text{LN}$ | Layer normalization |
