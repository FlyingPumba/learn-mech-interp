---
title: "Reading the Attention Patterns"
description: "How to visualize and interpret attention patterns to understand what information heads are moving, from previous token heads to induction heads."
order: 4
prerequisites:
  - title: "The Attention Mechanism"
    url: "/topics/attention-mechanism/"
---

## Attention Pattern Visualization

An attention pattern is a matrix with one row for each destination position and one column for each source position. Cell $(i,j)$ contains the weight $\alpha_{i,j}$: how much the head at position $i$ reads from position $j$. Plotting this matrix as a heatmap turns a large table of numbers into shapes we can recognize.

Check the axis labels before interpreting any heatmap. Some tools transpose the display, so a diagonal still looks like a diagonal while a vertical stripe becomes horizontal. Causal masking should leave the forbidden half of the matrix blank; that is a quick way to confirm which axis is which.

Consider GPT-2 Small processing a repeated sequence: "The cat sat on the mat. The cat sat on the." Two heads display distinctive patterns:

![Previous token head attention pattern showing a clear diagonal line where each position attends to the position immediately before it.](/topics/reading-attention-patterns/images/attn_prev_token.png "Figure 1: Previous token head (Layer 0, Head 1) in GPT-2 Small. The strong diagonal pattern shows each token attending to its immediate predecessor.")

![Induction head attention pattern showing off-diagonal attention where repeated tokens attend to tokens that followed their first occurrence.](/topics/reading-attention-patterns/images/attn_induction.png "Figure 2: Induction head (Layer 5, Head 1) in GPT-2 Small. In the second half of the sequence, attention jumps to specific positions in the first half, attending to tokens that followed the first occurrence of each repeated token.")

The first pattern is a **previous-token head** (Layer 0, Head 1): a diagonal displaced by one position. For each destination token, the largest weight falls on the source immediately before it. This head can implement the first step of an [induction circuit](/topics/induction-heads/) if its OV circuit writes the previous token's identity into the residual stream.

The second pattern is an **induction head** (Layer 5, Head 1): positions in the repeated half attend to positions in the first half. At the second “The,” for example, the head reads from “ cat,” the token that followed the first “The.” Its attention is consistent with the rule “find an earlier copy of the current token and read what came next.”{% sidenote "These patterns come from GPT-2 Small runs in TransformerLens, not idealized diagrams. The background attention is part of the data. Head labels summarize a dominant pattern; they do not claim that every attention weight follows the rule." %}

Together, the plots suggest the routing pattern required for induction. They do not establish the full mechanism. The query-key (QK) circuit produces the weights, while the output-value (OV) circuit determines what reading from a source position writes back. Two heads can have nearly identical heatmaps and opposite effects on the logits.

## Reading a Pattern Without Overreading It

Start with a plain description of the geometry: “each row peaks one column to the left” is evidence; “this head tracks syntax” is already a hypothesis. Then test whether the pattern persists across varied inputs. A head that looks like a previous-token head on one sentence may behave differently around punctuation, at the beginning of a sequence, or in another language.

Next inspect the OV circuit or the head's output. High attention weight gives a source value a large coefficient; it does not tell us whether that value is large, informative, or useful downstream. A head can attend sharply and write almost nothing, or spread attention across values that add coherently.

Finally, intervene. [Activation patching](/topics/activation-patching/) can test whether changing this head or its pattern changes the behavior of interest. Ablating the head, freezing its attention pattern, and patching its value output ask different questions, so the intervention should match the proposed mechanism.

<details class="pause-and-think">
<summary>Pause and think: the same pattern, a different function</summary>

Suppose two heads both attend almost entirely to the previous token. One head's OV circuit copies token identity; the other's writes the negative of that token's unembedding direction. What would their heatmaps tell you? What would you need to inspect to distinguish copying from suppression?

The heatmaps would look alike because they show only routing. Inspecting the heads' output vectors or OV circuits would reveal the difference, and an intervention could test whether those writes affect the predicted token.

</details>

## Looking Ahead

Attention heatmaps are useful hypothesis generators: they turn routing into something we can see. The [next block](/topics/activation-patching/) introduces interventions that test whether a visible pattern actually participates in the model's computation.
