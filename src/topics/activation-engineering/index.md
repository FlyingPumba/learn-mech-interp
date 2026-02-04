---
title: "Activation Engineering: ActAdd and Contrastive Activation Addition"
description: "How adding carefully computed steering vectors to model activations during inference can shift model behavior without any fine-tuning."
prerequisites:
  - title: "SAE Variants, Evaluation, and Honest Limitations"
    url: "/topics/sae-variants-and-evaluation/"
difficulty: "advanced"
block: "representation-engineering"
category: "methods"
---

## From Feature Clamping to Steering Vectors

Golden Gate Claude demonstrated something remarkable: clamping a single SAE feature could make a model weave the Golden Gate Bridge into every response. But that approach requires a trained sparse autoencoder. What if we could steer model behavior *without* an SAE, by intervening directly on the residual stream?

This is the idea behind **activation engineering** -- modifying a model's internal activations during inference to control its outputs {% cite "turner2024steering" %}. Unlike fine-tuning (which modifies weights) or prompting (which modifies inputs), activation engineering intervenes directly on internal representations during the forward pass. No training. No gradient computation. Just vector addition during inference.

> **Activation Engineering:** The inference-time modification of a model's internal activations to control its outputs. A steering vector $\mathbf{v}$ is added to the residual stream at a chosen layer during the forward pass, shifting the model's behavior toward a target concept without modifying the model's weights.

The technique builds on a simple but powerful insight: if the residual stream is a linear communication channel, and if concepts are linear directions in activation space (as the [linear representation hypothesis](/topics/linear-representation-hypothesis/) predicts), then *adding a direction should steer the model toward that concept*.

## The ActAdd Method

Turner et al. (2024) introduced **ActAdd** (Activation Addition), the simplest version of activation engineering {% cite "turner2024steering" %}. The recipe has four steps:

1. **Choose two contrasting prompts.** For example, "Love" and "Hate." These should differ primarily in the concept you want to steer.

2. **Run both through the model.** Collect residual stream activations at a chosen layer $\ell$.

3. **Compute the difference.** Subtract the negative activation from the positive activation. This difference is the **steering vector**:

$$
\mathbf{v} = \mathbf{h}^{(+)}_\ell - \mathbf{h}^{(-)}_\ell
$$

4. **Add during generation.** At each forward pass, add the steering vector to the residual stream at layer $\ell$:

$$
\mathbf{h}'_\ell = \mathbf{h}_\ell + \alpha \cdot \mathbf{v}
$$

where $\alpha$ controls the steering strength.{% sidenote "The scaling factor $\\alpha$ plays a critical role. Too small, and the steering has no effect. Too large, and the model produces incoherent text. Typical values range from 1 to 15 depending on the model and concept. The sweet spot must be found empirically." %}

The parameter $\alpha$ controls both direction and intensity:

- $\alpha > 0$: steer toward the positive prompt (e.g., more "Love")
- $\alpha < 0$: steer toward the negative prompt (e.g., more "Hate")
- $\alpha = 0$: no intervention (original model behavior)

**Key properties of ActAdd:**

- **Lightweight.** No training, no optimization, no backward pass. Only forward passes to compute the steering vector.
- **Data-efficient.** Works with a single contrast pair -- as few as 2 prompts.
- **Preserves off-target performance.** Steering sentiment does not break factuality or general capabilities.
- **Natural-language interface.** The steering direction is specified through text, not learned parameters.

## The Limitation of Single Pairs

A single contrast pair may capture noise alongside the target concept. If "Love" and "Hate" differ in ways beyond just sentiment -- perhaps one is longer, mentions specific topics, or triggers different positional patterns -- the steering vector encodes those differences too.{% sidenote "This is the same problem that arises with any contrastive method built from few samples. The steering vector captures the full difference between two activations, not just the semantically meaningful part. Averaging over many pairs mitigates this by canceling out pair-specific noise." %}

This motivates a more robust approach: averaging over many contrast pairs to isolate the shared direction.

## Contrastive Activation Addition (CAA)

Panickssery et al. (2024) proposed **Contrastive Activation Addition (CAA)**: instead of one contrast pair, average the activation differences over *many* pairs {% cite "panickssery2024caa" %}:

$$
\mathbf{v} = \frac{1}{N} \sum_{i=1}^{N} \left( \mathbf{h}_i^{(+)} - \mathbf{h}_i^{(-)} \right)
$$

where $\mathbf{h}_i^{(+)}$ and $\mathbf{h}_i^{(-)}$ are the activations for the $i$-th positive and negative prompt.

Averaging cancels out noise specific to individual pairs. What remains is the **shared direction** corresponding to the target concept. If every positive prompt involves more sycophancy and every negative prompt involves less, the average difference vector points in the "sycophancy direction," with pair-specific artifacts washed out.

### Layer-Specific Effects

Not all layers are equally effective for steering. Panickssery et al. found that **layers 15-17** in Llama 2 (7B and 13B) show the most significant steering influence. The pattern makes intuitive sense:

- **Early layers** are too close to token space. Representations are still input-specific, encoding surface-level features like token identity and position.
- **Late layers** are too committed to output. The model has already decided what to generate, and interventions are too late to change the trajectory.
- **Middle layers** encode concepts in their most abstract, modifiable form. This is where semantic directions are cleanest and steering is most effective.

### Sycophancy Steering

CAA was applied to steer **sycophancy** -- the tendency to agree with the user regardless of accuracy:

- **Sycophancy vector added:** The model agrees with the user even when the user is wrong ("You're right, the Earth is flat").
- **Sycophancy vector subtracted:** The model provides truthful answers even when they contradict the user. TruthfulQA performance improves.

This is a concrete demonstration that abstract behavioral tendencies like sycophancy have a linear geometric representation that can be manipulated.

### Additivity and Capability Preservation

A key finding: **steering stacks additively** with other methods:

- CAA + fine-tuning: the effects combine without interfering.
- CAA + few-shot prompting: prompting effects and steering effects add together.
- MMLU scores (a proxy for general capabilities) remain largely intact after steering.

This suggests that steering operates in a direction somewhat orthogonal to general capabilities. You can shift the model's behavioral tendencies without breaking its underlying competence.{% sidenote "The additivity result has practical implications. It means steering vectors could be combined with standard alignment techniques like RLHF or DPO, providing an additional control channel that works at inference time rather than training time." %}

<details class="pause-and-think">
<summary>Pause and think: Risks of linear steering</summary>

ActAdd requires just one contrast pair. CAA averages over many. Both produce a single steering vector -- a single direction in activation space. What are the risks of relying on a *linear* steering direction? Can you think of a behavior where a single direction would be insufficient?

Consider behaviors that are context-dependent. "Be helpful" might mean different things in different situations: providing detailed technical explanations for an expert versus simple summaries for a child. A single steering direction cannot capture this context-dependence. Behaviors that require conditional logic -- "be honest unless honesty would cause serious harm" -- are inherently non-linear and may resist single-direction steering.

</details>

## The Method Landscape

![Comparison of steering methods showing ActAdd (single contrast pair), CAA (multiple pairs averaged), and RepE (the broader framework encompassing both). ActAdd is simplest but noisiest; CAA is more robust; RepE adds representation reading to representation control.](/topics/activation-engineering/images/steering_method_comparison.png "Figure 1: Comparison of steering methods. ActAdd uses a single contrast pair; CAA averages over many pairs for robustness; RepE provides the theoretical framework unifying these techniques.")

ActAdd and CAA are specific techniques for computing steering vectors. But they are part of a broader paradigm -- [representation engineering](/topics/representation-engineering/) -- that provides the theoretical framework for both reading and controlling model representations.

<details class="pause-and-think">
<summary>Pause and think: Designing a steering experiment</summary>

Suppose you want to steer a model to be more concise in its responses. How would you design the contrast pairs for a CAA experiment? What positive and negative prompts would you use? What layer range would you try first, and why?

For contrast pairs, you might use prompts that elicit verbose responses (positive = concise, negative = verbose): ask the same question with instructions to "explain briefly" versus "explain in detail." You would start with middle layers (roughly one-third to one-half of the total depth) since that is where abstract behavioral tendencies are encoded. The key challenge is ensuring your pairs differ primarily in verbosity, not in content quality or accuracy.

</details>

## Looking Forward

Activation engineering demonstrates that the [linear representation hypothesis](/topics/linear-representation-hypothesis/) is not merely theoretical -- it is an **actionable tool**. If concepts are linear directions, we can compute them from contrastive examples and add them during inference.{% sidenote "The connection to the linear representation hypothesis is direct. If concepts were encoded non-linearly -- in complex, distributed patterns that do not form consistent directions -- then adding a fixed vector would not produce consistent behavioral shifts. The fact that it works is evidence that the linear representation hypothesis holds for many high-level behavioral concepts, not just low-level features." %}

But steering is only one piece of the puzzle. [Representation engineering](/topics/representation-engineering/) provides the broader framework: not just controlling behavior, but *reading* what concepts a model represents. And the [refusal direction](/topics/refusal-direction/) shows what happens when we apply these tools to safety-critical behavior.
