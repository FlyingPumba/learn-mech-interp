---
title: "Activation Patching and Causal Interventions"
description: "The primary technique for establishing causal claims about model internals: replace an activation and measure what changes. Covers the clean/corrupted framework, noising vs denoising, choosing a metric, and interpreting results."
prerequisites:
  - title: "The Attention Mechanism"
    url: "/topics/attention-mechanism/"
block: "observation-to-causation"
category: "methods"
---

## From Observation to Causation

Mechanistic interpretability begins with observational tools. The logit lens shows what a model would predict if processing stopped at a given layer. Probing classifiers reveal what information is linearly decodable from [the residual stream](/topics/attention-mechanism/#the-residual-stream). Attention patterns display where each head directs its focus. These techniques are powerful, but they share a fundamental limitation: they show what information *exists* in a model's internals, not what information the model actually *uses*.

The gap matters. A probing classifier might detect part-of-speech information at 95% accuracy from layer 6 activations, yet removing that information has no effect on the model's downstream performance. The information was there, but the model did not rely on it. Observation reveals correlation. We need causation.

This article introduces the primary tool for establishing causal claims about model internals: **activation patching** {% cite "heimersheim2024patching" %}. The core idea is straightforward. Replace a specific activation in one model run with the corresponding activation from a different run, and measure the effect on behavior. If the behavior changes, that activation was causally involved in producing the original output.

**Observation reveals what exists. Intervention reveals what matters.**

## The Clean/Corrupted Framework

The basic setup requires two model runs:

- A **clean run** where the model processes a prompt that produces the desired behavior.
- A **corrupted run** where the model processes a modified prompt that produces different behavior.

We then replace specific activations from one run into the other and observe how the output changes.

Consider a concrete example from the Indirect Object Identification (IOI) task:

- **Clean:** "When Mary and John went to the store, John gave a drink to ___" -- the model predicts *Mary* (the indirect object)
- **Corrupted:** "When Mary and John went to the store, Mary gave a drink to ___" -- the model predicts *John* (Mary became the repeated subject, so John is now the indirect object)

Now run the corrupted prompt, but at a specific layer or [attention head](/topics/attention-mechanism/#multi-head-attention), replace the corrupted activation with the clean activation. If the model's output switches back toward "Mary", that activation carries information that causally matters for identifying the indirect object. If the output stays at "John", that activation is not important for this task. By repeating this for every layer, every head, and every position, we build a map of what matters.

> **Activation Patching:** Also called causal mediation analysis or interchange intervention, activation patching replaces the activation $a_i$ of a specific model component $i$ in one run with the corresponding activation $a_i'$ from a different run, while keeping all other components unchanged: $\hat{y} = M(x;\; a_i \leftarrow a_i')$. The change in output $\hat{y} - y_{\text{original}}$ measures the causal effect of component $i$ on the model's behavior for this input pair.

![Diagram showing the activation patching setup with clean and corrupted model runs side by side, with an arrow indicating activation replacement at a specific layer.](/topics/activation-patching/images/act_patch_setup.png "Figure 1: The activation patching setup. Run the model on both clean and corrupted inputs, then replace specific activations from one run into the other to measure causal effects.")

**What makes a good clean/corrupted pair?** The two prompts should differ in exactly one semantically meaningful way:

- **Good:** Swap which name is the subject. This changes who the indirect object is with minimal other changes.
- **Bad:** Use a completely different sentence. Too many confounds make it impossible to tell which difference caused the change.
- **Bad:** Add random noise to embeddings. The model never encounters this distribution in practice, so the results may not reflect how the model processes natural inputs.

The cleaner the contrast, the more interpretable the results.

**Choosing a metric.** How do we measure the effect of patching? The preferred metric is the **logit difference**:

$$
\Delta L = \text{logit}(\text{Mary}) - \text{logit}(\text{John})
$$

The logit difference is continuous, linear in [residual stream](/topics/attention-mechanism/#the-residual-stream) contributions, and easy to interpret. Alternatives like probability (nonlinear via softmax, creating artificial sharpness) and accuracy (discrete, hiding gradual effects) are less reliable. Heimersheim and Nanda strongly recommend logit difference, with multiple metrics used to check robustness {% cite "heimersheim2024patching" %}.{% sidenote "Activation patching was developed independently by several groups under different names. Vig et al. (2020) introduced 'causal mediation analysis' by applying Pearl's framework to neural NLP. Geiger et al. (2021) formalized 'interchange intervention' within a causal abstraction framework. Meng et al. (2022) used 'causal tracing' with Gaussian noise corruption to trace factual associations. Heimersheim and Nanda (2024) synthesized these approaches into the practical framework now used by the MI community." %}

## Noising vs. Denoising

There are two fundamentally different ways to patch, and the distinction is the most important conceptual point in this article.

**Denoising** (clean into corrupted): Run the corrupted prompt. Replace one activation with the clean version. This asks: "Can this component *restore* the correct behavior?" Denoising tests **sufficiency** -- it identifies components that carry enough information to fix the corrupted run.{% sidenote "The distinction between sufficiency and necessity maps directly onto Pearl's causal framework. Denoising identifies sufficient causes -- components whose clean activation alone can restore correct behavior. Noising identifies necessary causes -- components without which the model fails. The two perspectives are complementary, and a complete circuit analysis requires both." %}

**Noising** (corrupted into clean): Run the clean prompt. Replace one activation with the corrupted version. This asks: "Does *damaging* this component break the correct behavior?" Noising tests **necessity** -- it identifies components that the model cannot do without.

These two directions answer different causal questions, and the difference is not merely academic. Sufficiency and necessity are not the same thing. A component can be sufficient without being necessary (if there are backups), or necessary without being sufficient (if it needs help from other components).

**The AND/OR gate analogy.** Heimersheim and Nanda offer a clarifying analogy {% cite "heimersheim2024patching" %}:

- **Serial circuit (AND gate):** A then B then C. Every component is necessary. Noising any one breaks the circuit.
- **Parallel circuit (OR gate):** A or B or C. No single component is necessary because the others compensate, but each is sufficient alone.

Noising finds AND-circuit components (serial dependencies). Denoising finds OR-circuit components (parallel/redundant paths).

This matters enormously in practice. The IOI circuit in GPT-2 has **backup Name Mover heads** that activate when the primary Name Movers are disabled. If you only use noising, you might miss the primary Name Movers entirely because the backups compensate. If you use denoising, you correctly identify the Name Movers as sufficient.

The takeaway: always consider which direction you are patching and what question it answers. A component that looks unimportant under one direction may be critically important under the other.

<details class="pause-and-think">
<summary>Pause and think: Redundant components</summary>

Consider a circuit with two redundant components A and B that each independently produce the correct output. What does noising A show? What does denoising A show? Which gives you more useful information about the circuit's structure?

Noising A would show little or no effect, because B compensates. Denoising A would show a large effect, revealing that A alone carries enough information. In circuits with redundancy, denoising is more informative for identifying individual components.

</details>

## A Worked Example: IOI in GPT-2 Small

Let us walk through activation patching on the Indirect Object Identification task in GPT-2 Small. This worked example demonstrates the full patching workflow and reveals the sparse circuit structure that makes mechanistic interpretability possible.

**Step 1: Establish the baseline.** On the clean prompt, the model correctly predicts "Mary" with a positive logit difference:

$$
\Delta L = \text{logit}(\text{Mary}) - \text{logit}(\text{John}) > 0
$$

On the corrupted prompt (where the subject names are swapped), the model predicts "John" with a negative logit difference:

$$
\Delta L = \text{logit}(\text{Mary}) - \text{logit}(\text{John}) < 0
$$

The gap between these two values is what we want to explain: which internal components drive this behavioral difference?

**Step 2: Patch layer by layer.** For each layer $\ell$, we replace the corrupted residual stream with the clean one (denoising direction) and measure how much of the logit difference is recovered.

![Bar chart showing patching recovery by layer. Layers 0-4 show small effect, layers 5-6 moderate, layers 7-8 large (S-Inhibition heads), layers 9-10 the largest (Name Mover heads).](/topics/activation-patching/images/act_patch_layers.png "Figure 2: Layer-by-layer activation patching results on the IOI task. Layers 7-10 carry the most causally important information.")

The results tell a clear story:

- **Layers 0-4:** Small effect. Early processing (token embeddings, positional information) does not contribute much on its own.
- **Layers 5-6:** Moderate effect. Induction-style heads begin to contribute.
- **Layers 7-8:** Large effect. This is where the S-Inhibition heads operate, suppressing attention to the duplicated name.
- **Layers 9-10:** The largest effect. The Name Mover heads directly copy the indirect object name to the output logits.

**Step 3: Patch individual attention heads.** The layer-level results show *where* in the model the critical computation happens, but not *which specific components* are responsible. For each of the 144 attention heads (12 layers times 12 heads), we patch the corrupted head output with the clean one and measure recovery.

![Heatmap showing patching effect for each of 144 attention heads (12 layers x 12 heads). Most cells are near zero. Blue cells at heads 9.9, 10.0, 9.6 show positive effect (Name Movers). Red cells at 10.7, 11.10 show negative effect (Negative Name Movers).](/topics/activation-patching/images/act_patch_heads.png "Figure 3: Head-level activation patching results. The IOI circuit involves roughly 10-15 heads out of 144, revealing a sparse structure.")

The heatmap reveals a remarkably sparse structure. Most heads have near-zero effect, but a handful stand out:

**Blue cells (positive effect):** These are the key players. Heads 9.9, 10.0, and 9.6 are the **Name Mover** heads, each recovering a large fraction of the logit difference. Heads 7.3, 7.9, 8.6, and 8.10 are the **S-Inhibition** heads, which suppress the wrong answer.

**Red cells (negative effect):** Equally informative. Heads 10.7 and 11.10 are **Negative Name Movers** that write *against* the correct answer. This is a counterintuitive but real phenomenon -- some heads consistently hurt performance on this task, actively pushing the model toward the wrong prediction.

**Interpretation.** A small number of heads -- roughly 10-15 out of 144 -- account for nearly all of the IOI behavior. This is a structured circuit, not random distributed computation. The key insight is that patching identified the circuit's components without any prior knowledge of what the model was doing. We did not need to know about Name Movers or S-Inhibition heads in advance -- the patching results revealed them purely through causal evidence.

For the full analysis of how these heads work together to implement an algorithm for identifying the indirect object, see Wang et al. {% cite "wang2022ioi" %}.

**A note on interpreting recovery percentages.** When we say "patching head 9.9 recovers 38% of the logit difference," this means replacing the corrupted activation of head 9.9 with its clean activation restores 38% of the gap between clean and corrupted performance. This does *not* mean head 9.9 is "38% of the circuit." Multiple components may independently recover overlapping portions, so the recoveries do not necessarily add up to 100%. Be careful with arithmetic interpretations of patching results -- they measure causal importance, not a partition of credit.

<details class="pause-and-think">
<summary>Pause and think: Designing a patching experiment</summary>

You have a model that correctly identifies sentiment in movie reviews. You want to know whether the model relies on specific adjectives or on overall sentence structure. How would you design an activation patching experiment to test this? What would your clean and corrupted prompts look like?

A good approach: use clean prompts with clear sentiment ("This movie was absolutely brilliant") and corrupted prompts where the adjectives are replaced with neutral or opposite ones while preserving sentence structure ("This movie was absolutely terrible"). If patching the early layers (where token identity is processed) recovers the sentiment, the model relies on the specific words. If patching later layers matters more, the model may depend on higher-level structural features.

</details>

## Attribution Patching

Full activation patching requires a separate forward pass for every component you want to test. In GPT-2 Small with 144 attention heads and 12 MLP layers, that means 156 forward passes. In GPT-3, with roughly 4.7 million neurons, testing each one individually is impractical. The problem is even worse at the neuron level: individual neurons are often polysemantic, responding to multiple unrelated features due to [superposition](/topics/superposition/), so head-level patching may miss important structure. Can we approximate patching without running all those forward passes?

Attribution patching {% cite "nanda2023attribution" %} uses a first-order Taylor approximation to estimate what full patching would find. The gradient of the metric with respect to each activation tells us how sensitive the output is to changes at that location. The difference between the clean and corrupted activations tells us how much each activation actually changes. Their product approximates the full patching effect:

$$
\text{Patch effect of } a_i \approx \nabla_{a_i}\mathcal{L} \cdot (a_i^{\text{clean}} - a_i^{\text{corrupt}})
$$

The efficiency gain is enormous. Full activation patching requires $O(n)$ forward passes, one per component. Attribution patching requires only two forward passes plus one backward pass for *all* components simultaneously. For GPT-3 with 4.7 million neurons, that is 3 passes instead of 4.7 million.

**When does this approximation work?** Transformers are, as Nanda puts it, "shockingly linear objects." The linear approximation often holds well for small activations like individual head outputs and neurons, where the relationship between activation changes and metric changes is approximately linear.

**When does it break?** For large activations such as entire residual streams at a layer, nonlinearities from softmax, MLP activations, and LayerNorm invalidate the linear regime. The Taylor approximation assumes small perturbations, and patching an entire layer's residual stream is anything but small.

**Best practice:** Use attribution patching as a fast screening tool. Sweep the entire model in a single pass to identify the most promising components, then verify the top candidates with actual activation patching. Think of it as a microscope's low-magnification mode -- scan the whole slide quickly to find the interesting regions, then switch to high magnification for precise measurement.

For a deeper treatment of attribution patching, including its relationship to path patching and how both are applied at scale, see [Attribution Patching and Path Patching](/topics/attribution-patching/).

## Path Patching

Standard activation patching replaces a component's entire output. But a head's output flows to many downstream components through [the residual stream](/topics/attention-mechanism/#the-residual-stream). Head $H$ might send critical information to head $K$ but irrelevant information to head $J$. Standard patching cannot distinguish these pathways.

Path patching asks a more refined question: which specific *pathway* carries the critical information? Instead of patching head $H$'s output everywhere, patch only the part of $H$'s output that flows to a specific downstream component $K$. This isolates the direct $H \to K$ connection from other paths through the residual stream.

The shift is from **nodes** to **edges** in the computational graph. Activation patching tests whether component $H$ is important. Path patching tests whether the specific connection $H \to K$ is important. This finer resolution reveals the wiring of the circuit, not just which components participate.

Path patching was central to the [IOI circuit analysis](/topics/ioi-circuit/) {% cite "wang2022ioi" %}, where it revealed how information flows between the head classes: from Duplicate Token heads through S-Inhibition heads to Name Mover heads. Without path patching, we would know which heads matter but not how they communicate.

Conmy et al. extended this idea into the **ACDC algorithm** (Automatic Circuit DisCovery), which automates path patching to systematically prune edges and discover circuits {% cite "conmy2023ioi" %}. ACDC starts with a fully connected computational graph and iteratively removes edges whose patching effect falls below a threshold, leaving behind the minimal circuit.

## The Causal Toolkit

We now have three levels of causal analysis, each suited to a different stage of investigation:

- **Activation patching** tests which components matter by replacing entire activations. It operates at the node level.
- **[Attribution patching](/topics/attribution-patching/)** provides fast screening of all components through gradient approximation, making it practical to survey even the largest models.
- **Path patching** tests which connections between components matter, operating at the edge level.

Together, these tools let us progress from "something is happening at layer 9" to "head 9.9 sends indirect-object information to the output through a specific pathway" -- the kind of mechanistic understanding that gives this field its name. To see these tools applied at scale, continue to [the IOI circuit](/topics/ioi-circuit/), the most complete circuit analysis ever performed.
