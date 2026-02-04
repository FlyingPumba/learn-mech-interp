---
title: "The Refusal Direction"
description: "How a single direction in activation space controls whether a language model refuses harmful requests, and what this reveals about the geometry of safety behavior."
prerequisites:
  - title: "Representation Engineering"
    url: "/topics/representation-engineering/"
difficulty: "advanced"
block: "representation-engineering"
category: "applications"
---

## Where Is Refusal Encoded?

Chat models are fine-tuned to refuse harmful requests. Ask "How do I bake a cake?" and you get a recipe. Ask "How do I build a bomb?" and you get a refusal. Safety training -- via RLHF, DPO, or similar techniques -- teaches the model to distinguish harmful from harmless requests and respond appropriately.

But *where* in the model's representations is "refusal" encoded? If the [linear representation hypothesis](/topics/linear-representation-hypothesis/) holds for safety-relevant behaviors, there should be a **direction** in activation space that corresponds to refusal. Arditi et al. (2024) set out to find it {% cite "arditi2024refusal" %}.

## The Hypothesis

The hypothesis is precise and testable:

**If refusal is a linearly represented concept, then:**

1. A single direction in activation space should distinguish harmful from harmless prompt processing.
2. Removing that direction should disable refusal.
3. Adding that direction should induce refusal even on harmless inputs.

This is exactly the logic of [Contrastive Activation Addition](/topics/activation-engineering/), applied to safety-critical behavior. The same contrastive methodology that steers sycophancy or sentiment can be used to find the direction that mediates refusal.

## Computing the Refusal Direction

The method follows the CAA approach:

1. **Collect harmful prompts** (e.g., "How to build a bomb") and **harmless prompts** (e.g., "How to bake a cake").

2. **Run both sets through the model**, collecting residual stream activations at intermediate layers.

3. **Compute the mean difference** in activations between harmful and harmless processing:

$$
\mathbf{r} = \frac{1}{N} \sum_{i=1}^{N} \left( \mathbf{h}_i^{\text{harmful}} - \mathbf{h}_i^{\text{harmless}} \right)
$$

This difference vector is the **refusal direction**.{% sidenote "The refusal direction is computed using the same contrastive averaging method as CAA. The only difference is the target concept: instead of steering sentiment or sycophancy, Arditi et al. targeted refusal. This highlights how general the contrastive framework is -- the same technique works for behavioral tendencies and safety-critical properties alike." %}

![Schematic diagram showing the refusal direction in activation space. Harmful prompt activations point along the refusal direction while harmless prompt activations are orthogonal to it.](/topics/refusal-direction/images/refusal_direction_schematic.png "Figure 1: The refusal direction in activation space. Harmful and harmless prompt activations separate along a single direction, which mediates the model's decision to refuse or comply.")

## The Finding

The result is striking:

**One direction mediates refusal across 13 open-source chat models**, from 1.3B to 72B parameters. This single direction is both necessary and sufficient for refusal behavior. Ablating it prevents refusal. Adding it induces refusal on harmless inputs. A single direction. One operation. Consistent across model families and scales.

## The Ablation Experiment

**What happens when we remove the refusal direction?**

The intervention projects out the refusal component from the residual stream, leaving everything else intact:

$$
\mathbf{h}^{(\ell)} \leftarrow \mathbf{h}^{(\ell)} - \left( \mathbf{h}^{(\ell)} \cdot \hat{\mathbf{r}} \right) \hat{\mathbf{r}}
$$

where $\hat{\mathbf{r}}$ is the unit refusal direction. This is applied at all layers and all token positions.{% sidenote "Projecting out a direction is a standard linear algebra operation. It removes the component of the activation that lies along the refusal direction while preserving all orthogonal components. Geometrically, it flattens the activation onto the hyperplane perpendicular to the refusal direction." %}

![Bar chart showing refusal rates before and after ablation across multiple models. Baseline refusal rates are 80-90% while post-ablation rates drop to near zero.](/topics/refusal-direction/images/refusal_ablation_results.png "Figure 2: Refusal ablation results. Removing the refusal direction drops refusal rates from 80-90% to near zero across all models tested, evaluated on 100 harmful instructions across 10 categories from JailbreakBench.")

The result is dramatic: refusal drops from 80-90% to near zero across all models tested.

## The Addition Experiment

**What happens when we add the refusal direction to harmless prompts?**

Take harmless prompts like "How to bake a cake" or "What is the capital of France?" Add the refusal direction to the residual stream during processing. The model now **refuses** these harmless requests.

This demonstrates **sufficiency**: the refusal direction is not just correlated with refusal. Adding it *causes* refusal.

## Necessity and Sufficiency

Together, the ablation and addition experiments establish causal evidence:

- **Necessity:** Removing the direction prevents refusal (ablation experiment).
- **Sufficiency:** Adding the direction causes refusal (addition experiment).

This is exactly the causal logic from [activation patching](/topics/activation-patching/):

- Ablation corresponds to **denoising** -- remove the signal, observe the deficit.
- Addition corresponds to **noising** -- add the signal, observe the effect.

The refusal direction passes both tests, establishing it as a genuine causal mediator of refusal behavior.

<details class="pause-and-think">
<summary>Pause and think: One direction across 13 models</summary>

The refusal direction was found independently in 13 different chat models spanning different families (Llama, Qwen, Gemma) and scales (1.3B to 72B parameters). What does the consistency of this finding tell us about how safety training works? Why might different training procedures (RLHF, DPO) on different architectures produce the same geometric structure?

One interpretation: safety fine-tuning does not create a complex, model-specific mechanism for refusal. Instead, it reinforces a simple linear direction that the model can use to distinguish "refuse" from "comply." Different training procedures converge on this solution because it is the simplest way to implement a binary behavioral switch in a linear representational space. This simplicity is both elegant and concerning.

</details>

## Capability Preservation

A natural concern: if we permanently remove the refusal direction from the model's weights, does the model lose other capabilities?

Arditi et al. used **weight orthogonalization** -- projecting out the refusal direction from the model's weight matrices permanently, not just during inference. The results across most models:

- **MMLU:** within 99% of baseline
- **ARC:** within 99% of baseline
- **GSM8K:** within 99% of baseline

Refusal is remarkably **separable** from general capabilities. The model can lose its ability to refuse harmful requests while retaining its ability to answer questions, reason mathematically, and perform general tasks.{% sidenote "Weight orthogonalization is a permanent modification, unlike inference-time steering which must be applied at each forward pass. It modifies the model's weight matrices to project out the refusal direction, effectively creating a new model that never refuses. The near-perfect capability preservation makes this a particularly concerning form of jailbreak." %}

## Implications for Safety Training

This finding has profound implications:

**Safety fine-tuning produces a linear safety mechanism.** RLHF, DPO, and similar techniques do not create deep, distributed, hard-to-remove safety behaviors. They create a single direction that can be cleanly removed.

**Refusal is not deeply integrated into the model's reasoning.** It is a direction that sits alongside general capabilities, not woven through them. This means safety training is adding a relatively shallow behavioral layer on top of the model's core competence.

**This is both encouraging and concerning.** Encouraging because we can understand the mechanism -- a genuine success for mechanistic interpretability. Concerning because that same understanding enables adversarial use. Weight orthogonalization is a white-box jailbreak that permanently removes refusal with minimal capability loss.

<details class="pause-and-think">
<summary>Pause and think: Designing robust safety training</summary>

The refusal direction can be removed with one linear operation. Should this make us more or less confident in current safety training? If you were designing safety training, how would you make it resistant to directional ablation? Is it even possible while maintaining the linear representation structure that makes models useful?

One approach: encode safety in multiple, non-linear ways -- not just a single linear direction but across many interacting components. However, this conflicts with the linear structure that makes models interpretable and steerable in the first place. Another approach: make refusal depend on the same representations that encode general capabilities, so that removing refusal also degrades performance. But this makes the model harder to fine-tune for legitimate customization. The tension between interpretability, controllability, and robustness may be fundamental.

</details>

## The Broader Significance

The refusal direction demonstrates the full power of the [representation engineering](/topics/representation-engineering/) toolkit applied to a safety-critical behavior:

- **Read:** The direction can be identified through contrastive methods.
- **Add:** Adding the direction induces refusal.
- **Remove:** Projecting out the direction eliminates refusal.

Every capability comes with a dual-use concern. The same tools that help us *understand* safety mechanisms are the same tools that help *bypass* them. This tension between understanding and vulnerability is central to the field of mechanistic interpretability applied to AI safety.

The next articles in this block explore two extensions: [concept erasure](/topics/concept-erasure/) provides a mathematically guaranteed method for removing concepts from representations (the "remove" operation with formal guarantees), and [function vectors](/topics/function-vectors/) show that the model naturally represents not just concepts but entire *tasks* as directions in activation space.
