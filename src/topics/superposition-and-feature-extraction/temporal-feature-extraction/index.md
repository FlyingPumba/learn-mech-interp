---
title: "Temporal Representations and Feature Extraction"
description: "How token-wise feature learning treats time, when span averaging helps, and how predictive decompositions separate persistent context from newly arriving information."
order: 5
prerequisites:
  - title: "SAE Variants, Evaluation, and Limitations"
    url: "/topics/sae-variants-and-evaluation/"
glossary:
  - term: "Temporal Feature Analysis"
    definition: "A feature-extraction objective that decomposes each representation into a context-predictable component and a residual component containing information not predicted from earlier context."
---

## A Feature Has a Timescale

Token-wise sparse autoencoders treat every activation as a separate training example. The representation after “Paris” and the representation after the next token may be adjacent states in one computation, but shuffling cached activations presents them to the sparse autoencoder as unrelated samples.

That choice works well for token-local questions: which feature activates on a particular word, or which sparse nodes contribute to the next prediction? It is less natural for a conversation topic, a character’s current goal, or an event unfolding across several sentences. Those variables persist while individual tokens change.

Temporal feature extraction asks which unit and dependencies the decomposition should preserve. Two approaches make different compromises. Span averaging changes the training example from a token to a longer unit. Predictive decomposition keeps token resolution but explicitly separates what context predicts from what is newly introduced.

## Changing the Unit with Span Averaging

A **turn-averaged sparse autoencoder (SAE)** changes the training example from one token to one span {% cite "der2026turnaveraged" %}. For a turn containing token positions $T$, first average the residual-stream activations:

$$
\bar{\mathbf{x}} = \frac{1}{|T|}\sum_{t \in T} \mathbf{x}_t.
$$

An ordinary SAE then reconstructs $\bar{\mathbf{x}}$. The mean remains a vector in $\mathbb{R}^{d_{\text{model}}}$, so the encoder, decoder, and sparsity mechanism do not need a new shape. A turn is a natural unit for chat transcripts, but the same construction can use paragraphs, documents, or another segmentation.

Averaging changes which information the objective rewards. Token-specific components that vary across a turn tend to cancel, while directions sustained across many positions remain in the mean. The resulting latents more often describe broad properties such as topic, style, response function, or persona. Averaging also removes token order, localized evidence, and other high-frequency detail, so it is a granularity choice rather than a uniform improvement.

## What Turn-Level Features Recover

Per-token features aggregated by maximum activation were best at identifying which exact text produced a feature list, reaching 95.0% in a ten-way matching task. Turn-averaged features gave more complete coverage of structured turn summaries, winning 87.9% of pairwise comparisons across feature configurations {% cite "der2026turnaveraged" %}. Features that preserve distinctive words can therefore be better for discrimination while turn-level features are better for describing a response as a whole.

Turn-level features also reduce the size of long-context attribution graphs. With $T$ turns, $N$ tokens, $L$ layers, and $k$ active features per unit, the candidate node count changes from roughly $NLk$ to $TLk$. In the paper’s illustrative ten-turn, 250-token example, that is about 5,000 rather than 128,000 candidate nodes across four layers. Intervention tests found that turn-level attribution weights correlated with observed feature effects, although less strongly than per-token weights and with decreasing correlation at longer context lengths {% cite "der2026turnaveraged" %}.

Pure turn averaging cannot faithfully reconstruct individual token activations. A nested architecture can reserve part of one dictionary for reconstructing the turn mean while the full dictionary reconstructs per-token activations, retaining both levels at the cost of a more complicated objective and capacity split.

<details class="pause-and-think">
<summary>Pause and think: Choosing the training example</summary>

You want features for detecting a conversation’s topic and features for identifying the exact sentence that introduced a new constraint. Should both dictionaries be trained on turn averages?

Turn averages are plausible for the persistent topic but discard where the constraint appeared. Token-level or temporally predictive features are better candidates for the second question. The intended unit of explanation should determine the training example.

</details>

## The Independence Assumption

Training an SAE on shuffled token activations optimizes a marginal reconstruction objective. It does not ask whether concepts persist, become correlated in a particular context, or change their effective dimensionality as a sequence develops.

Lubana et al. give this omission a Bayesian interpretation: standard SAE objectives impose priors that treat concept activations as independent across time, implying a stationary generative picture {% cite "lubana2025priors" %}. Their measurements instead find that language-model representations change systematically across a sequence. Conceptual dimensionality grows, correlations depend on context, and autocorrelation structure varies with token position.

> **Stationarity:** A temporal assumption under which the statistical structure of a representation does not change with absolute time. A stationary process may remain correlated across nearby steps, but those dependency patterns do not systematically evolve over the sequence.

Violating this assumption does not make every SAE feature false. It identifies information that the token-wise objective is not designed to separate: predictable structure inherited from context versus genuinely new information at the current token.

## Predictable and Novel Components

**Temporal Feature Analysis** models a representation $\mathbf{x}_t$ as two parts {% cite "lubana2025priors" %}:

$$
\mathbf{x}_t = \mathbf{p}_t + \mathbf{r}_t,
$$

where $\mathbf{p}_t$ is predicted from earlier context and $\mathbf{r}_t$ is the residual not explained by that prediction. The predictive component can carry slow-changing context, while the residual emphasizes newly arriving information.

> **Temporal Feature Analysis:** Decomposing each representation into a context-predictable component and a residual component containing information that earlier context did not predict.

The method uses a learned temporal predictor rather than choosing a fixed span and averaging it. It therefore preserves token-level changes and can represent dependencies across unequal distances. Its split is conditional on the predictor: a more capable predictor can classify more of the same activation as predictable, while a restricted predictor leaves more in the residual.

Span averaging and predictive decomposition are not substitutes. Averaging deliberately compresses a selected unit. Temporal Feature Analysis asks what part of the current state was expected from its history.

## Evaluating Temporal Structure

Event boundaries provide a test for slow and fast components. Within one event, predictive codes should remain similar; a boundary should introduce a sharper residual change. In controlled stories, predictive codes aligned more clearly with annotated event structure than the tested standard SAE codes {% cite "lubana2025priors" %}.

Garden-path sentences test whether a decomposition preserves an interpretation that unfolds across distant tokens. In “The old man the boat,” early words encourage the wrong parse until later evidence establishes that *man* is a verb. Hierarchical clustering of the predictive codes recovered longer-range relations associated with the resolved parse, whereas the tested SAE codes emphasized more local changes {% cite "lubana2025priors" %}.

The study also found a slow/fast separation across narratives and out-of-distribution dialogue: predictive codes captured smoother context-dependent trajectories, while residual codes and standard SAEs aligned more with faster variation. These experiments use particular models, predictors, synthetic datasets, and automated analyses. They establish useful failure cases for the tested token-wise decompositions, not a theorem that SAE objectives can never represent temporal concepts.

## Choosing Between the Approaches

Use **token-wise SAEs** when the target is local, the intervention site must remain token-specific, or cached independent activations are a practical requirement.

Use **span-averaged SAEs** when the explanatory unit is known in advance and exact within-span order is expendable. They are especially useful when graph size would otherwise grow with every token.

Use **predictive decomposition** when the distinction between inherited context and new information is itself the object of study. Event changes, belief updates, and syntactic reinterpretation have this form.

A convincing comparison holds the downstream question fixed. Reconstruction loss alone cannot decide whether a temporal decomposition is useful; evaluation should test event boundaries, state changes, causal interventions, or another task that needs the retained temporal structure.

## Open Choices in Temporal Feature Learning

Every method installs a temporal prior. Turn averaging assumes a boundary supplied by the analyst and treats positions inside it symmetrically. Temporal Feature Analysis assumes that the chosen predictor captures the relevant history and treats what it misses as novel. Token-wise SAEs assume temporal relationships need not enter the feature-learning objective.

Richer methods could learn boundaries, combine several timescales, or impose sparsity separately on predictable and residual streams. The current results establish that time is part of the representation problem. They do not yet identify one decomposition that is best across token prediction, long-context description, and causal circuit analysis.

[Transcoders](/topics/transcoders/) next change a different part of the objective by learning how features map across model layers. Temporal methods instead change what relationships across positions the feature model is asked to preserve.

