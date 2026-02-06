---
title: "Feature Geometry: Beyond One-Dimensional Directions"
description: "How categorical concepts form polytopes, periodic features trace circles, and hierarchical relationships map to orthogonal subspaces -- revealing that feature geometry in representation space is far richer than single directions."
order: 5
prerequisites:
  - title: "SAE Variants, Evaluation, and Honest Limitations"
    url: "/topics/sae-variants-and-evaluation/"

glossary:
  - term: "Polytope Representation"
    definition: "The convex hull formed by the vector representations of a categorical concept's values in activation space. A binary concept forms a line segment, a ternary concept forms a triangle, and a k-valued concept forms a (k-1)-simplex."
  - term: "Irreducible Multi-Dimensional Feature"
    definition: "A feature that occupies more than one dimension in activation space and cannot be decomposed into independent one-dimensional features. Days of the week, for instance, form a circle in a 2D subspace where the two dimensions are coupled, not separable."
  - term: "Hierarchical Orthogonality"
    definition: "The geometric property where a parent concept's representation vector is orthogonal to the difference vector between a child concept and the parent. This ensures that manipulating the parent (e.g., 'animal') does not shift the relative probabilities among children (e.g., 'mammal' vs. 'bird')."
---

## Is a Direction Enough?

The [linear representation hypothesis](/topics/linear-representation-hypothesis/) says that features correspond to linear directions in activation space. The [superposition hypothesis](/topics/superposition/) says that models pack more features than dimensions by encoding them as nearly-orthogonal directions. Both claims treat features as one-dimensional: a direction, possibly with a magnitude.

But two lines of recent work reveal that this picture is incomplete. Park et al. {% cite "park2024geometry" %} show that categorical and hierarchical concepts have geometric structure that goes well beyond a single direction: categories form polytopes, hierarchies impose orthogonality constraints, and magnitudes carry meaning. Independently, Engels et al. {% cite "engels2024multidimensional" %} demonstrate that some features are irreducibly multi-dimensional, occupying 2D or higher subspaces that cannot be decomposed into independent directions.

Consider a concrete example. How does a language model represent the concept "day of the week"? If it were a single direction, we would expect Monday and Tuesday to differ only in magnitude along that direction. Instead, the seven days trace out a circle in a two-dimensional subspace, equally spaced, with the circular structure used for computation. Or consider how "animal," "mammal," and "dog" relate geometrically. These are not three unrelated directions; they form a hierarchy with precise orthogonality constraints.

## From Directions to Vectors: Magnitudes Matter

The [linear representation hypothesis](/topics/linear-representation-hypothesis/) in its simplest form says that a concept corresponds to a direction in activation space. Park et al. {% cite "park2024geometry" %} sharpen this to a stronger claim: representations are **vectors**, not just directions. The magnitude matters.

Their key result concerns binary attributes. Suppose a model represents the binary feature "is a mammal." Park et al. prove that for every token $w$ that is a mammal, the projection of $w$'s representation onto the mammal direction equals a fixed constant $b_w$. Tokens that are not mammals project to zero. This means the representation is not just "some positive projection" but a specific, constant value. The direction tells you *what* attribute is being encoded; the magnitude tells you the *boundary* between having the attribute and not having it.

This has a satisfying consequence. If "king," "man," and "woman" are represented as vectors (not just directions), then vector arithmetic like $\text{king} - \text{man} + \text{woman}$ becomes a linear operation on binary attributes. The famous word analogy results are not a mysterious emergent property; they follow from the geometry of binary concept representations. The difference $\text{king} - \text{man}$ isolates the "royalty" attribute because the "male" components cancel.{% sidenote "This formalizes an intuition that has circulated since word2vec: word analogies work because concepts are additively composed. Park et al. give this a precise theoretical grounding by showing it follows from the constant-projection property of binary representations." %}

## Categorical Concepts as Polytopes

What about concepts that are not binary? Consider a categorical concept like "animal type" with values {mammal, bird, fish, reptile}. Each value has its own representation vector, and Park et al. {% cite "park2024geometry" %} show that the geometric structure of these vectors is highly constrained.

A $k$-valued categorical concept maps to a **(k-1)-simplex**: the convex hull of its $k$ representation vectors. A binary concept (2 values) forms a line segment. A ternary concept (3 values) forms a triangle. An animal type with 4 values forms a tetrahedron. The representation vectors sit at the vertices.

> **Polytope Representation:** The convex hull formed by the vector representations of a categorical concept's values in activation space. A $k$-valued concept forms a $(k{-}1)$-simplex, with each value at a vertex.

This connects directly to structures observed in [toy models of superposition](/topics/superposition/). Elhage et al. {% cite "elhage2022toy" %} found that features in their toy model arranged into pentagons, squares, and other geometric shapes. These are polytopes. Park et al. provide a theoretical explanation: the model is not choosing these shapes arbitrarily. When categorical concepts compete for limited dimensions under superposition pressure, the optimal arrangement is a regular simplex because it maximizes the angular separation between vertices.{% sidenote "Strictly, the toy model structures are projections of simplices into lower dimensions, which is why you get regular polygons (pentagons, hexagons) rather than full-dimensional simplices." %}

<details class="pause-and-think">
<summary>Pause and think: Dimensions consumed by categories</summary>

If a categorical concept with $k$ values forms a $(k{-}1)$-simplex, what happens when $k$ is very large? A concept like "US state" has 50 values, which would form a 49-simplex requiring at least 49 linearly independent dimensions. How many dimensions must the model dedicate to encoding this single concept? What does this imply about the cost of fine-grained categorical distinctions in a model with a fixed residual stream width?

</details>

## Hierarchical Structure and Orthogonality

Concepts do not exist in isolation. They form hierarchies: animal > mammal > dog. Park et al. {% cite "park2024geometry" %} show that these hierarchies impose precise geometric constraints.

The central result is an orthogonality condition. If "mammal" is a child of "animal," then the representation vector for "animal" is orthogonal to the vector $(\text{mammal} - \text{animal})$. In notation: $\mathbf{v}_{\text{animal}} \perp (\mathbf{v}_{\text{mammal}} - \mathbf{v}_{\text{animal}})$.

> **Hierarchical Orthogonality:** The parent concept's representation vector is orthogonal to the difference between a child and the parent. Formally, $\mathbf{v}_{\text{parent}} \perp (\mathbf{v}_{\text{child}} - \mathbf{v}_{\text{parent}})$ for each child concept.

Why should this hold? Think about what happens when you intervene on the "animal" direction. If you increase the model's confidence that a token is an animal, you should not shift whether it is more likely a mammal or a bird. The orthogonality condition guarantees exactly this: the parent direction and the child-vs-parent distinctions live in orthogonal subspaces, so manipulating one does not interfere with the other.

Park et al. validate this empirically across 900+ concepts from the WordNet hierarchy in both Gemma and LLaMA models. The predicted orthogonality holds with high fidelity: parent and child-difference vectors are far more orthogonal than random baselines.

This has a structural consequence for the geometry: child concept vectors are **colinear** with their parent (they point in the same direction plus an orthogonal offset). "Mammal" and "animal" share a component. "Dog" shares a component with both "mammal" and "animal." The hierarchy maps to a nested set of subspaces. This is elegant, but it creates problems for methods like [sparse autoencoders](/topics/sparse-autoencoders/) that assume features are independent directions. An SAE that finds an "animal" feature and a "mammal" feature may be decomposing what is really a single hierarchical structure into misleadingly independent components.

## Multi-Dimensional Features: When One Direction Is Not Enough

While Park et al. show that even "one-dimensional" features have richer structure than assumed, Engels et al. {% cite "engels2024multidimensional" %} go further: some features are not one-dimensional at all.

Consider "day of the week." If this were a one-dimensional feature, Monday and Tuesday would sit at different magnitudes along a single direction. Instead, Engels et al. find that the seven days trace out a regular heptagon on a **circle** in a two-dimensional subspace. Months of the year form a regular 12-gon on a circle in a different 2D subspace.

> **Irreducible Multi-Dimensional Feature:** A feature occupying more than one dimension that cannot be decomposed into independent one-dimensional features. The constraint coupling the dimensions (e.g., points lying on a circle) prevents decomposition.

Why irreducible? The two axes of the circle are not independent features. If you know the cosine component (the $x$-coordinate on the circle), the sine component (the $y$-coordinate) is constrained: $\cos^2\theta + \sin^2\theta = 1$. You cannot treat them as two separate binary features because they are coupled by the circular geometry. Decomposing them into independent 1D features would destroy the structure that makes the representation useful.

Engels et al. find these circular features across GPT-2, Mistral 7B, and Llama 3 8B. The same geometric structure appears for the same concepts regardless of model architecture, suggesting it is a natural solution to representing periodic or cyclic structure. There is also a continuity property: a token like "very late Monday" projects to a point between Monday and Tuesday on the circle, interpolating smoothly.

## Circular Features and Modular Arithmetic

The circular geometry is not just a static representation. The model actively uses it for computation.

Engels et al. {% cite "engels2024multidimensional" %} test this with prompts like "Two days after Monday is [...]" and find that the model performs modular arithmetic directly on the circular representation. The output logits for "Wednesday" increase because the model rotates the Monday position by $2 \times (2\pi/7)$ around the circle. Intervention experiments confirm this is causal: replacing the circular subspace content changes the model's answer.

The geometry encodes two things simultaneously. The **angle** on the circle encodes which day (or month, or hour) we are talking about. The **radius** encodes confidence or relevance: tokens strongly associated with a specific day project far from the center, while ambiguous tokens sit closer to the origin.{% sidenote "This parallels how magnitude encodes confidence in the binary case from Park et al. There is a recurring theme: direction encodes identity, magnitude encodes strength of association." %}

This finding also connects to earlier work on toy models. Nanda et al. found that small models trained specifically on modular arithmetic learn circular representations. Engels et al. show that the same geometry emerges naturally in large language models trained on general text, without any explicit modular arithmetic objective. The circular structure is apparently a convergent solution: when a model needs to represent cyclic concepts, circles are what you get.

<details class="pause-and-think">
<summary>Pause and think: SAEs and circular features</summary>

Standard [sparse autoencoders](/topics/sparse-autoencoders/) decompose activations into a sum of one-dimensional features: $\hat{\mathbf{x}} = \sum_i f_i \mathbf{d}_i$, where each $\mathbf{d}_i$ is a single direction. What happens when an SAE encounters a 2D circular feature like day-of-week? Think about how a dictionary of 1D directions would approximate a circle. How many dictionary elements would it need? What would those elements look like, and would they be individually interpretable?

</details>

## Implications for Interpretability

These findings point toward a generalization of how we think about features. The standard picture treats model activations as a sparse sum of one-dimensional directions. The multi-dimensional superposition hypothesis, as Engels et al. {% cite "engels2024multidimensional" %} frame it, says that activations are a sparse sum of **low-dimensional, irreducible features** that may occupy one, two, or potentially more dimensions.

This has direct consequences for the tools we use.

**SAEs fragment multi-dimensional features.** A 1D SAE encountering a circular day-of-week feature will break it into many correlated dictionary elements, perhaps one per day, each pointing from the origin toward one point on the circle. The SAE cannot represent the circle as a single coherent feature. This is a structural limitation, not a training failure: the SAE's representational vocabulary simply does not include multi-dimensional atoms. In [SAE evaluation](/topics/sae-variants-and-evaluation/), this may manifest as clusters of highly correlated features that should really be a single entity.

**Hierarchical concepts challenge independence assumptions.** Because "mammal" and "animal" are colinear (they share a direction component), SAEs and similar methods that assume features are independent may misattribute activation along the shared direction. An SAE might find separate "animal" and "mammal" features that both fire on mammals, without representing the hierarchical relationship between them.

**Capacity accounting changes.** In the one-dimensional picture, a model with residual dimension $d$ can store $O(d)$ features (or exponentially more under superposition, as we saw in [superposition](/topics/superposition/)). If features are $k$-dimensional, the capacity per feature is higher. A 2D feature costs roughly twice the capacity of a 1D feature, so the total number of representable features decreases. How much of a model's capacity goes to multi-dimensional features is an open empirical question.

## Looking Ahead

Feature geometry is an active and rapidly evolving research area. The work covered here raises more questions than it answers. How prevalent are multi-dimensional features beyond the well-studied cyclic cases? Do irreducible 3D or higher-dimensional features exist in practice? How should decomposition methods adapt, and can we build SAEs or other tools with multi-dimensional atoms? These questions connect directly to the [open problems in mechanistic interpretability](/topics/open-problems-methods/), where feature geometry is one of the most active frontiers.
