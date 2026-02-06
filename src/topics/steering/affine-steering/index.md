---
title: "Affine Steering"
description: "How combining directional ablation with an affine correction and tunable addition unifies addition and ablation steering into a single, more precise intervention."
order: 3
prerequisites:
  - title: "Ablation Steering"
    url: "/topics/ablation-steering/"

glossary:
  - term: "Affine Concept Editing (ACE)"
    definition: "A steering intervention that erases the component along a concept direction, re-centers at the null-behavior mean, and adds a tunable amount of the direction back. Generalizes both addition steering and directional ablation as special cases."
---

## Two Tools, One Intervention

[Addition steering](/topics/addition-steering/) shifts the model toward a behavior by adding a direction. [Ablation steering](/topics/ablation-steering/) suppresses a behavior by projecting out a direction. We have been treating these as separate tools, each operating on concept directions identified through [probing](/topics/caa-method/).

But there is a gap between them. Addition changes the model's behavior without removing its existing tendency. Ablation removes the tendency without controlling what replaces it. And in practice, ablation alone sometimes fails: on certain architectures, projecting out the [refusal direction](/topics/refusal-direction/) produces incoherent text rather than compliant responses.{% sidenote "Marshall et al. (2024) found that directional ablation on RWKV v5 produced complete gibberish, while the same direction worked fine with addition steering. The failure is not in the direction itself but in what happens when the model's activations land in a region far from anything it encountered during training." %}

Marshall et al. (2024) show that both methods are incomplete pieces of a single, more principled intervention: **Affine Concept Editing (ACE)** {% cite "marshall2024ace" %}.

## Why Affine?

The key observation is that the origin of activation space has no special meaning. Typical model activations live in a region far from the zero vector. When we project out a direction via ablation, we remove the component along that direction and leave the rest. But "the rest" is centered at the origin, which may be far from any region the model has learned to generate coherently from.

Consider what happens geometrically. Activations for compliant responses cluster around some mean $\mathbf{r}^-$. Activations for refusing responses cluster around some mean $\mathbf{r}^+$. The refusal direction $\mathbf{r} = \mathbf{r}^+ - \mathbf{r}^-$ connects these clusters. Directional ablation projects onto the hyperplane orthogonal to $\mathbf{r}$, which passes through the *origin*. But the compliant cluster is not centered at the origin. It is centered at $\mathbf{r}^-$, which has a non-zero component along $\mathbf{r}$.

> **Affine vs. Linear:** A linear function maps $\mathbf{0} \mapsto \mathbf{0}$. An affine function includes a constant offset: $f(\mathbf{v}) = A\mathbf{v} + \mathbf{b}$. Behavioral encoding in activation space is affine because the zero vector is not the "default" behavior. The default behavior has its own location in activation space, and interventions need to account for that offset.

This is the source of ablation's failure mode. Projecting out the refusal direction centers the result at the origin's projection, not at the compliant cluster. On models where these differ significantly, the result is incoherent.

## The ACE Formula

ACE combines three operations into one intervention:

$$
\mathbf{v}' = \underbrace{\mathbf{v} - \text{proj}_\mathbf{r}(\mathbf{v})}_{\text{erase}} + \underbrace{\text{proj}_\mathbf{r}(\mathbf{r}^-)}_{\text{re-center}} + \underbrace{\alpha \cdot \mathbf{r}}_{\text{steer}}
$$

where:
- $\mathbf{v}$ is the original activation
- $\mathbf{r} = \mathbf{r}^+ - \mathbf{r}^-$ is the concept direction (difference in means between the behavior and null-behavior classes)
- $\text{proj}_\mathbf{r}(\mathbf{v})$ is the component of $\mathbf{v}$ along $\mathbf{r}$
- $\mathbf{r}^-$ is the mean activation for the null-behavior class (e.g., compliant responses)
- $\alpha$ is a tunable scalar controlling steering strength

The three terms do the following:

1. **Erase.** Remove whatever component the activation has along the concept direction. After this step, the activation carries no information about whether the behavior is active. This is identical to [directional ablation](/topics/ablation-steering/).

2. **Re-center.** Add back the component that the null-behavior mean has along the concept direction. This shifts the erased activation to where compliant activations typically live, rather than leaving it at the origin. This is the affine correction, the term that ablation alone misses.

3. **Steer.** Add a tunable amount of the concept direction. At $\alpha = 0$, the model behaves as if it is in the null-behavior state. At $\alpha = 1$, it behaves as if in the full-behavior state. Values outside $[0, 1]$ extrapolate beyond the training distribution.

<figure>
  <img src="images/ace_comparison.png" alt="Three panels comparing CAA, directional ablation, and ACE geometrically. In each panel, green circles represent activation vectors, black dots mark the class means r+ and r-, and dashed lines show hyperplanes. Left (CAA): arrows shift activations uniformly downward, landing them far from either class mean. Center (directional ablation): arrows project activations onto the hyperplane through the origin O, clustering them there instead of near r-. Right (ACE): arrows project activations onto the hyperplane near r-, then steer toward r+, landing them in the correct target region.">
  <figcaption>Geometric comparison of three steering methods. Left: CAA shifts all activations by the same vector, without erasing the existing component. Center: directional ablation projects onto the hyperplane through the origin O, which may be far from the null-behavior mean r-. Right: ACE projects onto the hyperplane through r-, then steers by a controlled amount toward r+. From Marshall et al., <em>Refusal in LLMs is an Affine Function</em>. {%- cite "marshall2024ace" -%}</figcaption>
</figure>

<details class="pause-and-think">
<summary>Pause and think: Recovering addition and ablation</summary>

ACE claims to unify addition and ablation as special cases. Can you see how?

Setting only the steer term (dropping erase and re-center) gives $\mathbf{v}' = \mathbf{v} + \alpha \cdot \mathbf{r}$, which is [addition steering](/topics/addition-steering/). Setting only the erase term (dropping re-center and steer) gives $\mathbf{v}' = \mathbf{v} - \text{proj}_\mathbf{r}(\mathbf{v})$, which is [directional ablation](/topics/ablation-steering/). ACE adds the re-center term that neither method includes on its own, and combines all three into a single intervention where each piece plays a role.

</details>

## Standardization

A practical problem with [addition steering](/topics/addition-steering/) is that the same $\alpha$ value has different effects on different kinds of prompts. Adding the refusal direction with $\alpha = 5$ might cause the model to refuse a harmful prompt (where it was already leaning toward refusal) but not a harmless one (where refusal requires a larger push). The mapping from $\alpha$ to behavior depends on the input.

ACE addresses this through **standardization**. Because the erase step removes the input's existing component along the concept direction, and the re-center step places it at the null-behavior baseline, the steer step operates from a consistent starting point regardless of the input. The parameter $\alpha$ has a consistent meaning:

- $\alpha = 0$: null-behavior (e.g., comply)
- $\alpha = 1$: full behavior (e.g., refuse)

Marshall et al. show that ACE produces nearly overlapping refusal curves for harmful and harmless prompts, meaning the same $\alpha$ value produces the same degree of refusal regardless of prompt type. With addition steering alone, the curves diverge substantially {% cite "marshall2024ace" %}.

## Results

ACE was evaluated on 10 open-weight models, including Llama 3 8B and 70B, RWKV v5, Qwen, Yi, and Gemma variants {% cite "marshall2024ace" %}.

**Standardization.** Across all models, ACE produced more consistent steering than addition alone. The gap between harmful-prompt and harmless-prompt refusal curves was consistently smaller with ACE.

**Rescuing incoherent ablation.** On RWKV v5, directional ablation of the refusal direction produced completely incoherent outputs. ACE on the same model and direction produced coherent, well-formed compliant text. The affine correction term was the difference between gibberish and working steering.

**Cross-architecture generality.** The improvement held across transformer and non-transformer architectures, suggesting that affine encoding of behavioral concepts is a general property of language models, not an artifact of a specific architecture.

<details class="pause-and-think">
<summary>Pause and think: When does the affine correction matter?</summary>

The affine correction re-centers at $\mathbf{r}^-$ after erasing the concept direction. Under what conditions would this correction be negligible? When would it be essential?

The correction is negligible when $\mathbf{r}^-$ has a near-zero component along $\mathbf{r}$, meaning the null-behavior mean already lies close to the hyperplane orthogonal to the concept direction passing through the origin. In that case, ablation alone lands near the right place. The correction is essential when $\mathbf{r}^-$ has a large component along $\mathbf{r}$, meaning the null-behavior cluster is far from the origin in the concept direction. This is more likely for behaviors (like refusal) that are overlaid onto a model whose "default" state already has a strong tendency in one direction.

</details>

## Limitations

**Imperfect standardization.** ACE improves standardization but does not achieve it perfectly. Optimal $\alpha$ values sometimes fall outside $[0, 1]$, and some input dependence remains. The authors attribute this to imperfect concept erasure: directional ablation removes a single linear direction, but the concept may be encoded partly in nonlinear interactions that survive projection.{% sidenote "The authors tested whether LEACE (a method for provably complete linear concept erasure) would improve ACE. It did not help and was in some cases detrimental. This suggests the residual input-dependence comes from genuinely nonlinear encoding rather than from incomplete linear erasure." %}

**Requires class means.** ACE needs $\mathbf{r}^+$ and $\mathbf{r}^-$, the mean activations for the two behavior classes. This requires labeled examples of both behaviors, the same data requirement as [CAA](/topics/caa-method/). The method cannot be applied in settings where only the concept direction is available without the class means.

**Single direction.** Like addition and ablation, ACE operates on a single linear direction. Behaviors encoded across multiple interacting directions, or encoded nonlinearly, are not fully captured.

## The Geometric Picture

ACE has a clean geometric interpretation that extends the pictures from [addition](/topics/addition-steering/) and [ablation](/topics/ablation-steering/):

1. **Ablation** projects onto the hyperplane through the **origin** orthogonal to $\mathbf{r}$.
2. **ACE** projects onto the hyperplane through $\mathbf{r}^-$ orthogonal to $\mathbf{r}$, then translates by $\alpha \cdot \mathbf{r}$.

The difference is where the hyperplane sits. Ablation uses the origin as the reference point. ACE uses the empirical null-behavior mean. When the null-behavior mean is far from the origin along the concept direction, this difference matters.

## Looking Forward

ACE formalizes what addition and ablation each get right and combines them into a single intervention that is more precise than either alone. The insight that behavioral encoding is *affine* rather than linear is simple but consequential: it means the correct intervention must account for where the "default" behavior lives in activation space, not just the direction of the target behavior.

The broader framework of [representation control](/topics/representation-control/) now has three levels of sophistication: addition (shift toward a concept), ablation (remove a concept), and affine editing (erase, re-center, and steer with a single consistent parameter). For guaranteed concept removal that goes beyond single-direction projection, see [concept erasure with LEACE](/topics/concept-erasure/).
