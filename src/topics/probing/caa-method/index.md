---
title: "Contrastive Activation Addition (CAA)"
description: "How to compute robust steering vectors by averaging activation differences across many contrast pairs, isolating the shared direction corresponding to a target concept."
order: 2
prerequisites:
  - title: "The Linear Representation Hypothesis"
    url: "/topics/linear-representation-hypothesis/"
---

## From Single Pairs to Robust Directions

If concepts are linear directions in activation space, we can find them by computing the difference between activations for contrasting inputs. But a single contrast pair may capture noise alongside the target concept. If "Love" and "Hate" differ in ways beyond just sentiment -- perhaps one is longer, mentions specific topics, or triggers different positional patterns -- the resulting vector encodes those differences too.{% sidenote "This is the same problem that arises with any contrastive method built from few samples. The steering vector captures the full difference between two activations, not just the semantically meaningful part. Averaging over many pairs mitigates this by canceling out pair-specific noise." %}

This motivates a more robust approach: averaging over many contrast pairs to isolate the shared direction.

## The CAA Method

Panickssery et al. (2024) proposed **Contrastive Activation Addition (CAA)**: instead of one contrast pair, average the activation differences over *many* pairs {% cite "panickssery2024caa" %}:

$$
\mathbf{v} = \frac{1}{N} \sum_{i=1}^{N} \left( \mathbf{h}_i^{(+)} - \mathbf{h}_i^{(-)} \right)
$$

where $\mathbf{h}_i^{(+)}$ and $\mathbf{h}_i^{(-)}$ are the activations for the $i$-th positive and negative prompt.

Averaging cancels out noise specific to individual pairs. What remains is the **shared direction** corresponding to the target concept. If every positive prompt involves more sycophancy and every negative prompt involves less, the average difference vector points in the "sycophancy direction," with pair-specific artifacts washed out.

> **Contrastive Activation Addition (CAA):** A method for computing concept directions by averaging activation differences across many contrast pairs. The averaging process isolates the shared direction corresponding to the target concept while canceling pair-specific noise.

## The Procedure

1. **Construct many contrasting prompt pairs.** Each pair should differ primarily in the concept you want to probe. For sycophancy: pairs where one response agrees with the user and one disagrees. For honesty: pairs where one response is truthful and one is deceptive.

2. **Run all prompts through the model.** Collect residual stream activations at a chosen layer $\ell$ for both positive and negative prompts.

3. **Compute the mean difference:**

$$
\mathbf{v} = \frac{1}{N} \sum_{i=1}^{N} \left( \mathbf{h}_i^{(+)} - \mathbf{h}_i^{(-)} \right)
$$

4. **The result is a concept direction** -- a vector that points in the direction of the target concept in activation space.

<figure>
  <img src="images/caa-method-overview.png" alt="Diagram of CAA steering vector generation. A contrast pair with positive and negative examples is fed through the model. At layer n, residual stream activations are extracted for both examples. The difference between activations at the answer token position is computed, then averaged over many pairs to produce the final steering vector.">
  <figcaption>Steering vector generation in CAA. For each contrast pair, residual stream activations are extracted at layer n and differenced at the answer token position. Averaging over many pairs yields the final concept direction. From Panickssery et al., <em>Steering Llama 2 via Contrastive Activation Addition</em>. {%- cite "panickssery2024caa" -%}</figcaption>
</figure>

## Layer-Specific Effects

Not all layers are equally informative. Panickssery et al. found that **layers 15-17** in Llama 2 (7B and 13B) show the most significant concept separation. The pattern makes intuitive sense:

- **Early layers** are too close to token space. Representations are still input-specific, encoding surface-level features like token identity and position.
- **Late layers** are too committed to output. The model has already decided what to generate.
- **Middle layers** encode concepts in their most abstract form. This is where semantic directions are cleanest and most detectable.

<figure>
  <img src="images/caa-layer-sweep.png" alt="Per-layer CAA effect for Llama 2 7B Chat. The x-axis shows transformer layer number (0 to 31) and the y-axis shows the change in probability of answer-matching behavior. Positive steering (blue) peaks around layers 12-15 and negative steering (orange) shows a corresponding trough, with both effects concentrated in middle layers and near zero at early and late layers.">
  <figcaption>Per-layer steering effect in Llama 2 7B Chat across multiple behaviors. The effect peaks sharply in the middle layers (around 12-15) and is negligible at early and late layers. From Panickssery et al., <em>Steering Llama 2 via Contrastive Activation Addition</em>. {%- cite "panickssery2024caa" -%}</figcaption>
</figure>

## Applications: Sycophancy Detection

CAA was applied to probe **sycophancy** -- the tendency to agree with the user regardless of accuracy:

The computed sycophancy direction successfully distinguishes:
- Responses that agree with the user (even when wrong)
- Responses that provide truthful answers (even when contradicting the user)

This demonstrates that abstract behavioral tendencies like sycophancy have a linear geometric representation that can be detected and measured.

<details class="pause-and-think">
<summary>Pause and think: Designing contrast pairs</summary>

Suppose you want to find a direction corresponding to "formal vs. informal" writing style. How would you design the contrast pairs for CAA? What considerations would guide your choice of prompts?

For contrast pairs, you would want prompts that elicit the same content but differ in formality. Ask the same question with instructions to "respond formally" versus "respond casually." The key challenge is ensuring your pairs differ primarily in formality, not in content, length, or topic. You would want diverse topics and question types to ensure the averaged direction captures formality itself, not artifacts of specific domains.

</details>

## Additivity and Robustness

A key finding: CAA directions are **robust** and combine well with other methods:

- CAA + fine-tuning: the effects combine without interfering.
- CAA + few-shot prompting: prompting effects and probing effects are additive.
- Directions computed from different prompt sets for the same concept are highly correlated.

This suggests that CAA is capturing genuine geometric structure in the model's representations, not artifacts of specific prompt choices.{% sidenote "The robustness of CAA directions across prompt sets is important evidence that these directions correspond to real concepts, not noise. If the direction changed dramatically with different prompt pairs for the same concept, we would have less confidence that we were measuring something meaningful." %}

## Connection to Steering

Once you have computed a concept direction via CAA, that same direction can be used for [steering](/topics/addition-steering/). The direction that a linear classifier uses to *detect* a concept is the same direction you can *add* to induce that concept. CAA provides the **probing** half of representation engineering; [addition steering](/topics/addition-steering/) provides the **control** half.

<details class="pause-and-think">
<summary>Pause and think: How many pairs are enough?</summary>

CAA averages over many contrast pairs. But how many is "many"? What factors would influence the number of pairs needed for a reliable direction?

The number depends on how much pair-specific noise exists relative to the true concept signal. Concepts with clear, unambiguous manifestations (like language: English vs. French) might need fewer pairs. Subtle behavioral concepts (like sycophancy) where the manifestation varies by context might need more pairs to average out the variation. Empirically, studies have used anywhere from 50 to several hundred pairs. The diagnostic is consistency: if adding more pairs doesn't change the direction significantly, you likely have enough.

</details>

## Looking Forward

CAA provides a principled method for finding concept directions in activation space. The same methodology applies whether you're probing sentiment, sycophancy, honesty, or safety-relevant properties like [refusal](/topics/refusal-direction/). The directions computed via CAA form the foundation for both understanding what models represent and [controlling how they behave](/topics/addition-steering/).
