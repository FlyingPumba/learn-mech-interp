---
title: "Composition and Virtual Attention Heads"
description: "How attention heads compose across layers through V-, K-, and Q-composition, creating virtual attention heads with capabilities no single head possesses."
order: 5
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

> **V-Composition:** V-composition occurs when a layer 2 head reads the *value output* of a layer 1 head. The combined effect on the residual stream is the matrix product of their OV circuits: $W_{OV}^{h_2} W_{OV}^{h_1}$.

In V-composition, head $h_1$ in an earlier layer moves information from source tokens, transforming it through its OV circuit. Head $h_2$ in a later layer then further transforms and re-routes that information through its own OV circuit. The composed OV circuit is the matrix product $W_{OV}^{h_2} W_{OV}^{h_1}$.{% sidenote "The matrix product of two low-rank matrices is itself low-rank. If each OV circuit has rank at most $d_k$, their composition has rank at most $d_k$ as well. This means composed circuits still operate in a constrained subspace, which limits the information they can process but also makes them more tractable to analyze." %}

In plain terms: head $h_1$ copies some information to the residual stream, and head $h_2$ picks up that information, transforms it again, and writes the result somewhere else. The two heads form a pipeline.

## K-Composition

> **K-Composition:** K-composition occurs when a layer 2 head uses the output of a layer 1 head to compute its *keys*. The layer 1 output changes what layer 2 "looks like" to other queries.

K-composition lets the model condition attention patterns on the results of earlier computation. Here is a concrete example: head $h_1$ copies the subject noun to a later position in the residual stream. Head $h_2$ then uses that copied information as part of its key, effectively attending based on "which position contains information about the subject?" without the subject needing to be at that position originally.

This is powerful because it means attention patterns in later layers are not fixed functions of the original token embeddings. They can depend on what earlier layers have already computed. The model can dynamically route information based on the context it has built up.

## Q-Composition

> **Q-Composition:** Q-composition occurs when a layer 2 head uses the output of a layer 1 head to compute its *queries*. The layer 1 output changes what layer 2 "searches for."

Q-composition lets the model dynamically adjust what it attends to based on earlier layers' analysis. For example, head $h_1$ might write syntactic information (such as "this position is a verb") into the residual stream. Head $h_2$ then uses that information to form queries like "find the subject of this verb," enabling a syntactic relationship that depends on the output of $h_1$.{% sidenote "K-composition and Q-composition both affect the attention pattern of the later head, but they do so from different sides of the bilinear form. K-composition changes what positions 'advertise' about themselves, while Q-composition changes what positions 'search for.' The distinction matters because they interact differently with the QK circuit matrix." %}

Where K-composition changes what positions "advertise" about themselves, Q-composition changes what positions "search for." Together, K- and Q-composition give later layers the ability to implement attention patterns that are computed functions of the model's intermediate representations, not just functions of the input tokens.

## Virtual Attention Heads

> **Virtual Attention Head:** A virtual attention head is a computational unit formed by the composition of two or more physical attention heads across layers. It implements a behavior that no single physical head performs alone.

Virtual heads are *emergent*: they arise from the interaction of physical heads, not from explicit design. The model learns weight matrices for individual heads, but the composed behavior of head pairs (or triples, or longer chains) can implement algorithms that the individual heads cannot.

The most important example of a virtual attention head is the **induction head**, which will be covered in detail in a [later article](/topics/induction-heads/). An induction head is formed by the composition of two physical heads: a "previous token" head in an earlier layer that copies the identity of the preceding token to each position, and a "pattern matching" head in a later layer that searches for previous occurrences of the current token's predecessor and attends to what followed. Neither head alone implements in-context pattern completion, but their composition does {% cite "olsson2022context" %}.

<details class="pause-and-think">
<summary>Pause and think: Recognizing composition types</summary>

Consider the induction head example: a "previous token" head writes information to the residual stream, and a "pattern matching" head in a later layer uses that information. Which type of composition is at work here (V, K, or Q)? Think about whether the first head's output is being used as values, keys, or queries by the second head. Then consider: could the same induction behavior be implemented with a different composition type?

</details>

## The Two-Layer Expansion

For a two-layer model, the full output expands into three classes of terms:

$$
T = \underbrace{\text{direct path}}_{\text{Embed}(\mathbf{x})} + \underbrace{\sum_h \text{single-head terms}}_{\text{each head acting alone}} + \underbrace{\sum_{h_1, h_2} \text{composition terms}}_{\text{pairs of heads interacting}}
$$

The direct path is the token embedding passing straight through to the output. The single-head terms are each head's independent contribution. The composition terms are the new ingredient that multi-layer transformers add: they capture the interactions between pairs of heads across layers.

The composition terms are what make multi-layer transformers more powerful than single-layer ones. A one-layer transformer can only compute functions of the original token embeddings. A two-layer transformer can compute functions of *functions* of the embeddings, because later heads read the outputs of earlier heads.

## Combinatorial Richness

The number of possible two-head compositions grows rapidly with model size. Consider a model with $H$ heads per layer and $L$ layers. Each pair of heads where the first is in an earlier layer than the second can form a virtual head. With 12 heads per layer and 12 layers, there are thousands of possible pairwise compositions.{% sidenote "For a model with 12 heads and 12 layers, the number of virtual two-head pairs is $12 \\times 12 \\times \\binom{12}{2} = 9{,}504$. And this only counts two-head compositions. Three-head chains, four-head chains, and longer compositions add even more potential virtual circuits. The combinatorial explosion means the model's computational capacity far exceeds what individual heads suggest." %}

This combinatorial explosion means multi-layer transformers have far richer computational capacity than their parameter count alone suggests. The parameters define individual heads, but the *space of possible behaviors* includes all compositions of those heads. Understanding a model therefore requires understanding not just what each head does individually, but how heads compose to create emergent behaviors.

This is both the promise and the challenge of mechanistic interpretability. The mathematical framework gives us the tools to analyze individual heads and their circuits. But the search problem of finding which compositions matter for any given behavior remains the central difficulty of the field.

## TransformerLens Vocabulary

When reading mechanistic interpretability research, you will encounter a standard set of naming conventions from **TransformerLens**, the Python library most widely used for MI research (developed by Neel Nanda). While we will not write code here, the vocabulary appears in virtually every paper and blog post in the field.

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

The tools developed across this block form a complete framework for analyzing transformers. The [attention mechanism](/topics/attention-mechanism/) describes how individual components work. The [QK/OV circuit decomposition](/topics/qk-ov-circuits/) reveals the two independent functions of each attention head. Composition explains how multi-layer models build capabilities that transcend individual heads.

But a key question remains: what are the right *units of analysis*? We have decomposed the model into attention heads. Yet individual neurons do not always correspond to single interpretable concepts. A single neuron may respond to multiple unrelated inputs, a phenomenon known as *polysemanticity*. Understanding why this happens and what the right units of analysis actually are leads to the [superposition hypothesis](/topics/superposition/) and the broader foundations of mechanistic interpretability.
