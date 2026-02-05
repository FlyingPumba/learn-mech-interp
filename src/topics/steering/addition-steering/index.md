---
title: "Addition Steering"
description: "How adding carefully computed steering vectors to model activations during inference can shift model behavior without any fine-tuning."
order: 1
prerequisites:
  - title: "Contrastive Activation Addition (CAA)"
    url: "/topics/caa-method/"
---

## From Reading to Control

[Probing methods](/topics/caa-method/) identify directions in activation space that correspond to concepts. But what happens if we *add* those directions during inference? Can we steer model behavior by intervening directly on the residual stream?

This is the idea behind **addition steering** -- modifying a model's internal activations during inference to control its outputs {% cite "turner2024steering" %}. Unlike fine-tuning (which modifies weights) or prompting (which modifies inputs), addition steering intervenes directly on internal representations during the forward pass. No training. No gradient computation. Just vector addition during inference.

> **Addition Steering:** The inference-time modification of a model's internal activations by adding a steering vector to the residual stream. The vector is added at a chosen layer during the forward pass, shifting the model's behavior toward a target concept without modifying the model's weights.

The technique builds on a simple but powerful insight: if the residual stream is a linear communication channel, and if concepts are linear directions in activation space (as the [linear representation hypothesis](/topics/linear-representation-hypothesis/) predicts), then *adding a direction should steer the model toward that concept*.

## The ActAdd Method

Turner et al. (2024) introduced **ActAdd** (Activation Addition), the simplest version of addition steering {% cite "turner2024steering" %}. The recipe has four steps:

1. **Choose two contrasting prompts.** For example, "Love" and "Hate." These should differ primarily in the concept you want to steer toward.

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

## Controlling Direction and Intensity

The parameter $\alpha$ controls both direction and intensity:

- $\alpha > 0$: steer toward the positive prompt (e.g., more "Love")
- $\alpha < 0$: steer toward the negative prompt (e.g., more "Hate")
- $\alpha = 0$: no intervention (original model behavior)

This bidirectionality is powerful. A single steering vector enables both amplification and suppression of a concept, depending on the sign of $\alpha$.

## Key Properties

**Lightweight.** No training, no optimization, no backward pass. Only forward passes to compute the steering vector, then simple addition during inference.

**Data-efficient.** Works with a single contrast pair -- as few as 2 prompts. For more robust steering, use directions computed via [CAA](/topics/caa-method/).

**Preserves off-target performance.** Steering sentiment does not break factuality or general capabilities. The intervention is targeted to the concept direction.

**Natural-language interface.** The steering direction is specified through text prompts, not learned parameters.

<details class="pause-and-think">
<summary>Pause and think: Why middle layers?</summary>

Addition steering is most effective at middle layers (roughly layers 15-17 in Llama 2). Why might early or late layers be less effective for steering?

Early layers are too close to token space -- representations are still input-specific, encoding surface-level features. Steering here would interfere with basic processing. Late layers are too committed to output -- the model has already decided what to generate, and interventions are too late to change the trajectory. Middle layers encode concepts in their most abstract, modifiable form, making them the sweet spot for steering.

</details>

## Application: Inducing Behavior

Addition steering can induce behaviors that the model would not normally exhibit:

**Sycophancy steering:** Add the sycophancy direction (computed via [CAA](/topics/caa-method/)) and the model agrees with the user even when the user is wrong.

**Sentiment steering:** Add a "positive sentiment" direction and responses become more optimistic and cheerful.

**Refusal induction:** Add the [refusal direction](/topics/refusal-direction/) to harmless prompts and the model refuses to answer even benign questions like "What is the capital of France?"{% sidenote "The refusal induction experiment is particularly striking. It demonstrates *sufficiency*: adding the refusal direction *causes* refusal, not just correlates with it. This is strong causal evidence that the direction genuinely mediates the behavior." %}

The refusal induction experiment demonstrates **sufficiency**: adding a direction *causes* the associated behavior. This is the complement to [ablation](/topics/ablation-steering/), which demonstrates **necessity** by showing that removing a direction prevents the behavior.

## Additivity with Other Methods

A key finding: **steering stacks additively** with other methods:

- Addition steering + fine-tuning: the effects combine without interfering.
- Addition steering + few-shot prompting: prompting effects and steering effects add together.
- MMLU scores (a proxy for general capabilities) remain largely intact after steering.

This suggests that steering operates in a direction somewhat orthogonal to general capabilities. You can shift the model's behavioral tendencies without breaking its underlying competence.{% sidenote "The additivity result has practical implications. It means steering vectors could be combined with standard alignment techniques like RLHF or DPO, providing an additional control channel that works at inference time rather than training time." %}

## The Geometric Picture

Addition steering has a clean geometric interpretation:

![Illustration of addition steering in activation space. The original activation h is shifted by adding the steering vector v, resulting in a new activation h' that is closer to the target concept region.](/topics/addition-steering/images/addition_steering_geometry.png "Figure 1: Addition steering shifts the activation from its original position toward the target concept by adding the steering vector.")

The residual stream activation $\mathbf{h}$ is a point in high-dimensional space. Adding a steering vector $\mathbf{v}$ translates that point along the concept direction. The translated point $\mathbf{h}' = \mathbf{h} + \alpha \mathbf{v}$ is closer to (or further from, depending on $\alpha$) the region of activation space associated with the target concept.

<details class="pause-and-think">
<summary>Pause and think: Designing a steering experiment</summary>

Suppose you want to steer a model to be more concise in its responses. How would you design the contrast pairs? What positive and negative prompts would you use? What layer range would you try first?

For contrast pairs, you might use prompts that elicit verbose responses (positive = concise, negative = verbose): ask the same question with instructions to "explain briefly" versus "explain in detail." You would start with middle layers since that is where abstract behavioral tendencies are encoded. The key challenge is ensuring your pairs differ primarily in verbosity, not in content quality or accuracy.

</details>

## Limitations

Addition steering assumes **linearity**: that concepts are directions and that adding those directions has consistent effects. This assumption fails for:

- **Context-dependent behaviors.** "Be helpful" might mean different things in different situations. A single direction cannot capture this context-dependence.
- **Conditional logic.** Behaviors like "be honest unless honesty would cause serious harm" are inherently non-linear.
- **Interference effects.** Steering strongly in one direction may have unintended effects on related concepts.

For behaviors that resist single-direction steering, more sophisticated interventions may be needed.

## Connection to the Toolkit

Addition steering is one of three fundamental operations on concept directions:

- **Read** with [LAT](/topics/lat-probing/) and [CAA](/topics/caa-method/) -- detect what concepts are encoded.
- **Add** with addition steering -- steer behavior toward a concept.
- **Remove** with [ablation](/topics/ablation-steering/) -- eliminate a concept's influence.

Together, these operations form a principled framework for understanding and controlling model representations. Addition demonstrates *sufficiency* (adding the direction causes the behavior), while [ablation](/topics/ablation-steering/) demonstrates *necessity* (removing the direction prevents the behavior).
