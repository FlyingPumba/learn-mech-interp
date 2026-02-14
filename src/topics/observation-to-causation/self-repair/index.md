---
title: "Self-Repair in Language Models"
description: "When ablating a model component, later components compensate and partially restore the original behavior. Understanding self-repair is essential for correctly interpreting ablation experiments and activation patching results."
order: 4
prerequisites:
  - title: "Activation Patching and Causal Interventions"
    url: "/topics/activation-patching/"

glossary:
  - term: "Self-Repair"
    definition: "The phenomenon where ablating or patching a model component causes later components to compensate, partially restoring the original behavior. Self-repair means that ablation effects systematically understate component importance."
---

## The Compensation Problem

[Activation patching](/topics/activation-patching/) and ablation are the primary tools for establishing which model components matter for a behavior. The logic is simple: remove a component, measure the damage. If performance drops, the component was important. If it does not, the component was not needed.

But this logic has a hidden assumption: that removing a component reveals its true contribution. What if later components *compensate* for the removal, partially restoring the behavior we just disrupted? The measured effect would understate the component's actual importance. We would conclude "this head accounts for 30% of the logit difference" when the true figure is substantially higher, with the gap hidden by downstream compensation.

This is **self-repair**: the phenomenon where ablating a model component triggers compensatory changes in later components that partially restore the original output {% cite "mcgrath2023hydra" %}. Self-repair is not a rare edge case. It appears to be a general property of transformer language models, and it affects the interpretation of every ablation experiment.

> **Self-Repair:** When a model component is ablated, later components adjust their behavior to partially compensate, restoring some fraction of the original output. The ablation effect measured at the output is therefore a lower bound on the component's true importance.

## Known Mechanisms

Rushing and Nanda {% cite "rushing2024selfrepair" %} systematically investigated self-repair in GPT-2 Small by ablating individual attention heads and measuring how later layers responded. They identified three sources of compensation, each contributing a different fraction of the observed self-repair.

**LayerNorm rescaling.** When a component's contribution is removed from the residual stream, the magnitude of the stream changes. LayerNorm, which normalizes the stream before each subsequent layer, rescales the remaining contributions. This rescaling mechanically amplifies the surviving signal, recovering some of the lost effect. LayerNorm rescaling is entirely mechanical -- it requires no "intelligent" adjustment by later components, just the standard normalization operation applied to a residual stream that is now missing one additive term. This mechanism alone accounts for a substantial fraction of self-repair, sometimes up to 30% of the ablated effect.{% sidenote "The LayerNorm contribution is worth emphasizing because it is not a learned behavior. It is a side effect of the architecture. Any additive component removed from the residual stream will be partially compensated by LayerNorm rescaling, regardless of what that component computed. This means self-repair is partly baked into the transformer architecture itself." %}

**Backup heads.** Some attention heads are nearly inactive under normal operation but activate when specific primary components are removed. The [IOI circuit](/topics/ioi-circuit/) provides the canonical example: Backup Name Mover Heads have the same functional profile as the primary Name Movers (they attend to name tokens, copy names to output logits, and respond to S-Inhibition signals) but contribute minimally under normal conditions. When primary Name Movers are ablated, the backups increase their contribution, picking up the slack. Backup heads represent a learned redundancy -- the model has trained spare capacity that activates precisely when needed.

**Unexplained residual.** Even after accounting for LayerNorm rescaling and backup heads, a significant fraction of self-repair remains unexplained. Later MLP layers and attention heads adjust their outputs in ways that partially compensate for the ablation, but the mechanisms driving these adjustments are not yet fully characterized. This is an active area of research.

<details class="pause-and-think">
<summary>Pause and think: Why does self-repair exist?</summary>

Why would gradient descent produce models that compensate for ablated components? After all, components are not ablated during training. What training pressure could give rise to this behavior?

One hypothesis: self-repair is a byproduct of redundancy that the model develops for robustness. If multiple components contribute to the same output, the model's loss is smoother and more robust to variation in any single component's output. During training, the model may learn overlapping representations because they improve the expected loss across the training distribution, even though no component is ever fully ablated during training. The result is that partial removal of one component leaves enough residual signal for later components to work with, producing compensation that looks like self-repair.

</details>

## Implications for Ablation Experiments

Self-repair has direct consequences for how we interpret causal experiments.

**Ablation effects are lower bounds.** When we ablate a head and measure a 30% drop in the logit difference, the head's true contribution is likely higher. Later components have partially compensated. The gap between the measured effect and the true contribution depends on the strength of self-repair for that component, which varies across heads and tasks.

**Noising is more affected than denoising.** In the [noising direction](/topics/activation-patching/) (replacing a clean activation with a corrupted one), the model's backup mechanisms are fully operational in the clean run and ready to compensate. In the denoising direction (replacing a corrupted activation with a clean one), the corrupted run may not have the same backup structures activated. This asymmetry means noising experiments are more susceptible to self-repair effects.

**Iterated ablation reveals hidden structure.** Standard ablation tests one component at a time, which means backup components remain invisible -- they only activate when the primary is removed. Discovering backup mechanisms requires iterated ablation: first remove the primary component, then search for newly activated components. The number of possible ablation combinations grows combinatorially, so exhaustive search is infeasible. Current circuit analyses likely miss some backup mechanisms.

**Mean and resample ablation reduce confounds.** Zero ablation is particularly susceptible to self-repair artifacts because it pushes the residual stream far from its natural distribution, potentially triggering abnormal compensatory responses from downstream components. [Mean ablation and resample ablation](/topics/activation-patching/) keep the residual stream closer to its training distribution, reducing (but not eliminating) the self-repair confound.{% sidenote "Resample ablation, where the component's activation is replaced with the value from a random different input, is used in causal scrubbing and offers the cleanest baseline: it preserves the full distribution of the component's activations while removing the input-specific signal. The tradeoff is computational cost, since stable estimates require multiple resampling draws." %}

## The Hydra Effect

McGrath et al. {% cite "mcgrath2023hydra" %} named the phenomenon after the mythological Hydra: cut off one head and two grow back. The name captures an important aspect of self-repair that goes beyond simple compensation.

In some cases, ablating a component does not just trigger partial compensation -- it triggers *reorganization* of the downstream computation. Later layers may route information through different pathways than they normally use, effectively implementing an alternative algorithm for the same task. The output looks similar, but the internal mechanism has changed.

This is troubling for circuit analysis. If ablating component A causes the model to route through an alternative pathway involving components B, C, and D, then our ablation experiment tells us that A is "not important" -- but only because the model found a workaround. The circuit we identify by ablation (B, C, D) may differ from the circuit the model actually uses (A, with B, C, D as dormant backups).

## Partial Mitigations

No current technique fully solves the self-repair problem, but several approaches reduce its impact.

**Use denoising over noising when possible.** Denoising (patching clean activations into a corrupted run) is less affected by self-repair because the corrupted baseline typically lacks the compensatory structures present in the clean run.

**Compare multiple ablation baselines.** If zero ablation, mean ablation, and resample ablation all agree on a component's importance, the result is more robust. If they disagree, the difference may indicate self-repair artifacts.

**Treat effects as lower bounds.** When reporting ablation results, acknowledge that the measured effect understates the true contribution. Avoid claims like "head X accounts for exactly 30% of the behavior." Instead, "ablating head X reduces the logit difference by 30%, which is a lower bound on its contribution."

**Look for backup mechanisms explicitly.** After identifying primary circuit components, ablate them and re-run attribution methods on the remaining model to search for backup components that activate only when the primaries are removed.

## Looking Ahead

Self-repair is one of several phenomena that complicate the interpretation of causal experiments in neural networks. [Copy suppression](/topics/copy-suppression/), where heads actively suppress predictions of previously seen tokens, provides another example of a mechanism that interacts with ablation experiments in non-obvious ways. Together, these phenomena underscore that transformers are not simple feed-forward systems where removing a component cleanly excises its contribution. They are adaptive systems with redundancy, compensation, and reorganization built in. Interpreting them requires accounting for these dynamics.
