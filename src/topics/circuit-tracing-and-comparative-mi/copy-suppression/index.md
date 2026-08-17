---
title: "Copy Suppression"
description: "How attention heads suppress tokens copied from earlier context, connecting negative name movers, anti-induction heads, and a broader computational motif."
order: 8
prerequisites:
  - title: "Circuit Evaluation: Faithfulness, Completeness, and Minimality"
    url: "/topics/circuit-evaluation/"

glossary:
  - term: "Copy Suppression"
    definition: "An attention head algorithm pattern where the head attends to positions where a predicted token appeared earlier in context and outputs the negative of that token's unembedding direction, suppressing the model's tendency to predict tokens it has already seen."
---

## A Head That Works Against Prediction

In the [IOI circuit](/topics/ioi-circuit/), Negative Name Mover Heads consistently push the model *away* from the correct answer. In [circuit evaluation](/topics/circuit-evaluation/), we explained this as loss hedging, a statistical optimization where reducing confidence on individual examples improves expected loss across the training distribution. But this explanation raises a question: what are these heads actually *computing*? What algorithm do they implement?

McDougall et al. {% cite "mcdougall2023copy" %} answered this question by studying one such head, head L10H7 in GPT-2 Small, not only on IOI, but across a broader sample of pre-training data. Their analysis produced a detailed account of much of the head's behavior: it implements **copy suppression**, an algorithmic pattern that operates beyond the IOI benchmark.

Unlike an analysis confined to a curated benchmark, this study asks whether the proposed mechanism explains the head on more representative text. The head that looks counterproductive on IOI then has a more coherent interpretation: it often reduces an existing tendency to copy from context.

## The Algorithm

Copy suppression identifies the current prediction, finds earlier occurrences, and then lowers that token's logit:

1. **Identify the current prediction.** The head's query reads the residual stream at the current position, which (by late layers) already contains a strong signal about what the model is about to predict.

2. **Find where that token appeared before.** The head's QK circuit computes attention weights that are high for positions where the predicted token (or a semantically similar token) appeared earlier in the context.

3. **Suppress the prediction.** The head's OV circuit maps the attended token's embedding through a transformation that approximates the *negative* of the unembedding direction for that token. The result is added to the residual stream, pushing the logit for the predicted token *down*.

In formal terms, for a copy suppression head at position $t$ that attends to position $s$:

$$
\text{output}_t \approx -\alpha \cdot W_U[\text{token}_s]
$$

where $W_U[\text{token}_s]$ is the unembedding vector for the token at position $s$ and $\alpha > 0$ controls the suppression strength. The head outputs the negative unembedding of the token it attends to, directly reducing that token's logit.{% sidenote "The OV circuit does not literally implement the negative unembedding. Rather, the composition $W_E W_V W_O$ (embedding, value, and output matrices) approximates $-W_U^T$ (the transpose of the unembedding) for common tokens. The approximation is imperfect but strong enough to produce reliable suppression." %}

> **Copy Suppression:** An attention head algorithm where the head (1) identifies what token the model is currently predicting, (2) attends to positions where that token appeared earlier in context, and (3) outputs the negative unembedding of that token, suppressing the prediction. This reduces the model's tendency to over-predict tokens that have already appeared.

## Why Copy Suppression Exists

Language models have a systematic bias toward predicting tokens that appear in the context. This is often correct because repetition is common in natural language ("The cat sat on the mat. The cat..."). It can also be wrong. After seeing "Paris" several times in a passage, the model's residual stream may retain evidence for "Paris" even when the next token should be something else.

Copy suppression counteracts this bias. By detecting when a strongly predicted token has already appeared and suppressing its logit, copy suppression heads calibrate the model's predictions. They reduce overconfidence in repeated tokens, making the probability distribution more accurate.

Copy suppression does not make the model less confident everywhere. It lowers confidence specifically when a token is both strongly predicted and already present in context, which can improve calibration and expected loss on the broader distribution.

<details class="pause-and-think">
<summary>Pause and think: Copy suppression and perplexity</summary>

If copy suppression heads calibrate the model by reducing over-prediction of repeated tokens, what would you expect to happen to the model's perplexity (average cross-entropy loss) if you ablated all copy suppression heads? Would perplexity increase uniformly across all tokens, or would the effect be concentrated on specific types of tokens?

The effect would be concentrated on tokens where the model tends to over-predict something it has already seen. On sequences with repeated entities or phrases, ablating copy suppression would increase the logit for the repeated token, making the model overconfident. On sequences where the correct prediction happens to be a repeated token, the ablation might actually *help* (since the suppression was reducing the correct prediction). The net effect on perplexity would depend on the balance between these cases, but the effect would be highly non-uniform across the token distribution.

</details>

## Unifying Previously Mysterious Behaviors

Copy suppression provides a unifying explanation for several head behaviors that had been documented individually but not connected.

**Negative Name Movers in IOI.** The [Negative Name Mover Heads](/topics/circuit-evaluation/) attend to name positions and push against the correct answer on IOI. A copy-suppression account explains the sign: positive Name Movers raise a previously seen name, and the negative heads suppress tokens that are both predicted and present in context. The measured head can improve average loss on broader text even while hurting this benchmark, but that distribution-level effect must be tested rather than inferred from the label.

**Anti-induction heads.** Some heads appear to implement the *opposite* of [induction](/topics/induction-heads/): where an induction head sees "[A][B]...[A]" and predicts [B], an anti-induction head sees the same pattern and suppresses [B]. Under copy suppression, this makes sense: if [B] is already being predicted (perhaps by an induction head), and [B] appeared earlier in context, a copy suppression head would suppress it.

**Calibration beyond the benchmark.** A negative contribution to one metric can be part of a policy that improves loss elsewhere. Copy suppression is a concrete example: repeated-name answers make suppression look counterproductive on IOI, while broader evaluation can test whether the same head reduces overprediction on other text.{% sidenote "A task-specific role and a distribution-level role answer different questions. Report both the benchmark effect and the evidence from a broader sample instead of assuming either one defines the head." %}

## The Mechanism in Detail

McDougall et al. {% cite "mcdougall2023copy" %} decomposed L10H7's behavior into its QK and OV circuits and verified each step.

**The QK circuit** implements what the authors call “predict-attend.” Queries read information correlated with the current prediction, while keys carry token-identity information. The attention weight $A_{t,s}$ becomes high when the token at source position $s$ matches a token favored at destination $t$. This differs from a purely positional pattern: the routing depends on overlap between the prediction and the context.

**The OV circuit** implements approximate negative unembedding. The composition of the value and output projection matrices maps input token embeddings to vectors that point in approximately the opposite direction of those tokens' unembedding vectors. When the head attends to a token and passes it through the OV circuit, the output pushes that token's logit down.

The two circuits work in concert: the QK circuit identifies *which* tokens to suppress (those that match the current prediction and appear in context), and the OV circuit produces *how* to suppress them (by outputting their negative unembedding).

## Connection to Self-Repair

Copy suppression interacts with [self-repair](/topics/self-repair/) in a specific way. When primary circuit components (like Name Mover Heads in IOI) are ablated, the prediction signal they normally produce disappears from the residual stream. Copy suppression heads, which attend based on the prediction signal, no longer detect a strong prediction to suppress. Their suppression effect drops, which *partially restores* the correct answer through a different pathway.

Copy suppression contributes to measured self-repair because ablating a positive pathway can also weaken a downstream negative contribution. The resulting recovery is partly a release of suppression, not only increased activity from backup heads.

<details class="pause-and-think">
<summary>Pause and think: Ablation interpretation</summary>

Consider a circuit where Head A produces a positive contribution of +5 to the logit difference, and Head B (a copy suppression head) produces a contribution of -2. If you ablate Head A, the logit difference might drop by only 4 (not 5), because Head B's suppression also decreases when A's signal disappears. How does this affect the interpretation of A's ablation result? What is A's "true" contribution?

There is no single answer without defining the counterfactual. A's direct projected write is +5. Its total effect through all downstream paths includes the suppression it induces, while the observed ablation effect is 4 under this intervention. State which quantity you mean instead of treating “true contribution” as an intrinsic scalar.

</details>

## Implications for Circuit Analysis

The mechanism changes how we should interpret negative contributors, task-specific circuits, and attention patterns.

**Negative contributors are not automatically errors.** A head with a negative direct contribution to one task metric may implement a broader policy that improves other examples. Copy suppression supplies a testable hypothesis for such cases.

**Task-specific circuits are partial pictures.** Analyzing a head's role on one task gives a narrow view. The same head may participate in a broader pattern elsewhere in the data. Copy suppression heads can hurt IOI performance even when their average effect on more representative text is useful.

**Attention patterns reveal algorithm type.** Standard attention patterns (attend to syntactically relevant positions) differ from copy suppression patterns (attend to positions where the predicted token appeared). Examining *what determines attention weights*, syntactic position, token identity, or prediction-context overlap, provides clues about the algorithm a head implements.

## Looking Ahead

Copy suppression shows why a head's role on one benchmark may not describe its broader function. A component can oppose the desired answer on IOI yet improve predictions elsewhere by counteracting excessive copying. This makes distribution-wide evaluation a necessary complement to task-specific circuit analysis.
