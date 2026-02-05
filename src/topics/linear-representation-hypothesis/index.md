---
title: "The Linear Representation Hypothesis"
description: "Why neural networks appear to represent concepts as linear directions in activation space, and why individual neurons fail as units of analysis."
prerequisites:
  - title: "What is Interpretability?"
    url: "/topics/what-is-mech-interp/"
block: "foundations-of-mi"
category: "core-concepts"
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

## Why Linear?

Three properties of transformer architecture make linear representations the natural choice.{% sidenote "The argument for linearity is not that nonlinear features cannot exist. It is that the architecture creates strong pressure toward linear representations because they are the easiest to process. Nonlinear features are possible but architecturally expensive, requiring dedicated nonlinear detectors in later layers." %}

**Transformers are mostly linear operations.** The core computations -- matrix multiplications, additions, and attention-weighted sums -- are all linear. Nonlinearities (GELU activations in MLPs, softmax in attention) are pointwise and local. The residual stream flows through the model as an additive accumulation of linear contributions from each attention head and MLP. If features are represented as linear directions, subsequent layers can extract them with a simple matrix multiply. This is computationally cheap.

**Linear features compose easily.** If a later layer needs to read a feature, a linear feature can be extracted with a matrix multiplication: $W \cdot \mathbf{r}$ projects the residual stream onto whatever directions $W$ has learned to read. Nonlinear features would require dedicated nonlinear detectors -- the later layer would need to learn a specific nonlinear function for each feature it wants to read. Linear representations minimize the work required for downstream processing.

**Linear features can be superposed.** If the model needs to store many features in a limited number of dimensions, linear directions can be packed into the same space by using nearly-orthogonal directions. Two features encoded as directions at 89 degrees have only a tiny dot product (cos 89 degrees is approximately 0.017), producing minimal interference. This packing trick would not work for nonlinear representations, where there is no analogous notion of "nearly orthogonal." The [superposition hypothesis](/topics/superposition/) builds directly on this property of linear features.

## Empirical Evidence

Several lines of evidence support the linear representation hypothesis.

**Word embedding arithmetic.** The classic result: "king - man + woman = queen." Semantic relationships correspond to vector arithmetic in embedding space. If "king" and "queen" differ by a direction encoding gender, and "man" and "woman" differ by the same direction, then the analogy holds as vector addition and subtraction. This is exactly what the LRH predicts: concepts like gender are encoded as linear directions, and manipulating those directions produces the expected semantic changes.{% sidenote "Word embedding arithmetic predates the LRH as a formalized hypothesis. The famous word2vec results from Mikolov et al. (2013) demonstrated these linear relationships in static word embeddings. The LRH extends this observation to contextualized representations in transformer activations, where the same principle appears to hold at intermediate layers." %}

**Linear probes.** Simple linear classifiers trained on intermediate activations can decode linguistic properties -- syntax, semantics, part-of-speech, factual knowledge -- with high accuracy. If features were encoded nonlinearly, a linear probe would fail to detect them. The success of linear probing provides evidence that the relevant information is indeed organized along linear directions.

**Sparse autoencoder features.** Sparse autoencoders trained on model activations extract interpretable directions that correspond to recognizable concepts. The fact that a linear decomposition (the SAE decoder) can recover meaningful features from polysemantic activations is strong evidence that those features are linearly encoded in the first place. We will explore sparse autoencoders in depth in a later article.

<details class="pause-and-think">
<summary>Pause and think: Linearity and probing</summary>

If a linear probe achieves 95% accuracy at decoding part-of-speech from layer 6 activations, does that prove the model *uses* part-of-speech at layer 6? What is the gap between "information is linearly decodable" and "information is causally used"? Think about what additional experiment you would need to distinguish these two claims.

</details>

## Connection to Superposition

If features are directions, a natural question arises: what if the model has more features than dimensions?

A residual stream in $\mathbb{R}^{d_{\text{model}}}$ can represent at most $d_{\text{model}}$ orthogonal directions. But the model may need to track thousands of concepts simultaneously. A model with $d_{\text{model}} = 768$ has 768 orthogonal directions, yet it might need to represent 10,000 or 100,000 distinct features.

The model's solution is to encode features as *nearly-orthogonal* directions, packing more features than dimensions at the cost of small interference between features. This is superposition. Two features with directions at 85 degrees interfere slightly (their dot product is about 0.09), but this interference is a small price to pay for representing both features rather than discarding one entirely.{% sidenote "The mathematical framework for superposition was developed by Elhage et al. (2022) in their toy model analysis. They showed that when features are sparse -- active on only a small fraction of inputs -- the expected cost of interference drops quadratically with sparsity, making superposition extremely cheap." %}

The LRH makes superposition possible. Because features are linear directions, you can pack many of them into a shared space using the geometry of high-dimensional vector spaces. In 768 dimensions, there is an enormous amount of room for nearly-orthogonal directions, far more than low-dimensional intuitions would suggest. The [superposition article](/topics/superposition/) explores this in detail, including the toy model that reveals when and why models adopt superposition.

## Polysemanticity: Why Neurons Fail

The simplest approach to understanding a neural network is to look at individual neurons. If each neuron represented a single concept, interpretability would be straightforward. We could build a dictionary: "neuron 347 detects cats," "neuron 891 detects questions." Unfortunately, this is not what happens.

> **Polysemanticity:** A neuron is polysemantic if it activates for multiple unrelated concepts. A monosemantic neuron activates for a single, coherent concept.

A neuron in a language model might activate strongly for both "baseball" contexts and "academic citation" contexts. If this neuron fires, which concept is active? You cannot tell. The neuron conflates two unrelated features into one activation. This is polysemanticity, and it is pervasive in real neural networks {% cite "olah2020zoom" %}.

The root cause is the same counting problem that motivates superposition: the model has more features than neurons (or more precisely, more features than dimensions). To fit all these features, the model distributes them across overlapping neuron activations. Each neuron participates in encoding multiple features.{% sidenote "It is tempting to think that polysemanticity is a problem only in small models with few neurons. In fact, larger models learn more features as well as having more dimensions, so the ratio of features to dimensions does not necessarily improve. Evidence from studies of neurons in GPT-2, GPT-3, and other production-scale models shows that polysemanticity remains pervasive regardless of model size." %}

Consider the contrast between the neuron view and the feature view:

In the **neuron view**, you look at individual neuron activations. Each neuron is polysemantic, so you cannot determine which feature is active. "Neuron 347 fires. Is it detecting baseball, academic citations, or something else?" Interpretation is inherently ambiguous.

In the **feature view**, you look at directions in activation space. Each direction is (ideally) monosemantic -- it corresponds to a single concept. "The baseball direction has activation 2.3. The citation direction has activation 0.1." Interpretation is cleaner because features, not neurons, are the natural unit.

The shift from neurons to features is one of the most important conceptual moves in mechanistic interpretability. The old question was "What does neuron $n$ represent?" The new question is "What direction in activation space represents concept $c$?" This reframing changes both the tools we use and the questions we ask.

<details class="pause-and-think">
<summary>Pause and think: Polysemanticity and interpretation</summary>

If individual neurons are polysemantic, what does this mean for interpreting neural network behavior by looking at individual neuron activations? What tools or techniques would we need to build a reliable picture of what the model is computing? Think about how you might recover monosemantic features from polysemantic neurons.

</details>

## Limitations of the LRH

The linear representation hypothesis is a hypothesis, not a proven law. Several caveats are worth keeping in mind.

Some features may be nonlinear. Concepts like "this sentence is a question" or "this number is greater than 100" may require more than a single linear direction to represent. These features depend on complex interactions between multiple tokens and may not reduce to a simple dot product.

Context dependence is another concern. The same concept might be represented differently in different contexts, making a single fixed direction insufficient. The direction encoding "Paris" when Paris is the subject of a sentence might differ from the direction encoding "Paris" when it appears as a location.

Despite these caveats, the LRH has been remarkably productive. It guides the design of probes, sparse autoencoders, and many other MI tools. The hypothesis is approximately true often enough to be useful, and even its failures are informative -- they point toward the next generation of tools that might handle nonlinear features.

## Looking Ahead

The linear representation hypothesis provides the theoretical grounding for the features claim. Features are directions. Linear operations can read them out. But if there are more features than dimensions, the model must superpose them, and individual neurons become polysemantic mixtures. The next step is to see these ideas in action. In the article on [induction heads](/topics/induction-heads/), we will examine a real circuit discovered by applying the mathematical framework to small transformer models -- a pair of attention heads that compose to implement in-context pattern matching. This discovery validates the circuits claim: features really do connect through weights to implement identifiable algorithms.
