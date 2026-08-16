---
title: "Manifold Steering"
description: "Steering activations along learned geometric paths, linking internal representation manifolds to smooth behavior and comparing linear baselines."
order: 3
prerequisites:
  - title: "Discovering and Interpreting Neural Manifolds"
    url: "/topics/neural-manifolds/"
  - title: "Addition Steering"
    url: "/topics/addition-steering/"

glossary:
  - term: "Manifold Steering"
    definition: "An activation intervention that interpolates in a fitted manifold's intrinsic coordinates and maps the path back into activation space, keeping intermediate states on the learned representation manifold."
  - term: "Behavior Manifold"
    definition: "A low-dimensional structure fit to the model's natural output distributions for a task, used to describe which behavioral transitions resemble unintervened model behavior."
  - term: "Scaled Isometry"
    definition: "A correspondence between two spaces that approximately preserves distances up to one common scale factor. Here it describes similar geodesic distance relationships in activation and behavior manifolds."
---

## Straight Lines Can Take Shortcuts Through the Wrong Place

[Addition steering](/topics/addition-steering/) treats activation space as flat. Given a direction $\mathbf{v}$, it moves an activation to $\mathbf{h} + \alpha\mathbf{v}$. When we interpolate between two representative activations $\mathbf{h}_0$ and $\mathbf{h}_1$, the corresponding path is the straight line

$$
\boldsymbol{\pi}_{\mathrm{lin}}(t) = (1-t)\mathbf{h}_0 + t\mathbf{h}_1, \qquad 0 \leq t \leq 1.
$$

This is sensible when the relevant representation is a direction or a flat subspace. It can be a poor fit when natural activations lie on a curved structure.

Picture two towns on opposite sides of a crescent-shaped island. The straight chord between them is short, but much of it passes through the sea. A route that stays on land is longer and curved. In activation space, the chord can pass through states unlike any produced by an ordinary forward pass. The model may respond unpredictably there, even though both endpoints are familiar.

Wurgaft et al. ask whether the island's shape provides a better steering rule {% cite "wurgaft2026manifoldsteering" %}. Their experiments compare paths that assume three different geometries: a straight Euclidean path, a path following the density of observed activations, and a path derived from desired behavior. The central claim is not merely that curved paths look nicer. It is that activation geometry and output behavior share a measurable structure, and that interventions respecting one tend to respect the other.

<figure>
  <img src="images/manifold-steering-overview.png" alt="Activation space and behavior space connected by intervention and behavioral pullback. Straight paths cut across the curved activation manifold, while manifold and behavior-aware paths follow it and yield smoother output distributions.">
  <figcaption>Three geometries for steering. A straight path can leave the region occupied by natural activations, while activation-manifold and behavior-derived paths follow the curved structure. From Wurgaft et al., <em>Manifold Steering Reveals the Shared Geometry of Neural Network Representation and Behavior</em>. {%- cite "wurgaft2026manifoldsteering" -%}</figcaption>
</figure>

> **Manifold Steering:** An intervention that moves between represented states by interpolating in the intrinsic coordinates of a fitted activation manifold, then mapping each point back into activation space.

## Two Spaces Linked by the Model

To test whether geometry matters causally, we need to look at both sides of an intervention.

The **activation manifold** $\mathcal{M}_h$ is fit to internal states from ordinary, unintervened forward passes. For example, activations associated with weekdays can form a loop, while ages can form an open curve. The position on this structure supplies an intrinsic concept coordinate.

The **behavior manifold** $\mathcal{M}_y$ is fit to the model's output probability distributions on the same task. A model answering a weekday question might assign most probability to Wednesday, some to adjacent days, and little to distant or unrelated tokens. As the correct answer changes, these whole distributions trace a structured path in the probability simplex.

Wurgaft et al. represent those distributions in square-root coordinates. If $\mathbf{p}$ is a probability vector, they map it to $\sqrt{\mathbf{p}}$ component by component. Euclidean distance in this transformed space corresponds to Hellinger distance between probability distributions. This avoids treating a probability vector as if it occupied an unconstrained flat space.

The model itself maps an intervened activation to an output distribution:

$$
\mathbf{h}(t) \longmapsto \mathbf{p}_{\mathbf{h}\leftarrow\mathbf{h}(t)}(x).
$$

Here the notation means: run the base input $x$, replace the activation at the selected layer with $\mathbf{h}(t)$, and continue the forward pass. As $t$ changes, the intervention traces a path in activation space and induces a trajectory in behavior space. If the chosen activation does not causally mediate the output, the behavioral trajectory will barely move.

## Building a Manifold Path

Let $\mathbf{s}:\mathbb{R}^k \rightarrow \mathbb{R}^d$ parameterize the fitted activation manifold. It maps a $k$-dimensional intrinsic coordinate $\mathbf{u}$ to a point in the $d$-dimensional activation space. The two endpoint activations have coordinates $\mathbf{u}_0$ and $\mathbf{u}_1$.

Instead of interpolating directly in activation space, manifold steering interpolates the intrinsic coordinates and maps them back:

$$
\boldsymbol{\pi}_{\mathrm{m}}(t)
= \mathbf{s}\big((1-t)\mathbf{u}_0 + t\mathbf{u}_1\big).
$$

The straight and manifold paths share endpoints. Only their intermediate states differ. That makes the comparison especially informative: any difference in behavior comes from the geometry assumed between known states, not from choosing a different target.

For a cyclic concept, the intrinsic route must also respect the topology. Moving from Sunday to Tuesday should pass through Monday, not traverse every other day. For a multi-dimensional concept family, $\mathbf{u}$ can contain several coordinates and the path can change them jointly or separately.

<details class="pause-and-think">
<summary>Pause and think: When are the two paths identical?</summary>

Under what condition does interpolation in intrinsic coordinates produce the same path as interpolation between the ambient activations?

They coincide when the relevant part of $\mathbf{s}$ is affine, so the manifold is flat along the route. Curvature is what makes the mapped intrinsic interpolation depart from the ambient straight line.

</details>

## Choosing the Geometry Means Choosing a Metric

A path is shortest only relative to a metric. On a flat sheet, the Euclidean metric makes straight lines shortest. On a curved surface, the induced metric makes geodesics stay on the surface. If activation density is used to define the geometry, paths through frequently observed regions can be made cheaper than shortcuts through sparse regions.

The choice of metric produces three conceptually different steering strategies {% cite "wurgaft2026manifoldsteering" %}:

1. **Euclidean steering** assumes the ambient activation space is flat and uses a straight path.
2. **Density or manifold steering** derives a metric from the distribution of natural activations, favoring paths that remain on the fitted activation manifold.
3. **Pullback steering** starts with a metric in behavior space and transfers it back through the model's activation-to-output mapping.

A small activation change $d\mathbf{h}$ produces some change in the output distribution. Locally, the model's Jacobian maps one to the other. A behavior-space metric can therefore assign a cost to each activation-space movement according to the behavioral change it produces. This transferred cost is called a **pullback metric**. Directions that barely change behavior can be cheap, while directions that produce large or unnatural changes can be expensive.

Density geometry and pullback geometry use different information. One sees only which internal states occur naturally. The other sees how internal changes affect outputs. If their preferred paths coincide, that is evidence that the natural activation manifold is aligned with the model's behavioral organization rather than being an incidental shape in the residual stream.

In practice, exact geodesic optimization in thousands of activation dimensions would be difficult. The paper first reduces activations with PCA, fits low-dimensional parameterizations to concept centroids, and works with paths through those fitted structures. The resulting method tests a geometric hypothesis under a tractable approximation; it does not recover a unique, exact metric for the full residual stream.

## Does Activation Geometry Match Behavior Geometry?

Before intervening, Wurgaft et al. compare geodesic distances within the two fitted manifolds {% cite "wurgaft2026manifoldsteering" %}. A geodesic is the shortest path allowed to stay on a surface. On a circle, for example, it follows an arc rather than cutting across the interior.

For weekday, month, letter, and age tasks, pairwise geodesic distances in activation space closely tracked geodesic distances between output distributions. The reported correlations were $0.99$ for weekdays, $0.89$ for months, and $0.999$ for both letters and ages. Straight-line activation distances matched less well, especially for ages and months.

> **Scaled Isometry:** An approximate mapping under which distances in one space are proportional to distances in another. The overall scale may change, but relative path lengths and neighborhood relationships are preserved.

The evidence supports an approximate scaled isometry between the fitted activation and behavior manifolds in these tasks. This is a stronger observation than finding the same ordering in two plots. It says that the internal distance from Monday to Thursday, relative to other day pairs, resembles the distance between the model's corresponding output distributions.

It is not an exact identity between representations and behavior. The manifolds are estimated from finite samples, their coordinates are chosen by the researchers, and different internal states can yield similar outputs. “Approximate scaled isometry on the tested task” is the appropriately scoped conclusion.

## Steering Along the Curve

The causal test replaces a layer activation with 50 points along either the straight or manifold path, then measures the resulting output distribution. In the language experiments, the researchers use Llama 3.1 8B and intervene at layer 28 on structured addition tasks such as asking for a number of days after a given weekday {% cite "wurgaft2026manifoldsteering" %}.

Manifold paths produced smooth, ordered transitions. Steering from Tuesday toward Friday shifted probability through neighboring days. Straight paths often transferred mass directly between non-adjacent endpoints or temporarily assigned substantial probability to unrelated tokens. The line connected the endpoints geometrically, but it did not follow the model's learned concept ordering.

<figure>
  <img src="images/natural-domain-steering.png" alt="Activation and behavior manifolds for weekdays, months, letters, and ages, with plots comparing output probabilities along manifold and linear steering paths. Manifold paths follow the concept ordering while linear paths jump between endpoints.">
  <figcaption>Activation paths and induced output trajectories for cyclic and sequential concepts. Manifold steering moves probability through adjacent concept values; linear steering tends to jump between endpoints and stray farther from natural behavior distributions. From Wurgaft et al. {%- cite "wurgaft2026manifoldsteering" -%}</figcaption>
</figure>

The paper quantifies “natural” using distance from the behavior manifold fitted to unintervened output distributions. Across the four tasks, manifold-steered trajectories had about $2.8\times$ lower cumulative output energy than linearly steered trajectories. This metric does not mean the generated answer is universally better. It means the intermediate probability distributions more closely resemble the distributions the model naturally produces on that task.

The direction of evidence can also be reversed. Starting with a desired path on the behavior manifold, the researchers optimize activation states whose interventions produce that output path. These **pullback** trajectories curve through activation space similarly to the independently fitted activation manifold and match it better than straight paths do. Activation geometry predicts behavioral geometry, and behavior-derived paths recover aspects of activation geometry.

## More Than One Control Coordinate

A single steering direction has one control knob. A manifold can supply several intrinsic coordinates, which makes factored control possible when a concept family has multiple independent variables.

The paper tests an in-context task built from words arranged on a $5 \times 5$ grid. Sequences follow a random walk through the grid, so the model must represent both row and column structure. The researchers fit a two-dimensional surface to activation centroids and compare paths that change one coordinate while holding the other fixed.

<figure>
  <img src="images/factored-manifold-steering.png" alt="A five-by-five word grid, two-dimensional activation and behavior manifolds, and steering paths that change either grid length or width. Manifold steering preserves the untargeted coordinate better than linear steering.">
  <figcaption>A two-dimensional concept family supports factored control. Paths across the fitted surface change one grid coordinate while largely preserving the other, unlike shortcuts through the ambient space. From Wurgaft et al. {%- cite "wurgaft2026manifoldsteering" -%}</figcaption>
</figure>

Manifold steering changed the targeted coordinate with little effect on the other one. The straight baseline showed more off-target drift. This is the intervention analogue of [hierarchical orthogonality](/topics/feature-geometry/): a useful representation can separate control variables, but here the coordinate system lives on a curved surface rather than being restricted to globally fixed directions.

The same framework was tested in a visual world model trained on the Mountain Car environment. Position and velocity define a curved family of physical states. Geometry-aware activation paths produced smooth changes in predicted video states, while straight paths were more likely to blur or jump between positions. This cross-modality example suggests the method is not tied to token probabilities, although it remains one controlled environment.

## What Manifold Steering Adds to the Toolkit

Direction-based and manifold-based steering answer different representation hypotheses.

- Use a direction when the behavior varies approximately along one stable linear axis and you need a lightweight intervention.
- Use a subspace when several linear coordinates matter but curvature is negligible.
- Consider a manifold when held-out activations show reproducible curvature, the intrinsic coordinates have a clear interpretation, and straight interventions leave the region of natural states.

Manifold steering is considerably more demanding than addition steering. It needs a dataset spanning the concept family, a choice of activation site, a reliable manifold fit, and a way to choose routes in intrinsic coordinates. Its main value is not replacing every steering vector. It provides a controlled test of whether a model's representational geometry constrains behavior.

### Designing a Convincing Comparison

A good experiment begins before fitting the curve. Choose a family with a falsifiable ordering or adjacency structure, define the output distribution to measure, and reserve prompt templates for evaluation. Collect endpoint activations and intermediate concept states from ordinary forward passes. Then freeze the layer, dimensionality reduction, parameterization, and path-selection rules.

The linear and manifold paths should share endpoints and use the same number of intervention steps. Evaluate more than endpoint accuracy. At each step, measure:

- probability assigned to adjacent, endpoint, and unrelated concepts;
- distance to the behavior manifold learned from unintervened outputs;
- fluency or task performance where the intervention continues into generation;
- preservation of variables not targeted by the path;
- sensitivity to prompt, layer, seed, and manifold-fitting choices.

A no-intervention trajectory establishes ordinary output variability. Random curved paths test whether smoothness alone helps. A path fit with shuffled concept coordinates checks whether benefits come from following the proposed semantic organization. When possible, compare with a flat subspace path that has the same intrinsic dimension, separating curvature from the mere use of several coordinates.

Naturalness deserves careful wording. In the paper, it means proximity to a manifold of output distributions observed without intervention. That is a useful distributional criterion, but it is task-local. A response can resemble the model's usual probability patterns and still be incorrect or harmful. Conversely, a beneficial intervention might intentionally create behavior rarely seen in the base model. Naturalness is one outcome measure, not the steering objective for every application.

### The Path Is Only Part of the Intervention

The experiments replace the selected activation with each target point on a centroid-derived path. Conventional activation addition instead preserves the current state and adds a displacement. Those operations answer different questions. Replacement cleanly tests what behavior a specified path induces, while addition may better preserve information unique to the current prompt.

Layer, token position, and intervention timing still matter. A beautiful manifold at one site is useful for steering only if that site mediates the output and enough downstream computation remains to express the change. Replacing activations at every generated token is also different from intervening once on a prompt token. The geometry does not remove these ordinary steering design choices.

One possible extension would transport input-specific residual information along the route. If a source activation is written as a concept centroid plus a residual, an intervention might move the centroid component along the manifold while retaining or geometrically transporting the residual. That requires new assumptions: the residual may contain concept information, and tangent and normal directions can rotate along a curved surface. It should be evaluated against full replacement and ordinary addition rather than presumed safer.

Path choice can also be ambiguous. A loop has two routes between most endpoints; a surface can contain several geodesics; low-density gaps may disconnect an estimated manifold. The researcher must state whether the route is chosen by intrinsic distance, activation density, behavioral cost, or a task-specific constraint. Different choices encode different mechanistic hypotheses even when they use the same fitted surface.

<details class="pause-and-think">
<summary>Pause and think: What should the baseline control?</summary>

Why compare a curved path and a straight path with exactly the same endpoints?

If the endpoints differed, smoother behavior could result from better endpoint selection rather than the route between them. Shared endpoints isolate the effect of the assumed geometry on intermediate interventions.

</details>

## Limitations and Open Problems

The strongest results currently come from concepts with known coordinates and simple topology: cycles, sequences, grids, and a controlled physical system. The language tasks use synthetic templates and task-relevant next-token distributions. They do not yet show that manifold steering works for diffuse behaviors such as honesty, refusal, or sycophancy during open-ended generation.

The manifold fits are supervised by known concept orderings. In realistic discovery settings, both the number of intrinsic coordinates and their topology may be unknown. An incorrect fit can manufacture a smooth path that reflects the researcher's assumptions rather than the model's representation. Density also becomes harder to estimate as intrinsic dimension grows.

Replacing a whole activation with a centroid-derived path is a strong intervention. It can erase input-specific information stored at the same site. A practical method would need to preserve unrelated components, choose intervention layers robustly, and measure off-target effects across broad inputs. Staying near a fitted manifold reduces one kind of distribution shift; it does not guarantee safety, factuality, or fluent long-form behavior.

Representation geometry should earn its role through held-out prediction and intervention, not visual appeal alone. When the evidence supports a curved structure, the path between concepts becomes part of the mechanistic hypothesis. The next curriculum block begins with [Logit Diff Amplification](/topics/logit-diff-amplification/) and asks a complementary question: how do learned representations and behaviors change across model variants and training stages?
