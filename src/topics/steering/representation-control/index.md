---
title: "Representation Control"
description: "The unified framework for steering model behavior through interventions on internal representations, encompassing addition and ablation as complementary operations."
order: 3
prerequisites:
  - title: "Ablation Steering"
    url: "/topics/ablation-steering/"
---

## The Control Framework

[Addition steering](/topics/addition-steering/) and [ablation steering](/topics/ablation-steering/) are specific techniques. But they are part of a broader paradigm: **representation control** -- the systematic manipulation of model behavior through interventions on internal representations.

Zou et al. (2023) formalized this paradigm as part of Representation Engineering (RepE) {% cite "zou2023repe" %}. The key insight is that [probing methods](/topics/lat-probing/) and control methods are two sides of the same coin. The direction that a linear classifier uses to *detect* a concept is the same direction you *add* to induce that concept, or *project out* to eliminate it.

> **Representation Control:** The use of concept directions identified through probing to systematically control model behavior. Control operations include addition (to induce behaviors) and ablation (to disable behaviors), both operating on the same geometric structure revealed by probing.

## Reading and Control: Two Sides of One Coin

The framework unifies three capabilities:

1. **Read:** What does the model represent? ([CAA](/topics/caa-method/), [LAT](/topics/lat-probing/))
2. **Control:** How can we steer it? ([Addition](/topics/addition-steering/), [Ablation](/topics/ablation-steering/))
3. **Analyze:** What does the intervention tell us about the model?

This unification is important because it connects the *diagnostic* question (what does the model encode?) with the *interventional* question (can we change it?).

A concept direction that reads well but steers poorly suggests the representation is correlated with but not causal for the behavior. A direction that steers well but reads poorly suggests the intervention works through a mechanism we do not yet understand.

## The Geometric Operations

Each operation corresponds to a fundamental geometric operation on activation space:

| Operation | Geometric Effect | Purpose |
|-----------|------------------|---------|
| **Reading** | Project onto direction | Detect if concept is present |
| **Addition** | Translate along direction | Induce the concept |
| **Ablation** | Project onto orthogonal complement | Remove the concept |

These are the three basic linear operations on a one-dimensional subspace (a direction). Reading projects the activation onto the subspace to measure its component. Addition translates along the subspace to shift toward the concept. Ablation projects onto the orthogonal complement to eliminate the concept.{% sidenote "The geometric perspective is illuminating. In a high-dimensional activation space, a concept direction defines a one-dimensional subspace. Reading, addition, and ablation are the three fundamental linear operations on this subspace. More sophisticated operations (like those in LEACE) extend this geometry to higher-dimensional subspaces." %}

## Safety Applications

Representation control enables both understanding and manipulating safety-relevant properties:

- **Honesty.** Read whether the model's representations encode truthfulness, then steer toward honesty. The honesty direction can distinguish when a model "knows" it is generating false information.

- **Harmlessness.** Detect tendencies to generate harmful content, then control them. The harmlessness direction separates harmful from harmless response trajectories.

- **Sycophancy.** Identify the direction that encodes "agree with the user regardless of accuracy," then ablate or reverse it to promote truthfulness.

- **Refusal.** The [refusal direction](/topics/refusal-direction/) is the most striking example -- one direction mediates safety-critical refusal behavior across 13 models.

## Causal Validation

Representation control provides a methodology for establishing causal claims about model behavior:

1. **Identify the direction** via probing ([CAA](/topics/caa-method/), [LAT](/topics/lat-probing/)).
2. **Test sufficiency** via [addition](/topics/addition-steering/): does adding the direction cause the behavior?
3. **Test necessity** via [ablation](/topics/ablation-steering/): does removing the direction prevent the behavior?

A direction that passes both tests is a genuine causal mediator. This is the same logic as [activation patching](/topics/activation-patching/), but applied to concept directions rather than individual components.

<details class="pause-and-think">
<summary>Pause and think: The limits of linear control</summary>

Representation control assumes that high-level behavioral concepts are represented as linear directions in activation space. Under what circumstances might this assumption fail? What kinds of behaviors might resist linear control?

The assumption likely fails for behaviors that are highly context-dependent or compositional. "Be helpful" might require different strategies in different contexts, making it difficult to capture with a single direction. Similarly, behaviors defined by the *absence* of something (e.g., "do not discuss topic X") may not have clean linear representations. Conditional behaviors ("be honest unless X") are inherently non-linear.

</details>

## Combining Operations

Representation control operations can be combined:

- **Add multiple directions** to induce multiple behaviors simultaneously.
- **Ablate one direction while adding another** to replace one behavior with a different one.
- **Layer-specific interventions** to target where concepts are most malleable.

The [function vectors](/topics/function-vectors/) work shows that even complex *tasks* (not just concepts) can be represented as directions and combined through addition.

## Implications for Alignment

The representation control framework has profound implications for AI safety:

**Understanding:** We can now ask precise questions about what safety-relevant concepts a model represents and where.

**Control:** We have tools to steer behavior without retraining -- useful for rapid iteration and deployment-time adjustments.

**Vulnerability:** The same tools that help us understand safety mechanisms can bypass them. The [refusal direction](/topics/refusal-direction/) can be ablated with one operation.

This dual-use nature is fundamental to mechanistic interpretability. Understanding and manipulation are two sides of the same geometric coin.

<details class="pause-and-think">
<summary>Pause and think: Designing robust safety mechanisms</summary>

If safety behaviors are encoded as linear directions that can be ablated, how might we design more robust safety mechanisms? Is it possible to make safety behaviors resistant to linear ablation while maintaining the interpretable, linear structure that makes models useful?

One approach: encode safety in multiple, redundant ways -- not just a single direction but across many interacting components. However, this conflicts with the linear structure that makes models interpretable and steerable. Another approach: make safety depend on the same representations that encode general capabilities, so removing safety also degrades performance. But this makes legitimate customization harder. The tension between interpretability, controllability, and robustness may be fundamental.

</details>

## The Complete Toolkit

Representation control, combined with [probing methods](/topics/caa-method/), provides a complete toolkit for working with model representations:

- **Probe** with [CAA](/topics/caa-method/) and [LAT](/topics/lat-probing/) to identify concept directions.
- **Add** with [addition steering](/topics/addition-steering/) to induce behaviors.
- **Remove** with [ablation steering](/topics/ablation-steering/) to disable behaviors.
- **Erase** with [LEACE](/topics/concept-erasure/) for mathematically guaranteed removal.

This toolkit extends to naturally occurring directions like [function vectors](/topics/function-vectors/), showing that the same geometric structure underlies both engineered interventions and the model's own learned computations.
