---
title: "Copy Suppression"
description: "An algorithm pattern where attention heads suppress predictions of tokens that appear earlier in context, unifying previously mysterious head behaviors like negative name movers and anti-induction heads."
order: 9
prerequisites:
  - title: "Circuit Evaluation: Faithfulness, Completeness, and Minimality"
    url: "/topics/circuit-evaluation/"

glossary:
  - term: "Copy Suppression"
    definition: "An attention head algorithm pattern where the head attends to positions where a predicted token appeared earlier in context and outputs the negative of that token's unembedding direction, suppressing the model's tendency to predict tokens it has already seen."
---

## A Head That Works Against Prediction

In the [IOI circuit](/topics/ioi-circuit/), Negative Name Mover Heads consistently push the model *away* from the correct answer. In [circuit evaluation](/topics/circuit-evaluation/), we explained this as loss hedging -- a statistical optimization where reducing confidence on individual examples improves expected loss across the training distribution. But this explanation raises a question: what are these heads actually *computing*? What algorithm do they implement?

McDougall et al. {% cite "mcdougall2023copy" %} answered this question by studying one such head -- head L10H7 in GPT-2 Small -- not on the narrow IOI task, but across the full pre-training distribution. The result was a complete mechanistic account of the head's behavior: it implements **copy suppression**, a general algorithm pattern that serves a calibration function far broader than any single task.

This is notable because it is one of the most complete analyses of an attention head's function across its full operating range, not just on a curated benchmark. The head that looked counterproductive on IOI turns out to be doing something sensible and general.

## The Algorithm

Copy suppression works in three steps:

1. **Identify the current prediction.** The head's query reads the residual stream at the current position, which (by late layers) already contains a strong signal about what the model is about to predict.

2. **Find where that token appeared before.** The head's QK circuit computes attention weights that are high for positions where the predicted token (or a semantically similar token) appeared earlier in the context.

3. **Suppress the prediction.** The head's OV circuit maps the attended token's embedding through a transformation that approximates the *negative* of the unembedding direction for that token. The result is added to the residual stream, pushing the logit for the predicted token *down*.

In formal terms, for a copy suppression head at position $t$ that attends to position $s$:

$$
\text{output}_t \approx -\alpha \cdot W_U[\text{token}_s]
$$

where $W_U[\text{token}_s]$ is the unembedding vector for the token at position $s$ and $\alpha > 0$ controls the suppression strength. The head outputs the negative unembedding of the token it attends to, directly reducing that token's logit.{% sidenote "The OV circuit does not literally implement the negative unembedding. Rather, the composition $W_O W_V W_E$ (output, value, and embedding matrices) approximates $-W_U^T$ (the transpose of the unembedding) for common tokens. The approximation is imperfect but strong enough to produce reliable suppression." %}

> **Copy Suppression:** An attention head algorithm where the head (1) identifies what token the model is currently predicting, (2) attends to positions where that token appeared earlier in context, and (3) outputs the negative unembedding of that token, suppressing the prediction. This reduces the model's tendency to over-predict tokens that have already appeared.

## Why Copy Suppression Exists

Language models have a systematic bias toward predicting tokens that appear in the context. This is often correct -- repetition is common in natural language ("The cat sat on the mat. The cat..."). But it can also be wrong. After seeing "Paris" mentioned several times in a passage, the model's residual stream accumulates evidence for "Paris" that may persist even when the next token should be something else.

Copy suppression counteracts this bias. By detecting when a strongly predicted token has already appeared and suppressing its logit, copy suppression heads calibrate the model's predictions. They reduce overconfidence in repeated tokens, making the probability distribution more accurate.

This is not loss hedging in the sense of a statistical trick. It is a genuine algorithmic contribution: the model's predictions are more calibrated *because* copy suppression heads suppress over-prediction of already-seen tokens. The expected loss improves not because the model becomes less confident overall, but because it becomes less confident *specifically where overconfidence is likely*.

<details class="pause-and-think">
<summary>Pause and think: Copy suppression and perplexity</summary>

If copy suppression heads calibrate the model by reducing over-prediction of repeated tokens, what would you expect to happen to the model's perplexity (average cross-entropy loss) if you ablated all copy suppression heads? Would perplexity increase uniformly across all tokens, or would the effect be concentrated on specific types of tokens?

The effect would be concentrated on tokens where the model tends to over-predict something it has already seen. On sequences with repeated entities or phrases, ablating copy suppression would increase the logit for the repeated token, making the model overconfident. On sequences where the correct prediction happens to be a repeated token, the ablation might actually *help* (since the suppression was reducing the correct prediction). The net effect on perplexity would depend on the balance between these cases, but the effect would be highly non-uniform across the token distribution.

</details>

## Unifying Previously Mysterious Behaviors

Copy suppression provides a unifying explanation for several head behaviors that had been documented individually but not connected.

**Negative Name Movers in IOI.** The [Negative Name Mover Heads](/topics/circuit-evaluation/) in the IOI circuit attend to name positions and push *against* the correct answer. Under copy suppression, this behavior is expected: the model is already strongly predicting the indirect object name (thanks to the Name Mover Heads), and copy suppression heads detect that this name appeared earlier in the context and suppress it. On the IOI task, this suppression is counterproductive because the correct answer *is* a name that appeared in context. But across the full distribution, suppressing over-prediction of context tokens is beneficial.

**Anti-induction heads.** Some heads appear to implement the *opposite* of [induction](/topics/induction-heads/): where an induction head sees "[A][B]...[A]" and predicts [B], an anti-induction head sees the same pattern and suppresses [B]. Under copy suppression, this makes sense: if [B] is already being predicted (perhaps by an induction head), and [B] appeared earlier in context, a copy suppression head would suppress it.

**Calibration across the distribution.** Heads that appear counterproductive on narrow benchmarks often serve a calibration role across the full pre-training distribution. Copy suppression provides the mechanism: these heads are not making "errors" on the benchmark. They are implementing a general algorithm that happens to conflict with the benchmark's specific structure.{% sidenote "This is a broader lesson for circuit analysis: a head's function on a narrow task may be misleading about its function on the full distribution. The IOI task is designed so that the correct answer is a repeated name -- exactly the kind of token that copy suppression heads suppress. On a more representative sample of text, the same heads would improve calibration rather than hurt task performance." %}

## The Mechanism in Detail

McDougall et al. {% cite "mcdougall2023copy" %} decomposed L10H7's behavior into its QK and OV circuits and verified each step.

**The QK circuit** implements what they call "predict-attend": the head's queries encode information about what the model is currently predicting (read from the late-layer residual stream, which already contains the prediction signal), and the keys encode token identity. The attention weight $A_{t,s}$ is high when the token at position $s$ matches the model's current prediction at position $t$. This is distinct from standard attention patterns that attend based on syntactic position or semantic relevance -- copy suppression heads attend based on *prediction-context overlap*.

**The OV circuit** implements approximate negative unembedding. The composition of the value and output projection matrices maps input token embeddings to vectors that point in approximately the opposite direction of those tokens' unembedding vectors. When the head attends to a token and passes it through the OV circuit, the output pushes that token's logit down.

The two circuits work in concert: the QK circuit identifies *which* tokens to suppress (those that match the current prediction and appear in context), and the OV circuit produces *how* to suppress them (by outputting their negative unembedding).

## Connection to Self-Repair

Copy suppression interacts with [self-repair](/topics/self-repair/) in a specific way. When primary circuit components (like Name Mover Heads in IOI) are ablated, the prediction signal they normally produce disappears from the residual stream. Copy suppression heads, which attend based on the prediction signal, no longer detect a strong prediction to suppress. Their suppression effect drops, which *partially restores* the correct answer through a different pathway.

This means copy suppression heads contribute to the observed self-repair phenomenon. Part of the "compensation" that occurs when primary heads are ablated is not backup heads activating -- it is suppression heads *deactivating*, removing their usual negative contribution. The measured self-repair effect is partly a release of suppression rather than active compensation.

<details class="pause-and-think">
<summary>Pause and think: Ablation interpretation</summary>

Consider a circuit where Head A produces a positive contribution of +5 to the logit difference, and Head B (a copy suppression head) produces a contribution of -2. If you ablate Head A, the logit difference might drop by only 4 (not 5), because Head B's suppression also decreases when A's signal disappears. How does this affect the interpretation of A's ablation result? What is A's "true" contribution?

This is genuinely ambiguous. In one sense, A's direct contribution is +5 (what it adds to the residual stream). In another sense, A's net contribution accounting for induced effects is +5 - 2 = +3 (since A's presence also triggers B's suppression). The ablation measurement of 4 is somewhere in between, because B's suppression is reduced but not eliminated. This illustrates why ablation results must be interpreted carefully -- they reflect not just the ablated component's direct contribution but also the induced changes in all downstream components.

</details>

## Implications for Circuit Analysis

Copy suppression has several practical implications for mechanistic interpretability work.

**Negative contributors are not errors.** When direct logit attribution reveals heads with negative contributions to a task metric, the instinct is to dismiss them as noise or classify them as "working against the circuit." Copy suppression shows that negative contributors may implement a general-purpose algorithm that is beneficial across the full distribution, even when it conflicts with a specific task.

**Task-specific circuits are incomplete pictures.** Analyzing a head's role on one task (like IOI) gives a narrow view. The same head may have a different and more fundamental role on the full distribution. Copy suppression heads "hurt" IOI performance, but their actual function -- calibrating predictions across all text -- is both useful and well-motivated.

**Attention patterns reveal algorithm type.** Standard attention patterns (attend to syntactically relevant positions) differ from copy suppression patterns (attend to positions where the predicted token appeared). Examining *what determines attention weights* -- syntactic position, token identity, or prediction-context overlap -- provides clues about the algorithm a head implements.

## Looking Ahead

Copy suppression is one of the most complete analyses of an attention head algorithm that goes beyond narrow task-specific circuits. It demonstrates that transformer heads implement general-purpose algorithms that serve the pre-training objective, and that these algorithms can appear counterproductive when viewed through the lens of a specific task. Understanding the general-purpose functions of attention heads -- not just their task-specific roles -- is an important open frontier for mechanistic interpretability.
