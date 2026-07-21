---
title: "Refined Attribution Methods"
description: "How AtP* and EAP-IG fix key failure modes of gradient-based circuit discovery, from attention saturation and effect cancellation to zero-gradient regions, and how EAP-GP and CEAP further refine edge attribution."
order: 3
prerequisites:
  - title: "Attribution Patching and Path Patching"
    url: "/topics/attribution-patching/"

glossary:
  - term: "AtP*"
    definition: "Attribution Patching, starred. An improved variant of attribution patching that reduces false negatives from attention saturation by recomputing how patched queries and keys change attention weights, and from cancellation between direct and indirect effects using GradDrop. It retains AtP's scalability and provides a way to bound the probability of remaining false negatives."
  - term: "EAP-IG"
    definition: "Edge Attribution Patching with Integrated Gradients. Replaces the single gradient evaluation in EAP with an average of gradients along the interpolation path from corrupted to clean activations, fixing zero-gradient failures and improving circuit faithfulness."
  - term: "EAP-GP"
    definition: "Edge Attribution Patching with GradPath. An edge-level circuit discovery method that replaces EAP-IG's fixed straight-line interpolation with a dynamically adjusted, gradient-guided path. GradPath steers the integration path away from saturated regions, producing more reliable edge attributions and more faithful discovered circuits."
  - term: "CEAP"
    definition: "Conductance-based Edge Attribution Patching. A circuit discovery method that scores model edges using conductance along the interpolation path from corrupted to clean inputs. Unlike EAP-IG, it weights the gradient at each interpolation step by the edge activation's local change, rather than multiplying the average gradient by the total activation change. Its conductance scores produce more principled edge rankings and can reduce circuit instability under data resampling."
---

## When Gradients Mislead

[Attribution patching](/topics/attribution-patching/) approximates the effect of patching each component using a single gradient evaluation. This is fast (two forward passes plus one backward pass for all components) but relies on a linear approximation that can fail in specific, diagnosable ways.

These failures are not random noise. They are *systematic*, caused by specific nonlinearities in the transformer architecture. Understanding them matters because they produce **false negatives**: components or edges that are genuinely important but that gradient methods score as unimportant. A false positive (flagging an unimportant component) wastes time. A false negative (missing an important one) means the discovered circuit is wrong.

Three failure modes have been identified in the literature, each addressed by a different refinement.

## Failure Mode 1: Attention Saturation

The attention softmax maps logits to probabilities. In saturated regions, where one logit dominates, the probability is near 1 and its gradient is near 0. If the clean input puts the softmax in a saturated region, the gradient there is nearly flat, and the linear approximation estimates a near-zero patching effect even when the actual effect is large.

Consider an attention head that attends strongly (probability 0.99) to a specific token on the clean input but diffusely on the corrupted input. The true patching effect is large: replacing corrupted attention with clean attention would dramatically change where the head reads from. But the gradient at the clean attention pattern is nearly zero because the softmax is saturated. Attribution patching reports "this head does not matter," which is wrong.

Kramár et al. (2024) call this the **QK saturation problem** and show it is a primary source of false negatives in standard attribution patching {% cite "kramar2024atp" %}.

## Failure Mode 2: Effect Cancellation

A component's total effect on the output is the sum of its **direct effect** (through its own output) and **indirect effects** (through how it influences downstream components). These can partially cancel: a head might have a positive direct effect and a negative indirect effect that nearly offset.

When the linear approximation introduces even small multiplicative errors in the indirect effect, the estimated total can become orders of magnitude smaller than the true total. If the true direct effect is +5 and the true indirect effect is -4.8, the true total is 0.2. But if the gradient approximation estimates the indirect effect as -5.1, the estimated total becomes -0.1, flipping the sign and halving the magnitude. Small relative errors in large, opposing terms produce large absolute errors in their sum.

Kramár et al. (2024) demonstrate this concretely: on MLP neurons in GPT-2 and Pythia-12B, cancellation produces false negatives where the true patching effect is 5-12 times larger than the attribution patching estimate {% cite "kramar2024atp" %}.

## Failure Mode 3: Zero-Gradient Regions

When the corrupted input lands in a flat region of the loss landscape, the gradient at that point is near zero for all components. Standard attribution patching evaluates the gradient at the corrupted (or clean) input and multiplies by the activation difference. If the gradient is near zero, every component gets a near-zero score regardless of its actual importance.

This differs from saturation: saturation is specific to the softmax, while zero-gradient regions can arise anywhere in the loss landscape. A corrupted input that happens to produce a confident (but wrong) prediction will have small gradients because the model is not uncertain, just incorrect.

Hanna et al. (2024) identify this as the key failure mode for edge-level attribution {% cite "hanna2024faithfulness" %}.

<details class="pause-and-think">
<summary>Pause and think: Diagnosing failure modes</summary>

You run attribution patching on a circuit discovery task and find that it misses a head you know is important (from full activation patching). The head has high attention to a specific token (probability > 0.95) on the clean input. Which failure mode is most likely, and how would you confirm?

This is likely attention saturation. The softmax gradient is near zero at probability 0.95, so the attribution patching estimate will be near zero regardless of the true effect. You can confirm by checking the attention probabilities on clean versus corrupted inputs: if they differ substantially and the clean probabilities are near 0 or 1, saturation is the cause. AtP*'s QK fix (described below) would address this by recomputing the exact attention change rather than relying on the softmax gradient.

</details>

## AtP*: Fixing Node-Level Attribution

Kramár et al. (2024) introduce **AtP\*** (Attribution Patching, starred), which addresses saturation and cancellation with two targeted fixes while retaining scalability {% cite "kramar2024atp" %}:

### The QK Fix

Instead of approximating the attention softmax with a gradient, AtP\* **recomputes it exactly**. For query and key nodes, AtP\* computes the actual attention weights under patching (using the corrupted query/key values) and the actual clean attention weights, then uses the *exact difference in attention patterns* as the perturbation for the rest of the gradient computation:

$$
\hat{\mathcal{I}}_{\text{AtP*}}^{Q}(n) = \left(\text{attn}(n)_\text{patch} - \text{attn}(n)(x^\text{clean})\right)^\top \frac{\partial \mathcal{L}}{\partial \text{attn}(n)}
$$

The gradient still approximates the effect of the attention change on downstream computation, but the attention change itself is computed exactly. This eliminates the saturation problem because we never linearize through the softmax.

The cost is modest: computing the patched attention patterns requires less than two additional forward passes, far cheaper than full activation patching over all components.

### GradDrop

To address cancellation, AtP\* uses **GradDrop**: compute the attribution estimate multiple times, each time zeroing out the gradient contribution from a different layer, then average the absolute values:

$$
\hat{c}_{\text{AtP*}}(n) = \frac{1}{L-1} \sum_{\ell=1}^{L} \left| \hat{\mathcal{I}}_{\text{GradDrop}_\ell}(n) \right|
$$

where $\hat{\mathcal{I}}_{\text{GradDrop}_\ell}$ is the attribution with the gradient at layer $\ell$ zeroed out.

The intuition: if direct and indirect effects cancel in the full computation, they are unlikely to cancel in the *same way* when individual gradient paths are dropped. Averaging absolute values across the dropout variants breaks the destructive interference. This requires $L$ additional backward passes (one per layer), but $L$ is much smaller than the number of components.

AtP\* also provides a method for **bounding remaining false negatives** using subset sampling with statistical tests, giving confidence intervals on how large any missed effect could be.

## EAP: Edge Attribution Patching

Before discussing EAP-IG, we need the baseline it improves on. **Edge Attribution Patching (EAP)** applies the gradient approximation to *edges* (connections between components) rather than nodes {% cite "syed2023eap" %}:

$$
\text{EAP}(u, v) = (\mathbf{z}_u^\text{corrupt} - \mathbf{z}_u^\text{clean})^\top \nabla_v \mathcal{L}
$$

where $u$ is the source node, $v$ is the destination node, $\mathbf{z}_u$ is the activation at node $u$, and $\nabla_v \mathcal{L}$ is the gradient of the metric with respect to the input at node $v$.

EAP scores every edge in the computational graph in a single forward-backward pass, making it dramatically more efficient than ACDC (which requires a forward pass per edge). Syed et al. showed that EAP outperforms ACDC on circuit recovery benchmarks while being orders of magnitude faster {% cite "syed2023eap" %}.

But EAP inherits the gradient approximation's failure modes. When the gradient at the evaluation point is near zero (failure mode 3), EAP assigns near-zero scores to all edges regardless of their true importance.

## EAP-IG: Integrated Gradients for Edges

Hanna et al. (2024) fix the zero-gradient problem by replacing the single gradient evaluation with **integrated gradients** along the path from corrupted to clean activations {% cite "hanna2024faithfulness" %}:

$$
\text{EAP-IG}(u, v) = (\mathbf{z}_u^\text{corrupt} - \mathbf{z}_u^\text{clean}) \cdot \frac{1}{m} \sum_{k=1}^{m} \nabla_v \mathcal{L}\!\left(\mathbf{z}^\text{corrupt} + \frac{k}{m}(\mathbf{z}^\text{clean} - \mathbf{z}^\text{corrupt})\right)
$$

Instead of evaluating the gradient at a single point, EAP-IG evaluates it at $m$ equally-spaced points along the straight line from corrupted to clean activations and averages.{% sidenote "Integrated gradients were introduced by Sundararajan et al. (2017) as a general attribution method satisfying desirable axioms like sensitivity and implementation invariance. EAP-IG applies this established technique specifically to edge attribution in circuit discovery." %}

<figure>
  <img src="images/eap-ig-integrated-gradients-gelu.png" alt="Left: A GELU activation curve showing how EAP evaluates the gradient at a single point (which may be in a flat region), while EAP-IG samples gradients at multiple interpolation points along the path, capturing the transition. Right: Circuit faithfulness on the Country-Capital task, showing EAP-IG achieving higher faithfulness than EAP as edges are added.">
  <figcaption>Left: integrated gradients on a GELU activation. EAP evaluates the gradient at a single point (blue, in a flat region), missing the edge's importance. EAP-IG samples at intermediate points (colored dots) that capture the steep transition. Right: this translates to more faithful circuits on the Country-Capital task. From Hanna et al., <em>Have Faith in Faithfulness</em>. {%- cite "hanna2024faithfulness" -%}</figcaption>
</figure>

If the corrupted point sits in a flat region, some of the interpolation points will be in regions with informative gradients. The average captures the cumulative effect across the full path, not just the local slope at one endpoint. In practice, $m = 5$ integration steps are sufficient for stable results.

### Faithfulness over Overlap

The key finding from Hanna et al. is methodological: they show that **circuit overlap** (how many nodes match a ground-truth circuit) is a misleading evaluation metric. EAP and EAP-IG produce circuits with similar node overlap to ground-truth circuits, but EAP circuits are significantly **less faithful** (they reproduce less of the model's behavior when isolated).

> Overlap tells you whether you found the right components. Faithfulness tells you whether the circuit actually *works*.

EAP-IG consistently produces more faithful circuits across six benchmark tasks on GPT-2 Small. On the Subject-Verb Agreement task, EAP produced completely unfaithful circuits until over 1,000 edges were included, while EAP-IG maintained faithfulness throughout {% cite "hanna2024faithfulness" %}.

<figure>
  <img src="images/eap-ig-faithfulness-comparison.png" alt="Six panels showing normalized faithfulness versus number of edges included for IOI, Greater-Than, SVA, Gender-Bias, Country-Capital, and Hypernymy tasks. EAP-IG (orange/green curves) consistently reaches high faithfulness with fewer edges than EAP (blue curve), with the most dramatic difference on SVA where EAP stays near zero until over 1000 edges.">
  <figcaption>Circuit faithfulness across six benchmark tasks on GPT-2 Small. EAP-IG circuits (orange) consistently match or exceed the faithfulness of EAP circuits (blue), often reaching high faithfulness with far fewer edges. The difference is most striking on SVA (top right), where EAP circuits remain near zero faithfulness until a large fraction of edges are included. From Hanna et al., <em>Have Faith in Faithfulness</em>. {%- cite "hanna2024faithfulness" -%}</figcaption>
</figure>

<details class="pause-and-think">
<summary>Pause and think: Why integrated gradients help</summary>

Consider a loss landscape shaped like a step function, flat on both sides but with a steep transition in the middle. The corrupted input is on one flat side, the clean input is on the other. What does EAP report? What does EAP-IG report?

EAP evaluates the gradient at the corrupted input, which is on the flat side: gradient near zero, so the attribution is near zero. EAP-IG evaluates gradients at 5 points along the path. Some of those points fall in the steep transition region, where the gradient is large. The average captures this transition, producing a non-zero attribution that correctly reflects the edge's importance. This is exactly the zero-gradient failure mode that EAP-IG was designed to address.

</details>

## EAP-GP: Adaptive Paths

EAP-IG integrates along a **straight line** from corrupted to clean activations. Zhang et al. (2025) identify a remaining problem: if the straight-line path passes through a **saturation region** (where gradients are persistently near zero over a broad area, not just at the endpoints), even averaging over the path produces dampened scores {% cite "zhang2025eapgp" %}.

**EAP-GP** (Edge Attribution Patching with GradPath) replaces the straight-line path with an **adaptive path** that follows the direction of informative gradients:

Starting from the corrupted input, EAP-GP steps in the direction of the difference between the corrupted and clean gradients, actively steering the integration path away from saturated regions where the attribution signal is weak. The adaptive path reaches the clean input by a different route than the straight line, one that traverses regions with higher gradient sensitivity.

On GPT-2 variants (Small, Medium, XL) across six circuit discovery benchmarks, EAP-GP improved circuit faithfulness by up to 17.7% over EAP-IG, with precision and recall matching or exceeding prior methods when validated against manually annotated ground-truth circuits {% cite "zhang2025eapgp" %}.

## CEAP: Conductance Over Integrated Gradients
EAP-IG uses Integrated Gradients, originally introduced by Sundararajan et al. (2017) to attribute a model's output to its input features {% cite "sundararajan2017axiomatic" %}. However, circuit discovery seeks to attribute model behavior to intermediate edges of the computational graph, so applying an input-attribution method to this setting may seem less principled.

Wu et al. (2026) address this with CEAP (Conductance-based Edge Attribution Patching) {% cite "wu2026variance" %}. CEAP scores edges using **conductance**, which Dhamdhere et al. (2019) introduced as an adaptation of Integrated Gradients for intermediate components {% cite "dhamdhere2018how" %}.
The importance of each edge is then computed as:

$$
\text{CEAP}(u, v)
=
\sum_{k=0}^{m-1}
\left(\mathbf{z}_u^{(k+1)} - \mathbf{z}_u^{(k)}\right)
\cdot
\nabla_v \mathcal{L}\!\left(\mathbf{z}^{(k)}\right)
$$

where $\mathbf{z}^{(k)} = \mathbf{z}^{\text{corrupt}} + \frac{k}{m}\left(\mathbf{z}^{\text{clean}}-\mathbf{z}^{\text{corrupt}}\right)$ is the input at interpolation step $k$, and $\mathbf{z}_u^{(k)}=\mathbf{z}_u\!\left(\mathbf{z}^{(k)}\right)$ is the activation at node $u$ produced by that input.

Conductance satisfies **additive order preservation**, a minimal desideratum for edge-scoring methods that is violated by Integrated Gradients:

> **Additive order preservation (informal):** Suppose a function is composed as a summation of several branches, as in the diagram below. If ablating one branch causes the function's behavior to change more than ablating another, then the scoring function should assign more importance to the former branch than to the latter.
>
> <figure>
>   <img src="/topics/refined-attribution-methods/images/additive-order-preservation-four-branch-sum.png" alt="A shared input z feeds four parallel branches f1, f2, f3, and f4, whose outputs are added to produce f of z.">
>   <figcaption>
>
>   An example of a function $f(z) = \sum_{i=1}^4 f_i(z)$.
>
>   </figcaption>
>
> </figure>

<details class="pause-and-think">
<summary>Pause and think: Why the CEAP score is more principled</summary>
The CEAP score weights the gradient at each interpolation step by how much the corresponding activation moves at that step. Intuitively, a step should matter more for two reasons: (1) the activation moves more in that step, and (2) that activation movement has a larger local effect on the output.
CEAP reflects both factors. 

EAP-IG, on the other hand, treats the gradients of all the steps equally, which can distort how much a certain activation really affects the output.
</details>

Empirically, CEAP reduces resampling instability, which refers to the instability of the found circuit when the probing prompts are resampled from the same distribution {% cite "wu2026variance" %}.

<figure>
  <a href="images/ceap-resampling-variance-gpt2-xl-sva.png" aria-label="Open the full-size resampling-stability figure">
    <img src="images/ceap-resampling-variance-gpt2-xl-sva.png" alt="Six plots comparing circuit stability for EAP-IG and CEAP on GPT-2 XL across SVA prompt templates plural 0 through plural 5. CEAP has a consistently higher pairwise Jaccard index as the number of selected edges varies.">
  </a>
  <figcaption>Resampling stability of circuits discovered by EAP-IG (blue) and CEAP (orange) across six SVA prompt templates on GPT-2 XL. Stability is measured by the mean pairwise Jaccard index between circuits obtained from four resampled probing datasets; shaded regions show the standard deviation. Higher values indicate greater stability. From Wu et al., <em>Demystifying Variance in Circuit Discovery of LLMs</em>. {% cite "wu2026variance" %}</figcaption>
</figure>

### Have More Faith in Faithfulness: A Variance Perspective

 Wu et al. (2026) also deepen the understanding of faithfulness.
 Faithfulness has become a popular metric for evaluating circuit quality, especially following Hanna et al. (2024) {% cite "hanna2024faithfulness" %}. However, Miller et al. (2024) {% cite "miller2024transformer" %} point out an important caveat: when performing circuit discovery for a population of samples, the circuit's faithfulness often varies drastically across those samples.
 
<figure>
  <a href="images/ioi-faithfulness-ablation-sensitivity.png" aria-label="Open the full-size IOI faithfulness evaluation figure">
    <img src="images/ioi-faithfulness-ablation-sensitivity.png" alt="Four boxplots of logit difference recovered for the IOI circuit, comparing node and edge ablations, specific and all token positions, and resample and mean ablation values. The resulting faithfulness distributions differ substantially across evaluation choices, with many scores below zero or above one hundred percent.">
  </a>
  <figcaption>Faithfulness scores for the IOI circuit under different evaluation choices: node- versus edge-level ablation, specific versus all token positions, and resample versus mean ablation. The dotted line marks 100% recovery, or perfect faithfulness. Across all evaluation setups, many samples deviate substantially from perfect faithfulness. From Miller et al. (2024), <em>Transformer Circuit Evaluation Metrics Are Not Robust</em>. {% cite "miller2024transformer" %}
  </figcaption>
</figure>

 
 Does this mean that circuit discovery is just hacking the faithfulness metric at the population level, while failing to provide meaningful explanations for individual samples?
Fortunately, Wu et al. (2026) argue that the answer is no {% cite "wu2026variance" %}.
 In particular, they study *unfaithfulness*, defined as $\vert 1 - \text{faithfulness} \vert$, which can be interpreted as the fraction of the full model's behavior magnitude that is not explained by the circuit.
 They find that unfaithfulness is negatively correlated with the full model's behavior magnitude.
 In other words, when the model's behavior on a sample is weaker, the circuit's relative behavioral deviation on that sample tends to be larger.
 They also give a mechanistic explanation: when the full model's behavior magnitude is small, different components tend to contribute more evenly to the network output.
 As a result, the components excluded from the circuit are not much less important than the components included in it, leading to higher unfaithfulness.

 The main takeaways are:
  - Samplewise variance of (un)faithfulness is intrinsic but not necessarily fatal: it is linked to the behavior magnitude of the full model and does not, by itself, indicate fundamental defects of the found circuits.
  - Comparing (un)faithfulness across circuit sizes or methods remains meaningful. However, comparing raw (un)faithfulness across individual samples is much less informative.


## Choosing a Method

Each refinement targets a specific failure mode and adds computational cost:

| Method | Targets | Cost | Scope |
|--------|---------|------|-------|
| **AtP** | (baseline) | 2 fwd + 1 bwd | Nodes |
| **AtP\*** (QK fix) | Attention saturation | + ~2 fwd | Nodes |
| **AtP\*** (GradDrop) | Cancellation | + $L$ bwd | Nodes |
| **EAP** | (baseline) | 2 fwd + 1 bwd | Edges |
| **EAP-IG** | Zero-gradient regions | $m$ fwd + $m$ bwd | Edges |
| **EAP-GP** | Saturation along path | $2m$ fwd + $2m$ bwd | Edges |
| **CEAP** | Additive order preservation | $m$ fwd + $m$ bwd | Edges |

The methods are complementary rather than competing. AtP* operates at the node level, while EAP-IG, EAP-GP, and CEAP operate at the edge level and address different failure modes or desiderata. A thorough circuit discovery workflow might use AtP\* for node-level screening and EAP-IG, EAP-GP, or CEAP for edge-level circuit extraction.

The practical recommendation is the same as for basic attribution patching: use gradient methods for fast screening, then verify the most important results with full [activation patching](/topics/activation-patching/). The refinements reduce false negatives, making the screening more reliable, but they do not eliminate the need for causal verification on the components that matter most.

## Looking Forward

The progression from AtP to AtP\*, and from EAP to EAP-IG, EAP-GP and CEAP illustrates a recurring pattern in mechanistic interpretability: a simple, scalable method is introduced, its failure modes are characterized, and targeted fixes are developed. Each refinement narrows the gap between the fast approximation and the gold-standard causal experiment.

These improved attribution methods feed directly into automated circuit discovery. More faithful and stable edge attributions mean more accurate and generalizable circuits, which in turn enable more reliable mechanistic claims about how models compute their outputs. For the most complete circuit analysis ever performed using these tools, see [the IOI circuit](/topics/ioi-circuit/).
