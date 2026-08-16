---
title: "The Linear Representation Hypothesis"
description: "Why neural networks appear to represent concepts as linear directions in activation space, and why individual neurons fail as units of analysis."
order: 2
prerequisites:
  - title: "What is Interpretability?"
    url: "/topics/what-is-mech-interp/"

glossary:
  - term: "Linear Representation Hypothesis"
    definition: "The hypothesis that neural networks represent concepts as linear directions in activation space, so that adding or subtracting these directions corresponds to adding or removing the associated concept."
---

## Features as Directions

In the previous article, we introduced the features claim: neural networks represent human-understandable concepts as directions in activation space. But why should features be *linear* directions? Why not some more complex, nonlinear encoding? The **linear representation hypothesis** provides both a theoretical motivation and substantial empirical evidence for this claim {% cite "park2023lrh" %}.

> **Linear Representation Hypothesis (LRH):** High-level concepts are represented as linear directions in a neural network's activation space. The activation of a concept is measured by a dot product with the corresponding direction vector.

In mathematical terms, a feature $f$ corresponds to a direction $\mathbf{d}_f \in \mathbb{R}^{d_{\text{model}}}$. To measure how strongly feature $f$ is active in a residual stream state $\mathbf{r}$:

$$
\text{feature activation of } f = \mathbf{r} \cdot \mathbf{d}_f
$$

This dot product is linear in $\mathbf{r}$. If the residual stream contains multiple features $f_1, f_2, \ldots$, each encoded as a direction, then the residual stream is approximately a linear combination of feature directions, each weighted by its activation strength:

$$
\mathbf{r} \approx \sum_i a_i \mathbf{d}_{f_i}
$$

This is a simple picture: the residual stream is a sum of feature vectors, and we can read off any feature's activation with a dot product. But why would the model learn to do things this way?

<figure>
  <img src="images/causal-inner-product-geometry.png" alt="Two spheres illustrating the geometry of linear representations. On the left sphere, embedding directions for concepts like male/female and singular/plural are shown as vectors, with the causal inner product measuring alignment between concept directions. On the right sphere, the same concepts are shown from the unembedding perspective, demonstrating that concept directions maintain geometric structure across the embedding and unembedding spaces.">
  <figcaption>The geometry of linear representations. Concept directions (such as gender or grammatical number) can be visualized as vectors on a sphere in activation space. The causal inner product measures whether two directions represent related or independent concepts. From Park et al., <em>The Linear Representation Hypothesis and the Geometry of Large Language Models</em>. {%- cite "park2023lrh" -%}</figcaption>
</figure>

## Why Linear?

Linear information is easy to read, linear reads compose with linear writes, and sparse linear features can share a representation space. Together, these architectural properties make linear representations a useful default hypothesis.{% sidenote "This is an architectural motivation, not a proof. Transformers contain nonlinear MLPs and input-dependent attention, and a useful property can be distributed across several directions or encoded nonlinearly." %}

**Linear information is easy to read.** Every attention and MLP block begins by applying learned linear maps to its input. A property available along a direction can therefore influence a downstream preactivation through a dot product. The full transformer is not linear: attention weights depend on the input, and MLP activations are nonlinear. The narrower point is that linearly accessible information fits naturally into the operations every block already performs.

**Linear reads compose with linear writes.** If a later layer needs a feature, a row of its weight matrix can project the residual stream onto the relevant direction. That value can then affect queries, keys, values, or MLP preactivations. Nonlinear information can still be recovered by a network, but it requires the appropriate combination of directions and nonlinear operations.

**Sparse linear features can be superposed.** When features are rarely active together, a model can associate them with non-orthogonal directions and tolerate some interference. Two unit directions separated by 89 degrees have a dot product of about 0.017, so a linear read for one is only weakly affected by the other at equal activation. The [superposition hypothesis](/topics/superposition/) studies when this tradeoff is worthwhile.

## Empirical Evidence

Evidence comes from embedding arithmetic, probes, sparse dictionaries, relational maps, and controlled synthetic tasks.

**Word embedding arithmetic.** The classic result: "king - man + woman = queen." Semantic relationships correspond to vector arithmetic in embedding space. If "king" and "queen" differ by a direction encoding gender, and "man" and "woman" differ by the same direction, then the analogy holds as vector addition and subtraction. This is exactly what the LRH predicts: concepts like gender are encoded as linear directions, and manipulating those directions produces the expected semantic changes.{% sidenote "Word embedding arithmetic predates the LRH as a formalized hypothesis. The famous word2vec results from Mikolov et al. (2013) demonstrated these linear relationships in static word embeddings. The LRH extends this observation to contextualized representations in transformer activations, where the same principle appears to hold at intermediate layers." %}

**Linear probes.** Simple linear classifiers can often decode properties such as part of speech, syntax, semantics, or factual labels from intermediate activations. Success shows that the labeled classes are linearly separable in the sampled representation and distribution. It does not show that the model uses the probe's direction, and failure may reflect limited data, a poor target, or a representation that is accessible only nonlinearly.

**Sparse autoencoder features.** Sparse autoencoders often learn decoder directions whose activation examples support recognizable labels. Their reconstruction performance shows that a sparse linear dictionary can approximate many sampled activations. This is evidence for useful linear structure, although the learned dictionary may be non-unique and a plausible feature label may describe only part of a latent's behavior.

**Linear relational structure.** Linearity extends beyond individual features to *relations* between entities. Hernandez et al. {% cite "hernandez2023lre" %} showed that subject-object mappings (e.g., "Eiffel Tower → Paris") are approximated by single linear transformations in activation space, called **Linear Relational Embeddings**. This strengthens the LRH case: not only are concepts like "is a city" represented as directions, but the relation "located in" is approximately a linear map. This connects to factual recall methods like [ROME](/topics/fact-editing/), which implicitly assume that factual associations have linear structure in MLP weight space.

**Linear structure in synthetic tasks.** Models trained to predict legal moves in board games provide a controlled example. Nonlinear probes initially appeared necessary to decode Othello board state, but later work found effective linear probes after changing the target coordinate frame {% cite "nanda2023othello" %}. The lesson is methodological: a failed probe can reflect how the property was parameterized, not only how the model represents it.

<details class="pause-and-think">
<summary>Pause and think: Linearity and probing</summary>

If a linear probe achieves 95% accuracy at decoding part-of-speech from layer 6 activations, does that prove the model *uses* part-of-speech at layer 6? What is the gap between "information is linearly decodable" and "information is causally used"? Think about what additional experiment you would need to distinguish these two claims.

</details>

## Connection to Superposition

If features are directions, a natural question arises: what if the model has more features than dimensions?

A residual stream in $\mathbb{R}^{d_{\text{model}}}$ can represent at most $d_{\text{model}}$ orthogonal directions. But the model may need to track thousands of concepts simultaneously. A model with $d_{\text{model}} = 768$ has 768 orthogonal directions, yet it might need to represent 10,000 or 100,000 distinct features.

The model's solution is to encode features as *nearly-orthogonal* directions, packing more features than dimensions at the cost of small interference between features. This is superposition. Two features with directions at 85 degrees interfere slightly (their dot product is about 0.09), but this interference is a small price to pay for representing both features rather than discarding one entirely.{% sidenote "The mathematical framework for superposition was developed by Elhage et al. (2022) in their toy model analysis. They showed that when features are sparse, active on only a small fraction of inputs, the expected cost of interference drops quadratically with sparsity, making superposition extremely cheap." %}

The LRH makes superposition possible. Because features are linear directions, you can pack many of them into a shared space using the geometry of high-dimensional vector spaces. In 768 dimensions, there is an enormous amount of room for nearly-orthogonal directions, far more than low-dimensional intuitions would suggest. The [superposition article](/topics/superposition/) explores this in detail, including the toy model that reveals when and why models adopt superposition.

## Polysemanticity: Why Neurons Fail

The simplest approach to understanding a neural network is to look at individual neurons. If each neuron represented a single concept, interpretability would be straightforward. We could build a dictionary: "neuron 347 detects cats," "neuron 891 detects questions." Unfortunately, this is not what happens.

> **Polysemanticity:** A neuron is polysemantic if it activates for multiple unrelated concepts. A monosemantic neuron activates for a single, coherent concept.

**The Wolf and Coke Can Problem.** Early vision interpretability work found a neuron that responded strongly to both wolves and Coca-Cola cans {% cite "olah2020zoom" %}. One possible explanation is that rarely co-occurring features can share capacity with limited interference. The activation examples alone do not establish why training produced that particular mixture.

Reusing capacity can help the model while misleading the interpreter. A neuron labeled from wolf images may indeed respond to wolves, yet still respond just as strongly to cans outside the labeling set. The label is not false so much as incomplete, which is why interpretation needs diverse counterexamples and causal tests.

This problem extends beyond vision. A neuron in a language model might activate strongly for both "baseball" contexts and "academic citation" contexts. If this neuron fires, which concept is active? You cannot tell. The neuron conflates two unrelated features into one activation. This is polysemanticity, and it is pervasive in real neural networks.

The [superposition hypothesis](/topics/superposition/) proposes a capacity-based cause: if useful features outnumber available dimensions and are sparse enough, overlapping directions can be cheaper than dedicating one coordinate to each feature. This theory explains polysemanticity in toy models and motivates tests in larger networks; it is not the only possible reason a real neuron responds to several patterns.{% sidenote "Larger models have more dimensions, but may also learn more features. Scale alone therefore does not tell us whether a particular layer should become more or less polysemantic." %}

Consider the contrast between the neuron view and the feature view:

In the **neuron view**, you look at individual neuron activations. Each neuron is polysemantic, so you cannot determine which feature is active. "Neuron 347 fires. Is it detecting baseball, academic citations, or something else?" Interpretation is inherently ambiguous.

In the **feature view**, you look for directions or other structures in activation space. An ideal direction isolates one useful property: “the baseball direction has activation 2.3; the citation direction has activation 0.1.” Whether the learned directions are actually monosemantic must be tested rather than assumed.

Moving from neurons to features changes the question from “What does neuron $n$ represent?” to “How is property $c$ represented in activation space?” A single direction is the simplest candidate, but later articles also consider multidimensional and nonlinear geometry.

<details class="pause-and-think">
<summary>Pause and think: Polysemanticity and interpretation</summary>

If individual neurons are polysemantic, what does this mean for interpreting neural network behavior by looking at individual neuron activations? What tools or techniques would we need to build a reliable picture of what the model is computing? Think about how you might recover monosemantic features from polysemantic neurons.

</details>

## Limitations of the LRH

The linear representation hypothesis is a productive approximation, not a proven law.

Some features may be nonlinear. Concepts like "this sentence is a question" or "this number is greater than 100" may require more than a single linear direction to represent. These features depend on complex interactions between multiple tokens and may not reduce to a simple dot product.

Context dependence is another concern. The same concept might be represented differently in different contexts, making a single fixed direction insufficient. The direction encoding "Paris" when Paris is the subject of a sentence might differ from the direction encoding "Paris" when it appears as a location.

The LRH guides the design of probes, sparse autoencoders, and many other MI tools. Its value is empirical: linear methods recover useful structure often enough to support experiments. Failures are informative too, because they motivate multidimensional, context-dependent, or nonlinear alternatives.

## Looking Ahead

The linear representation hypothesis motivates treating directions as candidate features, and the superposition hypothesis explains why those directions may not align with individual neurons. The [induction heads](/topics/induction-heads/) article shifts from representations to computation: it examines evidence that attention heads in small transformers compose into a reusable pattern-completion circuit.
