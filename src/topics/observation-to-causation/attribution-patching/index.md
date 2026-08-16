---
title: "Attribution Patching and Path Patching"
description: "Efficient gradient-based approximations to activation patching, and path patching for tracing information flow along specific edges in the computational graph."
order: 2
prerequisites:
  - title: "Activation Patching and Causal Interventions"
    url: "/topics/activation-patching/"

glossary:
  - term: "Attribution Patching"
    definition: "A linearized approximation of activation patching that uses gradients to estimate the causal effect of patching each component, making it computationally feasible to scan all components in a single forward and backward pass."
  - term: "Path Patching"
    definition: "A refined variant of activation patching that isolates the effect of a specific computational path between two components, controlling for all other paths. This enables precise attribution of behavior to individual connections in a circuit."
---

## The Scalability Problem

[Activation patching](/topics/activation-patching/) is the foundation of causal interpretability: replace an activation, measure the effect, and establish which components matter. But it has a fundamental scaling problem. Each component tested requires a separate forward pass through the model. In GPT-2 Small, testing all 144 attention heads and 12 MLP layers means 156 forward passes. In GPT-3, with roughly 4.7 million neurons, individually testing every neuron is computationally infeasible.

The cost creates a methodological bottleneck: screen only a tractable subset and risk missing structure, or spend enough compute to patch every candidate. A first-order approximation makes a model-wide sweep possible with a small number of passes.

**Attribution patching** estimates many patching effects from gradients {% cite "nanda2023attribution" %}. **Path patching** asks which connections carry an effect between components {% cite "conmy2023ioi" %}. Both trade exactness or simplicity for scale and resolution.

## Attribution Patching: The Gradient Approximation

Attribution patching approximates the effect of patching every component without performing each patch. A first-order Taylor approximation combines how sensitive the metric is to an activation (the gradient) with how much that activation differs between clean and corrupted runs (the activation difference). Their product estimates the patching effect.{% sidenote "Attribution patching is closely related to 'gradient times input' attribution methods from the broader interpretability literature. Instead of multiplying the gradient by the input itself, it uses the *difference* between clean and corrupted activations, focusing the attribution on task-relevant changes rather than absolute activation magnitudes." %}

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

**The practical implication.** Attribution patching is best used as a fast screening tool, not as a substitute for actual activation patching. The recommended workflow is: sweep the entire model with attribution patching to identify the most promising components in a single pass, then verify the top candidates with full activation patching. Think of it as a microscope's low-magnification mode, scan the whole slide quickly, then switch to high magnification on the interesting regions.

<details class="pause-and-think">
<summary>Pause and think: When would attribution patching be misleading?</summary>

Consider a component whose patching effect is highly nonlinear, for instance, a component where small perturbations have no effect but large perturbations cause a phase transition in model behavior. What would attribution patching report for this component, and how would it compare to full activation patching?

Attribution patching would report a small effect because the gradient at the evaluation point is near zero, while full activation patching would reveal a large finite-change effect. A substantial disagreement is therefore evidence that the local linear approximation is inadequate at that location.

</details>

## Path Patching: From Components to Connections

Standard activation patching replaces a component's entire output, combining every downstream use of that write. Head $H$ might supply task-relevant information to head $K$ while also affecting head $J$ through an irrelevant route. A whole-output patch measures their net effect but does not identify which downstream consumer uses the information.

Path patching asks a more targeted question: is the specific connection from $H$ to $K$ important? Instead of replacing $H$'s entire output in the residual stream, path patching replaces only the component of $H$'s output that flows into a specific downstream consumer $K$.{% sidenote "Implementing path patching is more involved than standard activation patching. You need to identify how a downstream head reads from the residual stream (through its QKV projections) and selectively patch only the contribution from the upstream head. In practice, this is done by patching the input to the downstream head's query, key, or value computation rather than the upstream head's output directly." %}

The conceptual shift is from **nodes** to **edges** in the computational graph:

- **Activation patching** tests nodes: "Is component $H$ important?"
- **Path patching** tests edges: "Is the connection $H \to K$ important?"

In the [IOI circuit](/topics/ioi-circuit/), activation patching implicates both S-Inhibition and Name Mover heads {% cite "wang2022ioi" %}. Path patching narrows the hypothesis to the route into Name Mover *queries*, supporting an account in which S-Inhibition changes where Name Movers attend rather than what their value pathway copies.

## Automated Circuit Discovery

Path patching, applied systematically, becomes a tool for automated circuit discovery. Conmy et al. developed the **ACDC algorithm** (Automatic Circuit DisCovery) to do exactly this {% cite "conmy2023ioi" %}.

<figure>
  <img src="images/acdc-circuit-discovery.png" alt="Left: the full computational graph of GPT-2 Small with hundreds of nodes and edges, with the ACDC-recovered circuit highlighted in red. Right: the extracted circuit shown as a clean graph with labeled nodes representing attention heads grouped by function (Duplicate Token, Induction, S-Inhibition, Name Mover, Backup Name Mover).">
  <figcaption>Automated circuit discovery with ACDC on the IOI task in GPT-2 Small. The full computational graph (left) is pruned to a sparse circuit (right) that closely matches the manually discovered IOI circuit. From Conmy et al., <em>Towards Automated Circuit Discovery for Mechanistic Interpretability</em>. {%- cite "conmy2023ioi" -%}</figcaption>
</figure>

ACDC starts with a chosen computational graph and treats its edges as candidate connections. It then tests edges in an order and prunes those whose removal falls below a selected effect threshold. What remains is a sparse circuit candidate. Because effects can interact, the greedy result need not be globally minimal and can depend on the graph, metric, baseline, ordering, and threshold.

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

Attribution, activation, and path patching answer related questions at different costs. One useful workflow applies them in stages:{% sidenote "This sequence is a practical heuristic, not a required recipe. The right validation depends on the model, task, intervention size, and claim being made." %}

1. **Attribution patching** for broad screening. Sweep the entire model to identify which components show the largest estimated patching effects. This narrows the search from thousands of components to a manageable set of candidates.

2. **Activation patching** for confirmation. Run full patching on the top candidates to verify that the gradient approximation was accurate. This catches components where the linear approximation was misleading.

3. **Path patching** for mechanistic understanding. Once the key components are identified, trace the connections between them. This reveals not just which components participate in the circuit but how information flows between them.

Attribution patching may localize an effect to layer 9; activation patching can test head 9.9 directly; path patching can then ask whether that head receives S-Inhibition information through its queries and copies a name through its OV circuit. Each intervention narrows the causal claim.

To see this full toolkit applied to the most ambitious circuit analysis ever attempted, continue to [The IOI Circuit: Discovery and Mechanism](/topics/ioi-circuit/).
