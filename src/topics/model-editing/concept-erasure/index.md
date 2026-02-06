---
title: "Concept Erasure with LEACE"
description: "How LEACE provides a mathematically guaranteed method for erasing specific concepts from model representations, going beyond simple ablation with formal guarantees."
order: 1
prerequisites:
  - title: "Ablation Steering"
    url: "/topics/ablation-steering/"

glossary:
  - term: "Concept Erasure"
    definition: "A technique for removing specific concepts from model representations by projecting activations onto the orthogonal complement of the concept's subspace, making the concept linearly unreadable from the modified representations."
  - term: "LEACE"
    definition: "Least-squares Concept Erasure: a closed-form method for removing linear information about a concept from model representations by computing and projecting out the optimal linear subspace, guaranteeing that no linear classifier can recover the erased concept."
---

## Beyond Simple Ablation

[Addition steering](/topics/addition-steering/) *adds* a direction to steer model behavior. [Ablation steering](/topics/ablation-steering/) *removes* a direction to disable a behavior. But projection-based removal offers no formal guarantee -- a sufficiently powerful non-linear classifier might still detect traces of the erased concept in the modified representations.

What if we want to **provably** erase a concept? Not just project it out at one layer, but guarantee that no linear classifier can recover it from the modified representations?

Belrose et al. (2023) introduced **LEACE** (LEAst-squares Concept Erasure): a closed-form method that achieves exactly this guarantee {% cite "belrose2023leace" %}.

> **LEACE (LEAst-squares Concept Erasure):** A closed-form projection method that provably prevents *all* linear classifiers from predicting a target concept from the modified representations, while making the smallest possible change to those representations in the least-squares sense.

If [representation control](/topics/representation-control/) gives us a toolkit of *read, add, and remove*, LEACE provides the mathematically strongest version of "remove."{% sidenote "The name LEACE stands for LEAst-squares Concept Erasure, emphasizing both the optimality criterion (least-squares, meaning minimal distortion) and the goal (concept erasure, meaning complete removal of linear information about a concept)." %}

## The LEACE Guarantee

Unlike iterative methods such as INLP (Iterative Nullspace Projection), which repeatedly finds and removes linear classifiers, LEACE has a **mathematical guarantee**:

- After LEACE, **no** linear classifier can predict the erased concept from the modified representations. The mutual information between the modified representations and the concept label is zero for all linear readouts.

- The modification is the **smallest possible** change that achieves this guarantee. LEACE minimizes the expected squared difference between original and modified representations.

- The solution is computed in **closed form**. No iterative optimization, no adversarial games, no convergence concerns. The projection matrix is computed directly from the data covariance and the concept labels.{% sidenote "The closed-form solution is a significant practical advantage. Iterative methods like INLP require training and removing classifiers in a loop, which is slow and can fail to converge. LEACE computes the answer in one pass through the data, making it both faster and more reliable." %}

The core idea is an orthogonal projection. LEACE identifies the subspace that carries all linear information about the target concept, then projects the representations onto the orthogonal complement of that subspace. Everything in the concept subspace is removed; everything outside it is preserved.

<figure>
  <img src="images/leace-projection-steps.png" alt="Four panels showing the LEACE projection process. The original data has two classes (orange and blue) spread along a concept subspace direction. After whitening, the data has equal variance in all directions. The erasure step projects onto the orthogonal complement of the concept subspace, collapsing the two classes together. Unwhitening restores the original covariance structure, but with the concept information removed.">
  <figcaption>The three steps of the LEACE projection. First, whitening ensures equal variance in all directions. Then, orthogonal projection onto the complement of the concept subspace removes all linear information about the concept. Finally, unwhitening restores the original covariance structure. From Belrose et al., <em>LEACE: Perfect Linear Concept Erasure in Closed Form</em>. {%- cite "belrose2023leace" -%}</figcaption>
</figure>

<details class="pause-and-think">
<summary>Pause and think: Linear versus non-linear erasure</summary>

LEACE guarantees that no *linear* classifier can recover the erased concept. But what about non-linear classifiers? Could a deep neural network still detect traces of the erased concept in the modified representations?

In principle, yes. LEACE only guarantees erasure against linear readouts. Non-linear classifiers could potentially recover information from higher-order correlations or non-linear interactions between features. However, the linear representation hypothesis suggests that most high-level concepts in transformers are encoded as linear directions. If the concept is primarily linear, LEACE removes the vast majority of the signal. The residual non-linear information, if any, would be much harder to exploit.

</details>

## Concept Scrubbing

To erase a concept throughout the entire model -- not just at one layer -- LEACE is applied sequentially through all layers. This procedure is called **concept scrubbing**:

1. Compute the LEACE projection at layer 1, apply it.
2. Compute the LEACE projection at layer 2 (on the already-modified activations), apply it.
3. Continue through all layers.

The sequential application is necessary. Naive independent erasure at each layer can fail because later layers can **reconstruct** the erased information from residual signals. If layer 3 sees the original activations from layer 2 (which still contain the concept), it can re-derive the concept information even though layer 1's representation was scrubbed. Sequential application ensures that each layer sees only the already-scrubbed representations from previous layers.

<details class="pause-and-think">
<summary>Pause and think: The reconstruction problem</summary>

Why can later layers reconstruct erased information? Consider a concept encoded redundantly across layers 1, 2, and 3. If you erase it only at layer 1, layers 2 and 3 still contain the original representation. Since the residual stream carries information forward, layer 3 can combine its own concept information with the residual stream to reconstruct what was erased at layer 1. What does this tell us about the challenge of erasing concepts from deep networks?

It tells us that erasure must be holistic. A concept is not stored in one location -- it is distributed across the entire residual stream. Effective erasure requires intervening at every point where the concept can be read. This is why concept scrubbing applies LEACE at every layer in sequence, ensuring the concept cannot be reconstructed downstream.

</details>

## LEACE vs. Simple Ablation

| Property | Ablation Steering | LEACE |
|----------|-------------------|-------|
| Guarantee | None (heuristic) | Provable (no linear recovery) |
| Computation | Simple projection | Covariance-based projection |
| Data requirements | Just the direction | Dataset for covariance estimation |
| Multi-layer | Apply independently | Apply sequentially (concept scrubbing) |

The contrast with the [refusal direction](/topics/refusal-direction/) experiments is instructive. Arditi et al. removed the refusal direction via simple [ablation](/topics/ablation-steering/), which was effective but offered no formal guarantee. LEACE would provide a stronger erasure -- guaranteeing that no linear probe could recover refusal-related information from the modified representations. The tradeoff is that LEACE requires computing the full covariance structure, while simple projection requires only the direction itself.

## The Complete Representation Toolkit

With LEACE, the probing and steering toolkit is complete:{% sidenote "Each operation in the toolkit corresponds to a fundamental geometric operation on the activation space. Reading is projection onto a subspace. Steering is translation along a direction. Erasure is projection onto an orthogonal complement. These three operations -- project, translate, project-out -- exhaust the basic linear operations on a one-dimensional subspace." %}

- **Read** with [LAT](/topics/lat-probing/) and [CAA](/topics/caa-method/) -- detect what concepts are encoded in the model's representations.
- **Add** with [addition steering](/topics/addition-steering/) -- steer behavior toward a concept by adding its direction.
- **Remove** with [ablation](/topics/ablation-steering/) (fast, no guarantees) or LEACE (slower, provable guarantees).

The three operations form a principled framework for understanding and controlling model representations. Reading tells us what is there. Adding lets us amplify or introduce it. Removing lets us guarantee it is gone.
