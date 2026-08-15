---
title: "Concept Erasure with LEACE"
description: "How LEACE removes linearly decodable information with minimum expected distortion, what its guarantee covers, and why nonlinear information may remain."
order: 2
prerequisites:
  - title: "Ablation Steering"
    url: "/topics/ablation-steering/"

glossary:
  - term: "Concept Erasure"
    definition: "Transforming representations so a chosen label is no longer recoverable by a specified class of predictors. LEACE targets linear predictors while minimizing expected squared distortion."
  - term: "LEACE"
    definition: "Least-squares Concept Erasure: a closed-form, covariance-aware transformation that makes a target label linearly guarded under its population assumptions with minimum expected squared distortion."
---

## Beyond Simple Ablation

[Addition steering](/topics/addition-steering/) *adds* a direction to influence behavior. [Ablation steering](/topics/ablation-steering/) removes one chosen direction. That projection guarantees the selected component is gone, but it does not remove every linear direction that predicts the label, and a nonlinear classifier may still recover information from what remains.

LEACE asks a narrower question that admits a proof: can we transform a representation so no linear predictor beats the best constant predictor for a target label under a specified population distribution and loss family?

Belrose et al. (2023) introduced **LEACE** (LEAst-squares Concept Erasure), a closed-form method for constructing such a linear guard {% cite "belrose2023leace" %}.

> **LEACE (LEAst-squares Concept Erasure):** A closed-form affine transformation that makes class labels linearly guarded under the method's population assumptions while minimizing expected squared distortion.

Within the class covered by its theorem, LEACE strengthens “remove” from a one-direction intervention to a population-level guarantee about linear prediction.{% sidenote "The method's name uses 'concept erasure,' but the theorem concerns a target variable, a population distribution, a family of losses, and linear predictors. Keeping those qualifiers visible prevents 'erasure' from being mistaken for removal of every semantic or behavioral trace." %}

## The LEACE Guarantee

Unlike iterative methods such as INLP (Iterative Nullspace Projection), which repeatedly finds and removes linear classifiers, LEACE has a **mathematical guarantee**:

- After LEACE, the transformed representation is **linearly guarded**: under the population distribution used to compute the transformation, linear predictors cannot improve on the best constant predictor for the target label under the losses covered by the theorem.

- Among linear guards in the theorem's setting, the modification minimizes the expected squared difference between the original and transformed representations.

- The solution is computed in **closed form** from population moments, or from their finite-sample estimates. It does not require the repeated classifier-training loop used by INLP.{% sidenote "Closed form removes one optimization problem, but finite data still introduces estimation error. A held-out probe can test how well the empirical transformation guards a new sample from the same distribution." %}

LEACE first whitens the representation so covariance is measured in an isotropic space, projects out the label-correlated subspace there, and maps back. The result is generally not an ordinary orthogonal projection in the original coordinates. It removes the linear signal identified by the population moments while minimizing expected squared change.

<figure>
  <img src="images/leace-projection-steps.png" alt="Four panels showing the LEACE projection process. The original data has two classes (orange and blue) spread along a concept subspace direction. After whitening, the data has equal variance in all directions. The erasure step projects onto the orthogonal complement of the concept subspace, collapsing the two classes together. Unwhitening restores the original covariance structure, but with the concept information removed.">
  <figcaption>The three steps of the LEACE projection. First, whitening ensures equal variance in all directions. Then, orthogonal projection onto the complement of the concept subspace removes all linear information about the concept. Finally, unwhitening restores the original covariance structure. From Belrose et al., <em>LEACE: Perfect Linear Concept Erasure in Closed Form</em>. {%- cite "belrose2023leace" -%}</figcaption>
</figure>

<details class="pause-and-think">
<summary>Pause and think: Linear versus non-linear erasure</summary>

Under what conditions could a nonlinear classifier still predict the target after LEACE? What changes if the deployment distribution differs from the population used to estimate the transformation?

Yes. LEACE constrains linear prediction, while a nonlinear classifier may exploit higher-order correlations left behind. Even when a concept is well predicted linearly before erasure, the remaining nonlinear signal must be measured rather than assumed negligible.

</details>

## Concept Scrubbing

To erase a concept throughout the entire model, not just at one layer, LEACE is applied sequentially through all layers. This procedure is called **concept scrubbing**:

1. Compute the LEACE projection at layer 1, apply it.
2. Compute the LEACE projection at layer 2 (on the already-modified activations), apply it.
3. Continue through all layers.

The sequential application is necessary. Naive independent erasure at each layer can fail because later layers can **reconstruct** the erased information from residual signals. If layer 3 sees the original activations from layer 2 (which still contain the concept), it can re-derive the concept information even though layer 1's representation was scrubbed. Sequential application ensures that each layer sees only the already-scrubbed representations from previous layers.

<details class="pause-and-think">
<summary>Pause and think: The reconstruction problem</summary>

Why can later layers reconstruct erased information? Consider a concept encoded redundantly across layers 1, 2, and 3. If you erase it only at layer 1, layers 2 and 3 still contain the original representation. Since the residual stream carries information forward, layer 3 can combine its own concept information with the residual stream to reconstruct what was erased at layer 1. What does this tell us about the challenge of erasing concepts from deep networks?

Later layers can reconstruct a target label from information that survives an earlier intervention. Concept scrubbing therefore applies LEACE sequentially at every tested layer, reducing the opportunity for downstream reconstruction. This procedure targets distributed linear decodability; it does not prove that all information about the concept is gone.

</details>

## LEACE vs. Simple Ablation

| Property | Ablation Steering | LEACE |
|----------|-------------------|-------|
| Guarantee | Removes one selected direction | Population linear-guard guarantee under stated assumptions |
| Computation | Simple projection | Covariance-based projection |
| Data requirements | Just the direction | Dataset for covariance estimation |
| Multi-layer | Apply independently | Apply sequentially (concept scrubbing) |

The contrast with the [refusal direction](/topics/refusal-direction/) experiments is instructive. Arditi et al. projected out one direction and measured a large behavioral effect. Applying LEACE to a labeled refusal dataset would instead target all population-level linear predictability captured by its moment estimates. That is a stronger statement about a specified label distribution, but not automatically a stronger behavioral intervention; both effects would need to be measured.

## Where LEACE Fits

LEACE adds a covariance-aware erasure operation to the probing and steering toolkit:{% sidenote "Reading, translation, and projection cover several useful interventions on a chosen linear subspace. They do not exhaust linear algebra, and they do not cover nonlinear or context-dependent representations." %}

- **Read** with [LAT](/topics/lat-probing/) and [CAA](/topics/caa-method/), detect what concepts are encoded in the model's representations.
- **Add** with [addition steering](/topics/addition-steering/), steer behavior toward a concept by adding its direction.
- **Remove** with [ablation](/topics/ablation-steering/) (a simple chosen-direction projection) or LEACE (a covariance-aware operation with a population linear-guard guarantee under its assumptions).

The three operations ask progressively stronger questions: can we read a label, can moving along the direction change behavior, and can we prevent linear recovery with limited distortion? LEACE guarantees the last of these under its assumptions; it does not guarantee that every trace of the concept or every associated behavior is gone.
