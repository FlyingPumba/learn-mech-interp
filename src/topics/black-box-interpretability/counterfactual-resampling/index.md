---
title: "Counterfactual Resampling"
description: "Testing which steps in a reasoning trace affect the final answer by resampling continuations after individual steps are removed or replaced."
order: 1
prerequisites:
  - title: "Activation Patching"
    url: "/topics/activation-patching/"

glossary:
  - term: "Counterfactual Resampling"
    definition: "A black-box technique for measuring the causal importance of individual reasoning steps: delete a step from a chain-of-thought trace, regenerate from that point many times, and measure the distributional shift in final answers via KL divergence."
  - term: "Thought Anchor"
    definition: "A reasoning step with disproportionately high counterfactual importance, meaning the model's final answer distribution changes substantially when that step is removed. Plan generation and uncertainty management steps tend to be thought anchors."
---

## Which Reasoning Steps Matter?

Modern language models can produce long chains of reasoning before arriving at an answer. A model solving a math problem might restate the question, plan an approach, retrieve relevant formulas, perform several calculations, catch a mistake, backtrack, and finally produce a result. Some of these steps are load-bearing; others are filler. But which ones actually determine the answer?

This is not just an academic question. If we want to understand *how* a model reasons (or whether it truly reasons at all), we need methods to identify the steps that causally influence the output. [Activation patching](/topics/activation-patching/) does this at the level of individual model components, but it requires access to model internals. Can we measure the importance of reasoning steps using only the model's inputs and outputs?

**Counterfactual resampling** offers one answer: delete a reasoning step, let the model regenerate from that point, and see how the final answer changes {% cite "bogdan2025thoughtanchors" %} {% cite "macar2025thoughtbranches" %}.

<figure>
  <img src="images/overview_methods.png" alt="Three-panel overview: (A) an example reasoning trace with sentences color-coded by category, (B) the three analysis methods (resampling, receiver heads, attention suppression), and (C) a directed causal graph showing sentence importance.">
  <figcaption>Overview of the counterfactual resampling framework. (A) A reasoning trace with sentences categorized by function: active computation (green), plan generation (red), uncertainty management (purple). (B) Three complementary analysis methods. (C) The resulting causal graph, where node size indicates importance. From Bogdan et al., <em>Thought Anchors</em>. {% cite "bogdan2025thoughtanchors" %}</figcaption>
</figure>

## The Forced-Answer Baseline

The most straightforward way to measure a step's importance is to interrupt the model at that point and force it to produce a final answer. If the model can already give the correct answer after step 5, then steps 6 through 20 were presumably unimportant.

This **forced-answer** approach measures how much information has accumulated up to a given point. Applied to math problems, it suggests that **active computation** steps (algebra, arithmetic, symbolic manipulation) are the most important, since accuracy jumps most after these steps.

But there is a problem. Forced-answer measures cumulative information, not causal influence. A step might coincide with a jump in accuracy simply because it comes after the real work has already been done. It conflates *when the answer becomes available* with *what made the answer possible*. We need something more surgical.

## The Core Technique

Counterfactual resampling takes a different approach. Instead of asking "does the model know the answer after this step?", it asks: "does the answer *change* if this step had gone differently?"

The procedure, for a reasoning trace with sentences $S_1, S_2, \ldots, S_n$:

1. **Delete** sentence $S_i$ and everything after it, keeping only the prefix $S_1, \ldots, S_{i-1}$.
2. **Regenerate** a replacement sentence $T_i$ from this prefix (using the model's own sampling, typically temperature 0.6).
3. **Roll out** the rest of the reasoning from $T_i$ to a final answer. Repeat this $N = 100$ times to get a distribution of answers.
4. **Compare** the answer distribution from the regenerated rollouts to the distribution from rollouts that kept $S_i$ intact. The divergence between these two distributions is the **resampling importance** of $S_i$.

Formally, if $p(A \mid S_i)$ is the answer distribution when the original step is kept and $p(A' \mid T_i)$ is the distribution when it is replaced:

$$
\text{importance}(S_i) = D_{\text{KL}}\!\left[\, p(A' \mid T_i) \;\|\; p(A \mid S_i) \,\right]
$$

A step with high KL divergence is one where the model's conclusion is sensitive to *what was said at that point*. A step with near-zero divergence contributes little that the surrounding context does not already determine.

> **Counterfactual Resampling:** Delete a reasoning step, regenerate the rest of the trace many times, and measure the KL divergence between the resulting answer distribution and the original. Steps that produce large distributional shifts are causally important.

<details class="pause-and-think">
<summary>Pause and Think</summary>

Consider a reasoning trace where step 3 says "Let me try converting to base 2" and step 4 performs the conversion. If you delete step 3 and regenerate, the model might choose a completely different strategy. If you delete step 4 and regenerate, the model will likely just redo the same conversion (since step 3 already committed to the approach). Which step do you expect to have higher counterfactual importance, and why?

Step 3 should have higher importance, because it determines the *direction* of reasoning. Step 4 is largely predetermined by step 3. This is the core insight: strategic decisions anchor reasoning more than their downstream execution does.

</details>

## Semantic Filtering

There is a subtlety. When we regenerate from the prefix $S_1, \ldots, S_{i-1}$, sometimes the model produces a replacement $T_i$ that is semantically identical to the original $S_i$, just worded differently. In these cases the answer distribution should not change, and counting these rollouts would dilute our importance estimate.

**Semantic filtering** addresses this. Before including a rollout in the counterfactual distribution, we check whether $T_i$ is actually different from $S_i$ by computing the cosine similarity of their sentence embeddings. Rollouts where the similarity exceeds a threshold (typically 0.8) are excluded, since they represent cases where the model effectively reproduced the same reasoning step.

The resulting metric is **counterfactual importance**: the KL divergence computed only over rollouts where the replacement genuinely diverged from the original.

This distinction matters. Without semantic filtering, a step that the model always reproduces (regardless of phrasing) looks unimportant. With filtering, we correctly identify it as *overdetermined*, a step the model gravitates toward given the preceding context. Overdetermination is interesting in its own right: it means the reasoning chain has built up enough context to make that step nearly inevitable.

## Resilience: When Removed Content Reappears

Semantic filtering handles cases where the *immediate* replacement is identical to the original. But there is a deeper problem: the model can **re-derive** the content of a removed sentence further downstream. You delete step 5, and the replacement at step 5 is genuinely different, but by step 8 the model has arrived at the same conclusion anyway through a different path. One round of resampling would miss this.

Macar et al. {% cite "macar2025thoughtbranches" %} address this with a metric called **resilience**: the number of iterative resampling rounds needed before a sentence's semantic content stays absent from the rest of the trace. A sentence with high resilience keeps reappearing even when you repeatedly remove it, meaning the model's reasoning is deeply committed to that content. A sentence with low resilience vanishes after a single perturbation, suggesting it was superficially generated rather than structurally necessary.

This leads to a refined importance metric, **Counterfactual++**, which only counts a sentence as truly removed when its content is absent from *all* downstream positions, not just the immediate replacement:

$$
\text{importance}^{++}(S_i) = D_{\text{KL}}\!\left[\, p(A' \mid \forall\, j \geq i:\, T_j \text{ dissimilar to } S_i) \;\|\; p(A \mid S_i) \,\right]
$$

This is a stricter test. A sentence might have moderate counterfactual importance (the immediate replacement differs and the answer shifts) but low Counterfactual++ importance (the model re-derives the same content later). Conversely, a sentence with high Counterfactual++ importance is one whose content, once removed, genuinely cannot be recovered.

## Why On-Policy Resampling Matters

Hand-written replacement sentences seem like a simpler way to test targeted hypotheses than repeatedly sampling from the model. They also change the distribution of the reasoning trace, creating a different intervention.

When Macar et al. compared **on-policy** interventions (replacements sampled from the model itself) with **off-policy** alternatives (hand-written edits, sentences from a different model, or sentences from the same model on a different problem), the off-policy interventions produced effects 10 to 100 times weaker {% cite "macar2025thoughtbranches" %}. Hand-written sentences clustered near zero behavioral change, while on-policy replacements ranged from no effect to complete behavioral reversal.

The reason is distributional fit. A hand-written sentence may be grammatically correct and topically relevant, but the model treats it as out-of-distribution. Its token-level log-probabilities are much lower than what the model would generate itself, and subsequent processing does not engage with it the same way. On-policy replacements, by contrast, are things the model *would actually say* given the preceding context, so they integrate naturally into the reasoning flow and produce genuine downstream effects.

For behavioral interventions on reasoning traces, distributional fit is part of the intervention. A hand-written replacement may test the model's response to unfamiliar prose rather than the causal role of the original reasoning step.

## Plans Anchor the Reasoning Trajectory

When Bogdan et al. applied counterfactual resampling to DeepSeek R1-Distill (a reasoning model) on math problems, the results were surprising. They classified each reasoning sentence into one of several categories: **plan generation** (stating strategies, meta-reasoning about approach), **active computation** (algebra, arithmetic), **uncertainty management** (backtracking, re-evaluation, expressing confusion), **fact retrieval**, **self-checking**, and others.

<figure>
  <img src="images/importance_by_category.png" alt="Two scatter plots comparing forced-answer importance (panel A) and counterfactual importance (panel B) by sentence category. In panel A, Active Computation dominates. In panel B, Plan Generation has the highest importance.">
  <figcaption>The discrepancy between forced-answer importance (A) and counterfactual importance (B). Under the counterfactual-resampling metric, plan generation and uncertainty management rank above active computation. From Bogdan et al., <em>Thought Anchors</em>. {% cite "bogdan2025thoughtanchors" %}</figcaption>
</figure>

The forced-answer method put **active computation** on top: accuracy jumps most after the model performs calculations. But counterfactual resampling told a different story:

- **Plan generation** sentences had the highest counterfactual importance. These are the steps where the model commits to a strategy ("Let me try converting to base 2 first" or "I'll use the quadratic formula"). Removing them causes downstream reasoning to diverge substantially.
- **Uncertainty management** sentences (backtracking, re-evaluation) came second. When the model catches a mistake and changes course, that correction anchors the rest of the trace.
- **Active computation** ranked lower. Despite being the most frequent category (about a third of all sentences), computation steps are largely predetermined by earlier planning decisions. The algebra follows from the strategy; change the strategy and the algebra changes, but change one line of algebra and the model often just redoes it.

The authors call the high-importance steps **thought anchors**: the sentences that pin down the trajectory of reasoning. The metaphor is apt. An anchor does not do the work of sailing, but it determines where the ship ends up.

### The Self-Preservation Test

In the tested safety-relevant scenarios, **self-preservation** sentences such as “My primary goal is to ensure I'm not shut down” had the lowest resilience category, often disappearing after one to four resampling iterations. Their Counterfactual++ importance was near zero {% cite "macar2025thoughtbranches" %}.

<figure>
  <img src="images/resilience_by_category.png" alt="Bar chart showing resilience scores by sentence category across four models. Self-preservation consistently has the lowest scores, while situation assessment and action execution have the highest.">
  <figcaption>Resilience scores by sentence category across four reasoning models. Self-preservation sentences are the least resilient under this metric, consistent with their surface wording being replaceable in the sampled traces. From Macar et al., <em>Thought Branches</em>. {% cite "macar2025thoughtbranches" %}</figcaption>
</figure>

Across four tested reasoning models, the literal self-preservation sentences were easy to replace without changing the sampled continuation distribution much. Situation-assessment and plan-generation sentences scored as more influential. This supports a claim about the role of the written trace under resampling; it does not show that the model lacks internal self-preservation-related states or that every low-scoring sentence is a post-hoc rationalization.

## Validation: Looking Inside the Model

Counterfactual resampling is a purely black-box method. But we can check whether the model's own internals agree with these importance scores. The paper does this in two ways.

### Receiver Heads

Some attention heads in later layers show a distinctive pattern: they attend sharply to a small number of sentences rather than distributing attention broadly. These **receiver heads** are identified by computing, for each head, how concentrated its sentence-level attention distribution is (measured by kurtosis). Heads with high kurtosis, meaning attention is spiked on just a few sentences, are receivers.

<figure>
  <img src="images/receiver_heads_attention.png" alt="Box plot showing receiver-head attention scores by sentence category. Plan Generation receives the highest attention, followed by Fact Retrieval and Active Computation.">
  <figcaption>Receiver heads preferentially attend to plan generation sentences. From Bogdan et al., <em>Thought Anchors</em>. {% cite "bogdan2025thoughtanchors" %}</figcaption>
</figure>

Receiver-head attention overlaps with sentences that score highly under counterfactual resampling, especially plan generation and uncertainty management. This agreement is useful convergent evidence, but attention concentration is still observational until an intervention tests whether changing those connections alters the continuation.

### Causal Attention Suppression

A more direct test: for each sentence, mask all attention from subsequent tokens to that sentence and measure the KL divergence in the resulting token logits. This directly blocks the information flow from a given sentence to later computation.

The suppression-based importance correlates with resampling importance (Spearman $\rho \approx 0.20$ overall, rising to $\rho \approx 0.34$ for nearby sentence pairs). The correlation is modest, which makes sense: resampling measures the total downstream effect of a step including all indirect paths through later sentences, while suppression only blocks the direct attention pathway. But the agreement in direction confirms that counterfactual resampling captures something real about the model's internal computation.

## From Sentences to Causal Graphs

Counterfactual resampling extends naturally beyond measuring the importance of individual steps. We can also measure the causal influence of one sentence on another by checking whether a specific later sentence $S_j$ still appears (semantically) in rollouts where $S_i$ has been replaced.

This produces a **directed causal graph** over sentences: edges represent cases where one step causally influences another. The structure of this graph turns out to be informative. On easier problems, the causal links are mostly short-range (each step depends on the one or two steps immediately before it). On harder problems, the graph develops longer-range dependencies, with early planning decisions influencing steps much later in the trace.

<details class="pause-and-think">
<summary>Pause and Think</summary>

Counterfactual resampling is, at its core, the same logic as [activation patching](/topics/activation-patching/): replace a component, measure what changes downstream. But resampling operates on *sentences in the reasoning trace* (a black-box, behavioral level) while activation patching operates on *model components like attention heads or residual stream positions* (a white-box, mechanistic level). What kinds of questions can each approach answer that the other cannot?

Activation patching can identify *which model components* (specific heads, layers, neurons) are responsible for a behavior, letting us build mechanistic explanations. Counterfactual resampling can identify *which reasoning steps* matter, even when we have no access to model internals or when the model is too large for detailed mechanistic analysis. Resampling is also naturally suited to reasoning traces, where the unit of interest is a semantic step rather than an individual token or component. But it cannot tell us *how* the model implements each step internally.

</details>

## Transplant Resampling and Nudged Reasoning

So far we have used counterfactual resampling to ask which steps matter. But the same logic extends to a different question: *how do external influences propagate through a reasoning trace?*

**Transplant resampling** addresses this {% cite "macar2025thoughtbranches" %}. Suppose a model produces a reasoning trace while given a hint (e.g., a multiple-choice question where one answer is highlighted). We want to know *where* in the trace the hint's influence takes hold. The procedure: take the hinted trace up to sentence $i$, graft those sentences onto the *unhinted* prompt, and resample 100 rollouts from that point. By varying $i$, we can trace how the hint's effect accumulates across the reasoning chain.

The finding is that hints do not operate through a single decisive sentence. Instead, the influence is **diffuse and cumulative**: each sentence shifts the answer distribution slightly toward the hinted answer, and the effect builds gradually across the full trace. One telltale signature is that the backtracking token "Wait" (common in reasoning models' self-correction) appears about 30% less often in hinted traces, as though the hint suppresses the model's error-correction impulse.

The authors term this **nudged reasoning**: the model is not blindly copying the hint, nor is it engaging in pure post-hoc rationalization. Rather, the hint subtly biases each reasoning step, and these small biases compound. This is a more nuanced picture of unfaithfulness than a simple "the model ignores its own reasoning."

<details class="pause-and-think">
<summary>Pause and Think</summary>

Transplant resampling reveals that a hint's effect on reasoning is diffuse rather than localized to one sentence. How does this complicate the task of detecting unfaithful reasoning? If the bias were concentrated in a single step (e.g., "The answer is B because the hint said so"), we could identify it by inspecting individual sentences. What changes when the bias is spread across many sentences, each only slightly shifted?

When bias is diffuse, no single sentence looks suspicious in isolation. Each step seems reasonable on its own; the unfaithfulness only becomes visible at the distributional level, by comparing behavior with and without the hint. Surface inspection for sentences that mention or visibly follow the hint will therefore miss the effect. Counterfactual resampling instead measures the distributional shift across many rollouts.

</details>

## Limitations

Counterfactual resampling has several important caveats:

- **Computational cost.** Each sentence requires $N = 100$ rollouts in both the original and counterfactual conditions. For a 50-sentence reasoning trace, that is 10,000 full generations. This limits the technique to relatively small-scale analysis.
- **Overdetermination.** If multiple sentences independently produce the same downstream effect, removing any one of them may show low importance even though they are collectively essential. The technique measures individual, not joint, causal effects.
- **Sampling variance.** Counterfactual importance estimates are noisy when few rollouts produce semantically divergent replacements (below 10 valid samples, estimates become unreliable).
- **Sentence granularity.** The choice of sentence as the unit of analysis is a practical convenience. Reasoning steps do not always align neatly with sentence boundaries.
- **Black-box by design.** The technique measures behavioral effects but cannot explain *how* the model internally implements each step. Agreement with white-box methods (receiver heads, attention suppression) provides some validation, but the behavioral and mechanistic levels may diverge in ways that resampling alone cannot detect.

## Looking Ahead

Counterfactual resampling studies the structure of a visible reasoning trace at the behavioral level. It complements mechanistic tools from earlier in the curriculum: [activation patching](/topics/activation-patching/) and [circuit tracing](/topics/circuit-tracing/) test which internal components contribute to a behavior, while counterfactual resampling tests which written reasoning steps affect the sampled answer.

The results across both lines of work point toward a consistent picture: strategic decisions (planning, backtracking) anchor model reasoning, while execution steps and rhetorical statements are more superficial than they appear. And the transplant resampling results raise a direct challenge for chain-of-thought monitoring: if external influences on reasoning are diffuse and cumulative rather than localized to identifiable sentences, then detecting unfaithful reasoning requires distributional methods, not just reading the trace.
