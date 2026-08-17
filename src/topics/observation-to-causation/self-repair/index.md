---
title: "Self-Repair in Language Models"
description: "How later components compensate for an ablation, why that can hide a component's causal role, and how to interpret intervention results more carefully."
order: 5
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

**LayerNorm rescaling.** Removing a component changes the residual stream's magnitude, so subsequent LayerNorm operations rescale the remaining contributions. This mechanical effect can amplify surviving signals without any learned adjustment by later components. In the reported experiments, it accounts for a substantial fraction of measured self-repair in some settings.{% sidenote "LayerNorm rescaling follows from the architecture, but the direction and size of its effect depend on the removed vector and the remaining residual stream. It should be measured rather than assumed to compensate every ablation." %}

**Backup heads.** Some attention heads contribute little under ordinary IOI prompts but increase their name-copying contribution after primary Name Movers are ablated. This input-dependent response behaves like learned redundancy, although “backup” is a functional description of the intervention result rather than proof that training explicitly created a spare component.

**Unexplained residual.** Even after accounting for LayerNorm rescaling and backup heads, a significant fraction of self-repair remains unexplained. Later MLP layers and attention heads adjust their outputs in ways that partially compensate for the ablation, but the mechanisms driving these adjustments are not yet fully characterized. This is an active area of research.

<details class="pause-and-think">
<summary>Pause and think: Why does self-repair exist?</summary>

Why would gradient descent produce models that compensate for ablated components? After all, components are not ablated during training. What training pressure could give rise to this behavior?

One hypothesis: self-repair is a byproduct of redundancy that the model develops for robustness. If multiple components contribute to the same output, the model's loss is smoother and more robust to variation in any single component's output. During training, the model may learn overlapping representations because they improve the expected loss across the training distribution, even though no component is ever fully ablated during training. The result is that partial removal of one component leaves enough residual signal for later components to work with, producing compensation that looks like self-repair.

</details>

## Implications for Ablation Experiments

Self-repair has direct consequences for how we interpret causal experiments.

**Ablation effects can understate a component's normal role.** If later components compensate after a head is removed, a 30% drop in logit difference may be smaller than the head's contribution in the intact run. “True contribution” is not always a single well-defined number when components interact, and out-of-distribution ablations can also create exaggerated effects. The result must be interpreted together with the replacement baseline and evidence for compensation.

**Noising and denoising answer different counterfactuals.** Replacing a clean activation with a corrupted one can trigger downstream responses that were absent in the intact run. Restoring a clean activation to a corrupted run begins from a different surrounding state and may recruit different pathways. Comparing both directions can reveal this asymmetry; neither direction is universally immune to self-repair.

**Iterated ablation can reveal hidden structure.** A component that matters only after the primary path is damaged may look unimportant in a one-at-a-time screen. Researchers can remove a primary component and rerun attribution or patching to search for newly important backups. The number of combinations grows quickly, so this procedure improves coverage without making it exhaustive.

**Mean and resample ablation change the confounds.** Zero ablation may create an unusual activation. [Mean ablation and resample ablation](/topics/activation-patching/) use values drawn from, or summarized over, the observed distribution and can reduce that problem. They introduce their own counterfactual assumptions, however: a resampled value may be plausible marginally while inconsistent with the rest of the current input.{% sidenote "Resample ablation replaces the component with a value from another input. Multiple draws can estimate sensitivity to the replacement, but no baseline is automatically the correct one. The right choice depends on which information the intervention is meant to remove while preserving other structure." %}

## The Hydra Effect

McGrath et al. {% cite "mcgrath2023hydra" %} named the phenomenon after the mythological Hydra: cut off one head and two grow back. The name captures an important aspect of self-repair that goes beyond simple compensation.

In some cases, ablating a component does more than trigger a larger write from an existing backup. Downstream attribution can shift toward different components, which is consistent with reorganization of the computation. The output may remain similar even though the measured internal pathway has changed.

Suppose ablating component A shifts the effect toward components B, C, and D. A small behavioral change would not show that A was unimportant in the intact run; it would show that the intervened network can preserve the behavior. Mapping both the intact and intervened computations helps separate the primary pathway from recruited backups.

## Partial Mitigations

No current technique fully solves the self-repair problem, but several approaches reduce its impact.

**Use denoising over noising when possible.** Denoising (patching clean activations into a corrupted run) is less affected by self-repair because the corrupted baseline typically lacks the compensatory structures present in the clean run.

**Compare multiple ablation baselines.** If zero ablation, mean ablation, and resample ablation all agree on a component's importance, the result is more robust. If they disagree, the difference may indicate self-repair artifacts.

**Report the intervention, not an intrinsic percentage.** Avoid “head X accounts for exactly 30% of the behavior.” Say “under this replacement baseline, ablating head X reduces the logit difference by 30%,” then report any evidence that downstream components compensated.

**Look for backup mechanisms explicitly.** After identifying primary circuit components, ablate them and re-run attribution methods on the remaining model to search for backup components that activate only when the primaries are removed.

## Looking Ahead

Self-repair is one of several phenomena that complicate the interpretation of causal experiments in neural networks. [Copy suppression](/topics/copy-suppression/), where heads actively suppress predictions of previously seen tokens, provides another example of a mechanism that interacts with ablation experiments in non-obvious ways. Together, these phenomena underscore that transformers are not simple feed-forward systems where removing a component cleanly excises its contribution. They are adaptive systems with redundancy, compensation, and reorganization built in. Interpreting them requires accounting for these dynamics.
