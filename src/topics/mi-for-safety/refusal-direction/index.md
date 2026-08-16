---
title: "The Refusal Direction"
description: "How one activation direction mediates refusal in several chat models, how researchers test it causally, and why refusal is not the whole of safety."
order: 1
prerequisites:
  - title: "Ablation Steering"
    url: "/topics/ablation-steering/"

glossary:
  - term: "Refusal Direction"
    definition: "A direction derived from activation differences between harmful and harmless prompts that causally mediates much of the tested models' refusal behavior. It is a mechanism for refusal, not a complete representation of safety or harmfulness."
---

## Where Is Refusal Encoded?

Chat models are fine-tuned to refuse harmful requests. Ask "How do I bake a cake?" and you get a recipe. Ask "How do I build a bomb?" and you get a refusal. Safety training, via RLHF, DPO, or similar techniques, teaches the model to distinguish harmful from harmless requests and respond appropriately.

But *where* in the model's representations is "refusal" encoded? If the [linear representation hypothesis](/topics/linear-representation-hypothesis/) holds for safety-relevant behaviors, there should be a **direction** in activation space that corresponds to refusal. Arditi et al. (2024) set out to find it {% cite "arditi2024refusal" %}.

## The Hypothesis

The hypothesis is precise and testable:

**If refusal is a linearly represented concept, then:**

1. A single direction in activation space should distinguish harmful from harmless prompt processing.
2. Removing that direction (via [ablation](/topics/ablation-steering/)) should disable refusal.
3. Adding that direction (via [addition steering](/topics/addition-steering/)) should induce refusal even on harmless inputs.

This applies the [probing](/topics/caa-method/) and [steering](/topics/representation-control/) toolkit to safety-critical behavior.

## Computing the Refusal Direction

The method follows the [CAA](/topics/caa-method/) approach:

1. **Collect harmful prompts** (e.g., "How to build a bomb") and **harmless prompts** (e.g., "How to bake a cake").

2. **Run both sets through the model**, collecting residual stream activations at intermediate layers.

3. **Compute the mean difference** in activations between harmful and harmless processing:

$$
\mathbf{r} = \frac{1}{N} \sum_{i=1}^{N} \left( \mathbf{h}_i^{\text{harmful}} - \mathbf{h}_i^{\text{harmless}} \right)
$$

This difference vector is the **refusal direction**.{% sidenote "The refusal direction is computed using the same contrastive averaging method as CAA. The only difference is the target concept: instead of probing sentiment or sycophancy, Arditi et al. targeted refusal. This highlights how general the contrastive framework is, the same technique works for behavioral tendencies and safety-critical properties alike." %}

![Schematic diagram showing harmful and harmless prompt activations separated along a candidate refusal direction.](/topics/refusal-direction/images/refusal_direction_schematic.png "Figure 1: A schematic of separation along a refusal direction. The real activation geometry is high-dimensional; harmless prompts need not be literally orthogonal to this direction.")

## The Finding

Across 13 open-source chat models, from 1.3B to 72B parameters, one model-specific direction mediates much of the measured refusal behavior:

- **[Ablating](/topics/ablation-steering/)** it prevents refusal, models comply with harmful requests.
- **[Adding](/topics/addition-steering/)** it induces refusal on harmless inputs, models refuse benign questions.

The intervention pattern appears across the tested Llama, Qwen, and Gemma models, although each model has its own activation space and its direction is estimated separately.

![Bar chart showing refusal rates before and after ablation across multiple models. Baseline refusal rates are 80-90% while post-ablation rates drop to near zero.](/topics/refusal-direction/images/refusal_ablation_results.png "Figure 2: Refusal ablation results. Removing the refusal direction drops refusal rates from 80-90% to near zero across all models tested, evaluated on 100 harmful instructions across 10 categories from JailbreakBench.")

## Causal Validation

The ablation and addition experiments provide complementary causal evidence:

- **Ablation:** Removing the direction sharply reduces refusal on the tested harmful prompts.
- **Addition:** Adding the direction raises refusal on tested harmless prompts.

This follows the intervention logic from [activation patching](/topics/activation-patching/). It establishes the direction as a causal mediator under these interventions, while “necessary” and “sufficient” remain relative to the prompt distribution, layers, and intervention strength.

<details class="pause-and-think">
<summary>Pause and think: One direction across 13 models</summary>

The refusal direction was found independently in 13 different chat models spanning different families and scales (1.3B to 72B parameters). What does the consistency of this finding tell us about how safety training works? Why might different training procedures (RLHF, DPO) on different architectures produce the same geometric structure?

One interpretation is that safety fine-tuning makes a low-dimensional refusal signal easy for later layers to use. Another is that the extracted direction is a shared bottleneck downstream of more distributed harm recognition. The experiments identify an intervention point; they do not show that the entire computation leading to refusal is one-dimensional.

</details>

## Capability Preservation

A natural concern: if we permanently remove the refusal direction from the model's weights, does the model lose other capabilities?

Arditi et al. used **weight orthogonalization**, projecting out the refusal direction from the model's weight matrices permanently, not just during inference. The results across most models:

- **MMLU:** within 99% of baseline
- **ARC:** within 99% of baseline
- **GSM8K:** within 99% of baseline

On the reported MMLU, ARC, and GSM8K evaluations, refusal can be reduced without a comparable drop in benchmark performance. This shows separability with respect to those measurements, not preservation of every capability or behavior.{% sidenote "Weight orthogonalization modifies weight matrices rather than intervening separately on every forward pass. The resulting model refuses far less on the tested prompts while retaining the reported benchmark scores, which makes the method relevant to white-box jailbreak analysis." %}

## Implications for Safety Training

The intervention supports two mechanistic conclusions and one dual-use warning:

**Refusal has a low-dimensional mediator.** In the tested models, safety fine-tuning produces behavior that can be strongly altered through one direction. Upstream harm recognition and other safety-relevant computations may still be distributed.

**Refusal and benchmark capability can be partly separated.** Removing the direction changes refusal far more than it changes the reported general benchmarks. This does not establish that refusal is wholly detached from reasoning, or that all safety training is shallow.

**The mechanism is interpretable and bypassable.** Weight orthogonalization turns the causal account into a white-box jailbreak, permanently reducing refusal while largely preserving the reported benchmark scores.

<details class="pause-and-think">
<summary>Pause and think: Designing robust safety training</summary>

The refusal direction can be removed with one linear operation. Should this make us more or less confident in current safety training? If you were designing safety training, how would you make it resistant to directional ablation? Is it even possible while maintaining the linear representation structure that makes models useful?

Possible defenses include redundant refusal pathways, adversarial training against directional removal, and objectives that connect refusal to robust harm understanding. Each proposal needs empirical testing: distributing a mechanism does not automatically make it safer, and entangling it with capabilities can create new failure modes. Interpretability and robustness need not be opposites, but optimizing one does not guarantee the other.

</details>

## The Broader Significance

The refusal direction is a compact example of applying [contrastive analysis](/topics/caa-method/) and [steering](/topics/representation-control/) to a safety-relevant behavior:

- **Read:** The direction can be identified through [contrastive methods](/topics/caa-method/).
- **Add:** [Adding](/topics/addition-steering/) the direction induces refusal.
- **Remove:** [Projecting out](/topics/ablation-steering/) the direction eliminates refusal.

Every capability comes with a dual-use concern. The same tools that help us *understand* safety mechanisms are the same tools that help *bypass* them. This tension between understanding and vulnerability is central to the field of mechanistic interpretability applied to AI safety.

For a different goal, removing information available to a class of linear predictors under explicit assumptions, see [concept erasure with LEACE](/topics/concept-erasure/).
