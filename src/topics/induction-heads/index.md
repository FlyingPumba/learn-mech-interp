---
title: "Induction Heads and In-Context Learning"
description: "How the discovery of induction heads revealed a two-step circuit for in-context learning, demonstrating that compositional circuits emerge during training."
prerequisites:
  - title: "Composition and Virtual Attention Heads"
    url: "/topics/composition-and-virtual-heads/"
block: "foundations-of-mi"
category: "core-concepts"
---

## What Can Simple Models Compute?

Before we can appreciate what composition makes possible, we need to understand what a model *without* composition can do. Consider the simplest possible transformer: a one-layer, attention-only model with $H$ attention heads and no MLP. The output at each position is:

$$
T(\mathbf{x}) = \mathbf{x} + \sum_{h=1}^{H} \text{Attn}^h(\mathbf{x} \cdot W_{OV}^h)
$$

In this model, each attention head operates independently on the raw input. No head can see what another head has computed. Every attention pattern is determined solely by the token identities at each position {% cite "elhage2021mathematical" %}.

We can characterize the model's capabilities by computing two end-to-end matrices. The **end-to-end QK matrix** $W_E^T W_{QK}^h W_E$ is an $n_{\text{vocab}} \times n_{\text{vocab}}$ matrix whose entry $(i, j)$ tells us how much token $i$ attends to token $j$, based purely on token identity. The **end-to-end OV matrix** $W_U W_{OV}^h W_E$ is another $n_{\text{vocab}} \times n_{\text{vocab}}$ matrix whose entry $(i, j)$ tells us how much attending to token $j$ increases the logit for predicting token $i$.{% sidenote "These end-to-end matrices are analytically exact for one-layer attention-only models. No approximation is involved. This makes one-layer models a clean theoretical laboratory: we can characterize their complete behavior by examining these finite matrices. The story gets more complex with multiple layers, where composition creates cross-terms that do not factor as neatly." %}

Together, these matrices tell us everything a one-layer head can do: "if you see token $j$, promote token $i$ in the output." This covers bigram statistics ("after 'the', predict 'cat'"), skip-trigrams (attending to a token two or three positions back), and positional patterns (always attending to the previous token).

But there is a hard limit. A one-layer model computes a direct token-to-token mapping. The attention pattern depends only on the token identities at each position, not on what other heads have found. This means a one-layer model *cannot* implement: "if you see $A$ followed by $B$, then later when you see $A$ again, predict $B$." That requires conditioning on the relationship between tokens, which requires composing information across different heads.

## The Power of Two Layers

With two layers, the model gains a qualitatively new capability. The output now expands into three types of terms:

$$
T = \underbrace{\text{direct path}}_{\text{token embedding}} + \underbrace{\sum_h \text{single-head terms}}_{\text{each head alone}} + \underbrace{\sum_{h_1, h_2} \text{composition terms}}_{\text{head pairs across layers}}
$$

The composition terms are where new capabilities emerge. A layer-2 head reads from the residual stream *after* layer 1 has written to it. This means a layer-2 head's attention pattern can depend on computations performed by layer-1 heads. Specifically, through **K-composition**, a layer-1 head can enrich the keys that a layer-2 head reads. The layer-2 head no longer sees just raw token identities -- it sees token identities plus whatever information layer 1 has added.{% sidenote "K-composition is not the only form of composition. Q-composition changes what a layer-2 head searches for, and V-composition changes what information is moved. But K-composition is the key mechanism for induction heads, where the layer-1 head enriches the key at each position with information about the preceding token." %}

The qualitative jump is stark. One-layer models see raw tokens and compute fixed token-to-token mappings. Two-layer models see *enriched* tokens, where each position carries information deposited by layer-1 heads. This enrichment is what makes context-dependent pattern matching possible.

<details class="pause-and-think">
<summary>Pause and think: What new capability emerges?</summary>

Two layers can do something one layer cannot. Given what you know about composition, can you guess what new capability emerges? Think about what information a layer-1 head could add to each position, and how a layer-2 head could use that enriched information to make predictions that depend on context rather than just token identity.

</details>

## The Induction Pattern

Consider a sequence where a pattern repeats:

$$
[A][B] \ldots [A] \to \text{predict } [B]
$$

The model sees tokens $A$ then $B$ somewhere earlier in the context. Later, it sees $A$ again and predicts $B$. This is in-context pattern completion. The model has never been specifically trained on this particular $A$-$B$ pair. It has learned a general algorithm for copying from earlier in the context.

Take a concrete example. In the sequence "The cat sat on the cat ...", at the second "cat" position the model should predict "sat" -- the token that followed the first "cat." This requires the model to find the previous occurrence of "cat" in the context, identify that "sat" followed it, and copy "sat" to the output. No single attention head can do all three steps. This requires composition {% cite "olsson2022context" %}.

## The Two-Step Mechanism

The induction head circuit uses two attention heads across two layers, working together through K-composition.

> **Previous Token Head:** An attention head (typically in layer 1) that attends to the immediately preceding position. At position $i$, it copies information about the token at position $i-1$ into the residual stream. After this head runs, each position carries not just its own token identity but also the identity of the token before it.

**Step 1.** The previous token head runs in layer 1. At every position, it attends to the position immediately before it (producing a characteristic diagonal stripe in the attention pattern matrix). After this head writes to the residual stream, the position holding "sat" now encodes: "I am 'sat' and the token before me was 'cat'." The position holding "on" encodes: "I am 'on' and the token before me was 'sat'." Every position in the sequence is enriched with predecessor information.

> **Induction Head:** An attention head (typically in layer 2) that, at the second occurrence of token $A$, attends to the token that previously followed $A$. It implements the pattern $[A][B] \ldots [A] \to [B]$ by using predecessor information in its keys to find matching contexts.

**Step 2.** The induction head runs in layer 2. At the second occurrence of "cat", this head's query effectively says: "I am looking for a position whose predecessor was 'cat'." Thanks to the previous token head, the position holding "sat" has "predecessor = cat" in its key. The induction head attends to "sat" and copies its token identity to the output. The prediction is "sat."

The mechanism is K-composition in action. The layer-1 head enriches the keys with predecessor information. The layer-2 head uses those enriched keys to attend based on context, not just raw token identity.

## Reading the Attention Patterns

The two heads in the induction circuit have distinctive attention patterns that are recognizable in attention heatmaps.

The **previous token head** produces a strong diagonal stripe shifted by one position. Each token attends heavily to the token immediately before it. This pattern is consistent regardless of token content -- it is a positional pattern, not a content-based one. In a heatmap of the sequence "A B C D A B", every row has its peak one column to the left.{% sidenote "Previous token heads are among the most common attention head types found in transformer models. They appear reliably across model sizes and architectures. Their simplicity makes them easy to identify: any head with a clean shifted-diagonal attention pattern is likely a previous token head." %}

The **induction head** produces an off-diagonal stripe that breaks the regular diagonal pattern. At positions where a token repeats, the head attends not to the repeated token itself, but to the token that *followed* the previous occurrence. In the sequence "A B C D A B", the second "A" (position 5) attends strongly to "B" (position 2), and the second "B" (position 6) attends strongly to "C" (position 3). The pattern is content-dependent: it appears only at positions with repeated tokens and points to the position after the previous match.

If you see an attention heatmap with a clean diagonal, that is a previous token head. If you see one with off-diagonal spikes at content-matching positions, that is an induction head.

## The Phase Change

During training, there is a sudden sharp improvement in in-context learning ability. Olsson et al. document this as a visible "bump" in the training loss curve {% cite "olsson2022context" %}. Before this moment, the model makes predictions based on token frequencies -- essentially bigram statistics. After, it uses earlier tokens in the context to improve predictions on later tokens.

The transition is not gradual. Before the phase change, the model's loss improves for the first 50 or so tokens of context and then plateaus. Additional context does not help. After the phase change, the model's loss continues improving for much longer contexts, sometimes 500 tokens or more. The model has suddenly gained the ability to use distant context.

Induction heads form at precisely the moment of the phase change. The correlation is striking, and multiple lines of evidence support a causal link. Ablating induction heads in small models removes in-context learning ability. The phase change occurs at the same training step across model sizes from 2-layer to 40-layer models. Architectural perturbations that make induction heads harder to form (such as restricting composition between layers) delay the phase change correspondingly.

<details class="pause-and-think">
<summary>Pause and think: Phase changes and AI safety</summary>

The model suddenly gains a new capability at a specific point in training. What might this mean for AI safety? If capabilities can emerge abruptly rather than gradually, how does that affect our ability to predict what a model will be able to do? Consider whether other, more concerning capabilities might also emerge through sudden phase transitions.

</details>

## From Toy Models to Large Models

Despite being discovered in tiny attention-only models, induction heads appear in models up to 13 billion parameters and beyond. In larger models, the mechanism generalizes from exact token matching to *fuzzy* pattern completion. The head does not just match identical tokens -- it matches tokens that play similar semantic roles, enabling more flexible in-context learning.{% sidenote "The generalization from exact matching to fuzzy matching is one of the most significant aspects of the induction head discovery. In small models, the circuit implements literal token copying: see 'cat' again, predict what followed 'cat' before. In large models, the mechanism generalizes to semantic similarity: see a word that plays a similar role to a previous word, predict what came next in the earlier context. This generality is what makes induction heads a plausible explanation for a substantial portion of in-context learning." %}

This generality is what makes the discovery significant. A mechanism found in toy models explains behavior in production-scale systems. It validates the core approach of mechanistic interpretability: study simple models with mathematical tools, discover circuits, and find that those circuits appear (in more sophisticated form) in the models we actually deploy.

The induction head is the first circuit discovered in transformers that proves composition creates qualitatively new capabilities. It is the canonical example of a discovered circuit, and it demonstrates that the features-and-circuits framework from Olah et al. produces real, verifiable results. The mathematical framework from the [composition and virtual heads](/topics/composition-and-virtual-heads/) article gave us the analytical tools. Applied to real models, those tools revealed a beautiful two-step mechanism for in-context learning.

## Looking Ahead

We have seen a concrete circuit: two attention heads composing across layers to implement pattern completion. The next question is how to systematically measure the contribution of each component. [Direct logit attribution](/topics/direct-logit-attribution/) provides this tool, decomposing the model's output logits into per-component contributions and letting us ask precisely which heads matter most for any given prediction. Beyond attribution, the discovery of circuits like the induction head motivates the search for more complex circuits, such as the [IOI circuit](/topics/ioi-circuit/) that handles indirect object identification through a coordinated network of more than twenty attention heads.
