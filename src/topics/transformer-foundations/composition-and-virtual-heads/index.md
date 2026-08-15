---
title: "Composition and Virtual Attention Heads"
description: "How attention heads compose across layers through V-, K-, and Q-composition, creating virtual attention heads with capabilities no single head possesses."
order: 7
prerequisites:
  - title: "QK and OV Circuits"
    url: "/topics/qk-ov-circuits/"

glossary:
  - term: "Composition (of attention heads)"
    definition: "The mechanism by which attention heads in different layers interact through the residual stream, where earlier heads write information that later heads read. Three types exist: Q-composition, K-composition, and V-composition."
  - term: "Virtual Attention Head"
    definition: "An emergent attention head that does not correspond to any single physical head in the model but arises from the composition of two or more heads across different layers communicating through the residual stream."
---

## Beyond One Layer

A single-layer transformer has a clean decomposition: each attention head independently reads from the residual stream, computes its [QK and OV circuits](/topics/qk-ov-circuits/), and writes back. But real transformers have many layers, and this changes everything.

When we stack two layers, layer 2 heads receive the residual stream *after* layer 1 heads have written to it. This means a layer 2 head can "read" the output of a layer 1 head. The result is *composed* behaviors that neither head could achieve alone {% cite "elhage2021mathematical" %}.

Consider the implication: in a one-layer model, each head operates on the original token embeddings. In a two-layer model, later heads operate on a mixture of the original embeddings and the outputs of earlier heads. The space of possible computations grows dramatically, because pairs of heads across layers can work together to implement functions that no single head can express.

There are three types of composition, depending on whether the layer 1 output is used as values, keys, or queries by the layer 2 head.

## V-Composition

> **V-Composition:** V-composition occurs when a layer 2 head reads the output of a layer 1 head through its value pathway. With the row-vector convention used here, the composed transformation is $W_{OV}^{h_1} W_{OV}^{h_2}$.

In V-composition, head $h_1$ in an earlier layer moves information from source tokens through $W_{OV}^{h_1}$. Head $h_2$ later reads and transforms part of that update through $W_{OV}^{h_2}$, giving $\mathbf{x}W_{OV}^{h_1}W_{OV}^{h_2}$.{% sidenote "The product of two low-rank matrices is also low-rank. If each OV circuit has rank at most $d_k$, their composition has rank at most $d_k$ as well. This constrains the subspace through which the heads can communicate." %}

In plain terms: head $h_1$ copies some information to the residual stream, and head $h_2$ picks up that information, transforms it again, and writes the result somewhere else. The two heads form a pipeline.

## K-Composition

> **K-Composition:** K-composition occurs when a layer 2 head uses the output of a layer 1 head to compute its *keys*. The layer 1 output changes what layer 2 "looks like" to other queries.

K-composition lets the model condition attention patterns on the results of earlier computation. Here is a concrete example: head $h_1$ copies the subject noun to a later position in the residual stream. Head $h_2$ then uses that copied information as part of its key, effectively attending based on "which position contains information about the subject?" without the subject needing to be at that position originally.

This is powerful because it means attention patterns in later layers are not fixed functions of the original token embeddings. They can depend on what earlier layers have already computed. The model can dynamically route information based on the context it has built up.

## Q-Composition

> **Q-Composition:** Q-composition occurs when a layer 2 head uses the output of a layer 1 head to compute its *queries*. The layer 1 output changes what layer 2 "searches for."

Q-composition lets the model dynamically adjust what it attends to based on earlier layers' analysis. For example, head $h_1$ might write syntactic information (such as "this position is a verb") into the residual stream. Head $h_2$ then uses that information to form queries like "find the subject of this verb," enabling a syntactic relationship that depends on the output of $h_1$.{% sidenote "K-composition and Q-composition both affect the attention pattern of the later head, but they do so from different sides of the bilinear form. K-composition changes what positions 'advertise' about themselves, while Q-composition changes what positions 'search for.' The distinction matters because they interact differently with the QK circuit matrix." %}

Where K-composition changes what positions "advertise" about themselves, Q-composition changes what positions "search for." Together, K- and Q-composition give later layers the ability to implement attention patterns that are computed functions of the model's intermediate representations, not just functions of the input tokens.

<figure>
  <img src="images/qkv-composition-between-layers.png" alt="Diagram showing Q-Composition, K-Composition, and V-Composition between Layer 0 and Layer 1 attention heads in a two-layer model. Each panel shows dots representing heads in both layers, with lines connecting composing head pairs. K-Composition shows the strongest connections, linking a previous token head (red) in Layer 0 to induction heads (teal) in Layer 1.">
  <figcaption>Q-, K-, and V-Composition between attention heads in a two-layer attention-only transformer. Lines connect head pairs with significant composition, measured by the Frobenius norm of the relevant weight matrix products. In this model, K-composition dominates: a previous token head (red, Layer 0) composes with induction heads (teal, Layer 1) to implement in-context pattern completion. From Elhage et al., <em>A Mathematical Framework for Transformer Circuits</em>. {%- cite "elhage2021mathematical" -%}</figcaption>
</figure>

## Measuring Composition: Composition Scores

The figure above connects head pairs with "significant composition, measured by the Frobenius norm of the relevant weight matrix products." How do we actually compute this? Elhage et al. define three **composition scores** that quantify how much one head's output can affect another head's computation {% cite "elhage2021mathematical" %}:

$$
\text{K-comp}(h_1, h_2) = \frac{\|W_{OV}^{h_1} \cdot W_{QK}^{h_2 \top}\|_F}{\|W_{OV}^{h_1}\|_F \cdot \|W_{QK}^{h_2 \top}\|_F}
$$

$$
\text{Q-comp}(h_1, h_2) = \frac{\|W_{OV}^{h_1} \cdot W_{QK}^{h_2}\|_F}{\|W_{OV}^{h_1}\|_F \cdot \|W_{QK}^{h_2}\|_F}
$$

$$
\text{V-comp}(h_1, h_2) = \frac{\|W_{OV}^{h_1} \cdot W_{OV}^{h_2}\|_F}{\|W_{OV}^{h_1}\|_F \cdot \|W_{OV}^{h_2}\|_F}
$$

Each score measures the Frobenius norm of the composed weight matrix, normalized by the norms of the individual matrices. The normalization ensures the score lies between 0 and 1: a score of 0 means the two matrices are "orthogonal" (the output of $h_1$ falls entirely in the null space of $h_2$'s reading matrix), while a score of 1 means perfect alignment.{% sidenote "Without normalization, larger heads would have higher composition scores simply because their weight matrices have larger norms, not because they compose more. The normalization converts the score from 'how much composition happens' to 'what fraction of the available capacity is used for composition.'" %}

These are purely **weight-based** measures. A high score indicates alignment between an output subspace of $h_1$ and an input pathway of $h_2$, so the corresponding interaction has capacity to be large. It does not show that real inputs activate or route information through that path. A very small score bounds that particular normalized matrix product, but the heads may still interact through other pathways or participate in a larger circuit.

Composition scores complement the activation-based intervention methods covered later in the course ([activation patching](/topics/activation-patching/), [path patching](/topics/activation-patching/#path-patching)). Weight-based scores are cheap to compute and give a bird's-eye view of which head pairs *can* interact. Activation-based methods are more expensive but confirm which interactions actually *occur* on specific inputs.

## Virtual Attention Heads

> **Virtual Attention Head:** A virtual attention head is a computational unit formed by the composition of two or more physical attention heads across layers. It implements a behavior that no single physical head performs alone.

Virtual heads are *emergent*: they arise from the interaction of physical heads, not from explicit design. The model learns weight matrices for individual heads, but the composed behavior of head pairs (or triples, or longer chains) can implement algorithms that the individual heads cannot.

The most important example of a virtual attention head is the **induction head**, which will be covered in detail in a [later article](/topics/induction-heads/). An induction head is formed by the composition of two physical heads: a "previous token" head in an earlier layer that copies the identity of the preceding token to each position, and a "pattern matching" head in a later layer that searches for previous occurrences of the current token's predecessor and attends to what followed. Neither head alone implements in-context pattern completion, but their composition does {% cite "olsson2022context" %}.

<details class="pause-and-think">
<summary>Pause and think: Recognizing composition types</summary>

Consider the induction head example: a "previous token" head writes information to the residual stream, and a "pattern matching" head in a later layer uses that information. Which type of composition is at work here (V, K, or Q)? Think about whether the first head's output is being used as values, keys, or queries by the second head. Then consider: could the same induction behavior be implemented with a different composition type?

</details>

## The Two-Layer Expansion

For a simplified attention-only decomposition, and treating the input-dependent attention patterns as fixed for a forward pass, the output can be grouped into three classes of paths:

$$
T = \underbrace{\text{direct path}}_{\text{Embed}(\mathbf{x})} + \underbrace{\sum_h \text{single-head terms}}_{\text{each head acting alone}} + \underbrace{\sum_{h_1, h_2} \text{composition terms}}_{\text{pairs of heads interacting}}
$$

The direct path is the token embedding passing straight through to the output. The single-head terms are each head's independent contribution. The composition terms are the new ingredient that multi-layer transformers add: they capture the interactions between pairs of heads across layers.

Composition gives later heads access to representations computed by earlier heads. A one-layer attention block forms its queries, keys, and values from the initial residual state; a later block can form them from a contextually updated state. This extra depth enables conditional routing patterns unavailable to the corresponding one-layer architecture.

## Combinatorial Richness

The number of candidate two-head paths grows rapidly with model size. With $H$ heads in each of $L$ layers, there are $H^2\binom{L}{2}$ ordered pairs whose first head is in an earlier layer. For 12 heads and 12 layers, that is 9,504 candidates.{% sidenote "This count measures possible pairings, not active circuits. Most pairs may have weak weight alignment, negligible activation, or no relevance to the behavior under study. Longer paths increase the search space further." %}

The count explains a practical search problem: characterizing heads one at a time leaves thousands of possible cross-layer interactions untested. Circuit analysis therefore asks which candidate compositions are active and behaviorally relevant, rather than assuming every possible pair matters.

This is both the promise and the challenge of mechanistic interpretability. The mathematical framework gives us the tools to analyze individual heads and their circuits. But the search problem of finding which compositions matter for any given behavior remains the central difficulty of the field.

## TransformerLens Vocabulary

Many mechanistic-interpretability tutorials and codebases use naming conventions from **TransformerLens**, developed by Neel Nanda. We cover the library in a [dedicated article](/topics/transformerlens/); the short reference here will make later code examples easier to read.

Weight matrices follow a consistent naming pattern:

| TransformerLens Name | Meaning |
|---|---|
| `blocks.0.attn.W_Q` | Query weights, layer 0 |
| `blocks.0.attn.W_K` | Key weights, layer 0 |
| `blocks.0.attn.W_V` | Value weights, layer 0 |
| `blocks.0.attn.W_O` | Output projection, layer 0 |
| `blocks.0.mlp.W_in` | MLP input weights, layer 0 |
| `blocks.0.mlp.W_out` | MLP output weights, layer 0 |
| `embed.W_E` | Token embedding matrix |
| `unembed.W_U` | Unembedding matrix |

TransformerLens also provides three key abstractions for mechanistic analysis:

- **HookPoint:** A named location in the model where you can intercept activations (for example, after each attention head or after each MLP). Every intermediate computation has a HookPoint.
- **Cache:** A dictionary storing all intermediate activations from a forward pass, keyed by HookPoint name. Running `model.run_with_cache(tokens)` gives you every activation in the model in one call.
- **Hooks:** User-defined functions that can read or modify activations at any HookPoint during a forward pass. This is how researchers perform activation patching and other interventions.

These abstractions let researchers "open the hood" and inspect or intervene on any step of the computation. The naming conventions (`blocks.{layer}.attn.W_Q`, `blocks.{layer}.hook_attn_pattern`, etc.) create a shared vocabulary that makes it possible to compare results across papers and reproduce analyses precisely.

<details class="pause-and-think">
<summary>Pause and think: From framework to practice</summary>

The mathematical framework tells us that every attention head has two independent circuits (QK and OV) and that heads across layers can compose. TransformerLens gives us the tools to compute and inspect these objects in real models. If you had access to a model's cache of all intermediate activations, how would you identify which pairs of heads are composing? What would you look for in the activations to detect V-composition versus K-composition?

</details>

## Looking Ahead

The tools developed across this block give us a first framework for analyzing transformers. The [attention mechanism](/topics/attention-mechanism/) describes how information moves, the [QK/OV circuit decomposition](/topics/qk-ov-circuits/) separates an attention head's routing and writing operations, and composition shows how those operations interact across layers.

But a key question remains: what are the right *units of analysis*? We have decomposed the model into attention heads. Yet individual neurons do not always correspond to single interpretable concepts. A single neuron may respond to multiple unrelated inputs, a phenomenon known as *polysemanticity*. Understanding why this happens and what the right units of analysis actually are leads to the [superposition hypothesis](/topics/superposition/) and the broader foundations of mechanistic interpretability.
