---
title: "Ablation Steering"
description: "Projecting a concept direction out of model activations, measuring which behaviors disappear, and distinguishing causal evidence from complete erasure."
order: 2
prerequisites:
  - title: "Addition Steering"
    url: "/topics/addition-steering/"
---

## The Complement to Addition

[Addition steering](/topics/addition-steering/) asks what happens when we add a concept direction. The complementary intervention removes that direction: does the associated behavior weaken or disappear?

**Ablation steering** projects a direction out of the residual stream. If the measured behavior falls, the result is evidence that information along that direction participates causally in the behavior. Redundancy, reconstruction, and off-target effects keep this from being an unconditional necessity proof.

> **Ablation Steering:** The inference-time modification of a model's internal activations by projecting out a concept direction from the residual stream. This removes the component of the activation that lies along the concept direction, disabling behaviors that depend on that direction.

## The Projection Operation

To ablate a direction $\mathbf{r}$ from an activation $\mathbf{h}$, we project onto the orthogonal complement:

$$
\mathbf{h}' = \mathbf{h} - \left( \mathbf{h} \cdot \hat{\mathbf{r}} \right) \hat{\mathbf{r}}
$$

where $\hat{\mathbf{r}}$ is the unit vector in the direction to ablate.{% sidenote "Projecting out a direction is a standard linear algebra operation. It removes the component of the activation that lies along the target direction while preserving all orthogonal components. Geometrically, it flattens the activation onto the hyperplane perpendicular to the ablated direction." %}

This operation:
- Removes all information along direction $\mathbf{r}$
- Preserves all information orthogonal to $\mathbf{r}$
- Is applied at every layer and token position during the forward pass

## Application: Disabling Refusal

The most dramatic demonstration of ablation steering targets the [refusal direction](/topics/refusal-direction/) {% cite "arditi2024refusal" %}. Chat models are trained to refuse harmful requests. But where is "refusal" encoded?

Arditi et al. computed the refusal direction using [CAA](/topics/caa-method/), the mean difference between activations on harmful versus harmless prompts. Then they ablated this direction during inference.

Across the tested models, directional ablation reduced refusal rates from 80–90% to near zero.

![Bar chart showing refusal rates before and after ablation across multiple models. Baseline refusal rates are 80-90% while post-ablation rates drop to near zero.](/topics/refusal-direction/images/refusal_ablation_results.png "Figure 1: Refusal ablation results. Removing the refusal direction drops refusal rates from 80-90% to near zero across all models tested.")

Across those models and evaluations, one projection removes most measured refusal. The result is both a useful mechanistic clue and a warning that refusal behavior may be easier to bypass than broad capability benchmarks reveal.

## Necessity and Sufficiency Together

Ablation and [addition](/topics/addition-steering/) together establish causal evidence:

| Experiment | Operation | Result | Demonstrates |
|------------|-----------|--------|--------------|
| Addition | Add direction to harmless inputs | Model refuses harmless requests | **Sufficiency** |
| Ablation | Remove direction from harmful inputs | Model complies with harmful requests | **Necessity** |

The logic resembles [activation patching](/topics/activation-patching/), but the vocabulary does not map directly. Noising and denoising exchange naturally occurring activations between paired runs; addition and ablation construct new activations by translating or projecting them.

A direction that passes both tests is a strong candidate causal mediator for the tested behavior. The tests do not establish that it is the only mediator or that the intervention changes nothing else.

<details class="pause-and-think">
<summary>Pause and think: One direction across many models</summary>

The refusal direction was found independently in 13 different chat models spanning different families (Llama, Qwen, Gemma) and scales (1.3B to 72B parameters). What does the consistency of this finding tell us about how safety training works?

One interpretation: safety fine-tuning does not create a complex, model-specific mechanism for refusal. Instead, it reinforces a simple linear direction that the model uses to distinguish "refuse" from "comply." Different training procedures converge on this solution because it is the simplest way to implement a binary behavioral switch in a linear representational space. This simplicity is both elegant and concerning.

</details>

## Capability Preservation

A natural concern: if we ablate a direction, does the model lose other capabilities?

Arditi et al. tested this by permanently projecting out the refusal direction from model weights (not just during inference). The results:

- **MMLU:** within 99% of baseline
- **ARC:** within 99% of baseline
- **GSM8K:** within 99% of baseline

On MMLU, ARC, and GSM8K, measured capability remains close to baseline while refusal collapses. This shows separation on those benchmarks, not preservation of every capability or every safety-relevant behavior.{% sidenote "Weight orthogonalization permanently changes the checkpoint, unlike an inference-time hook. A benchmark result describes the tested distribution; it does not show that the modified model never refuses or that all off-target effects have been ruled out." %}

## Inference-Time vs. Permanent Ablation

Ablation can be applied in two ways:

**Inference-time ablation:** Project out the direction during each forward pass. Reversible, stop applying the intervention and the behavior returns.

**Weight orthogonalization:** Modify the model's weight matrices to permanently project out the direction. Creates a new model checkpoint with the behavior permanently disabled.

Both reduce refusal, but weight orthogonalization creates a permanently modified model that can be distributed.

<details class="pause-and-think">
<summary>Pause and think: When ablation fails</summary>

Ablation assumes that a behavior is mediated by a single linear direction. Under what circumstances might ablation fail to disable a behavior?

Ablation would fail if the behavior is encoded redundantly across multiple directions, or if later layers can reconstruct the ablated information from other signals. It would also fail if the behavior does not have a clean linear representation, if it is distributed across many interacting components rather than concentrated in one direction. For robust erasure with formal guarantees, see [concept erasure with LEACE](/topics/concept-erasure/).

</details>

## The Geometric Picture

Ablation has a clean geometric interpretation:

![Illustration of ablation in activation space. The original activation h is projected onto the hyperplane orthogonal to the ablated direction r, removing the component along r.](/topics/ablation-steering/images/ablation_geometry.svg "Figure 2: Ablation projects the activation onto the hyperplane orthogonal to the ablated direction, removing all information along that direction.")

The original activation $\mathbf{h}$ has some component along the ablated direction $\mathbf{r}$. Projection removes exactly that component, flattening the activation onto the orthogonal hyperplane. All other information is preserved.

## Comparison to Addition

| Property | Addition Steering | Ablation Steering |
|----------|------------------|-------------------|
| Operation | $\mathbf{h}' = \mathbf{h} + \alpha \mathbf{v}$ | $\mathbf{h}' = \mathbf{h} - (\mathbf{h} \cdot \hat{\mathbf{r}})\hat{\mathbf{r}}$ |
| Effect | Induces behavior | Disables behavior |
| Demonstrates | Sufficiency | Necessity |
| Reversibility | Trivial (set $\alpha = 0$) | Trivial (stop projecting) |
| Intensity control | Scaling factor $\alpha$ | Binary (project or not) |

Addition exposes an explicit strength parameter. Full directional ablation removes the measured component, although partial projection is also possible and downstream behavioral effects need not be binary.

## Connection to the Toolkit

Ablation steering completes the core operations on concept directions:

- **Read** with [LAT](/topics/lat-probing/) and [CAA](/topics/caa-method/), detect what concepts are encoded.
- **Add** with [addition steering](/topics/addition-steering/), steer behavior toward a concept.
- **Remove** with ablation steering, eliminate a concept's influence.

For applications requiring *guaranteed* erasure, where even a sufficiently powerful non-linear classifier should not be able to recover the concept, see [concept erasure with LEACE](/topics/concept-erasure/).
