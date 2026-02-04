---
title: "Attribution Patching and Path Patching"
description: "Efficient gradient-based approximations to activation patching, and path patching for tracing information flow along specific edges in the computational graph."
prerequisites:
  - title: "Activation Patching and Causal Interventions"
    url: "/topics/activation-patching/"
difficulty: "intermediate"
block: "observation-to-causation"
category: "methods"
---

## The Scalability Problem

[Activation patching](/topics/activation-patching/) is the foundation of causal interpretability: replace an activation, measure the effect, and establish which components matter. But it has a fundamental scaling problem. Each component tested requires a separate forward pass through the model. In GPT-2 Small, testing all 144 attention heads and 12 MLP layers means 156 forward passes. In GPT-3, with roughly 4.7 million neurons, individually testing every neuron is computationally infeasible.

This is not just a practical inconvenience. It creates a methodological bottleneck. Researchers who want to screen the entire model for interesting components are forced to choose between testing a tractable subset (and potentially missing important structure) or spending enormous compute on exhaustive search. We need a way to approximate activation patching that scales to the full model in a single sweep.

Attribution patching solves this problem using gradient-based approximation {% cite "nanda2023attribution" %}. Path patching extends the analysis from components to connections {% cite "conmy2023ioi" %}. Together, they complete the causal toolkit introduced in the previous article.

## Attribution Patching: The Gradient Approximation

The core insight of attribution patching is that we can approximate the effect of patching each component without actually performing the patch. The idea relies on a first-order Taylor approximation: if we know how sensitive the output metric is to changes at each activation (the gradient), and we know how much each activation changes between clean and corrupted runs (the activation difference), we can estimate the patching effect as their product.{% sidenote "Attribution patching is closely related to 'gradient times input' attribution methods from the broader interpretability literature. The key difference is that instead of multiplying the gradient by the input itself, we multiply it by the *difference* between clean and corrupted activations. This focuses the attribution on task-relevant changes rather than absolute activation magnitudes." %}

Formally, the estimated patching effect for activation $a_i$ is:

$$
\text{Patch effect of } a_i \approx \nabla_{a_i}\mathcal{L} \cdot (a_i^{\text{clean}} - a_i^{\text{corrupt}})
$$

The gradient $\nabla_{a_i}\mathcal{L}$ captures the local sensitivity of the metric to perturbations at $a_i$. The difference $(a_i^{\text{clean}} - a_i^{\text{corrupt}})$ captures how much the activation actually changes between the two runs. Their dot product estimates how much the metric would change if we replaced the corrupted activation with the clean one at that location.

The efficiency gain is dramatic. Full activation patching requires $O(n)$ forward passes, where $n$ is the number of components. Attribution patching requires exactly two forward passes (one clean, one corrupted) plus one backward pass (to compute gradients). That is three passes total, regardless of model size. For GPT-3 with 4.7 million neurons, this means 3 passes instead of 4.7 million.

## When the Approximation Holds

The accuracy of attribution patching depends on whether the first-order (linear) approximation captures the true relationship between activation changes and metric changes.

**Where it works well.** Transformers are, as Nanda puts it, "shockingly linear objects" {% cite "nanda2023attribution" %}. For small activations like individual attention head outputs and individual neurons, the linear approximation is often surprisingly accurate. The patching effect at this scale is genuinely close to linear in the activation perturbation, so the gradient captures most of what matters. Attribution patching at the head level and neuron level typically agrees well with full activation patching on the same components.

**Where it breaks down.** For large activations such as entire residual streams at a layer, the approximation degrades. Nonlinearities from softmax, MLP activation functions, and LayerNorm all violate the linearity assumption. These nonlinearities mean that the effect of patching an entire layer's residual stream is not well-approximated by a gradient. The Taylor expansion assumes small perturbations, and patching an entire residual stream is a large perturbation.{% sidenote "One way to understand this: the gradient gives you the slope of the function at a point. For a linear function, the slope is constant, so the prediction is exact regardless of perturbation size. For a nonlinear function, the slope changes as you move away from the evaluation point, and the prediction becomes increasingly inaccurate for larger perturbations." %}

**The practical implication.** Attribution patching is best used as a fast screening tool, not as a substitute for actual activation patching. The recommended workflow is: sweep the entire model with attribution patching to identify the most promising components in a single pass, then verify the top candidates with full activation patching. Think of it as a microscope's low-magnification mode -- scan the whole slide quickly, then switch to high magnification on the interesting regions.

<details class="pause-and-think">
<summary>Pause and think: When would attribution patching be misleading?</summary>

Consider a component whose patching effect is highly nonlinear -- for instance, a component where small perturbations have no effect but large perturbations cause a phase transition in model behavior. What would attribution patching report for this component, and how would it compare to full activation patching?

Attribution patching would report a small effect (because the gradient at the evaluation point is near zero), while full activation patching would reveal the large effect of the actual clean-to-corrupted perturbation. This is a case where the linear approximation fundamentally misleads: components with threshold-like behavior are poorly captured by gradients. When you find components where attribution patching and full activation patching disagree significantly, that disagreement itself is informative -- it reveals nonlinearity at that location.

</details>

## Path Patching: From Components to Connections

Standard activation patching tests whether a component is important by replacing its entire output. But this conflates all the different roles a component might play. Head $H$ writes a vector to [the residual stream](/topics/attention-mechanism/#the-residual-stream), and that vector is read by every downstream head and MLP. Head $H$ might send critical information to head $K$ (say, the identity of a duplicated name) while simultaneously sending irrelevant information to head $J$ (say, positional encoding noise). Standard activation patching cannot distinguish these pathways -- it can only tell you that $H$ matters overall, not where its output is consumed.

Path patching asks a more targeted question: is the specific connection from $H$ to $K$ important? Instead of replacing $H$'s entire output in the residual stream, path patching replaces only the component of $H$'s output that flows into a specific downstream consumer $K$.{% sidenote "Implementing path patching is more involved than standard activation patching. You need to identify how a downstream head reads from the residual stream (through its QKV projections) and selectively patch only the contribution from the upstream head. In practice, this is done by patching the input to the downstream head's query, key, or value computation rather than the upstream head's output directly." %}

The conceptual shift is from **nodes** to **edges** in the computational graph:

- **Activation patching** tests nodes: "Is component $H$ important?"
- **Path patching** tests edges: "Is the connection $H \to K$ important?"

This distinction is more than theoretical. Consider the [IOI circuit](/topics/ioi-circuit/) {% cite "wang2022ioi" %}. Activation patching reveals that S-Inhibition heads and Name Mover heads are both important. But path patching reveals the specific connection: S-Inhibition heads modify the *queries* of Name Mover heads (not their keys or values). This tells us the mechanism -- S-Inhibition heads change *where* the Name Movers attend, not *what* the Name Movers copy. Without path patching, we would know which heads matter but not how they communicate.

## Automated Circuit Discovery

Path patching, applied systematically, becomes a tool for automated circuit discovery. Conmy et al. developed the **ACDC algorithm** (Automatic Circuit DisCovery) to do exactly this {% cite "conmy2023ioi" %}.

ACDC starts with the full computational graph of the model, treating every possible edge between components as a candidate connection. It then iteratively tests each edge using path patching: if removing an edge has negligible effect on model behavior for the task, that edge is pruned. After testing all edges, what remains is the circuit -- the minimal subgraph that accounts for the model's behavior.

The algorithm proceeds in topological order, working backward from the output:

1. Start with all edges in the computational graph
2. For each edge (in reverse topological order), temporarily remove it
3. If the model's behavior on the task is unchanged, permanently prune the edge
4. If behavior degrades, keep the edge
5. The surviving edges define the circuit

The threshold for "unchanged" is a tunable parameter, creating a tradeoff between faithfulness (keeping all edges that matter) and minimality (removing as many as possible). A strict threshold keeps more edges and produces a more faithful but less interpretable circuit. A loose threshold prunes aggressively and produces a more minimal but potentially less faithful circuit.

ACDC was validated on the IOI task, where it recovered a circuit closely matching the one Wang et al. found through manual analysis {% cite "wang2022ioi" %}. The key advantage is speed: ACDC can screen thousands of edges in hours, while manual circuit discovery took months.

<details class="pause-and-think">
<summary>Pause and think: Choosing the pruning threshold</summary>

ACDC prunes an edge if removing it changes the model's behavior by less than a threshold $\tau$. What happens if $\tau$ is set too high? What happens if it is set too low?

If $\tau$ is too high, edges that contribute modestly to the task are pruned, and the resulting circuit may miss secondary components like Backup Name Movers. The circuit becomes more minimal but less faithful. If $\tau$ is too low, the circuit retains many irrelevant edges and provides little simplification over the full model. The goal is to find the threshold where the circuit captures the primary mechanism without excessive noise. In practice, researchers often sweep across multiple threshold values and compare the resulting circuits.

</details>

## Combining the Tools

Attribution patching and path patching are not alternatives to activation patching -- they extend it. A typical circuit discovery workflow uses all three tools at different stages:{% sidenote "This three-stage workflow is the standard approach in modern mechanistic interpretability. Each tool has its strengths: attribution patching for breadth, activation patching for precision, and path patching for mechanistic understanding. Skipping any stage leaves gaps in the analysis." %}

1. **Attribution patching** for broad screening. Sweep the entire model to identify which components show the largest estimated patching effects. This narrows the search from thousands of components to a manageable set of candidates.

2. **Activation patching** for confirmation. Run full patching on the top candidates to verify that the gradient approximation was accurate. This catches components where the linear approximation was misleading.

3. **Path patching** for mechanistic understanding. Once the key components are identified, trace the connections between them. This reveals not just which components participate in the circuit but how information flows between them.

The progression moves from "something is happening at layer 9" (attribution patching) to "head 9.9 is causally important" (activation patching) to "head 9.9 receives S-Inhibition information through its queries and copies name identity through its OV circuit to the output logits" (path patching). Each step adds resolution and mechanistic detail.

To see this full toolkit applied to the most ambitious circuit analysis ever attempted, continue to [The IOI Circuit: Discovery and Mechanism](/topics/ioi-circuit/).
